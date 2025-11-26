const express = require('express');
const multer = require('multer');
const pool = require('./db'); // Importar la conexión
const app = express();
const port = 3000;

const upload = multer(); // memoria, guarda buffers en file.buffer

app.use(express.static('public'));

// Inicializar tablas
async function initializeDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applicants (
      id SERIAL PRIMARY KEY,
      fullname TEXT NOT NULL,
      rut TEXT NOT NULL,
      email TEXT NOT NULL,
      income NUMERIC,
      amount BIGINT,
      months INTEGER,
      status TEXT,
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
    CREATE TABLE IF NOT EXISTS installments (
      id SERIAL PRIMARY KEY,
      applicant_id INTEGER REFERENCES applicants(id) ON DELETE CASCADE,
      installment_number INTEGER,
      amount INTEGER,
      due_date DATE,
      status TEXT DEFAULT 'pending' -- 'pending', 'paid'
    );
  `);
}
initializeDb().catch(err => console.error('DB init error:', err));

// Ruta de prueba que guarda un mensaje en la base de datos
app.get('/save', async (req, res) => {
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, content TEXT)');
    await pool.query('INSERT INTO messages (content) VALUES ($1)', ['Hola desde PostgreSQL!']);
    res.send('Mensaje guardado en la base de datos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

// Ruta para obtener todos los mensajes
app.get('/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});
//Ruta para procesar la firma digital
// MODIFICA TU RUTA /sign EXISTENTE ASÍ:
app.post('/sign', express.json(), async (req, res) => {
  try {
    const { applicantId } = req.body;
    if (!applicantId) return res.status(400).json({ success: false, message: 'ID requerido' });

    // 1. Obtener datos del préstamo para calcular cuotas
    const applicantRes = await pool.query('SELECT * FROM applicants WHERE id = $1', [applicantId]);
    const applicant = applicantRes.rows[0];

    if (!applicant) return res.status(404).json({ success: false, message: 'Solicitante no encontrado' });

    // 2. Calcular valor cuota simple (Mismo cálculo que usaste antes)
    const amount = parseFloat(applicant.amount);
    const months = parseInt(applicant.months);
    const interestRate = 0.015;
    let monthlyPayment = amount / months;
    if (interestRate > 0) {
      monthlyPayment = amount * (interestRate * Math.pow(1 + interestRate, months)) / (Math.pow(1 + interestRate, months) - 1);
    }
    monthlyPayment = Math.round(monthlyPayment);

    // 3. Insertar las cuotas en la base de datos
    // (Solo si no existen ya, para evitar duplicados si firma dos veces)
    const checkInstallments = await pool.query('SELECT count(*) FROM installments WHERE applicant_id = $1', [applicantId]);
    if (parseInt(checkInstallments.rows[0].count) === 0) {
        for (let i = 1; i <= months; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i); // Vencimiento en 1 mes, 2 meses, etc.
            
            await pool.query(
                `INSERT INTO installments (applicant_id, installment_number, amount, due_date, status) VALUES ($1, $2, $3, $4, $5)`,
                [applicantId, i, monthlyPayment, dueDate, 'pending']
            );
        }
    }

    // 4. Actualizar estado a 'signed'
    await pool.query(`UPDATE applicants SET status = 'signed' WHERE id = $1`, [applicantId]);

    return res.json({ success: true, message: 'Firmado y cuotas generadas' });
  } catch (err) {
    console.error('Sign error:', err);
    return res.status(500).json({ success: false, message: 'Error al firmar' });
  }
});

// --- NUEVAS RUTAS PARA EL PAGO ---

// Obtener las cuotas de un cliente
app.get('/installments/:applicantId', async (req, res) => {
    try {
        const { applicantId } = req.params;
        const result = await pool.query('SELECT * FROM installments WHERE applicant_id = $1 ORDER BY installment_number ASC', [applicantId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener cuotas');
    }
});

// Pagar una cuota
app.post('/pay-installment', express.json(), async (req, res) => {
    try {
        const { installmentId } = req.body;
        
        // SIMULACIÓN DE VALIDACIÓN (Criterio de aceptación: Rechazo)
        // Simulamos que falla el 10% de las veces aleatoriamente
        const simularFallo = Math.random() < 0.1; 
        if (simularFallo) {
            return res.status(400).json({ success: false, message: 'Transacción rechazada: Fondos insuficientes en el medio de pago.' });
        }

        // Procesar pago exitoso
        await pool.query("UPDATE installments SET status = 'paid' WHERE id = $1", [installmentId]);
        
        res.json({ success: true, message: 'Pago exitoso. Comprobante #TX-998877' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Endpoint para recibir solicitud + documentos
app.post('/apply', upload.array('documents', 5), async (req, res) => {
  try {
    const { fullname, rut, email, income, amount, months } = req.body;
    // Validaciones básicas
    if (!fullname || !rut || !email || !income || !amount || !months) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
    }

    const incomeNum = parseFloat(income);
    const amountNum = parseFloat(amount);
    const monthsNum = parseInt(months, 10);

    if (isNaN(incomeNum) || isNaN(amountNum) || isNaN(monthsNum)) {
      return res.status(400).json({ success: false, message: 'Valores numéricos inválidos.' });
    }

    // Cálculo de cuota (misma fórmula que front)
    const interestRate = 0.015;
    let monthlyPayment = amountNum / monthsNum;
    if (interestRate > 0) {
      monthlyPayment = amountNum * (interestRate * Math.pow(1 + interestRate, monthsNum)) / (Math.pow(1 + interestRate, monthsNum) - 1);
    }

    // Regla de admisibilidad: ingreso >= 2 * cuota mensual (puedes ajustar)
    if (incomeNum < monthlyPayment * 2) {
      return res.status(400).json({
        success: false,
        admissible: false,
        message: 'No cumple regla de admisibilidad: ingreso insuficiente frente a la cuota mensual estimada.'
      });
    }

    // Insertar solicitante
    const insertApplicant = await pool.query(
      `INSERT INTO applicants (fullname, rut, email, income, amount, months, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [fullname, rut, email, incomeNum, amountNum, monthsNum, 'submitted']
    );
    const applicantId = insertApplicant.rows[0].id;

    // Guardar documentos (si hay)
    const files = req.files || [];
    for (const file of files) {
      await pool.query(
        `INSERT INTO documents (applicant_id, filename, mimetype, content) VALUES ($1,$2,$3,$4)`,
        [applicantId, file.originalname, file.mimetype, file.buffer]
      );
    }

    return res.json({ success: true, applicantId, fullname });
  } catch (err) {
    console.error('Apply error:', err);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
});

app.get('/', (req, res) => {
  res.send('¡Bienvenido! Usa /save para guardar un mensaje y /messages para verlos.');
});

app.listen(port, () => {
  console.log(`App corriendo en http://localhost:${port}`);
});