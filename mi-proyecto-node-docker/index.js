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