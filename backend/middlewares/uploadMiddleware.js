const multer = require('multer');

// --- Event Image Uploads ---
const allowedEventImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const eventImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (allowedEventImageTypes.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Invalid image type. Only JPG, PNG, WEBP, GIF are allowed.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// --- Memory Image Uploads (Flexible config) ---
const createMemoryUpload = ({ fileSize, mimeCheck, invalidMessage }) => multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (mimeCheck && typeof mimeCheck === 'function' && !mimeCheck(file.mimetype)) {
      return cb(new Error(invalidMessage || 'Invalid file type.'));
    }
    return cb(null, true);
  },
  limits: { fileSize: fileSize || 5 * 1024 * 1024 },
});

// Specific memory image upload instance
const memoryImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (allowedEventImageTypes.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Invalid image type. Only JPG, PNG, WEBP, GIF are allowed.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = {
  eventImageUpload,
  createMemoryUpload,
  memoryImageUpload
};
