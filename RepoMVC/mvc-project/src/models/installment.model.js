const pool = require('../config/db');

const InstallmentModel = {
  createMany: async (client, applicantId, amount, months) => {
    const rate = 0.015; // 1.5% mensual fijo
    let monthlyPayment =
      amount * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    monthlyPayment = Math.round(monthlyPayment);

    const now = new Date();
    for (let i = 1; i <= months; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i);
      await client.query(
        `INSERT INTO installments (applicant_id, installment_number, amount, due_date) VALUES ($1, $2, $3, $4)`,
        [applicantId, i, monthlyPayment, dueDate]
      );
    }
  },

  findByApplicant: async (applicantId) => {
    const result = await pool.query(
      'SELECT * FROM installments WHERE applicant_id = $1 ORDER BY installment_number ASC',
      [applicantId]
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query('SELECT * FROM installments WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  markPaid: async (id) => {
    await pool.query("UPDATE installments SET status = 'paid' WHERE id = $1", [id]);
  },

  countPending: async (applicantId) => {
    const result = await pool.query(
      "SELECT COUNT(*) FROM installments WHERE applicant_id = $1 AND status = 'pending'",
      [applicantId]
    );
    return parseInt(result.rows[0].count);
  },
};

module.exports = InstallmentModel;
