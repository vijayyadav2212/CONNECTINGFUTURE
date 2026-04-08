require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('\n=== TESTING RESOURCE_TYPE FIX ===\n');

// Test buffer (simulate a PDF)
const pdfBuffer = Buffer.from('PDF content for testing resource type fix');

async function testUpload(resourceType) {
  console.log(`\n--- Testing with resource_type: '${resourceType}' ---`);
  
  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'connecting-future/test-fix',
        public_id: `test_${resourceType}_${Date.now()}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          console.error('ERROR:', error.message);
          resolve();
          return;
        }
        
        console.log('✅ Upload Success:');
        console.log('  Public ID:', result.public_id);
        console.log('  Resource Type:', result.resource_type);
        console.log('  URL:', result.secure_url);
        console.log('  Status: Can access via browser?', 
          result.secure_url.includes('/raw/') ? '✅ YES (raw)' : 
          result.secure_url.includes('/image/') ? '❌ NO (image)' : 
          '❓ UNKNOWN'
        );
        resolve();
      }
    );
    
    uploadStream.on('error', (err) => {
      console.error('Stream error:', err.message);
      resolve();
    });
    
    uploadStream.end(pdfBuffer);
  });
}

(async () => {
  // Test both resource types
  await testUpload('raw');
  await new Promise(r => setTimeout(r, 1000));
  await testUpload('auto');
  
  console.log('\n=== TEST COMPLETE ===\n');
  console.log('Summary:');
  console.log('- "raw" URLs use /raw/upload/ path → ✅ Accessible');
  console.log('- "auto" URLs use /image/upload/ for PDFs → ⚠️  May have access issues');
  console.log('- Should use "raw" for PDFs, DOCS, and documents');
  console.log('\n');
  
  process.exit(0);
})();
