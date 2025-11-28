const express = require('express');
const multer = require('multer');
const pool = require('./db');
const app = express();
const port = 3000;

const upload = multer(); // Almacenamiento en memoria para simplificar
app.use(express.static('public'));
app.use(express.json());

// --- INICIALIZACIÓN DE LA BASE DE DATOS ---
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
  console.log("Base de datos inicializada/verificada.");
}
initializeDb().catch(err => console.error('Error DB init:', err));

// --- HELPER: NOTIFICACIONES (HU-06) ---
async function notify(applicantId, type, message) {
  try {
    await pool.query(
      `INSERT INTO notifications (applicant_id, type, message) VALUES ($1, $2, $3)`,
      [applicantId, type, message]
    );
    console.log(`[NOTIFICACIÓN EMAIL SIMULADA] Para ID ${applicantId}: ${message}`);
  } catch (e) {
    console.error("Error creando notificación", e);
  }
}

// --- ENDPOINTS ---

// LOGIN (Nueva funcionalidad de estructura)
app.post('/login', async (req, res) => {
  const { rut } = req.body;
  try {
    const result = await pool.query('SELECT * FROM applicants WHERE rut = $1', [rut]);
    if (result.rows.length > 0) {
      return res.json({ success: true, user: result.rows[0] });
    } else {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HU-02: Completar Solicitud
app.post('/apply', upload.array('documents', 5), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { fullname, rut, email, income, amount, months } = req.body;

    // Validación básica backend
    if (!fullname || !rut || !email || !amount) {
      throw new Error('Datos incompletos');
    }

    // Verificar si ya existe
    const check = await client.query('SELECT id FROM applicants WHERE rut = $1', [rut]);
    if (check.rows.length > 0) {
      throw new Error('Ya existe una solicitud con este RUT');
    }

    const insertRes = await client.query(
      `INSERT INTO applicants (fullname, rut, email, income, amount, months, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'submitted') RETURNING id`,
      [fullname, rut, email, parseFloat(income), parseFloat(amount), parseInt(months)]
    );
    const applicantId = insertRes.rows[0].id;

    // Guardar documentos
    if (req.files) {
      for (const file of req.files) {
        await client.query(
          `INSERT INTO documents (applicant_id, filename, mimetype, content) VALUES ($1, $2, $3, $4)`,
          [applicantId, file.originalname, file.mimetype, file.buffer]
        );
      }
    }

    // Generar cuotas (HU-01 -> HU-04 preparación)
    const principal = parseFloat(amount);
    const period = parseInt(months);
    const rate = 0.015; // 1.5% mensual fijo para el ejemplo
    let monthlyPayment = principal * (rate * Math.pow(1 + rate, period)) / (Math.pow(1 + rate, period) - 1);
    monthlyPayment = Math.round(monthlyPayment);

    const now = new Date();
    for (let i = 1; i <= period; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i);
      await client.query(
        `INSERT INTO installments (applicant_id, installment_number, amount, due_date) VALUES ($1, $2, $3, $4)`,
        [applicantId, i, monthlyPayment, dueDate]
      );
    }

    await client.query('COMMIT');
    
    // HU-06 Notificación
    notify(applicantId, 'Estado Solicitud', 'Su solicitud ha sido recibida y está en evaluación.');

    res.json({ success: true, applicantId, fullname });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// HU-03: Firma Digital
app.post('/sign', async (req, res) => {
  const { applicantId } = req.body;
  try {
    const appRes = await pool.query('SELECT status FROM applicants WHERE id = $1', [applicantId]);
    if (appRes.rows[0].status !== 'approved') {
      return res.status(400).json({ success: false, message: 'La solicitud no está aprobada para firma.' });
    }

    await pool.query("UPDATE applicants SET status = 'signed' WHERE id = $1", [applicantId]);
    
    // HU-06 Notificación
    notify(applicantId, 'Contrato Firmado', 'Has firmado exitosamente. Esperando desembolso.');
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HU-04: Pagar Cuota
app.post('/pay-installment', async (req, res) => {
  const { installmentId } = req.body;
  try {
    // Verificar estado
    const instRes = await pool.query('SELECT * FROM installments WHERE id = $1', [installmentId]);
    if (!instRes.rows.length) return res.status(404).json({ success: false, message: 'Cuota no encontrada' });
    if (instRes.rows[0].status === 'paid') return res.status(400).json({ success: false, message: 'Ya pagada' });

    // Procesar pago
    await pool.query("UPDATE installments SET status = 'paid' WHERE id = $1", [installmentId]);
    const applicantId = instRes.rows[0].applicant_id;

    // HU-06 Notificación Pago Exitoso
    notify(applicantId, 'Pago Recibido', `Se ha confirmado el pago de la cuota #${instRes.rows[0].installment_number}.`);

    // Verificar si terminó de pagar todo el crédito
    const pending = await pool.query("SELECT COUNT(*) FROM installments WHERE applicant_id = $1 AND status = 'pending'", [applicantId]);
    if (parseInt(pending.rows[0].count) === 0) {
      await pool.query("UPDATE applicants SET status = 'closed' WHERE id = $1", [applicantId]);
      notify(applicantId, 'Crédito Finalizado', '¡Felicidades! Has pagado la totalidad de tu préstamo.');
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HU-05: Desembolso (Endpoint Admin)
app.post('/admin/disburse', async (req, res) => {
  const { applicantId } = req.body;
  try {
    const appRes = await pool.query('SELECT status FROM applicants WHERE id = $1', [applicantId]);
    if (appRes.rows[0].status !== 'signed') {
      return res.status(400).json({ success: false, message: 'El cliente debe firmar antes de desembolsar.' });
    }

    await pool.query("UPDATE applicants SET status = 'disbursed', disbursed_at = NOW() WHERE id = $1", [applicantId]);
    
    // HU-06 Notificación Desembolso
    notify(applicantId, 'Fondos Depositados', 'El dinero ha sido transferido a tu cuenta bancaria.');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Aprobar/Rechazar (Para habilitar el flujo de firma)
app.post('/admin/status', async (req, res) => {
  const { applicantId, status } = req.body; // status: 'approved' o 'rejected'
  try {
    await pool.query("UPDATE applicants SET status = $1 WHERE id = $2", [status, applicantId]);
    
    // HU-06 Notificación Cambio Estado
    notify(applicantId, 'Actualización de Solicitud', `Tu solicitud ha sido: ${status === 'approved' ? 'APROBADA' : 'RECHAZADA'}.`);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener datos del usuario (refresh)
app.get('/applicant/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await pool.query('SELECT * FROM applicants WHERE id = $1', [id]);
    const installments = await pool.query('SELECT * FROM installments WHERE applicant_id = $1 ORDER BY installment_number ASC', [id]);
    const notifications = await pool.query('SELECT * FROM notifications WHERE applicant_id = $1 ORDER BY created_at DESC', [id]);
    
    if (user.rows.length === 0) return res.status(404).json({ success: false });

    res.json({
      user: user.rows[0],
      installments: installments.rows,
      notifications: notifications.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Listar todos
app.get('/admin/applicants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM applicants ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});