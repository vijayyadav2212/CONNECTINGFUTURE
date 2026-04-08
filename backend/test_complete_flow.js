const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

async function testComplete() {
  console.log('\n=== TESTING COMPLETE UPLOAD & DOWNLOAD FLOW ===\n');
  
  try {
    // Step 1: Upload
    console.log('Step 1: Uploading resume to backend...');
    const pdfBuffer = Buffer.from('TEST PDF CONTENT - This is a fake PDF file');
    
    const form = new FormData();
    form.append('resume', pdfBuffer, {
      filename: 'test-complete-flow.pdf',
      contentType: 'application/pdf'
    });
    
    const uploadResp = await fetch('http://localhost:4000/api/uploads/resume', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const uploadData = await uploadResp.json();
    console.log('✅ Upload successful');
    console.log('   URL:', uploadData.url);
    
    // Step 2: Check URL format
    console.log('\nStep 2: Checking URL format...');
    if (uploadData.url.includes('/fl_attachment/')) {
      console.log('✅ CORRECT: URL includes /fl_attachment/ flag');
    } else {
      console.log('❌ ERROR: URL missing /fl_attachment/ flag');
    }
    
    if (uploadData.url.includes('/raw/upload/')) {
      console.log('✅ CORRECT: URL uses /raw/upload/ (not /image/upload/)');
    } else {
      console.log('❌ ERROR: URL using wrong path');
    }
    
    // Step 3: Try to access the file
    console.log('\nStep 3: Testing download access...');
    const downloadResp = await fetch(uploadData.url, {
      method: 'GET'
    });
    
    console.log(`Download status: ${downloadResp.status}`);
    
    if (downloadResp.status === 200) {
      console.log('✅ SUCCESS: File is accessible (HTTP 200)');
      
      const content = await downloadResp.text();
      console.log(`File content length: ${content.length} bytes`);
      console.log(`File content starts with: "${content.substring(0, 30)}..."`);
      
      if (content.includes('TEST PDF CONTENT')) {
        console.log('✅ SUCCESS: File content is correct');
      }
    } else {
      console.log('❌ ERROR: File not accessible (HTTP ' + downloadResp.status + ')');
    }
    
    console.log('\n=== TEST COMPLETE ===\n');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testComplete();
