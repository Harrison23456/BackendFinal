const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access Denied. No token provided.' });

  try {
    // Verificar y decodificar el token
    const verified = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET); // Elimina "Bearer"
    if (verified.type !== 'user') {
      return res.status(403).json({ error: 'Access Denied. User type not authorized.' });
    }
    req.user = verified; // Adjuntar el usuario decodificado a la solicitud
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
