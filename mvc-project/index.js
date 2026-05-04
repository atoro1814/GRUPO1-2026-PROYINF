const express = require('express');
const { initializeDb } = require('./src/models/db.model');

const authRoutes = require('./src/routes/auth.routes');
const applicantRoutes = require('./src/routes/applicant.routes');
const adminRoutes = require('./src/routes/admin.routes');
const ocrRoutes = require('./src/routes/ocr.routes');

const app = express();
const port = 3000;

// --- MIDDLEWARES GLOBALES ---
app.use(express.static('public'));
app.use(express.json());

// --- RUTAS ---
app.use('/', authRoutes);
app.use('/', applicantRoutes);
app.use('/admin', adminRoutes);
app.use('/api', ocrRoutes);

// --- INICIO ---
initializeDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error DB init:', err);
    process.exit(1);
  });
