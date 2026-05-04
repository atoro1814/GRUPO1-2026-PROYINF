const express = require('express');
const router = express.Router();
const ApplicantController = require('../controllers/applicant.controller');
const upload = require('../middlewares/upload.middleware');

// HU-02: Completar Solicitud
router.post('/apply', upload.array('documents', 5), ApplicantController.apply);

// Obtener datos del usuario (refresh dashboard)
router.get('/applicant/:id', ApplicantController.getById);

// HU-03: Firma Digital
router.post('/sign', ApplicantController.sign);

// HU-04: Pagar Cuota
router.post('/pay-installment', ApplicantController.payInstallment);

module.exports = router;
