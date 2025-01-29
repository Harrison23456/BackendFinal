const express = require('express');
const bcrypt = require('bcrypt');
const Userweb = require('../modelos/usuario'); // Ajusta la ruta según tu proyecto
const Reportes = require('../modelos/reportes'); // Ajusta la ruta según tu proyecto
const jwt = require('jsonwebtoken');
const Company = require('../modelos/empresa'); // Asegúrate de que la ruta sea correcta
const axios = require('axios');
const DniScan = require('../modelos/dni');
const Consulta = require('../modelos/reportes_scan');
const Cliente = require('../modelos/cliente');
const Sala = require('../modelos/salajuego');
const authMiddlewareUser = require('../middlewares/authMiddlewareUser');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Login
router.post('/login', async (req, res) => {
  console.log('Solicitud recibida:', req.body);

  const { email, password, usermobile, passwordmobile, androidId } = req.body;

  try {
    // Buscar al usuario en la colección Userweb
    const userweb = await Userweb.findOne({ usermobile });
    if (!userweb) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(passwordmobile, userweb.passwordmobile);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Validar si la empresa está activa y la fecha no ha expirado
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

    // Validar si el `imei` del dispositivo está asociado a uno de los clientes del usuario
    const clientes = await Cliente.find({ user: userweb._id }); // Obtener todos los clientes del usuario
    const imeis = clientes.map((cliente) => cliente.imei); // Obtener todos los `imei` asociados

    if (!imeis.includes(androidId)) {
      return res.status(403).json({ error: 'El dispositivo no está asociado a este usuario' });
    }

    // Generar el token de autenticación
    const token = jwt.sign({ id: userweb._id, type: 'userweb', user: userweb }, process.env.JWT_SECRET, { expiresIn: '5h' });

    // Responder con éxito
    return res.status(200).json({
      token,
      user: { name: userweb.name, email: userweb.userweb, type: 'userweb' },
    });
  } catch (error) {
    console.error('Error en el login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Login Cliente
router.post('/login-cliente', async (req, res) => {
  console.log('Solicitud recibida:', req.body);

  const { imei } = req.body;

  try {
    // Buscar al cliente por su imei
    const cliente = await Cliente.findOne({ imei }).populate('sala user');

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Obtener datos relacionados
    const { sala, user } = cliente;


    // Verificar si la empresa asociada al usuario está activa
    const company = await Company.findOne({ _id: user.company._id });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    if (!company.status) {
      return res.status(403).json({ error: 'La empresa está desactivada' });
    }

    // Verificar si la fecha de expiración de la empresa ha pasado
    const today = new Date();
    if (company.fechaFin && company.fechaFin < today) {
      return res.status(403).json({ error: 'La fecha de expiración de la empresa ha pasado' });
    }

    // Generar un token JWT para el cliente
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
  
      res.json(response.data); // Enviar datos de la API al frontend
      console.log(response.data)
    } catch (error) {
      console.error('Error al consultar la API externa:', error.message);
      res.status(500).json({
        message: 'Error al consultar la API externa.',
        details: error.message,
      });
    }
  });
  
  // Ruta para guardar datos del DNI en la base de datos
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
      const userId = req.query.id; // Obtén el ID del usuario autenticado
      const user = await Userweb.findById(userId).select('company'); // Busca al usuario y solo selecciona el campo 'empresa'
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
  
    // Verificar si el DNI coincide con el código de barras
    if (dni === barcodeDni) {
      try {
        // Guardar la entrada en la base de datos
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

  // Save and validate scan
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


  // Buscar al cliente en la base de datos usando el androidId (imei)
  const clienteExistente = await Cliente.findOne({ imei: androidId });

  console.log(clienteExistente)
  if (!clienteExistente) {
    return res.status(404).json({ error: 'Cliente no encontrado.' });
  }

  // Obtener la sala correspondiente al cliente
  const salaExistente = await Sala.findOne({ _id: clienteExistente.sala });
console.log(salaExistente)
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
