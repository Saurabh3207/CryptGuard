const multer = require('multer');

const storage = () => multer.memoryStorage(); // Store the file data in memory for encryption

// File size and type validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-rar-compressed',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and common media files are allowed.'), false);
  }
};

// Configure multer with size limits and file type validation
const upload = multer({
  storage: storage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: fileFilter
});

module.exports = { uploadUserFile: upload.single('file') };