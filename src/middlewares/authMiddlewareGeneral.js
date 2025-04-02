const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../modelos/admin'); // Modelo de Administrador
const Userweb = require('../modelos/usuario'); // Modelo de Usuario Regular

const authMiddlewareGeneral = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'Access Denied. No token provided.' });
        }
    
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let user;
        
        if (decoded.type === 'user') {
          user = await User.findById(decoded.id); // Buscar en la colección de administradores
        } else if (decoded.type === 'userweb') {
          user = await Userweb.findById(decoded.id); // Buscar en la colección de usuarios regulares

        } else {
          return res.status(403).json({ error: 'Access Denied. Invalid user type.' });
        }
    
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }
    
        // Adjuntar el usuario decodificado y su tipo a la solicitud
        req.user = user;
        req.userType = decoded.type;
    
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
      }
};

module.exports = authMiddlewareGeneral;
