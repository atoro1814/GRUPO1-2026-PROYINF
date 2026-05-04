const ApplicantModel = require('../models/applicant.model');

const AuthController = {
  // POST /login
  login: async (req, res) => {
    const { rut } = req.body;
    try {
      const user = await ApplicantModel.findByRut(rut);
      if (user) {
        return res.json({ success: true, user });
      } else {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = AuthController;
