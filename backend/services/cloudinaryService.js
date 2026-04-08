const cloudinary = require('cloudinary').v2;

function getExtensionFromName(fileName = '') {
  const cleanName = String(fileName || '').split('?')[0].split('#')[0];
  const lastDot = cleanName.lastIndexOf('.');
  if (lastDot < 0 || lastDot === cleanName.length - 1) return '';
  return cleanName.slice(lastDot + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function stripAttachmentFlag(url = '') {
  if (!url) return '';
  return url
    .replace('/fl_attachment/', '/')
    .replace(/\/fl_attachment:[^/]+\//, '/');
}

function extractCloudinaryPublicId(cloudinaryUrl = '') {
  const cleanUrl = stripAttachmentFlag(cloudinaryUrl).split('?')[0];
  const uploadMatch = cleanUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (!uploadMatch || !uploadMatch[1]) return '';
  return uploadMatch[1].replace(/\.[^/.]+$/, '');
}

function getCloudinaryEnv() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY || process.env.API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET,
  };
}

// Configure Cloudinary with environment variables
// Priority: CLOUDINARY_URL (auto-parsed) > individual variables
if (process.env.CLOUDINARY_URL) {
  // Cloudinary SDK auto-parses CLOUDINARY_URL from environment
  // Just ensure we have basic config
  cloudinary.config({
    secure: true,
    api_timeout: 60000, // 60 second timeout
  });
} else {
  const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();
  if (cloudName && apiKey && apiSecret) {
  // Fallback to individual variables
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
      api_timeout: 60000,
    });
  } else {
    console.warn('[CLOUDINARY] No credentials found. Check CLOUDINARY_URL or CLOUD_NAME/API_KEY/API_SECRET (or CLOUDINARY_* variants).');
  }
}

/**
 * Get clean URL for viewing files in browser (no forced download)
 * For raw files (pdf/doc/docx), ensure URL has extension so browsers can infer file type.
 * @param {Object|string} uploadData - Cloudinary upload result object or secure_url string
 * @param {string} originalName - Original file name (used as fallback for extension)
 * @returns {string} Clean URL for viewing
 */
function getViewUrl(uploadData, originalName = '') {
  if (!uploadData) return '';

  if (typeof uploadData === 'string') {
    return stripAttachmentFlag(uploadData);
  }

  const secureUrl = stripAttachmentFlag(uploadData.secure_url || '');
  if (!secureUrl) return '';
  return secureUrl;
}

/**
 * Build optional download URL from a view URL
 * @param {string} viewUrl - Browser view URL
 * @param {string} fileName - Optional filename for downloaded file
 * @returns {string} Cloudinary URL that forces download
 */
function getDownloadUrl(viewUrl, fileName = '') {
  if (!viewUrl) return '';

  const cleanUrl = stripAttachmentFlag(viewUrl);
  const [basePath, query = ''] = cleanUrl.split('?');
  const safeName = String(fileName || '').replace(/[^a-zA-Z0-9._\- ]+/g, '').trim();
  const encodedName = encodeURIComponent(safeName);
  const attachmentSegment = encodedName ? `fl_attachment:${encodedName}` : 'fl_attachment';
  const downloadPath = basePath.replace('/upload/', `/upload/${attachmentSegment}/`);

  return query ? `${downloadPath}?${query}` : downloadPath;
}

