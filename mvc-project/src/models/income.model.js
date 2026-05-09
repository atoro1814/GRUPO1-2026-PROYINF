const pool = require('../config/db');

const IncomeModel = {
  // Guarda los registros individuales de cada liquidación dentro de una transacción
  saveMany: async (client, applicantId, records) => {
    // records: [{ liquidacion_number, amount, confidence }]
    for (const r of records) {
      await client.query(
        `INSERT INTO income_records (applicant_id, liquidacion_number, amount, confidence)
         VALUES ($1, $2, $3, $4)`,
        [applicantId, r.liquidacion_number, r.amount, r.confidence]
      );
    }
  },

  // Actualiza un registro individual cuando el usuario corrige el monto manualmente
  correct: async (id, amount) => {
    const result = await pool.query(
      `UPDATE income_records
       SET amount = $1, manually_corrected = TRUE
       WHERE id = $2
       RETURNING *`,
      [amount, id]
    );
    return result.rows[0] || null;
  },

  // Devuelve todos los registros de liquidaciones de un solicitante
  findByApplicant: async (applicantId) => {
    const result = await pool.query(
      `SELECT * FROM income_records
       WHERE applicant_id = $1
       ORDER BY liquidacion_number ASC`,
      [applicantId]
    );
    return result.rows;
  },

  // Calcula el promedio de los montos registrados para un solicitante
  calculateAverage: async (applicantId) => {
    const result = await pool.query(
      `SELECT ROUND(AVG(amount)) AS average
       FROM income_records
       WHERE applicant_id = $1`,
      [applicantId]
    );
    return parseFloat(result.rows[0].average) || 0;
  },
};

module.exports = IncomeModel;