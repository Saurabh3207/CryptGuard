const multer = require('multer');

const storage = () => multer.memoryStorage(); // Store the file data in memory for encryption};

module.exports = { uploadUserFile:multer({ storage: storage() }).single('file') };