const { dbQuery } = require('../config/db');
const { 
  fetchExternalJobsFromRapidApi, 
  buildExternalJobCacheKey, 
  normalizeJobSearchText 
} = require('../services/jobSearchService');

const externalJobsRateLimit = new Map();

function allowExternalJobsRequest(ipAddress) {
  const windowMs = Number(process.env.JOBS_RATE_LIMIT_WINDOW_MS || 60_000);
  const maxRequests = Number(process.env.JOBS_RATE_LIMIT_MAX || 30);
  const key = ipAddress || 'anonymous';
  const now = Date.now();
  const current = externalJobsRateLimit.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }
  current.count += 1;
  externalJobsRateLimit.set(key, current);
  return { allowed: current.count <= maxRequests, remaining: Math.max(0, maxRequests - current.count), resetAt: current.resetAt };
}

async function readJobSearchDefaults() {
  const { rows } = await dbQuery("SELECT setting_value FROM site_settings WHERE setting_key = 'job_search_defaults' LIMIT 1");
  const value = rows && rows[0] ? rows[0].setting_value : null;
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return {};
}

async function getCachedExternalJobs(cacheKey) {
  const { rows } = await dbQuery(
    `SELECT results_json, fetched_at, expires_at
     FROM external_job_search_cache
     WHERE cache_key = ? AND expires_at > NOW()
     ORDER BY fetched_at DESC
     LIMIT 1`,
    [cacheKey]
  );
  if (!rows || !rows.length) return null;
  return rows[0];
}

async function saveExternalJobsCache(cacheKey, params, jobs) {
  const ttlMinutes = Number(process.env.JOBS_CACHE_TTL_MINUTES || 15);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
  await dbQuery(
    `INSERT INTO external_job_search_cache (cache_key, role, location, employment_type, results_json, fetched_at, expires_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW())
     ON CONFLICT (cache_key)
     DO UPDATE SET role = EXCLUDED.role,
                   location = EXCLUDED.location,
                   employment_type = EXCLUDED.employment_type,
                   results_json = EXCLUDED.results_json,
                   fetched_at = NOW(),
                   expires_at = EXCLUDED.expires_at,
                   updated_at = NOW()`,
    [cacheKey, params.role || null, params.location || null, params.employmentType || null, JSON.stringify(jobs), expiresAt]
  );
}

async function saveExternalJobSnapshots(cacheKey, jobs) {
  if (!jobs || !jobs.length) return;
  for (const job of jobs) {
    await dbQuery(
      `INSERT INTO external_jobs_cache (
        job_id, title, company, location, apply_link, employment_type, salary, posted_at, logo_url, raw_data, search_key, last_seen_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON CONFLICT (job_id)
      DO UPDATE SET title = EXCLUDED.title,
                    company = EXCLUDED.company,
                    location = EXCLUDED.location,
                    apply_link = EXCLUDED.apply_link,
                    employment_type = EXCLUDED.employment_type,
                    salary = EXCLUDED.salary,
                    posted_at = EXCLUDED.posted_at,
                    logo_url = EXCLUDED.logo_url,
                    raw_data = EXCLUDED.raw_data,
                    search_key = EXCLUDED.search_key,
                    last_seen_at = NOW(),
                    updated_at = NOW()`,
      [
        job.job_id,
        job.title,
        job.company,
        job.location,
        job.apply_link,
        job.employment_type,
        job.salary,
        job.posted_date ? new Date(job.posted_date) : null,
        job.logo_url || null,
        JSON.stringify(job),
        cacheKey
      ]
    );
  }
}

