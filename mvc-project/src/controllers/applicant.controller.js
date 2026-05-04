const pool = require('../config/db');
const ApplicantModel = require('../models/applicant.model');
const DocumentModel = require('../models/document.model');
const InstallmentModel = require('../models/installment.model');
const NotificationModel = require('../models/notification.model');

const ApplicantController = {
  // POST /apply — HU-02: Completar Solicitud
  apply: async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { fullname, rut, email, income, amount, months, ocrData } = req.body;

      if (!fullname || !rut || !email || !amount) {
        throw new Error('Datos incompletos');
      }

      const existing = await client.query('SELECT id FROM applicants WHERE rut = $1', [rut]);
      if (existing.rows.length > 0) {
        throw new Error('Ya existe una solicitud con este RUT');
      }

      const newApplicant = await ApplicantModel.create(client, {
        fullname, rut, email, income, amount, months, ocrData,
      });
      const applicantId = newApplicant.id;

      if (req.files && req.files.length > 0) {
        await DocumentModel.saveMany(client, applicantId, req.files);
      }

      await InstallmentModel.createMany(client, applicantId, parseFloat(amount), parseInt(months));

      await client.query('COMMIT');

      // HU-06 Notificación
      await NotificationModel.create(
        applicantId,
        'Estado Solicitud',
        'Su solicitud ha sido recibida y está en evaluación.'
      ).catch((e) => console.error('Error creando notificación', e));

      res.json({ success: true, applicantId, fullname });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      res.status(400).json({ success: false, message: err.message });
    } finally {
      client.release();
    }
  },

  // GET /applicant/:id — Obtener datos del usuario
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await ApplicantModel.findById(id);
      if (!user) return res.status(404).json({ success: false });

      const installments = await InstallmentModel.findByApplicant(id);
      const notifications = await NotificationModel.findByApplicant(id);

      res.json({ user, installments, notifications });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /sign — HU-03: Firma Digital
  sign: async (req, res) => {
    const { applicantId } = req.body;
    try {
      const applicant = await ApplicantModel.findById(applicantId);
      if (!applicant || applicant.status !== 'approved') {
        return res.status(400).json({ success: false, message: 'La solicitud no está aprobada para firma.' });
      }

      await ApplicantModel.updateStatus(applicantId, 'signed');

      // HU-06 Notificación
      await NotificationModel.create(
        applicantId,
        'Contrato Firmado',
        'Has firmado exitosamente. Esperando desembolso.'
      ).catch((e) => console.error('Error creando notificación', e));

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /pay-installment — HU-04: Pagar Cuota
  payInstallment: async (req, res) => {
    const { installmentId } = req.body;
    try {
      const installment = await InstallmentModel.findById(installmentId);
      if (!installment) return res.status(404).json({ success: false, message: 'Cuota no encontrada' });
      if (installment.status === 'paid') return res.status(400).json({ success: false, message: 'Ya pagada' });

      await InstallmentModel.markPaid(installmentId);
      const applicantId = installment.applicant_id;

      // HU-06 Notificación Pago
      await NotificationModel.create(
        applicantId,
        'Pago Recibido',
        `Se ha confirmado el pago de la cuota #${installment.installment_number}.`
      ).catch((e) => console.error('Error creando notificación', e));

      const pending = await InstallmentModel.countPending(applicantId);
      if (pending === 0) {
        await ApplicantModel.updateStatus(applicantId, 'closed');
        await NotificationModel.create(
          applicantId,
          'Crédito Finalizado',
          '¡Felicidades! Has pagado la totalidad de tu préstamo.'
        ).catch((e) => console.error('Error creando notificación', e));
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = ApplicantController;
