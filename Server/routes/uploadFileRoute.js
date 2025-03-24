const express = require('express');
const router = express.Router();
const {uploadFileController} = require('../controllers/uploadFileController');
const {uploadUserFile} = require('../middleware/multer');

router.post('/uploadFile',uploadUserFile,uploadFileController);

module.exports = router;