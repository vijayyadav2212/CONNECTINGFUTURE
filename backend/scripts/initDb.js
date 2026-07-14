const { dbQuery } = require('../config/db');

const { createUsersSchema } = require('../database/users');
const { createMessagesSchema } = require('../database/messages');
const { createDonationsSchema } = require('../database/donations');
const { createRoadmapsSchema } = require('../database/roadmaps');
const { createConnectionsSchema } = require('../database/connections');
const { createMentorshipSchema } = require('../database/mentorship');
const { createResumeReviewsSchema } = require('../database/resumeReviews');
const { createAcademicProgressSchema } = require('../database/academicProgress');
const { createMemoriesSchema } = require('../database/memories');
const { createEventsSchema } = require('../database/events');
const { createJobsSchema } = require('../database/jobs');
const { createApplicationsSchema } = require('../database/applications');
const { createExternalJobsSchema } = require('../database/externalJobs');
const { createSiteSettingsSchema } = require('../database/siteSettings');

async function initDb() {
  console.log('Starting database schema initialization...');
  try {
    // 1. Users schema first since others might reference it
    console.log('Initializing Users schema...');
    await createUsersSchema(dbQuery);

    // 2. Messages
    console.log('Initializing Messages schema...');
    await createMessagesSchema(dbQuery);

    // 3. Donations
    console.log('Initializing Donations schema...');
    await createDonationsSchema(dbQuery);

    // 4. Roadmaps
    console.log('Initializing Roadmaps schema...');
    await createRoadmapsSchema(dbQuery);

    // 5. Connections
    console.log('Initializing Connections schema...');
    await createConnectionsSchema(dbQuery);

    // 6. Mentorship
    console.log('Initializing Mentorship schema...');
    await createMentorshipSchema(dbQuery);

    // 7. Resume Reviews
    console.log('Initializing Resume Reviews schema...');
    await createResumeReviewsSchema(dbQuery);

    // 8. Academic Progress
    console.log('Initializing Academic Progress schema...');
    await createAcademicProgressSchema(dbQuery);

    // 9. Memories
    console.log('Initializing Memories schema...');
    await createMemoriesSchema(dbQuery);

    // 10. Jobs
    console.log('Initializing Jobs schema...');
    await createJobsSchema(dbQuery);

    // 11. Applications
    console.log('Initializing Applications schema...');
    await createApplicationsSchema(dbQuery);

    // 12. External Jobs
    console.log('Initializing External Jobs schema...');
    await createExternalJobsSchema(dbQuery);

    // 13. Site Settings
    console.log('Initializing Site Settings schema...');
    await createSiteSettingsSchema(dbQuery);

    // 14. Events & Registrations
    console.log('Initializing Events schema...');
    await createEventsSchema(dbQuery);

    console.log('Database tables and indexes are successfully initialized!');
    process.exit(0);
  } catch (error) {
    console.error('Database schema initialization failed:', error);
    process.exit(1);
  }
}

initDb();
