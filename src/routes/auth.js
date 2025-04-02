// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../modelos/admin');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Userweb = require('../modelos/usuario'); 
const Company = require('../modelos/empresa'); 

router.get('/signin', authMiddleware, (req, res) => {
  if (req.user.type === 'user') {
    return res.status(200).json({ valid: true, user: req.user });
  } else {
    return res.status(403).json({ valid: false, error: 'Access Denied. User type not authorized.' });
  }
  });

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error registering user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar en la colección User
    let user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id, type: 'user' }, process.env.JWT_SECRET);

      return res.status(200).json({
        token,
        user: { name: user.name, email: user.email, type: 'user' },
      });
    }

    let userweb = req.body.email
    // Buscar en la colección Userweb si no se encuentra en User
    let userwe = await Userweb.findOne({ userweb });
    if (userwe) {
      
      const idempresa = userwe.company._id;
      const isMatch = await bcrypt.compare(password, userwe.passwordweb);
      if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    // Verificar si la empresa está activa
      const company = await Company.findOne({ _id: idempresa });

      if (!company) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
      }

      // Verificar si la empresa está desactivada
      if (!company.status) {
        return res.status(403).json({ error: 'La empresa está desactivada' });
      }

      // Verificar si la fecha de fin ha pasado
      const today = new Date();
      if (company.fechaFin && company.fechaFin < today) {
        return res.status(403).json({ error: 'La fecha de expiración de la empresa ha pasado' });
      }

      const token = jwt.sign({ id: userwe._id, type: 'userweb', user: userwe }, process.env.JWT_SECRET, { expiresIn: '5h' });

      return res.status(200).json({
        token,
        user: { name: userwe.name, email: userwe.userweb, type: 'userweb' },
      });
    }

    // Si no se encuentra en ninguna colección
    return res.status(404).json({ error: 'User not found' });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
    console.error(error);
  }
});

module.exports = router;
