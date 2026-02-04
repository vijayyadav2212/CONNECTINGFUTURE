async function createAcademicProgressSchema(dbQuery) {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS academic_semesters (
      id SERIAL PRIMARY KEY,
      student_auth0_id VARCHAR(255) NOT NULL,
      semester_key VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      gpa NUMERIC(3, 2) DEFAULT 0,
      total_credits INT DEFAULT 0,
      is_current BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(student_auth0_id, semester_key)
    )
  `);

  await dbQuery('CREATE INDEX IF NOT EXISTS idx_academic_semesters_student ON academic_semesters(student_auth0_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_academic_semesters_current ON academic_semesters(student_auth0_id, is_current)');

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS academic_courses (
      id SERIAL PRIMARY KEY,
      student_auth0_id VARCHAR(255) NOT NULL,
      semester_key VARCHAR(100) NOT NULL,
      course_key VARCHAR(120) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50),
      credits INT DEFAULT 0,
      grade VARCHAR(10),
      status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
      progress INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(student_auth0_id, course_key)
    )
  `);

  await dbQuery('CREATE INDEX IF NOT EXISTS idx_academic_courses_student ON academic_courses(student_auth0_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_academic_courses_semester ON academic_courses(student_auth0_id, semester_key)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_academic_courses_status ON academic_courses(status)');
}

module.exports = { createAcademicProgressSchema };
