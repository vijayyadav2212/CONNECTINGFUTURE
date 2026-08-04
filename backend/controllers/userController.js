const { dbQuery } = require('../config/db');
const bcrypt = require('bcryptjs');
const { fetchAuth0User } = require('../services/auth0Service');
const {
  deriveRole,
  upsertBasicUser,
  readAlumniAutoApproveSetting,
  sendAlumniApprovalEmail
} = require('../services/userService');

// GET current user's profile
async function getUserProfile(req, res) {
  const auth0Id = req.auth && req.auth.sub;
  const email = req.auth && req.auth["https://schemas.quickstart/email"] || req.auth && req.auth.email;
  if (!auth0Id) return res.status(401).json({ error: 'Unauthorized' });

  // Fast-track hardcoded admin profile
  if (auth0Id === 'local|admin') {
    return res.json({
      user: {
        id: 0,
        auth0_id: 'local|admin',
        email: 'admin@pvppcoe.ac.in',
        name: 'System Admin',
        user_type: 'admin',
        registration_completed: true,
        approval_status: 'approved'
      }
    });
  }

  dbQuery('SELECT * FROM users WHERE auth0_id = ? LIMIT 1', [auth0Id]).then(async ({ rows }) => {
    if (!rows) {
      console.error('DB error selecting user profile: no rows field');
      return res.status(200).json({
        user: {
          auth0_id: auth0Id,
          email: email || null,
          registration_completed: false,
        },
        warning: 'database_unavailable'
      });
    }

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'User not found in local database' });
    }

    const u = rows[0];
    try {
      const normalizedEmail = String(u.email || email || '').trim().toLowerCase();
      if (normalizedEmail) {
        const [jobsRes, roadmapsRes, mentorshipRes] = await Promise.all([
          dbQuery('SELECT COUNT(*)::int AS count FROM jobs WHERE LOWER(posted_by) = LOWER(?)', [normalizedEmail]),
          dbQuery('SELECT COUNT(*)::int AS count FROM roadmaps WHERE LOWER(owner_email) = LOWER(?)', [normalizedEmail]),
          dbQuery("SELECT COUNT(*)::int AS count FROM mentorship_sessions WHERE LOWER(mentor_email) = LOWER(?) AND status = 'completed'", [normalizedEmail]),
        ]);

        const jobs = Number(jobsRes.rows && jobsRes.rows[0] ? jobsRes.rows[0].count || 0 : 0);
        const roadmaps = Number(roadmapsRes.rows && roadmapsRes.rows[0] ? roadmapsRes.rows[0].count || 0 : 0);
        const mentorships = Number(mentorshipRes.rows && mentorshipRes.rows[0] ? mentorshipRes.rows[0].count || 0 : 0);

        u.impact_score = jobs + roadmaps + mentorships;
        u.impact_breakdown = { jobs, roadmaps, mentorships, sessions_completed: mentorships };
      } else {
        u.impact_score = 0;
        u.impact_breakdown = { jobs: 0, roadmaps: 0, mentorships: 0, sessions_completed: 0 };
      }
    } catch (impactErr) {
      console.warn('Failed to compute profile impact score:', impactErr.message);
      u.impact_score = Number(u.impact_score || 0);
      u.impact_breakdown = u.impact_breakdown || { jobs: 0, roadmaps: 0, mentorships: 0, sessions_completed: 0 };
    }

    if (!u.user_type && email) {
      const role = deriveRole(email);
      dbQuery('UPDATE users SET user_type = ? WHERE auth0_id = ?', [role, auth0Id]).catch(() => { });
      u.user_type = role;
    } else if (email) {
      const expected = deriveRole(email);
      if (u.user_type !== expected && u.user_type !== 'admin') {
        dbQuery('UPDATE users SET user_type = ? WHERE auth0_id = ?', [expected, auth0Id]).catch(() => { });
        u.user_type = expected;
      }
    }
    if (!u.approval_status) u.approval_status = 'pending';
    return res.json({ user: u });
  }).catch((err) => {
    console.error('DB error selecting user profile:', err.message);
    return res.status(200).json({ user: { auth0_id: auth0Id, email: email || null, registration_completed: false }, warning: 'database_unavailable' });
  });
}

