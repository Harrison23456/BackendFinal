const express = require('express');
const router = express.Router();
const Sala = require('../modelos/salajuego');
const authMiddlewareUser = require('../middlewares/authMiddlewareUser');
const authMiddlewareGeneral = require('../middlewares/authMiddlewareGeneral');
const Userweb = require('../modelos/usuario'); // Asegúrate de que la ruta sea correcta
const Consulta = require('../modelos/reportes_scan');
const Comportamiento = require('../modelos/comportamiento');
const Ludopatas = require('../modelos/ludopatas');
const Agravios = require('../modelos/agravios');
const jwt = require('jsonwebtoken');  // Para decodificar el token
const mongoose = require('mongoose');

const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');


router.post('/crear-sala', authMiddlewareUser, async (req, res) => {
    try {
      const userId = req.user._id; // Obtener el ID del usuario
      const newSala = new Sala({ ...req.body, user: userId });
      const savedSala = await newSala.save();
      res.status(201).json(savedSala);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  

  router.get('/mis-salas', authMiddlewareUser, async (req, res) => {
    try {
      const userId = req.user._id;
  
      const salas = await Sala.find({ user: userId }).populate('user'); 
  
      res.status(200).json(salas);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener las salas' });
    }
  });
  
  
  router.put('/mis-salas/:id', authMiddlewareUser, async (req, res) => {
    try {
      const userId = req.user._id;
      const sala = await Sala.findOne({ _id: req.params.id, user: userId });
  
      if (!sala) {
        return res.status(404).json({ message: 'Sala no encontrada o no tienes permiso para editarla' });
      }
  
      Object.assign(sala, req.body);
      await sala.save();
      res.status(200).json(sala);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar la sala' });
    }
  });  


router.delete('/mis-salas/:id', authMiddlewareUser, async (req, res) => {
    try {
      const userId = req.user._id;
      const sala = await Sala.findOneAndDelete({ _id: req.params.id, user: userId });
  
      if (!sala) {
        return res.status(404).json({ message: 'Sala no encontrada o no tienes permiso para eliminarla' });
      }
  
      res.status(200).json({ message: 'Sala eliminada correctamente' });
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar la sala' });
    }
  });
  
  router.get('/reportes/:tipo', async (req, res) => {
    try {
      const { tipo } = req.params;
      const consultas = await Consulta.find({ tipo });
      res.json(consultas);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener los reportes', error });
    }
  });

  router.get('/reportesesp', authMiddlewareUser, async (req, res) => {
    try {
      const userwebId = req.user._id;
  
      const userweb = await Userweb.findById(userwebId);
      if (!userweb) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
  
      const empresa = userweb.company.name; 
      const reportes = await Consulta.find({ 'user.empresa': empresa });
  
  
      res.json({ reportes });
    } catch (error) {
      console.error('Error obteniendo reportes:', error);
      res.status(500).json({ error: 'Error obteniendo reportes' });
    }
  });
  
  router.get('/reportesespadmin', authMiddleware, async (req, res) => {
    try {
      const { tipo } = req.query; 
      const reportesQuery = tipo ? { tipo } : {}; 
  
      const reportes = await Consulta.find(reportesQuery);
  
      res.json({ reportes });

  
    } catch (error) {
      console.error('Error obteniendo reportes:', error);
      res.status(500).json({ error: 'Error obteniendo reportes' });
    }
  });
  

router.get('/comportamientos', authMiddlewareUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const comportamientos = await Comportamiento.find({ userId });
    res.json(comportamientos);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo registros', error });
  }
});

router.get('/comportamientosadmin', authMiddlewareGeneral, async (req, res) => {
  try {
    const comportamientos = await Comportamiento.find();

    const comportamientosModificados = comportamientos.map(c => ({
      ...c._doc, 
      apellidos: `${c.apellidoPaterno} ${c.apellidoMaterno}`.trim() // Combinar apellidos
    }));

    res.json(comportamientosModificados);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo registros', error });
  }
});

router.patch('/comportamientos/:id/ludopata', authMiddlewareGeneral, async (req, res) => {
  try {
    const { ludopata } = req.body;
    const comportamiento = await Comportamiento.findByIdAndUpdate(
      req.params.id,
      { ludopata },
      { new: true }
    );

    if (!comportamiento) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    res.json(comportamiento);
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando el estado de ludopatía', error });
  }
});

router.get('/sololudopatas', async (req, res) => {
  try {
    const ludopatas = await Comportamiento.find({ ludopata: true })
      .select('-tipoDeAgravio -descripcion');

    // Combinar apellidoPaterno y apellidoMaterno en un nuevo campo "apellidos"
    const ludopatasConApellidos = ludopatas.map(ludopata => ({
      ...ludopata.toObject(),
      apellidos: `${ludopata.apellidoPaterno} ${ludopata.apellidoMaterno}`
    }));

    res.json(ludopatasConApellidos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ludópatas', error });
  }
});


router.post('/comportamientos', authMiddlewareGeneral, upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, apellidoPaterno, apellidoMaterno, edad, dni, descripcion, tipoDeAgravio, departamento, provincia, distrito, nroRegistro, tipoJugador } = req.body;
    const userId = req.user._id;
    
    const imagen = req.file ? req.file.path : null;

    const nuevoComportamiento = new Comportamiento({
      userId,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      edad,
      dni,
      descripcion,
      tipoDeAgravio,
      departamento,
      provincia,
      distrito,
      fechaRegistro: new Date(),
      nroRegistro,
      tipoJugador,
      imagen
    });

    await nuevoComportamiento.save();
    res.status(201).json({ message: 'Registro creado correctamente', nuevoComportamiento });
  } catch (error) {
    res.status(500).json({ message: 'Error creando el registro', error });
  }
});