async function resolveViewUrl(uploadData, originalName = '') {
  const baseUrl = getViewUrl(uploadData, originalName);
  if (!uploadData) return '';

  if (typeof uploadData === 'object' && uploadData.resource_type !== 'raw') {
    return baseUrl;
  }

  const pathWithoutQuery = String(baseUrl).split('?')[0];
  if (/\.[a-z0-9]+$/i.test(pathWithoutQuery)) {
    return baseUrl;
  }

  const publicId = typeof uploadData === 'string'
    ? extractCloudinaryPublicId(uploadData)
    : extractCloudinaryPublicId(uploadData.secure_url || uploadData.url || '');

  if (!publicId) {
    return baseUrl;
  }

  try {
    const resource = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
    const resolvedExtension = String(resource.format || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    if (resolvedExtension) {
      return `${pathWithoutQuery}.${resolvedExtension}`;
    }
  } catch (error) {
    console.warn('[CLOUDINARY] Failed to resolve raw asset metadata for view URL:', publicId, error.message || error);
  }

  return baseUrl;
}

/**
 * Upload a file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} folder - Cloudinary folder (e.g., 'event-images', 'resumes')
 * @param {string} originalName - Original file name for reference
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with url and public_id
 */
async function uploadFile(fileBuffer, folder, originalName, options = {}) {
  const resourceType = options.resource_type || options.resourceType || 'auto';
  const cloudinaryFolder = String(folder || '').replace(/^\/+|\/+$/g, '');

  return new Promise((resolve, reject) => {
    if (!fileBuffer || fileBuffer.length === 0) {
      return reject(new Error('File buffer is empty'));
    }

    // Remove extension from originalName to avoid double extensions (e.g., .pdf.pdf)
    const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');
    const sanitizedName = nameWithoutExtension.replace(/[^a-z0-9-_]/gi, '_');
    const publicId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${sanitizedName}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `connecting-future/${cloudinaryFolder}`,
        public_id: publicId,
        resource_type: resourceType,
        // Store metadata for downloads
        context: { filename: originalName },
        // Ensure proper filename in Content-Disposition header
        filename_override: originalName.replace(/\.[^/.]+$/, ''), // Remove extension for override
        ...options,
      },
      (error, result) => {
        if (error) {
          console.error(`[CLOUDINARY] Upload error for ${folder}/${publicId}:`, error);
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        console.log(`[CLOUDINARY] Successfully uploaded to ${folder}/${publicId}`);
        resolve(result);
      }
    );

    uploadStream.on('error', (error) => {
      console.error(`[CLOUDINARY] Stream error for ${folder}/${publicId}:`, error);
      reject(new Error(`Upload stream error: ${error.message}`));
    });

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {Promise<Object>} Deletion result
 */
async function deleteFile(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

/**
 * Upload event image
 */
async function uploadEventImage(fileBuffer, originalName) {
  return uploadFile(fileBuffer, 'events', originalName, {
    resource_type: 'image',
    quality: 'auto',
    fetch_format: 'auto',
  });
}

/**
 * Upload resume (PDF, DOC, DOCX - served as raw files)
 */
async function uploadResume(fileBuffer, originalName) {
  return uploadFile(fileBuffer, 'job_applications', originalName, {
    resource_type: 'raw', // PDFs/documents must use 'raw' not 'auto'
  });
}

async function uploadReviewResume(fileBuffer, originalName) {
  return uploadFile(fileBuffer, 'resume_reviews', originalName, {
    resource_type: 'raw',
  });
}

/**
 * Upload message file (PDFs, documents - served as raw files)
 */
async function uploadMessageFile(fileBuffer, originalName) {
  return uploadFile(fileBuffer, 'messages', originalName, {
    resource_type: 'auto',
  });
}

async function uploadOtherFile(fileBuffer, originalName) {
  return uploadFile(fileBuffer, 'others', originalName, {
    resource_type: 'auto',
  });
}

/**
 * Upload memory image
 */
async function uploadMemoryImage(fileBuffer, originalName) {
  return uploadFile(fileBuffer, 'memory-images', originalName, {
    quality: 'auto',
    fetch_format: 'auto',
  });
}

module.exports = {
  uploadFile,
  deleteFile,
  uploadEventImage,
  uploadResume,
  uploadReviewResume,
  uploadMessageFile,
  uploadOtherFile,
  uploadMemoryImage,
  getViewUrl,
  getDownloadUrl,
  resolveViewUrl,
};