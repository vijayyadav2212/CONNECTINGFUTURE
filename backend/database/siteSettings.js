// Site settings schema creator
async function createSiteSettingsSchema(dbQuery) {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id SERIAL PRIMARY KEY,
      setting_key VARCHAR(255) UNIQUE NOT NULL,
      setting_value JSONB,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await dbQuery('CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key)');

  // Initialize default job search settings if not present
  try {
    const { rows } = await dbQuery("SELECT * FROM site_settings WHERE setting_key = 'job_search_defaults' LIMIT 1");
    if (!rows || rows.length === 0) {
      await dbQuery(`
        INSERT INTO site_settings (setting_key, setting_value)
        VALUES ('job_search_defaults', '{"role": "software developer", "location": "India"}')
      `);
    }
  } catch (e) {
    console.error('Error initializing site settings:', e.message);
  }
}

module.exports = { createSiteSettingsSchema };