async function handleExternalJobsRequest(req, res) {
  try {
    const rate = allowExternalJobsRequest(req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous');
    res.setHeader('X-RateLimit-Limit', String(Number(process.env.JOBS_RATE_LIMIT_MAX || 30)));
    res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const defaults = await readJobSearchDefaults();
    const role = String(req.query.role || defaults.role || 'software developer').trim();
    const location = String(req.query.location || defaults.location || 'India').trim();
    const employmentType = String(req.query.employment_type || req.query.job_type || defaults.employment_type || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const refresh = String(req.query.refresh || req.query.force || '').toLowerCase() === 'true';

    const cacheKey = buildExternalJobCacheKey({ role, location, employmentType, page });
    if (!refresh) {
      const cached = await getCachedExternalJobs(cacheKey);
      if (cached && cached.results_json) {
        const cachedJobs = typeof cached.results_json === 'string' ? JSON.parse(cached.results_json) : cached.results_json;
        return res.json({
          jobs: cachedJobs || [],
          meta: {
            role,
            location,
            employment_type: employmentType || 'All Types',
            page,
            from_cache: true,
            fetched_at: cached.fetched_at
          }
        });
      }
    }

    const jobs = await fetchExternalJobsFromRapidApi({ role, location, employmentType, page });
    const filteredJobs = employmentType && employmentType !== 'All Types'
      ? jobs.filter(job => normalizeJobSearchText(job.employment_type).includes(normalizeJobSearchText(employmentType)))
      : jobs;

    await Promise.all([
      saveExternalJobsCache(cacheKey, { role, location, employmentType }, filteredJobs),
      saveExternalJobSnapshots(cacheKey, filteredJobs)
    ]);

    return res.json({
      jobs: filteredJobs,
      meta: {
        role,
        location,
        employment_type: employmentType || 'All Types',
        page,
        from_cache: false,
        fetched_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('External jobs request failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: error.message || 'Failed to load external jobs' });
  }
}

async function getAllJobs(req, res) {
  try {
    const { status, posted_by } = req.query;
    let query = 'SELECT * FROM jobs';
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (posted_by) {
      params.push(posted_by.toLowerCase());
      conditions.push(`LOWER(posted_by) = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const { rows } = await dbQuery(query, params);
    return res.json({ jobs: rows || [] });
  } catch (error) {
    console.error('getAllJobs error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch jobs' });
  }
}

async function createJob(req, res) {
  try {
    const {
      title, company, location, description, responsibilities,
      requirements, benefits, salary_min, salary_max, currency,
      tags, status, industry, job_type, is_remote,
      application_deadline, contact_person, application_method,
      application_url, posted_by
    } = req.body;

    const authorEmail = posted_by || 'alumni@vppcoe.ac.in';
    if (!title || !company || !location || !description) {
      return res.status(400).json({ error: 'Missing required fields: title, company, location, description' });
    }

    const tagsString = Array.isArray(tags) ? tags.join(',') : (tags || '');
    const sMin = salary_min ? parseFloat(salary_min) : null;
    const sMax = salary_max ? parseFloat(salary_max) : null;

    const { rows } = await dbQuery(
      `INSERT INTO jobs (
        title, company, location, description, responsibilities,
        requirements, benefits, salary_min, salary_max, currency,
        tags, status, industry, job_type, is_remote,
        application_deadline, contact_person, application_method,
        application_url, posted_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, NOW(), NOW()
      ) RETURNING *`,
      [
        title, company, location, description, responsibilities || '',
        requirements || '', benefits || '', sMin, sMax, currency || 'USD',
        tagsString, status || 'Approved', industry || 'General', job_type || 'Full-time', Boolean(is_remote),
        application_deadline ? new Date(application_deadline) : null, contact_person || '', application_method || '',
        application_url || '', authorEmail
      ]
    );

    return res.status(201).json({ success: true, job: rows[0] });
  } catch (error) {
    console.error('createJob error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create job' });
  }
}

async function updateJob(req, res) {
  try {
    const { id } = req.params;
    const {
      title, company, location, description, responsibilities,
      requirements, benefits, salary_min, salary_max, currency,
      tags, status, industry, job_type, is_remote,
      application_deadline, contact_person, application_method,
      application_url
    } = req.body;

    const tagsString = Array.isArray(tags) ? tags.join(',') : (tags || '');
    const sMin = salary_min ? parseFloat(salary_min) : null;
    const sMax = salary_max ? parseFloat(salary_max) : null;

    const { rows } = await dbQuery(
      `UPDATE jobs SET
        title = COALESCE($1, title),
        company = COALESCE($2, company),
        location = COALESCE($3, location),
        description = COALESCE($4, description),
        responsibilities = COALESCE($5, responsibilities),
        requirements = COALESCE($6, requirements),
        benefits = COALESCE($7, benefits),
        salary_min = COALESCE($8, salary_min),
        salary_max = COALESCE($9, salary_max),
        currency = COALESCE($10, currency),
        tags = COALESCE($11, tags),
        status = COALESCE($12, status),
        industry = COALESCE($13, industry),
        job_type = COALESCE($14, job_type),
        is_remote = COALESCE($15, is_remote),
        application_deadline = COALESCE($16, application_deadline),
        contact_person = COALESCE($17, contact_person),
        application_method = COALESCE($18, application_method),
        application_url = COALESCE($19, application_url),
        updated_at = NOW()
      WHERE id = $20
      RETURNING *`,
      [
        title, company, location, description, responsibilities,
        requirements, benefits, sMin, sMax, currency,
        tagsString, status, industry, job_type, is_remote,
        application_deadline ? new Date(application_deadline) : null, contact_person, application_method,
        application_url, id
      ]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json({ success: true, job: rows[0] });
  } catch (error) {
    console.error('updateJob error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update job' });
  }
}

async function deleteJob(req, res) {
  try {
    const { id } = req.params;
    await dbQuery('DELETE FROM jobs WHERE id = $1', [id]);
    return res.json({ success: true });
  } catch (error) {
    console.error('deleteJob error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete job' });
  }
}

async function applyToJob(req, res) {
  try {
    const { id } = req.params;
    const { applicant_email, resume_url, cover_letter } = req.body;

    if (!applicant_email) {
      return res.status(400).json({ error: 'Applicant email is required' });
    }

    const { rows } = await dbQuery(
      `INSERT INTO applications (job_id, applicant_email, resume_url, cover_letter, applied_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (job_id, applicant_email)
       DO UPDATE SET resume_url = EXCLUDED.resume_url, cover_letter = EXCLUDED.cover_letter, updated_at = NOW()
       RETURNING *`,
      [id, applicant_email, resume_url || '', cover_letter || '']
    );

    await dbQuery('UPDATE jobs SET applied = applied + 1 WHERE id = $1', [id]);

    return res.status(201).json({ success: true, application: rows[0] });
  } catch (error) {
    console.error('applyToJob error:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit application' });
  }
}

async function getApplications(req, res) {
  try {
    const { applicant_email, job_id } = req.query;
    let query = 'SELECT a.*, j.title as job_title, j.company as job_company FROM applications a JOIN jobs j ON a.job_id = j.id';
    const params = [];
    const conditions = [];

    if (applicant_email) {
      params.push(applicant_email.toLowerCase());
      conditions.push(`LOWER(a.applicant_email) = $${params.length}`);
    }
    if (job_id) {
      params.push(job_id);
      conditions.push(`a.job_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY a.applied_at DESC';

    const { rows } = await dbQuery(query, params);
    return res.json({ applications: rows || [] });
  } catch (error) {
    console.error('getApplications error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch applications' });
  }
}

async function getApplicationsByJob(req, res) {
  try {
    const { job_id } = req.query;
    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required' });
    }

    const { rows } = await dbQuery(
      `SELECT a.*, u.name as applicant_name, u.picture as applicant_avatar
       FROM applications a
       LEFT JOIN users u ON LOWER(a.applicant_email) = LOWER(u.email)
       WHERE a.job_id = $1 OR a.job_id::text = $1::text
       ORDER BY a.applied_at DESC`,
      [job_id]
    );

    return res.json({ applications: rows || [] });
  } catch (error) {
    console.error('getApplicationsByJob error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch applicants' });
  }
}

async function getExternalJobAnalytics(req, res) {
  try {
    const { rows } = await dbQuery(
      `SELECT 
        COUNT(*)::int as total_external_jobs,
        COALESCE(SUM(view_count), 0)::int as total_views,
        COALESCE(SUM(apply_click_count), 0)::int as total_apply_clicks,
        COALESCE(SUM(applied_confirm_count), 0)::int as total_confirmed_applies,
        COALESCE(SUM(application_response_count), 0)::int as total_responses
       FROM external_jobs_cache`
    );
    return res.json(rows[0] || {});
  } catch (error) {
    console.error('getExternalJobAnalytics error:', error);
    return res.status(500).json({ error: error.message || 'Failed to load analytics' });
  }
}

module.exports = {
  handleExternalJobsRequest,
  getAllJobs,
  createJob,
  updateJob,
  deleteJob,
  applyToJob,
  getApplications,
  getApplicationsByJob,
  getExternalJobAnalytics
};
