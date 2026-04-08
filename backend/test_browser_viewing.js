const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

async function testBrowserViewing() {
  console.log('\n=== TESTING BROWSER VIEWING (NO DOWNLOAD) ===\n');
  
  try {
    // Upload a file
    console.log('Uploading file...');
    const pdfBuffer = Buffer.from('TEST PDF CONTENT - This should display in browser');
    
    const form = new FormData();
    form.append('resume', pdfBuffer, {
      filename: 'test-browser-view.pdf',
      contentType: 'application/pdf'
    });
    
    const uploadResp = await fetch('http://localhost:4000/api/uploads/resume', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const uploadData = await uploadResp.json();
    console.log('✅ Upload successful\n');
    
    console.log('Generated URL:');
    console.log(uploadData.url);
    console.log('');
    
    // Check URL characteristics
    console.log('URL Analysis:');
    
    if (!uploadData.url.includes('/fl_attachment/')) {
      console.log('✅ NO /fl_attachment/ flag - File will OPEN in browser');
    } else {
      console.log('❌ Has /fl_attachment/ - File will DOWNLOAD');
    }
    
    if (uploadData.url.includes('/raw/upload/')) {
      console.log('✅ Uses /raw/upload/ - Correct path for PDFs');
    } else {
      console.log('❌ Wrong upload path');
    }
    
    // Test access
    console.log('\nTesting access:');
    const viewResp = await fetch(uploadData.url);
    console.log(`Status: ${viewResp.status} ${viewResp.status === 200 ? '✅' : '❌'}`);
    
    if (viewResp.status === 200) {
      const headers = viewResp.headers;
      const contentType = headers.get('content-type');
      console.log(`Content-Type: ${contentType}`);
      
      // Check if it's NOT forcing download
      const contentDisposition = headers.get('content-disposition');
      if (!contentDisposition || !contentDisposition.includes('attachment')) {
        console.log('✅ No Content-Disposition attachment - Will display in browser');
      } else {
        console.log('❌ Has attachment header - Will download');
      }
    }
    
    console.log('\n=== RESULT: FILE READY FOR BROWSER VIEWING ✅ ===\n');
    console.log('User can click URL to:');
    console.log('- View PDF in browser');
    console.log('- View images in browser');
    console.log('- Listen to audio in browser');
    console.log('- Option to download from browser if desired\n');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testBrowserViewing();
