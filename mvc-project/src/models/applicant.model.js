const pool = require('../config/db');

const ApplicantModel = {
  findByRut: async (rut) => {
    const result = await pool.query('SELECT * FROM applicants WHERE rut = $1', [rut]);
    return result.rows[0] || null;
  },

  findById: async (id) => {
    const result = await pool.query('SELECT * FROM applicants WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  findAll: async () => {
    const result = await pool.query('SELECT * FROM applicants ORDER BY created_at DESC');
    return result.rows;
  },

  create: async (client, { fullname, rut, email, income, amount, months, ocrData }) => {
    const result = await client.query(
      `INSERT INTO applicants (fullname, rut, email, income, amount, months, status, ocr_confidence)
       VALUES ($1, $2, $3, $4, $5, $6, 'submitted', $7) RETURNING id`,
      [fullname, rut, email, parseFloat(income), parseFloat(amount), parseInt(months), ocrData || '{}']
    );
    return result.rows[0];
  },

  updateStatus: async (id, status) => {
    await pool.query('UPDATE applicants SET status = $1 WHERE id = $2', [status, id]);
  },

  disburse: async (id) => {
    await pool.query(
      "UPDATE applicants SET status = 'disbursed', disbursed_at = NOW() WHERE id = $1",
      [id]
    );
  },
};

module.exports = ApplicantModel;
