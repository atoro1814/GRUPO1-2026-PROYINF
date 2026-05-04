const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');

// Listar todos los solicitantes
router.get('/applicants', AdminController.listApplicants);

// Aprobar o rechazar una solicitud
router.post('/status', AdminController.updateStatus);

// HU-05: Desembolso
router.post('/disburse', AdminController.disburse);

module.exports = router;
