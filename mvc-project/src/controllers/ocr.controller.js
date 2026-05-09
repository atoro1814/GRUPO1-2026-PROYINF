const pool = require('../config/db');
const ApplicantModel = require('../models/applicant.model');
const IncomeModel = require('../models/income.model');

// Umbral mínimo de confianza OCR para no marcar un campo como revisión requerida
const CONFIDENCE_THRESHOLD = 0.75;

// Simula la llamada al servicio OCR externo para una liquidación
// En producción, aquí iría la llamada real (ej. Google Vision, AWS Textract, etc.)
function callOcrService(fileBuffer) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulamos variación de confianza entre liquidaciones
      const confidence = parseFloat((Math.random() * 0.4 + 0.6).toFixed(2)); // 0.60 – 1.00
      const amount = Math.floor(Math.random() * 300000) + 600000;            // $600.000 – $900.000
      resolve({ amount, confidence });
    }, 500);
  });
}

const OcrController = {
  // POST /api/ocr/income — HU-10: Procesamiento OCR de liquidaciones de sueldo
  processIncome: async (req, res) => {
    const { applicantId } = req.body;

    if (!applicantId) {
      return res.status(400).json({ success: false, message: 'applicantId es requerido.' });
    }

    const files = req.files; // Array de hasta 3 archivos con fieldname 'liquidaciones'
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Debes subir al menos una liquidación.' });
    }
    if (files.length > 3) {
      return res.status(400).json({ success: false, message: 'Se aceptan máximo 3 liquidaciones.' });
    }

    try {
      const applicant = await ApplicantModel.findById(applicantId);
      if (!applicant) {
        return res.status(404).json({ success: false, message: 'Solicitante no encontrado.' });
      }

      // T4 se ocupa del procesamiento — aquí llamamos al OCR por cada archivo
      const ocrResults = await Promise.all(
        files.map((file, index) =>
          callOcrService(file.buffer).then((result) => ({
            liquidacion_number: index + 1,
            amount: result.amount,
            confidence: result.confidence,
            needs_review: result.confidence < CONFIDENCE_THRESHOLD,
          }))
        )
      );

      // Persistir en BD dentro de una transacción (T6)
      const average = Math.round(
        ocrResults.reduce((sum, r) => sum + r.amount, 0) / ocrResults.length
      );

      let savedRecords = [];
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const r of ocrResults) {
          const result = await client.query(
            `INSERT INTO income_records (applicant_id, liquidacion_number, amount, confidence)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [applicantId, r.liquidacion_number, r.amount, r.confidence]
          );
          savedRecords.push(result.rows[0]);
        }

        await client.query(
          'UPDATE applicants SET income = $1 WHERE id = $2',
          [average, applicantId]
        );

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      const liquidacionesResponse = ocrResults.map((r, i) => ({
        ...r,
        id: savedRecords[i].id,
      }));

      return res.json({
        success: true,
        liquidaciones: liquidacionesResponse,
        ingreso_promedio: average,
        needs_review: ocrResults.some((r) => r.needs_review),
      });
    } catch (error) {
      console.error('Error en OCR de ingresos:', error);
      res.status(500).json({ success: false, message: 'Error procesando las liquidaciones.' });
    }
  },

  // PATCH /api/ocr/income/:id — T4: Corrección manual de monto de liquidación
  correctIncome: async (req, res) => {
    const { id } = req.params;
    const { amount, applicantId } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'El monto ingresado no es válido.' });
    }
    if (!applicantId) {
      return res.status(400).json({ success: false, message: 'applicantId es requerido.' });
    }

    try {
      const updated = await IncomeModel.correct(id, parseFloat(amount));
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Registro de liquidación no encontrado.' });
      }

      // Recalcular promedio con el monto corregido y actualizar applicants.income
      const newAverage = await IncomeModel.calculateAverage(applicantId);
      await pool.query(
        'UPDATE applicants SET income = $1 WHERE id = $2',
        [newAverage, applicantId]
      );

      return res.json({
        success: true,
        updated_record: updated,
        ingreso_promedio: newAverage,
      });
    } catch (error) {
      console.error('Error corrigiendo liquidación:', error);
      res.status(500).json({ success: false, message: 'Error al corregir el monto.' });
    }
  },

  // POST /api/ocr — HU-07: Procesamiento OCR
  process: async (req, res) => {
    try {
      const { front, back } = req.files;

      if (!front || !back) {
        return res.status(400).json({ success: false, message: 'Faltan imágenes de la cédula' });
      }

      // Aquí se integraría la API externa (ej. Google Vision API).
      // Se simula un retraso de procesamiento de 2 segundos.
      setTimeout(() => {
        // T4: Mapear datos con nivel de confianza (1.0 = 100% seguro)
        const mockOcrResponse = {
          success: true,
          data: {
            fullname: { value: 'JUAN PEREZ SOTO', confidence: 0.98 },
            rut: { value: '11111111-1', confidence: 0.99 },
            // Simulamos que la dirección no se leyó bien
            address: { value: 'AV SIEMPRE VIVA 742', confidence: 0.65 },
          },
        };
        res.json(mockOcrResponse);
      }, 2000);
    } catch (error) {
      console.error('Error en OCR:', error);
      res.status(500).json({ success: false, message: 'Error procesando los documentos' });
    }
  },
};

module.exports = OcrController;