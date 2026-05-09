const express = require('express');
const router = express.Router();
const OcrController = require('../controllers/ocr.controller');
const upload = require('../middlewares/upload.middleware');

// HU-07: Procesamiento OCR de cédula de identidad
router.post('/ocr', upload.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]), OcrController.process);

// HU-10: Procesamiento OCR de liquidaciones de sueldo
router.post('/ocr/income', upload.array('liquidaciones', 3), OcrController.processIncome);

// HU-10 T4: Corrección manual de monto de una liquidación
router.patch('/ocr/income/:id', OcrController.correctIncome);

module.exports = router;