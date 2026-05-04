const pool = require('../config/db');

async function initializeDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applicants (
      id SERIAL PRIMARY KEY,
      fullname TEXT NOT NULL,
      rut TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      income NUMERIC,
      amount NUMERIC,
      months INTEGER,
      status TEXT DEFAULT 'submitted', -- submitted, approved, rejected, signed, disbursed, closed
      ocr_confidence JSON,
      disbursed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      applicant_id INTEGER REFERENCES applicants(id) ON DELETE CASCADE,
      filename TEXT,
      mimetype TEXT,
      content BYTEA
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      applicant_id INTEGER REFERENCES applicants(id) ON DELETE CASCADE,
      type TEXT,
      message TEXT,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS installments (
      id SERIAL PRIMARY KEY,
      applicant_id INTEGER REFERENCES applicants(id) ON DELETE CASCADE,
      installment_number INTEGER,
      amount NUMERIC,
      due_date DATE,
      status TEXT DEFAULT 'pending', -- pending, paid
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Base de datos inicializada/verificada.');
}

module.exports = { initializeDb };
