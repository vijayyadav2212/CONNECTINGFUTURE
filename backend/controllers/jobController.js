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

module.exports = {
  handleExternalJobsRequest
};
