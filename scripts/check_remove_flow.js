(async()=>{
  try{
    const backend = 'http://localhost:4000';
    const mentor = 'vedantangre268@gmail.com';
    const student = 'remove_test_student@pvppcoe.ac.in';
    const nodeFetch = global.fetch || (await import('node-fetch')).default;
    const fetch = nodeFetch;

    console.log('CREATE REQUEST');
    let r = await fetch(backend + '/api/mentorship/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ student_email: student, mentor_email: mentor, message: 'remove test' }) });
    console.log('status', r.status); console.log(await r.text());

    console.log('MENTOR ACCEPT');
    r = await fetch(backend + '/api/mentorship/respond', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mentor_email: mentor, student_email: student, action: 'accept' }) });
    console.log('status', r.status); console.log(await r.text());

    console.log('CHECK CONNECTIONS FOR STUDENT');
    r = await fetch(backend + '/api/connections?user_email=' + encodeURIComponent(student));
    console.log('status', r.status); console.log(await r.text());

    console.log('REMOVE CONNECTION (student removes)');
    r = await fetch(backend + '/api/connections/remove', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_email: student, other_email: mentor }) });
    console.log('status', r.status); console.log(await r.text());

    console.log('CHECK CONNECTIONS FOR STUDENT AFTER REMOVE');
    r = await fetch(backend + '/api/connections?user_email=' + encodeURIComponent(student));
    console.log('status', r.status); console.log(await r.text());
  } catch (e) { console.error(e); process.exit(1); }
})();
