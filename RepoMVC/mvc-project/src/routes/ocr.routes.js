const express = require('express');
const router = express.Router();
const OcrController = require('../controllers/ocr.controller');
const upload = require('../middlewares/upload.middleware');

// HU-07: Procesamiento OCR
router.post('/ocr', upload.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]), OcrController.process);

module.exports = router;
