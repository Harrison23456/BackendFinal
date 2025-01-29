const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../modelos/usuario');

const authMiddlewareUser = async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', ''); // Obtén el token
      if (!token) {
        return res.status(401).send({ message: 'No token provided' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decodifica el token
      const user = await User.findById(decoded.id); // Busca al usuario en la base de datos
      if (!user) {
        return res.status(401).send({ message: 'User not found' });
      }
      req.user = user; // Agrega el usuario a la solicitud
      next();
    } catch (error) {
      res.status(401).send({ message: 'Invalid token' });
    }
  };
  
  module.exports = authMiddlewareUser;