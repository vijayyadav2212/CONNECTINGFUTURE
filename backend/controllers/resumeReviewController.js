const { dbQuery } = require('../config/db');
const { getViewUrl } = require('../services/cloudinaryService');

function getProxyDownloadUrl(fileUrl, filename = '') {
  if (!fileUrl) return '';
  const params = new URLSearchParams({
    url: fileUrl,
    filename: filename || 'download',
  });
  return `/api/files/download?${params.toString()}`;
}

// GET approved alumni mentors for resume review
async function getMentorsForReview(req, res) {
  try {
    const { student_email } = req.query || {};
    
    const { rows: allMentors } = await dbQuery(`
      SELECT id, email, name, picture, skills, graduation_year, major, 
             job_title, company, location, bio, is_mentor
      FROM users 
      WHERE user_type = 'alumni' 
        AND approval_status = 'approved' 
        AND is_mentor = true
      ORDER BY name ASC
    `);
    
    let mentors = (allMentors || []).map(m => ({
      email: m.email,
      name: m.name || m.email,
      picture: m.picture,
      skills: m.skills,
      graduation_year: m.graduation_year,
      major: m.major,
      job_title: m.job_title,
      company: m.company,
      location: m.location,
      bio: m.bio,
      isConnected: false,
      connectionStatus: 'none',
    }));
    
    if (student_email) {
      const decodedEmail = decodeURIComponent(student_email);
      const { rows: connections } = await dbQuery(`
        SELECT mentor_email, status FROM mentorship_requests 
        WHERE student_email = ?
      `, [decodedEmail]);
      
      const connectionMap = new Map();
      (connections || []).forEach(c => {
        connectionMap.set(c.mentor_email, c.status);
      });
      
      mentors = mentors.map(m => ({
        ...m,
        isConnected: connectionMap.has(m.email) && connectionMap.get(m.email) === 'accepted',
        connectionStatus: connectionMap.get(m.email) || 'none',
      }));
      
      mentors.sort((a, b) => {
        if (a.isConnected !== b.isConnected) {
          return a.isConnected ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    }
    
    return res.json({ mentors });
  } catch (e) {
    console.error('Error fetching mentors:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// POST request resume review
async function requestResumeReview(req, res) {
  try {
    const { student_email, alumni_email, resume_url, filename, student_message } = req.body;
        
    if (!student_email || !alumni_email || !resume_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { rows: studentCheck } = await dbQuery(`
      SELECT email, name FROM users
      WHERE email = ? AND user_type = 'student'
    `, [student_email]);
    
    if (studentCheck.length === 0) {
      return res.status(400).json({ error: 'Student not found or invalid user type' });
    }

    const correctStudentEmail = studentCheck[0].email;
    const correctStudentName = studentCheck[0].name || 'Student';

    const { rows: alumniCheck } = await dbQuery(`
      SELECT email, name FROM users
      WHERE email = ? AND user_type = 'alumni' AND approval_status = 'approved' AND is_mentor = true
    `, [alumni_email]);
    
    if (alumniCheck.length === 0) {
      return res.status(400).json({ error: 'Selected mentor not available' });
    }

    const correctAlumniEmail = alumniCheck[0].email;
    const correctAlumniName = alumniCheck[0].name || 'Alumni';
    const pair_key = `${correctStudentEmail}|${correctAlumniEmail}|resume`;
    
    const result = await dbQuery(`
      INSERT INTO resume_reviews (
        pair_key, student_email, student_name, alumni_email, alumni_name,
        resume_url, filename, student_message, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [pair_key, correctStudentEmail, correctStudentName, correctAlumniEmail, correctAlumniName, resume_url, filename, student_message, 'pending']);

    console.log('[RESUME REQUEST CREATED] ID:', result.rows[0].id, 'Student:', result.rows[0].student_name, 'Alumni:', result.rows[0].alumni_name);
    return res.status(201).json({ review: result.rows[0] });
  } catch (e) {
    console.error('[RESUME REQUEST ERROR]', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// GET student requests
async function getStudentReviews(req, res) {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);
    
    const result = await dbQuery(`
      SELECT * FROM resume_reviews
      WHERE student_email = ?
      ORDER BY requested_at DESC
    `, [decodedEmail]);

    const normalizedReviews = (result.rows || []).map((row) => ({
      ...row,
      resume_url: row.resume_url ? getViewUrl(row.resume_url, row.filename || '') : row.resume_url,
      download_url: row.resume_url ? getProxyDownloadUrl(getViewUrl(row.resume_url, row.filename || ''), row.filename || '') : null,
    }));

    return res.json({ reviews: normalizedReviews });
  } catch (e) {
    console.error('Error fetching student reviews:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// GET alumni requests
async function getAlumniReviews(req, res) {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);
    
    console.log('[ALUMNI FETCH] Email:', decodedEmail);
    
    const result = await dbQuery(`
      SELECT 
        id, pair_key, student_email, student_name, alumni_email, alumni_name,
        resume_url, filename, status, student_message, alumni_feedback,
        requested_at, accepted_at, completed_at, rejected_at, created_at, updated_at
      FROM resume_reviews
      WHERE LOWER(alumni_email) = LOWER(?)
      ORDER BY 
        CASE WHEN status = 'pending' THEN 0 
             WHEN status = 'accepted' THEN 1 
             WHEN status = 'completed' THEN 2
             ELSE 3 END,
        requested_at DESC
    `, [decodedEmail]);

    const transformedReviews = result.rows.map(row => ({
      ...row,
      resume_url: row.resume_url ? getViewUrl(row.resume_url, row.filename || '') : row.resume_url,
      download_url: row.resume_url ? getProxyDownloadUrl(getViewUrl(row.resume_url, row.filename || ''), row.filename || '') : null,
      student_name: row.student_name || null,
      alumini_feedback: row.alumni_feedback || null
    }));
    
    return res.json({ reviews: transformedReviews });
  } catch (e) {
    console.error('Error fetching alumni reviews:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// POST accept request
async function acceptReviewRequest(req, res) {
  try {
    const { id } = req.params;
    
    const result = await dbQuery(`
      UPDATE resume_reviews
      SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
      WHERE id = ?
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log('[RESUME ACCEPTED] ID:', id);
    return res.json({ review: result.rows[0] });
  } catch (e) {
    console.error('Error accepting request:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// POST reject request
async function rejectReviewRequest(req, res) {
  try {
    const { id } = req.params;
    
    const result = await dbQuery(`
      UPDATE resume_reviews
      SET status = 'rejected', rejected_at = NOW(), updated_at = NOW()
      WHERE id = ?
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log('[RESUME REJECTED] ID:', id);
    return res.json({ review: result.rows[0] });
  } catch (e) {
    console.error('Error rejecting request:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// POST submit feedback
async function submitReviewFeedback(req, res) {
  try {
    const { id } = req.params;
    const { alumni_feedback } = req.body;
    
    if (!alumni_feedback) {
      return res.status(400).json({ error: 'Feedback is required' });
    }

    const result = await dbQuery(`
      UPDATE resume_reviews
      SET status = 'completed', alumni_feedback = ?, completed_at = NOW(), updated_at = NOW()
      WHERE id = ?
      RETURNING *
    `, [alumni_feedback, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log('[FEEDBACK SUBMITTED] ID:', id);
    return res.json({ review: result.rows[0] });
  } catch (e) {
    console.error('Error submitting feedback:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// GET debug
async function getResumeReviewsDebug(req, res) {
  try {
    const allReviews = await dbQuery(`
      SELECT id, pair_key, student_email, alumni_email, status, filename, requested_at 
      FROM resume_reviews 
      ORDER BY requested_at DESC
    `);
    
    const stats = {
      totalRecords: allReviews.rows.length,
      byStatus: {},
      byAlumniEmail: {},
      records: allReviews.rows
    };
    
    allReviews.rows.forEach(row => {
      stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + 1;
      stats.byAlumniEmail[row.alumni_email] = (stats.byAlumniEmail[row.alumni_email] || 0) + 1;
    });
    
    return res.json(stats);
  } catch (e) {
    console.error('Debug endpoint error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

module.exports = {
  getMentorsForReview,
  requestResumeReview,
  getStudentReviews,
  getAlumniReviews,
  acceptReviewRequest,
  rejectReviewRequest,
  submitReviewFeedback,
  getResumeReviewsDebug
};
