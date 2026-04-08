require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function identifyBrokenURLs() {
  console.log('\n=== IDENTIFYING BROKEN CLOUDINARY URLS ===\n');
  
  try {
    // Check resume_reviews table for URLs with /image/upload/
    const result = await pool.query(`
      SELECT id, student_email, resume_url 
      FROM resume_reviews 
      WHERE resume_url IS NOT NULL 
      ORDER BY id DESC
      LIMIT 20;
    `);
    
    let brokenCount = 0;
    let workingCount = 0;
    
    console.log(`Checking ${result.rows.length} resume requests:\n`);
    
    result.rows.forEach((row) => {
      const isBroken = row.resume_url.includes('/image/upload/');
      
      if (isBroken) {
        brokenCount++;
        console.log(`❌ ID ${row.id}: ${row.resume_url.substring(0, 90)}...`);
      } else if (row.resume_url.includes('/raw/upload/')) {
        workingCount++;
        console.log(`✅ ID ${row.id}: ${row.resume_url.substring(0, 90)}...`);
      } else {
        console.log(`⚠️  ID ${row.id}: UNKNOWN TYPE - ${row.resume_url.substring(0, 90)}...`);
      }
    });
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`✅ Working (/raw/upload/): ${workingCount}`);
    console.log(`❌ Broken (/image/upload/): ${brokenCount}`);
    
    if (brokenCount > 0) {
      console.log(`\n📋 ACTION REQUIRED:`);
      console.log(`  Students with ${brokenCount} old uploads need to re-upload their resumes.`);
      console.log(`  New uploads automatically use the correct /raw/upload URL.`);
      console.log(`\n✅ SOLUTION:`);
      console.log(`  - Issue is fixed in backend/services/cloudinaryService.js`);
      console.log(`  - All future uploads will use resource_type: 'raw'`);
      console.log(`  - Users with old broken files should re-upload`);
    } else {
      console.log(`\n✅ All URLs are working correctly!`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    pool.end();
  }
}

identifyBrokenURLs();
