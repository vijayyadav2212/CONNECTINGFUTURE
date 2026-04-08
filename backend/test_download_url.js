const { getDownloadUrl } = require('./services/cloudinaryService');

console.log('\n=== TESTING getDownloadUrl FUNCTION ===\n');

const testUrls = [
  'https://res.cloudinary.com/dzgbhybpa/raw/upload/v1775650806/connecting-future/resumes/1775650803036_ieo55b_test_pdf',
  'https://res.cloudinary.com/dzgbhybpa/image/upload/v1775650082/connecting-future/messages/1775650078785_s6f62k_Resume_Vijay_Yadav__1__pdf.pdf',
  'https://res.cloudinary.com/dzgbhybpa/image/upload/v1775649703/connecting-future/event-images/1775649700399_po5ue1_test_png.png',
];

testUrls.forEach((url, i) => {
  console.log(`\nTest ${i + 1}:`);
  console.log('Original:', url.substring(0, 80) + '...');
  
  const downloadUrl = getDownloadUrl(url, 'test.pdf');
  console.log('Modified:', downloadUrl.substring(0, 80) + '...');
  
  if (downloadUrl.includes('/fl_attachment/')) {
    console.log('✅ CORRECT: fl_attachment flag added');
  } else {
    console.log('❌ ERROR: fl_attachment flag NOT added');
  }
});

console.log('\n=== TEST COMPLETE ===\n');
