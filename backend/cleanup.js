const { dbQuery } = require('./config/db');

async function cleanup() {
  const tables = [
    'event_registrations', 'events', 'applications', 'jobs', 
    'mentorship_requests', 'mentorship_sessions', 'mentorship_subscriptions', 
    'mentor_daily_sessions', 'mentor_ratings', 'mentors', 
    'resume_reviews', 'academic_courses', 'academic_semesters', 
    'roadmap_student_progress', 'roadmap_quiz_attempts', 'roadmap_resource_follows', 'roadmaps',
    'memory_tag_notifications', 'memory_comments', 'memories', 
    'external_job_application_feedback', 'external_job_bookmarks', 'external_jobs_cache', 'external_job_search_cache',
    'donations', 'connections', 'messages'
  ];

  console.log('Starting robust database cleanup...');
  for (const table of tables) {
    try {
      await dbQuery(`DELETE FROM ${table}`);
      console.log(`- Cleared table: ${table}`);
    } catch (err) {
      console.warn(`- Skipped/Failed table ${table}:`, err.message);
    }
  }

  try {
    await dbQuery("DELETE FROM users");
    console.log('- Cleared all entries from users table');
  } catch (err) {
    console.error('- Failed to clear users table:', err.message);
  }

  console.log('Cleanup script executed completely!');
  process.exit(0);
}

cleanup();
