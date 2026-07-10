const crypto = require('crypto');

// Use global fetch if available (Node >= 18); otherwise lazy-load node-fetch
const fetchFn = (global.fetch ? global.fetch : ((...args) => import('node-fetch').then(({ default: f }) => f(...args))));
const fetch = (...args) => fetchFn(...args);

function normalizeJobSearchText(value) {
  return String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[,;]+/g, ' ')
    .trim()
    .toLowerCase();
}

function buildExternalJobCacheKey({ role, location, employmentType, page }) {
  return [
    normalizeJobSearchText(role),
    normalizeJobSearchText(location),
    normalizeJobSearchText(employmentType),
    String(page || 1)
  ].join('|');
}

function formatExternalSalary(job) {
  const minSalary = job.job_salary_min ?? job.salary_min ?? job.min_salary;
  const maxSalary = job.job_salary_max ?? job.salary_max ?? job.max_salary;
  const currency = job.job_salary_currency ?? job.salary_currency ?? job.currency;
  if (minSalary && maxSalary) return `${currency ? `${currency} ` : ''}${minSalary} - ${maxSalary}`.trim();
  if (minSalary) return `${currency ? `${currency} ` : ''}${minSalary}+`.trim();
  if (job.job_salary || job.salary) return String(job.job_salary || job.salary);
  return 'Not specified';
}

function formatExternalLocation(job, fallbackLocation) {
  const locationParts = [job.job_city, job.job_state, job.job_country].filter(Boolean).map(String);
  if (locationParts.length) return locationParts.join(', ');
  if (job.job_location) return String(job.job_location);
  return fallbackLocation || 'Remote / Flexible';
}

function mapJSearchJob(job) {
  return {
    job_id: String(job.job_id || job.id || crypto.randomUUID()),
    title: job.job_title || job.title || 'Untitled role',
    company: job.employer_name || job.company || 'Unknown company',
    location: formatExternalLocation(job, job.location),
    apply_link: job.job_apply_link || job.apply_link || job.job_google_link || job.job_url || '',
    employment_type: job.job_employment_type || job.employment_type || 'Not specified',
    salary: formatExternalSalary(job),
    posted_date: job.job_posted_at_datetime_utc || job.job_posted_at || job.posted_date || null,
    logo_url: job.employer_logo || job.logo_url || null,
    job_type: job.job_employment_type || job.employment_type || null,
    description: job.job_description || job.description || '',
    source: 'rapidapi-jsearch'
  };
}

async function fetchExternalJobsFromRapidApi({ role, location, employmentType, page }) {
  const rapidApiKey = process.env.RAPIDAPI_JSEARCH_KEY || process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_JSEARCH_HOST || process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com';
  if (!rapidApiKey) {
    throw new Error('RAPIDAPI_JSEARCH_KEY is not configured');
  }

  const searchParts = [role, 'jobs'];
  if (location) searchParts.push(`in ${location}`);
  const url = new URL(`https://${rapidApiHost}/search`);
  url.searchParams.set('query', searchParts.join(' ').replace(/\s+/g, ' ').trim());
  url.searchParams.set('page', String(page || 1));
  url.searchParams.set('num_pages', '1');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-rapidapi-host': rapidApiHost,
      'x-rapidapi-key': rapidApiKey
    }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`RapidAPI JSearch request failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.jobs) ? payload.jobs : [];
  return items.map(mapJSearchJob);
}

module.exports = {
  fetchExternalJobsFromRapidApi,
  buildExternalJobCacheKey,
  normalizeJobSearchText,
  mapJSearchJob
};
