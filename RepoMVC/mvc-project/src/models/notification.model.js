const pool = require('../config/db');

const NotificationModel = {
  create: async (applicantId, type, message) => {
    await pool.query(
      `INSERT INTO notifications (applicant_id, type, message) VALUES ($1, $2, $3)`,
      [applicantId, type, message]
    );
    console.log(`[NOTIFICACIÓN EMAIL SIMULADA] Para ID ${applicantId}: ${message}`);
  },

  findByApplicant: async (applicantId) => {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE applicant_id = $1 ORDER BY created_at DESC',
      [applicantId]
    );
    return result.rows;
  },
};

module.exports = NotificationModel;
