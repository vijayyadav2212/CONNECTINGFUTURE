const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

async function testResumeUpload() {
  console.log('\n=== TESTING FIXED RESUME UPLOAD ===\n');
  
  try {
    // Create a test PDF-like buffer
    const pdfBuffer = Buffer.from('Fake PDF content for testing resume upload...');
    
    console.log('Creating multipart form data with resume file...');
    const form = new FormData();
    form.append('resume', pdfBuffer, {
      filename: 'test-resume-fixed.pdf',
      contentType: 'application/pdf'
    });
    
    console.log('Uploading to http://localhost:4000/api/uploads/resume\n');
    const response = await fetch('http://localhost:4000/api/uploads/resume', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('Response status:', response.status);
    const responseData = await response.json();
    
    if (response.ok) {
      console.log('\n✅ UPLOAD SUCCESS!\n');
      console.log('File URL:', responseData.url);
      console.log('');
      
      // Check if URL uses correct path
      if (responseData.url.includes('/raw/upload/')) {
        console.log('✅ CORRECT: URL uses /raw/upload/ path');
        console.log('   PDFs will be accessible and downloadable');
      } else if (responseData.url.includes('/image/upload/')) {
        console.log('❌ PROBLEM: URL uses /image/upload/ path');
        console.log('   PDFs may return 401 Unauthorized');
      } else {
        console.log('❓ UNKNOWN: Check URL structure');
      }
      
      console.log('\nFile can be downloaded from:');
      console.log(responseData.url);
    } else {
      console.log('\n❌ UPLOAD FAILED');
      console.log('Error:', responseData.error);
      if (responseData.details) {
        console.log('Details:', responseData.details);
      }
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testResumeUpload();
