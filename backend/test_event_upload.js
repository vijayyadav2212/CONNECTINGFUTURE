const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

async function testEventImageUpload() {
  console.log('\n=== TESTING EVENT IMAGE UPLOAD ENDPOINT ===\n');
  
  try {
    // Create a test image file (1x1 PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x99, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    console.log('Test PNG buffer size:', pngBuffer.length, 'bytes');
    
    // Test with form-data package
    const form = new FormData();
    form.append('image', pngBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    console.log('Sending to http://localhost:4000/api/uploads/event-image');
    const response = await fetch('http://localhost:4000/api/uploads/event-image', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('\nResponse status:', response.status);
    const responseData = await response.json();
    console.log('Response data:', JSON.stringify(responseData, null, 2));
    
    if (response.ok && responseData.url) {
      console.log('\n✅ SUCCESS! File uploaded to:', responseData.url);
    } else {
      console.log('\n❌ FAILED! Response:', responseData);
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testEventImageUpload();