router.put('/comportamientos/:id', authMiddlewareGeneral, upload.single('imagen'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.imagen = req.file.path;
    }

    const comportamientoActualizado = await Comportamiento.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );

    if (!comportamientoActualizado) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    res.json(comportamientoActualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/comportamientos/:id', authMiddlewareGeneral, async (req, res) => {
  try {
    const comportamientoEliminado = await Comportamiento.findByIdAndDelete(req.params.id);
    if (!comportamientoEliminado) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    res.json({ message: 'Registro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//--------------------------Ludópatas----------------------------------------

router.post('/ludopatas', authMiddleware, async (req, res) => {
  try {
    const { nombre, apellidoPaterno, apellidoMaterno, edad, dni, ludopata } = req.body;
    const userId = req.user.id;
    const nuevoComportamiento = new Ludopatas({
      userId,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      edad,
      dni,
      ludopata
    });

    await nuevoComportamiento.save();
    res.status(201).json({ message: 'Registro creado correctamente', nuevoComportamiento });
  } catch (error) {
    res.status(500).json({ message: 'Error creando el registro', error });
  }
});

router.get('/ludopatas', authMiddlewareGeneral, async (req, res) => {
  try {
    const comportamientos = await Ludopatas.find({ });
    res.json(comportamientos);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo registros', error });
  }
});

router.put('/ludopatas/:id', authMiddleware, async (req, res) => {
  try {
      const comportamientoActualizado = await Ludopatas.findByIdAndUpdate(
          req.params.id, 
          req.body, 
          { new: true } 
      );
      if (!comportamientoActualizado) {
          return res.status(404).json({ message: 'Registro no encontrado' });
      }
      res.json(comportamientoActualizado);
  } catch (error) {
      res.status(400).json({ message: error.message });
  }
});

router.delete('/ludopatas/:id', authMiddleware, async (req, res) => {
  try {
      const comportamientoEliminado = await Ludopatas.findOneAndDelete(req.params._id);
      if (!comportamientoEliminado) {
          return res.status(404).json({ message: 'Registro no encontrado' });
      }
      res.json({ message: 'Registro eliminado correctamente' });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

/* ------------------------------------Agravios------------------------------------------------------- */
router.post('/agravios', async (req, res) => {
  try {
    const nuevoAgravio = new Agravios(req.body);
    await nuevoAgravio.save();
    res.status(201).json(nuevoAgravio);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el agravio', error });
  }
});

router.get('/agravios', async (req, res) => {
  try {
    const agravios = await Agravios.find();
    res.json(agravios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los agravios', error });
  }
});

router.get('/agravios/:id', async (req, res) => {
  try {
    const agravio = await Agravios.findById(req.params.id);
    if (!agravio) return res.status(404).json({ message: 'Agravio no encontrado' });
    res.json(agravio);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar el agravio', error });
  }
});

router.put('/agravios/:id', async (req, res) => {
  try {
    const agravioActualizado = await Agravios.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!agravioActualizado) return res.status(404).json({ message: 'Agravio no encontrado' });
    res.json(agravioActualizado);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el agravio', error });
  }
});

router.delete('/agravios/:id', async (req, res) => {
  try {
    const agravioEliminado = await Agravios.findByIdAndDelete(req.params.id);
    if (!agravioEliminado) return res.status(404).json({ message: 'Agravio no encontrado' });
    res.json({ message: 'Agravio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el agravio', error });
  }
});

router.get('/sololudopata/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    const comportamiento = await Comportamiento.findOne({ dni, ludopata: true });

    if (comportamiento) {
      return res.status(200).json({
        esLudopata: true,
        mensaje: 'El usuario está registrado como ludópata.',
        datos: comportamiento,
      });
    } else {
      return res.status(200).json({
        esLudopata: false,
        mensaje: 'El usuario no está registrado como ludópata.',
      });
    }
  } catch (error) {
    console.error('Error al buscar en la base de datos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ mensaje: 'Token no válido' });
    req.user = decoded;  // Guarda el usuario decodificado para el siguiente middleware
    next();
  });
};

router.get('/soloagravio/:dni', async (req, res) => {
  try {
    const { dni } = req.params;

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.user?.company?._id;
    if (!companyId) {
      return res.status(403).json({ mensaje: 'No se pudo obtener la empresa del usuario' });
    }
    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    const usuariosEmpresa = await Userweb.find({ 'company._id': companyObjectId });
    if (!usuariosEmpresa.length) {
      return res.status(404).json({ mensaje: 'No se encontraron usuarios en la empresa' });
    }

    const usuariosIds = usuariosEmpresa.map(user => user._id);

    const comportamiento = await Comportamiento.findOne({
      dni,
      userId: { $in: usuariosIds },
      tipoDeAgravio: { $ne: 'Ninguno' } 
    });

    if (comportamiento) {
      return res.status(200).json({
        tieneAgravio: true,
        mensaje: 'El usuario tiene un tipo de agravio registrado en su empresa.',
        datos: comportamiento,
      });
    } else {
      return res.status(200).json({
        tieneAgravio: false,
        mensaje: 'El usuario no tiene un tipo de agravio registrado en su empresa.',
      });
    }
  } catch (error) {
    console.error('Error al buscar en la base de datos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});


module.exports = router;
