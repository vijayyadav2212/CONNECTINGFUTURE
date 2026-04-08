require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('\n=== CLOUDINARY DIRECT UPLOAD TEST ===\n');

// Log configuration
console.log('Configuration:');
console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('  CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET');
console.log('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');
console.log('  CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? 'SET' : 'NOT SET');

// Create test buffer
const testBuffer = Buffer.from('Test PDF content for Cloudinary upload test');
console.log('\nTest buffer size:', testBuffer.length, 'bytes');

// Test 1: Using upload_stream with write()
console.log('\n--- TEST 1: Using upload_stream with write() ---');
try {
  const uploadStream1 = cloudinary.uploader.upload_stream(
    {
      folder: 'connecting-future/test',
      public_id: 'test_001_write_method',
      resource_type: 'auto',
    },
    (error, result) => {
      if (error) {
        console.error('TEST 1 FAILED - Callback error:', error.message);
      } else {
        console.log('TEST 1 SUCCESS:');
        console.log('  Public ID:', result.public_id);
        console.log('  URL:', result.secure_url);
        console.log('  Size:', result.bytes, 'bytes');
      }
    }
  );

  uploadStream1.on('error', (err) => {
    console.error('TEST 1 FAILED - Stream error:', err.message);
  });

  uploadStream1.write(testBuffer);
  uploadStream1.end();
} catch (e) {
  console.error('TEST 1 EXCEPTION:', e.message);
}

// Test 2: Using upload_stream with end()
console.log('\n--- TEST 2: Using upload_stream with end() + buffer ---');
setTimeout(() => {
  try {
    const uploadStream2 = cloudinary.uploader.upload_stream(
      {
        folder: 'connecting-future/test',
        public_id: 'test_002_end_method',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('TEST 2 FAILED - Callback error:', error.message);
        } else {
          console.log('TEST 2 SUCCESS:');
          console.log('  Public ID:', result.public_id);
          console.log('  URL:', result.secure_url);
        }
      }
    );

    uploadStream2.on('error', (err) => {
      console.error('TEST 2 FAILED - Stream error:', err.message);
    });

    uploadStream2.end(testBuffer);
  } catch (e) {
    console.error('TEST 2 EXCEPTION:', e.message);
  }
}, 2000);

// Test 3: Check API connectivity
console.log('\n--- TEST 3: Checking Cloudinary API Connectivity ---');
setTimeout(() => {
  cloudinary.api.resources(
    { type: 'upload', prefix: 'connecting-future' },
    (error, result) => {
      if (error) {
        console.error('TEST 3 FAILED - API Error:', error.message);
        console.error('  Error code:', error.http_code);
      } else {
        console.log('TEST 3 SUCCESS - API is working:');
        console.log('  Total resources:', result.total_count);
        console.log('  Returned resources:', result.resources ? result.resources.length : 0);
        if (result.resources && result.resources.length > 0) {
          console.log('  Latest resource:', result.resources[0].public_id);
        }
      }
    }
  );
}, 4000);

// Wait for all tests to complete
setTimeout(() => {
  console.log('\n=== TEST COMPLETE ===\n');
  process.exit(0);
}, 6000);
