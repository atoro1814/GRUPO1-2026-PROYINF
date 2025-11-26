const express = require('express');
const multer = require('multer');
const pool = require('./db');
const app = express();
const port = 3000;

const upload = multer(); // memoria
app.use(express.static('public'));
app.use(express.json()); // para endpoints json

// Inicializar tablas y nuevas columnas
async function initializeDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applicants (
      id SERIAL PRIMARY KEY,
      fullname TEXT NOT NULL,
      rut TEXT NOT NULL,
      email TEXT NOT NULL,
      income NUMERIC,
      amount NUMERIC,
      months INTEGER,
      status TEXT,
      bank_account TEXT,
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
      meta JSONB,
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
      status TEXT DEFAULT 'pending',
      reminder_sent BOOLEAN DEFAULT FALSE
    );
  `);
}
initializeDb().catch(err => console.error('DB init error:', err));

// Helper to insert notification
async function insertNotification(applicantId, type, message, meta = {}) {
  await pool.query(
    `INSERT INTO notifications (applicant_id, type, message, meta) VALUES ($1,$2,$3,$4)`,
    [applicantId, type, message, meta]
  );
  console.log(`Notificación (${type}) para applicant ${applicantId}: ${message}`);
}

// /apply: guarda applicant, documents y genera cuotas
app.post('/apply', upload.array('documents', 5), async (req, res) => {
  try {
    const { fullname, rut, email, income, amount, months } = req.body;
    if (!fullname || !rut || !email || !income || !amount || !months) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
    }
    const incomeNum = parseFloat(income), amountNum = parseFloat(amount), monthsNum = parseInt(months, 10);
    const insertApplicant = await pool.query(
      `INSERT INTO applicants (fullname, rut, email, income, amount, months, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [fullname, rut, email, incomeNum, amountNum, monthsNum, 'submitted']
    );
    const applicantId = insertApplicant.rows[0].id;
    // Guardar documentos
    const files = req.files || [];
    for (const file of files) {
      await pool.query(
        `INSERT INTO documents (applicant_id, filename, mimetype, content) VALUES ($1,$2,$3,$4)`,
        [applicantId, file.originalname, file.mimetype, file.buffer]
      );
    }
    // Generar cuotas mensuales aproximadas
    const interestRate = 0.015;
    let monthlyPayment = amountNum / monthsNum;
    if (interestRate > 0) {
      monthlyPayment = amountNum * (interestRate * Math.pow(1 + interestRate, monthsNum)) / (Math.pow(1 + interestRate, monthsNum) - 1);
    }
    // Inserta cuotas con fechas mensuales desde hoy (+1 mes)
    const now = new Date();
    for (let i = 1; i <= monthsNum; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i);
      await pool.query(
        `INSERT INTO installments (applicant_id, installment_number, amount, due_date, status) VALUES ($1,$2,$3,$4,$5)`,
        [applicantId, i, Math.round(monthlyPayment), dueDate.toISOString().split('T')[0], 'pending']
      );
    }
    // Notificación inicial: solicitud recibida
    await insertNotification(applicantId, 'application', 'Solicitud recibida y en evaluación', { status: 'submitted' });

    return res.json({ success: true, applicantId, fullname });
  } catch (err) {
    console.error('Apply error:', err);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// Endpoint para aprobar una solicitud (simulado)
app.post('/applicants/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query(`SELECT * FROM applicants WHERE id = $1`, [id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Solicitante no encontrado' });
    await pool.query(`UPDATE applicants SET status = $1 WHERE id = $2`, ['approved', id]);
    await insertNotification(id, 'status', 'Solicitud aprobada', { newStatus: 'approved' });
    return res.json({ success: true, message: 'Solicitud aprobada, correo enviado (simulado)' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});

