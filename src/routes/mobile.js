const express = require('express');
const bcrypt = require('bcrypt');
const Userweb = require('../modelos/usuario'); 
const Reportes = require('../modelos/reportes'); 
const jwt = require('jsonwebtoken');
const Company = require('../modelos/empresa'); 
const axios = require('axios');
const DniScan = require('../modelos/dni');
const Consulta = require('../modelos/reportes_scan');
const Cliente = require('../modelos/cliente');
const Sala = require('../modelos/salajuego');
const authMiddlewareUser = require('../middlewares/authMiddlewareUser');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { usermobile, passwordmobile, androidId } = req.body;

  try {
    const userweb = await Userweb.findOne({ usermobile });
    if (!userweb) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(passwordmobile, userweb.passwordmobile);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const company = await Company.findOne({ _id: userweb.company._id });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    if (!company.status) {
      return res.status(403).json({ error: 'La empresa está desactivada' });
    }
    const today = new Date();
    if (company.fechaFin && company.fechaFin < today) {
      return res.status(403).json({ error: 'La fecha de expiración de la empresa ha pasado' });
    }

    const clientes = await Cliente.find({ user: userweb._id }); 
    const imeis = clientes.map((cliente) => cliente.imei); 

    if (!imeis.includes(androidId)) {
      return res.status(403).json({ error: 'El dispositivo no está asociado a este usuario' });
    }

    const token = jwt.sign({ id: userweb._id, type: 'userweb', user: userweb }, process.env.JWT_SECRET, { expiresIn: '5h' });

    return res.status(200).json({
      token,
      user: { name: userweb.name, email: userweb.userweb, type: 'userweb' },
    });
  } catch (error) {
    console.error('Error en el login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});


router.post('/login-cliente', async (req, res) => {
  const { imei } = req.body;
  try {
    const cliente = await Cliente.findOne({ imei }).populate('sala user');

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const { sala, user } = cliente;
    const company = await Company.findOne({ _id: user.company._id });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    if (!company.status) {
      return res.status(403).json({ error: 'La empresa está desactivada' });
    }

    const today = new Date();
    if (company.fechaFin && company.fechaFin < today) {
      return res.status(403).json({ error: 'La fecha de expiración de la empresa ha pasado' });
    }

    const token = jwt.sign({ id: cliente._id, imei, type: 'cliente' }, process.env.JWT_SECRET, { expiresIn: '5h' });

    return res.status(200).json({
      token,
      cliente: { id: cliente.id, imei: cliente.imei, sala: sala.name, user: user.name },
    });

  } catch (err) {
    console.error('Error al procesar la solicitud:', err);
    res.status(500).json({ error: 'Error interno del servidor', message: err.message });
  }
});


router.get('/dni/:dni', authMiddlewareUser, async (req, res) => {
    const { dni } = req.params;
    const API_URL = 'https://api.apis.net.pe/v1/dni';
    const API_TOKEN = 'apis-token-12526.LM4h5pj0j2GbyOK1cuZJxREC9WknYFlm';
  
    try {
      const response = await axios.get(API_URL, {
        params: { numero: dni },
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error('Error al consultar la API externa:', error.message);
      res.status(500).json({
        message: 'Error al consultar la API externa.',
        details: error.message,
      });
    }
  });
  
router.post('/saveDniData', authMiddlewareUser, async (req, res) => {
    const { dni, nombre, apellido_paterno, apellido_materno } = req.body;
    try {
      const newReport = new Reportes({
        dni,
        nombre,
        apellido_paterno,
        apellido_materno,
        date: new Date(),
      });
      await newReport.save();
      res.status(201).json({ message: 'Reporte guardado correctamente.' });
    } catch (error) {
      console.error('Error al guardar el reporte:', error);
      res.status(500).json({ message: 'Error al guardar el reporte.' });
    }
  });
  
router.get('/getCompany', async (req, res) => {
    try {
      const userId = req.query.id; 
      const user = await Userweb.findById(userId).select('company'); 
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.json({ empresa: user.company.name });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

router.post('/barscan', authMiddlewareUser, async (req, res) => {
    const { dni, barcodeDni } = req.body;
    
    if (!dni || !barcodeDni) {
      return res.status(400).json({ error: 'DNI y código de barras son necesarios.' });
    }
    if (dni === barcodeDni) {
      try {
        const scan = new DniScan({ dni, barcodeDni });
        await scan.save();
        return res.status(200).json({ success: true, message: 'DNI y código de barras coinciden.' });
      } catch (error) {
        console.error('Error al guardar el escaneo:', error);
        return res.status(500).json({ error: 'Error al guardar el escaneo.' });
      }
    } else {
      return res.status(400).json({ error: 'El DNI y el código de barras no coinciden.' });
    }
  });


  router.post("/validate", async (req, res) => {
  const { barcode, dni } = req.body;

  const match = barcode === dni;
  const scan = new Scan({ barcode, dni, match });
  await scan.save();

  res.json({ success: true, match });
});

router.post('/dni/registrarconsulta', authMiddlewareUser, async (req, res) => {
  const { numeroDocumento, nombres, apellidoPaterno, apellidoMaterno, userId, nombre_user, apellidoPaterno_user, apellidoMaterno_user, empresa, tipo, androidId } = req.body;
  if (!numeroDocumento || !nombres || !apellidoPaterno || !apellidoMaterno || !tipo || !userId) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  const cliente = {
    dni: numeroDocumento,
    nombres,
    apellidoPaterno,
    apellidoMaterno,
  };

  const user = {
    userId,
    nombre_user,
    apellidoPaterno_user,
    apellidoMaterno_user,
    empresa
  };

  const clienteExistente = await Cliente.findOne({ imei: androidId });

  if (!clienteExistente) {
    return res.status(404).json({ error: 'Cliente no encontrado.' });
  }

  const salaExistente = await Sala.findOne({ _id: clienteExistente.sala });
  if (!salaExistente) {
    return res.status(404).json({ error: 'Sala no encontrada para el cliente.' });
  }

  try {
    const nuevaConsulta = new Consulta({ 
      cliente, 
      user,
      tipo,
      androidId,
      sala: {
        idSala: salaExistente._id.toString(),
        name: salaExistente.name,
        address: salaExistente.address,
      },
    });
    await nuevaConsulta.save();
    res.status(201).json({ message: 'Consulta guardada exitosamente.' });
  } catch (error) {
    console.error('Error al guardar la consulta:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});


module.exports = router;
