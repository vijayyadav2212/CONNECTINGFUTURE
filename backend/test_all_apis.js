const API_BASE = 'http://localhost:4000/api';

async function testAllApis() {
  console.log('====================================================');
  console.log('  CONNECTINGFUTURE FULL-STACK API INTEGRATION TEST  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health Endpoint
  await check('GET /api/health', async () => {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (res.status !== 200 || data.status !== 'healthy') throw new Error(`Unexpected status ${res.status}`);
  });

  // 2. User Registration & Profile
  const studentEmail = `student_${Date.now()}@pvppcoe.ac.in`;
  const alumniEmail = `alumni_${Date.now()}@pvppcoe.ac.in`;

  await check('PUT /api/v2/users/profile (Student)', async () => {
    const res = await fetch(`${API_BASE}/v2/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        name: 'Test Student',
        user_type: 'student',
        department: 'Computer Science',
        yearOfStudy: '3rd Year'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await check('PUT /api/v2/users/profile (Alumni)', async () => {
    const res = await fetch(`${API_BASE}/v2/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: alumniEmail,
        name: 'Test Alumni',
        user_type: 'alumni',
        is_mentor: true,
        company: 'Google',
        jobTitle: 'Senior Staff Engineer',
        approval_status: 'approved'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await check('GET /api/users?type=alumni', async () => {
    const res = await fetch(`${API_BASE}/users?type=alumni`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.users)) throw new Error(`Status ${res.status}`);
  });

  await check('GET /api/users/by-email', async () => {
    const res = await fetch(`${API_BASE}/users/by-email?email=${encodeURIComponent(alumniEmail)}`);
    const data = await res.json();
    if (!res.ok || !data.user) throw new Error(`Status ${res.status}`);
  });

  // 3. Mentorship Endpoints
  await check('POST /api/mentors/profile (Upsert Mentor Profile)', async () => {
    const res = await fetch(`${API_BASE}/mentors/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: alumniEmail,
        skills: 'System Design, Node.js, React',
        topics: 'Mock Interviews, Career Guidance',
        price: 500,
        subscription_price: 2000,
        subscription_duration_days: 30
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await check('GET /api/mentors (List Mentors)', async () => {
    const res = await fetch(`${API_BASE}/mentors`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.mentors)) throw new Error(`Status ${res.status}`);
  });

  await check('POST /api/mentorship/request (Send Request)', async () => {
    const res = await fetch(`${API_BASE}/mentorship/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_email: studentEmail,
        mentor_email: alumniEmail,
        message: 'Hello, looking forward to guidance.'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await check('GET /api/mentorship/requests', async () => {
    const res = await fetch(`${API_BASE}/mentorship/requests?student_email=${encodeURIComponent(studentEmail)}`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.requests) || data.requests.length === 0) throw new Error(`Status ${res.status}`);
  });

  await check('POST /api/mentorship/respond (Accept Request)', async () => {
    const res = await fetch(`${API_BASE}/mentorship/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mentor_email: alumniEmail,
        student_email: studentEmail,
        action: 'accept'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  let createdPlanId = null;
  await check('POST /api/mentorship/daily-sessions (Create Daily Plan)', async () => {
    const res = await fetch(`${API_BASE}/mentorship/daily-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mentor_email: alumniEmail,
        title: 'Daily Evening Q&A',
        daily_time: '18:00',
        start_date: '2026-08-01',
        end_date: '2026-08-31',
        meeting_link: 'https://meet.google.com/abc-defg-hij'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.daily_session) throw new Error(`Status ${res.status}`);
    createdPlanId = data.daily_session.id;
  });

  await check('GET /api/mentorship/daily-sessions', async () => {
    const res = await fetch(`${API_BASE}/mentorship/daily-sessions?mentor_email=${encodeURIComponent(alumniEmail)}`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.daily_sessions)) throw new Error(`Status ${res.status}`);
  });

  let createdSessionId = null;
  await check('POST /api/mentorship/sessions/purchase', async () => {
    const res = await fetch(`${API_BASE}/mentorship/sessions/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_email: studentEmail,
        mentor_email: alumniEmail,
        amount: 530,
        payment_id: 'pay_test123',
        order_id: 'order_test123'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.session) throw new Error(`Status ${res.status}`);
    createdSessionId = data.session.id;
  });

  await check('GET /api/mentorship/sessions', async () => {
    const res = await fetch(`${API_BASE}/mentorship/sessions?student_email=${encodeURIComponent(studentEmail)}`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.sessions)) throw new Error(`Status ${res.status}`);
  });

  await check('POST /api/mentorship/sessions/schedule', async () => {
    if (!createdSessionId) throw new Error('No session ID');
    const res = await fetch(`${API_BASE}/mentorship/sessions/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: createdSessionId,
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
        meeting_link: 'https://meet.google.com/session-link-123'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await check('POST /api/mentorship/ratings', async () => {
    if (!createdSessionId) throw new Error('No session ID');
    const res = await fetch(`${API_BASE}/mentorship/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: createdSessionId,
        student_email: studentEmail,
        mentor_email: alumniEmail,
        rating: 5,
        feedback: 'Great mentorship session!'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  // 4. Jobs & Applications
  let createdJobId = null;
  await check('POST /api/jobs (Create Job)', async () => {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Full Stack Software Engineer',
        company: 'Innovate Tech',
        location: 'Mumbai, India',
        description: 'Building modern web apps',
        posted_by: alumniEmail
      })
    });
    const data = await res.json();
    if (!res.ok || !data.job) throw new Error(`Status ${res.status}`);
    createdJobId = data.job.id;
  });

  await check('GET /api/jobs (List Jobs)', async () => {
    const res = await fetch(`${API_BASE}/jobs`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.jobs)) throw new Error(`Status ${res.status}`);
  });

  await check('POST /api/jobs/:id/apply (Apply to Job)', async () => {
    if (!createdJobId) throw new Error('No job ID');
    const res = await fetch(`${API_BASE}/jobs/${createdJobId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicant_email: studentEmail,
        resume_url: 'https://example.com/resume.pdf',
        cover_letter: 'Excited for this opportunity!'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await check('GET /api/jobs/applications/by-job (List Applicants for Alumni)', async () => {
    if (!createdJobId) throw new Error('No job ID');
    const res = await fetch(`${API_BASE}/jobs/applications/by-job?job_id=${createdJobId}`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.applications) || data.applications.length === 0) throw new Error(`Status ${res.status}`);
  });

  await check('GET /api/jobs/applications (List Student Applications)', async () => {
    const res = await fetch(`${API_BASE}/jobs/applications?applicant_email=${encodeURIComponent(studentEmail)}`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.applications)) throw new Error(`Status ${res.status}`);
  });

  // 5. Events API
  let createdEventId = null;
  await check('POST /api/events (Create Event)', async () => {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Alumni Tech Meet 2026',
        description: 'Networking and keynote speeches',
        event_date: '2026-09-15',
        location: 'College Auditorium',
        created_by: alumniEmail
      })
    });
    const data = await res.json();
    if (!res.ok || (!data.id && !data.event)) throw new Error(`Status ${res.status}`);
    createdEventId = data.id || (data.event && data.event.id);
  });

  await check('GET /api/events (List Events)', async () => {
    const res = await fetch(`${API_BASE}/events`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data)) throw new Error(`Status ${res.status}`);
  });

  await check('POST /api/events/:id/register (Register for Event)', async () => {
    if (!createdEventId) throw new Error('No event ID');
    const res = await fetch(`${API_BASE}/events/${createdEventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: studentEmail,
        user_name: 'Test Student'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  // 6. Campus Memories API
  let createdMemoryId = null;
  await check('POST /api/memories (Post Campus Memory)', async () => {
    const res = await fetch(`${API_BASE}/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author_email: alumniEmail,
        title: 'Graduation Day 2024',
        caption: 'Unforgettable moments with friends',
        image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1'
      })
    });
    const data = await res.json();
    if (!res.ok || (!data.memory && !data.id)) throw new Error(`Status ${res.status}`);
    createdMemoryId = (data.memory && data.memory.id) || data.id;
  });

  await check('GET /api/memories (List Memories)', async () => {
    const res = await fetch(`${API_BASE}/memories`);
    const data = await res.json();
    if (!res.ok || (!Array.isArray(data.memories) && !Array.isArray(data))) throw new Error(`Status ${res.status}`);
  });

  // 7. Donations API
  await check('POST /api/donations (Record Donation)', async () => {
    const res = await fetch(`${API_BASE}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donor_name: 'Test Alumni',
        donor_email: alumniEmail,
        amount: 1000,
        payment_method: 'razorpay',
        tier: 'bronze',
        payment_id: `don_${Date.now()}`
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Status ${res.status}: ${errText}`);
    }
  });

  await check('GET /api/donations (List Donations)', async () => {
    const res = await fetch(`${API_BASE}/donations`);
    const data = await res.json();
    if (!res.ok || (!Array.isArray(data.donations) && !Array.isArray(data))) throw new Error(`Status ${res.status}`);
  });

  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
}

testAllApis().catch(console.error);
