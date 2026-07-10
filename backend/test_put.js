const { dbQuery } = require('./config/db');

async function test() {
  try {
    const auth0Id = 'local|testuser';
    const email = 'test@example.com';
    const name = 'Test User';
    
    // Check previous approval status
    const existing = await dbQuery('SELECT approval_status FROM users WHERE auth0_id = ? LIMIT 1', [auth0Id]);
    const previousApprovalStatus = existing.rows && existing.rows[0] && existing.rows[0].approval_status;

    const values = {
      auth0_id: auth0Id,
      email: email,
      name: name,
      phone: null,
      university: null,
      graduation_year: 2024,
      major: 'CS',
      current_job: null,
      company: null,
      job_title: null,
      location: null,
      linkedin_url: null,
      github_url: null,
      website_url: null,
      bio: null,
      skills: null,
      is_mentor: false,
      picture: null,
      registration_completed: true,
      roll_number: null,
      year_of_study: null,
      department: 'CS',
      cgpa: null,
    };

    const sql = `
      INSERT INTO users (auth0_id, email, name, phone, university, graduation_year, major, current_job, company, job_title, location, linkedin_url, github_url, website_url, bio, skills, is_mentor, picture, registration_completed, roll_number, year_of_study, department, cgpa, approval_status, approval_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 'pending'), NULL)
      ON CONFLICT (auth0_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        university = EXCLUDED.university,
        graduation_year = EXCLUDED.graduation_year,
        major = EXCLUDED.major,
        current_job = EXCLUDED.current_job,
        company = EXCLUDED.company,
        job_title = EXCLUDED.job_title,
        location = EXCLUDED.location,
        linkedin_url = EXCLUDED.linkedin_url,
        github_url = EXCLUDED.github_url,
        website_url = EXCLUDED.website_url,
        bio = EXCLUDED.bio,
        skills = EXCLUDED.skills,
        is_mentor = EXCLUDED.is_mentor,
        picture = COALESCE(EXCLUDED.picture, users.picture),
        approval_status = CASE
          WHEN EXCLUDED.approval_status = 'approved' THEN 'approved'
          WHEN users.approval_status = 'rejected' THEN 'pending'
          ELSE users.approval_status
        END,
        approval_reason = CASE
          WHEN EXCLUDED.approval_status = 'approved' THEN NULL
          WHEN users.approval_status = 'rejected' THEN NULL
          ELSE users.approval_reason
        END,
        registration_completed = EXCLUDED.registration_completed,
        roll_number = EXCLUDED.roll_number,
        year_of_study = EXCLUDED.year_of_study,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa
    `;

    const params = [
      values.auth0_id,
      values.email,
      values.name,
      values.phone,
      values.university,
      values.graduation_year,
      values.major,
      values.current_job,
      values.company,
      values.job_title,
      values.location,
      values.linkedin_url,
      values.github_url,
      values.website_url,
      values.bio,
      values.skills,
      values.is_mentor,
      values.picture,
      values.registration_completed,
      values.roll_number,
      values.year_of_study,
      values.department,
      values.cgpa,
      null // incomingApprovalStatus
    ];

    console.log('Running test query...');
    await dbQuery(sql, params);
    console.log('Query succeeded!');
    process.exit(0);
  } catch (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }
}

test();
