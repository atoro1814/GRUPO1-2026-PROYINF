const DocumentModel = {
  saveMany: async (client, applicantId, files) => {
    for (const file of files) {
      await client.query(
        `INSERT INTO documents (applicant_id, filename, mimetype, content) VALUES ($1, $2, $3, $4)`,
        [applicantId, file.originalname, file.mimetype, file.buffer]
      );
    }
  },
};

module.exports = DocumentModel;
