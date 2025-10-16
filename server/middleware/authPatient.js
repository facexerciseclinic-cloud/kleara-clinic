const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');

const authPatient = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Make sure it's a patient token
      if (decoded.type !== 'patient') {
        return res.status(401).json({ message: 'Not authorized, invalid token type' });
      }

      // Get patient from the token
      req.patient = await Patient.findById(decoded.id).select('-password');

      if (!req.patient) {
        return res.status(401).json({ message: 'Not authorized, patient not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = authPatient;
