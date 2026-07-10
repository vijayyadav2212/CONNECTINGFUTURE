const { dbQuery } = require('../config/db');

// GET semesters for student
async function getSemesters(req, res) {
  try {
    const { auth0_id } = req.query || {};
    if (!auth0_id) return res.status(400).json({ error: 'auth0_id required' });
    const { rows } = await dbQuery(
      'SELECT id, student_auth0_id, semester_key, name, gpa, total_credits, is_current FROM academic_semesters WHERE student_auth0_id = ? ORDER BY created_at DESC',
      [auth0_id]
    );
    const semesters = (rows || []).map(r => ({
      id: r.id ? String(r.id) : '',
      semester_key: r.semester_key || '',
      name: r.name || r.semester_key || '',
      gpa: r.gpa != null ? Number(r.gpa) : null,
      total_credits: r.total_credits != null ? Number(r.total_credits) : 0,
      is_current: !!r.is_current
    }));
    return res.json({ semesters });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// GET courses in a semester for student
async function getCourses(req, res) {
  try {
    const { auth0_id, semester_key } = req.query || {};
    if (!auth0_id || !semester_key) return res.status(400).json({ error: 'auth0_id and semester_key required' });
    const { rows } = await dbQuery(
      'SELECT id, student_auth0_id, semester_key, course_key, name, code, credits, grade, status, progress FROM academic_courses WHERE student_auth0_id = ? AND semester_key = ? ORDER BY id',
      [auth0_id, semester_key]
    );
    const courses = (rows || []).map(r => ({
      id: r.id ? String(r.id) : '',
      course_key: r.course_key || '',
      name: r.name || '',
      code: r.code || '',
      credits: r.credits != null ? Number(r.credits) : 0,
      grade: r.grade || '-',
      status: r.status || 'upcoming',
      progress: r.progress != null ? Number(r.progress) : 0,
    }));
    return res.json({ courses });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST create/update semester
async function createSemester(req, res) {
  try {
    const body = req.body || {};
    const { auth0_id, semester_key, name, gpa, total_credits, is_current } = body;
    if (!auth0_id || !semester_key) return res.status(400).json({ error: 'auth0_id and semester_key required' });

    if (!!is_current) {
      await dbQuery(
        'UPDATE academic_semesters SET is_current = FALSE, updated_at = NOW() WHERE student_auth0_id = ? AND semester_key <> ?',
        [auth0_id, semester_key]
      );
    }

    const q = `
      INSERT INTO academic_semesters (student_auth0_id, semester_key, name, gpa, total_credits, is_current, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON CONFLICT (student_auth0_id, semester_key)
      DO UPDATE SET name = EXCLUDED.name, gpa = EXCLUDED.gpa, total_credits = EXCLUDED.total_credits, is_current = EXCLUDED.is_current, updated_at = NOW()
      RETURNING *
    `;
    const params = [auth0_id, semester_key, name || semester_key, gpa != null ? gpa : null, total_credits != null ? total_credits : 0, !!is_current];
    const { rows } = await dbQuery(q, params);
    return res.json({ semester: rows && rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST create/update course
async function createCourse(req, res) {
  try {
    const body = req.body || {};
    const { auth0_id, semester_key, course_key, name, code, credits, grade, status, progress } = body;
    if (!auth0_id || !course_key || !semester_key) return res.status(400).json({ error: 'auth0_id, semester_key and course_key required' });

    const q = `
      INSERT INTO academic_courses (student_auth0_id, semester_key, course_key, name, code, credits, grade, status, progress, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON CONFLICT (student_auth0_id, course_key)
      DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, credits = EXCLUDED.credits, grade = EXCLUDED.grade, status = EXCLUDED.status, progress = EXCLUDED.progress, semester_key = EXCLUDED.semester_key, updated_at = NOW()
      RETURNING *
    `;
    const params = [auth0_id, semester_key, course_key, name || course_key, code || null, credits != null ? credits : 0, grade || null, status || 'upcoming', progress != null ? progress : 0];
    const { rows } = await dbQuery(q, params);
    return res.json({ course: rows && rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = {
  getSemesters,
  getCourses,
  createSemester,
  createCourse
};
