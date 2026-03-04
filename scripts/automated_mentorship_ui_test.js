#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  try {
    const backend = 'http://localhost:4000';
    const frontend = 'http://localhost:3000';
    const mentor = 'vedantangre268@gmail.com';
    const student = 'test_student_sim@pvppcoe.ac.in';

    console.log('Running API sequence (request -> accept -> purchase -> schedule)...');
    // 1. Create request
    let res = await fetch(`${backend}/api/mentorship/request`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ student_email: student, mentor_email: mentor, message: 'Automated test request' })
    });
    console.log('request:', res.status, await res.text());

    // 2. Mentor accepts
    res = await fetch(`${backend}/api/mentorship/respond`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mentor_email: mentor, student_email: student, action: 'accept' })
    });
    console.log('respond:', res.status, await res.text());

    // 3. Student purchases
    res = await fetch(`${backend}/api/mentorship/sessions/purchase`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ student_email: student, mentor_email: mentor, amount: 1 })
    });
    const purchase = await res.json();
    console.log('purchase:', res.status, purchase);
    const sessionId = purchase && purchase.session && purchase.session.id;
    if (!sessionId) throw new Error('No session created');

    // 4. Mentor schedules
    const scheduled_at = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    res = await fetch(`${backend}/api/mentorship/sessions/schedule`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, scheduled_at, duration_minutes: 60, meeting_link: 'https://meet.google.com/automated-test' })
    });
    console.log('schedule:', res.status, await res.text());

    // 5. Launch headless browser and verify student sessions
    const browser = await chromium.launch();
    const page = await browser.newPage();
    console.log('Opening student mentorship page...');
    await page.goto(`${frontend}/student/mentorship-requests`, { waitUntil: 'networkidle' });

    // Run a direct fetch in page context to get sessions for the test student
    const sessions = await page.evaluate(async (ctx) => {
      const { backendUrl, studentEmail } = ctx;
      const r = await fetch(`${backendUrl}/api/mentorship/sessions?student_email=${encodeURIComponent(studentEmail)}`);
      return r.ok ? await r.json() : { error: `status:${r.status}`, text: await r.text() };
    }, { backendUrl: backend, studentEmail: student });

    console.log('Sessions fetched from page context:', sessions);

    // Screenshot result for inspection
    await page.screenshot({ path: 'mentorship_ui_test.png', fullPage: true });
    console.log('Saved screenshot: mentorship_ui_test.png');

    await browser.close();
    console.log('Automated UI test completed.');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