// Endpoint para rechazar una solicitud (simulado)
app.post('/applicants/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query(`SELECT * FROM applicants WHERE id = $1`, [id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Solicitante no encontrado' });
    await pool.query(`UPDATE applicants SET status = $1 WHERE id = $2`, ['rejected', id]);
    await insertNotification(id, 'status', 'Solicitud rechazada', { newStatus: 'rejected' });
    return res.json({ success: true, message: 'Solicitud rechazada, correo enviado (simulado)' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});

// Desembolso: ahora sólo si estado es approved
app.post('/applicants/:id/disburse', async (req, res) => {
  try {
    const { id } = req.params;
    const applicantRes = await pool.query('SELECT * FROM applicants WHERE id = $1', [id]);
    if (applicantRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Solicitante no encontrado' });
    }
    const applicant = applicantRes.rows[0];
    if (applicant.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Solo se puede desembolsar solicitudes aprobadas.' });
    }
    const transactionId = `TRX-${Date.now()}`;
    await pool.query(`UPDATE applicants SET status = $1, disbursed_at = NOW() WHERE id = $2`, ['disbursed', id]);

    const notificationMsg = `Correo enviado: fondos depositados (tx: ${transactionId})`;
    await insertNotification(id, 'disburse', notificationMsg, { transactionId });

    return res.json({ success: true, transactionId, message: 'Correo enviado' });
  } catch (err) {
    console.error('Disburse error:', err);
    return res.status(500).json({ success: false, message: 'Error interno en el desembolso' });
  }
});

// Endpoint para pagar una cuota y notificar (simulado)
app.post('/installments/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const instRes = await pool.query(`SELECT * FROM installments WHERE id = $1`, [id]);
    if (instRes.rows.length === 0) return res.status(404).json({ message: 'Cuota no encontrada' });
    const inst = instRes.rows[0];
    if (inst.status === 'paid') return res.status(400).json({ message: 'Cuota ya pagada' });

    await pool.query(`UPDATE installments SET status = 'paid' WHERE id = $1`, [id]);
    await insertNotification(inst.applicant_id, 'payment', `Pago confirmado de cuota ${inst.installment_number}`, { installmentId: id });

    // Si todas las cuotas están pagadas: cerrar préstamo y notificar
    const remaining = await pool.query(`SELECT count(*) FROM installments WHERE applicant_id = $1 AND status != 'paid'`, [inst.applicant_id]);
    if (parseInt(remaining.rows[0].count, 10) === 0) {
      await pool.query(`UPDATE applicants SET status = 'closed' WHERE id = $1`, [inst.applicant_id]);
      await insertNotification(inst.applicant_id, 'closure', 'Préstamo pagado en su totalidad. Cuenta cerrada.', {});
    }
    return res.json({ success: true, message: 'Pago procesado y correo de confirmación enviado (simulado)' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error interno' });
  }
});

// Notificaciones: obtener por applicantId
app.get('/applicants/:id/notifications', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, type, message, meta, created_at FROM notifications WHERE applicant_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error interno' });
  }
});

// Scheduler: buscar cuotas con due_date en 7 días y reminder_sent=false
setInterval(async () => {
  try {
    const result = await pool.query(`
      SELECT id, applicant_id, installment_number, due_date 
      FROM installments 
      WHERE reminder_sent = false AND status = 'pending' AND due_date BETWEEN NOW()::date AND (NOW()::date + INTERVAL '7 days')
    `);
    for (const row of result.rows) {
      const msg = `Recordatorio: cuota ${row.installment_number} vence el ${row.due_date}. Por favor realiza el pago a tiempo.`;
      await insertNotification(row.applicant_id, 'reminder', msg, { installmentNumber: row.installment_number, due_date: row.due_date });
      await pool.query(`UPDATE installments SET reminder_sent = TRUE WHERE id = $1`, [row.id]);
    }
  } catch (err) {
    console.error('Scheduler error:', err);
  }
}, 60 * 1000); // cada 60s (modo dev). Ajustar a hourly en prod.

app.listen(port, () => {
  console.log(`App corriendo en http://localhost:${port}`);
});