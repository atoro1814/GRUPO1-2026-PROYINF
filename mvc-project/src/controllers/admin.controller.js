const ApplicantModel = require('../models/applicant.model');
const NotificationModel = require('../models/notification.model');

const AdminController = {
  // GET /admin/applicants — Listar todos
  listApplicants: async (req, res) => {
    try {
      const applicants = await ApplicantModel.findAll();
      res.json(applicants);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /admin/status — Aprobar o Rechazar solicitud
  updateStatus: async (req, res) => {
    const { applicantId, status } = req.body; // status: 'approved' o 'rejected'
    try {
      await ApplicantModel.updateStatus(applicantId, status);

      // HU-06 Notificación
      await NotificationModel.create(
        applicantId,
        'Actualización de Solicitud',
        `Tu solicitud ha sido: ${status === 'approved' ? 'APROBADA' : 'RECHAZADA'}.`
      ).catch((e) => console.error('Error creando notificación', e));

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /admin/disburse — HU-05: Desembolso
  disburse: async (req, res) => {
    const { applicantId } = req.body;
    try {
      const applicant = await ApplicantModel.findById(applicantId);
      if (!applicant || applicant.status !== 'signed') {
        return res.status(400).json({ success: false, message: 'El cliente debe firmar antes de desembolsar.' });
      }

      await ApplicantModel.disburse(applicantId);

      // HU-06 Notificación
      await NotificationModel.create(
        applicantId,
        'Fondos Depositados',
        'El dinero ha sido transferido a tu cuenta bancaria.'
      ).catch((e) => console.error('Error creando notificación', e));

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = AdminController;
