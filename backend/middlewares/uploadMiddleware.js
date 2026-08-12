const multer = require('multer');

const isImageMime = (mime) => {
  if (!mime) return true;
  const lower = String(mime).toLowerCase();
  return lower.startsWith('image/') || lower === 'application/octet-stream';
};

const eventImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (isImageMime(file.mimetype)) return cb(null, true);
    return cb(new Error('Invalid image type. Please select a valid image file.'));
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

const createMemoryUpload = ({ fileSize, mimeCheck, invalidMessage }) => multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (mimeCheck && typeof mimeCheck === 'function' && !mimeCheck(file.mimetype)) {
      return cb(new Error(invalidMessage || 'Invalid file type.'));
    }
    return cb(null, true);
  },
  limits: { fileSize: fileSize || 20 * 1024 * 1024 },
});

const memoryImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (isImageMime(file.mimetype)) return cb(null, true);
    return cb(new Error('Invalid image type. Please select a valid image file.'));
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

module.exports = {
  eventImageUpload,
  createMemoryUpload,
  memoryImageUpload
};
