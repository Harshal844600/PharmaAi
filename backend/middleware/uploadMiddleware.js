/**
 * middleware/uploadMiddleware.js
 *
 * Multer configuration for VCF file uploads.
 * - Memory storage (no disk I/O; buffer processed in-memory)
 * - Only .vcf extensions accepted
 * - Hard 5 MB file size limit
 */

const multer = require('multer');
const path = require('path');

// Use memory storage — file content available as req.file.buffer
const storage = multer.memoryStorage();

/**
 * File filter: accept only .vcf files.
 * Validates by extension (MIME types for VCF are not standardized across OSes).
 */
function vcfFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.vcf') {
    return cb(
      Object.assign(new Error('Only .vcf files are accepted.'), { code: 'INVALID_FILE_TYPE' }),
      false
    );
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter: vcfFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

module.exports = { upload };
