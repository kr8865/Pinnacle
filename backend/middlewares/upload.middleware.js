const multer = require('multer');
const ApiError = require('../utils/ApiError');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ARCHIVE_TYPES = ['application/zip', 'application/x-zip-compressed'];
const CSV_TYPES = ['text/csv', 'application/vnd.ms-excel'];

const ALL_ALLOWED = [...IMAGE_TYPES, ...DOC_TYPES, ...ARCHIVE_TYPES, ...CSV_TYPES];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALL_ALLOWED.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = { upload, IMAGE_TYPES, DOC_TYPES, ARCHIVE_TYPES, CSV_TYPES };
