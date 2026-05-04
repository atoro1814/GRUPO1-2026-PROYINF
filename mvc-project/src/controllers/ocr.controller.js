const OcrController = {
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
            rut: { value: '11.111.111-1', confidence: 0.99 },
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