// PUT create/update user profile
async function updateUserProfile(req, res) {
  try {
    const auth0Id = req.auth && req.auth.sub;
    const email = req.body.email || (req.auth && (req.auth["https://schemas.quickstart/email"] || req.auth.email));
    if (!auth0Id || !email) return res.status(400).json({ error: 'Missing auth0_id or email' });

    const {
      name,
      phone,
      university,
      graduationYear,
      course,
      currentCompany,
      jobTitle,
      location,
      linkedIn,
      gitHub,
      portfolio,
      bio,
      skills,
      isOpenToMentoring,
      picture,
      rollNumber,
      yearOfStudy,
      department,
      cgpa
    } = req.body;

    const derivedRole = deriveRole(email);
    const isAlumni = derivedRole === 'alumni';
    let shouldAutoApproveAlumni = false;
    try {
      shouldAutoApproveAlumni = isAlumni ? await readAlumniAutoApproveSetting() : false;
    } catch (settingErr) {
      console.warn('Failed to read alumni auto-approve setting:', settingErr.message);
    }
    const incomingApprovalStatus = shouldAutoApproveAlumni ? 'approved' : null;
    let previousApprovalStatus = null;
    try {
      const existing = await dbQuery('SELECT approval_status FROM users WHERE auth0_id = ? LIMIT 1', [auth0Id]);
      previousApprovalStatus = existing.rows && existing.rows[0] && existing.rows[0].approval_status
        ? String(existing.rows[0].approval_status).toLowerCase()
        : null;
    } catch (lookupErr) {
      console.warn('Failed to read previous alumni approval status:', lookupErr.message);
    }

    const values = {
      auth0_id: auth0Id,
      email,
      name: name || null,
      phone: phone || null,
      university: university || null,
      graduation_year: graduationYear ? parseInt(graduationYear, 10) : null,
      major: course || null,
      current_job: jobTitle || null,
      company: currentCompany || null,
      job_title: jobTitle || null,
      location: location || null,
      linkedin_url: linkedIn || null,
      github_url: gitHub || null,
      website_url: portfolio || null,
      bio: bio || null,
      skills: Array.isArray(skills) ? skills.join(',') : (skills || null),
      is_mentor: !!isOpenToMentoring,
      picture: picture || null,
      registration_completed: true,
      roll_number: rollNumber || null,
      year_of_study: yearOfStudy || null,
      department: department || course || null,
      cgpa: cgpa ? parseFloat(cgpa) : null,
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
      incomingApprovalStatus
    ];

    await dbQuery(sql, params);
    const r = await dbQuery('SELECT * FROM users WHERE auth0_id = ? LIMIT 1', [auth0Id]);
    const savedUser = r.rows && r.rows[0] ? r.rows[0] : null;
    const currentStatus = String(savedUser?.approval_status || '').toLowerCase();
    if (savedUser && isAlumni && (currentStatus === 'approved' || currentStatus === 'rejected') && previousApprovalStatus !== currentStatus) {
      sendAlumniApprovalEmail({
        to: savedUser.email,
        name: savedUser.name,
        status: savedUser.approval_status,
        reason: savedUser.approval_reason,
      }).catch((emailErr) => console.warn('Failed to send approval/rejection email:', emailErr.message));
    }
    return res.json({ message: 'Profile saved', user: savedUser });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET list of all users (for admin)
async function listUsers(req, res) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
    const { rows } = await dbQuery('SELECT * FROM users ORDER BY created_at DESC LIMIT ?', [limit]);
    return res.json({ users: rows || [] });
  } catch (error) {
    console.error('Error listing users:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

// POST change password for current user
async function changePassword(req, res) {
  try {
    const auth0Id = req.auth && req.auth.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    // Fetch user from database
    const { rows } = await dbQuery('SELECT * FROM users WHERE auth0_id = ? LIMIT 1', [auth0Id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    // If user has an existing password, check current password
    if (user.password_hash) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password' });
      }
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await dbQuery('UPDATE users SET password_hash = ? WHERE auth0_id = ?', [passwordHash, auth0Id]);

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  listUsers,
  changePassword
};
