const express = require('express');
const router = express.Router();
const Cliente = require('../modelos/cliente');
const Sala = require('../modelos/salajuego');
const authMiddlewareUser = require('../middlewares/authMiddlewareUser');
const Userweb = require('../modelos/usuario'); // Asegúrate de que la ruta sea correcta


router.post('/crear-cliente', authMiddlewareUser, async (req, res) => {
  try {
    const userId = req.user._id; // Obtener el ID del usuario logueado
    const { imei, sala } = req.body;

    // Verificar si ya existe un cliente con el mismo IMEI
    const existingCliente = await Cliente.findOne({ imei });
    if (existingCliente) {
      return res.status(400).json({ message: 'El Android ID ya está registrado.' });
    }

    // Obtener el usuario y verificar si tiene móviles disponibles
    const user = await Userweb.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (!user.company || user.company.mobiles <= 0) {
      return res.status(400).json({ message: 'No hay móviles disponibles para crear un cliente' });
    }

    // Crear el nuevo cliente
    const newCliente = new Cliente({
      ...req.body,
      user: userId,
      sala: sala,
    });

    // Guardar el cliente en la base de datos
    const savedCliente = await newCliente.save();

    // Restar 1 al número de móviles disponibles
    user.company.mobiles -= 1;
    await Userweb.findByIdAndUpdate(userId, { company: user.company });

    // Responder con el cliente creado
    res.status(201).json(savedCliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



  router.get('/mis-clientes', authMiddlewareUser, async (req, res) => {
    try {
      //const userId = req.user._id;
      const userId = req.user._id;

      // Buscar salas del usuario y poblar datos del usuario
      const clientes = await Cliente.find({ user: userId }).populate('user sala'); // Población con campos específicos
  
      res.status(200).json(clientes);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener los clientes' });
    }
  });
  
  
  // Editar cliente
router.put('/mis-clientes/:id', authMiddlewareUser, async (req, res) => {
    try {
      const clienteId = req.params.id;
      const userId = req.user._id; // ID del usuario que realiza la solicitud
  
      // Verificar que el cliente pertenece al usuario autenticado
      const cliente = await Cliente.findOne({ _id: clienteId, user: userId });
      if (!cliente) {
        return res.status(404).json({ message: 'Cliente no encontrado o no autorizado' });
      }
  
      // Actualizar los campos permitidos
      const { imei, sala } = req.body;
      cliente.imei = imei || cliente.imei;
      cliente.sala = sala || cliente.sala;
  
      // Guardar cambios
      const updatedCliente = await cliente.save();
      res.status(200).json(updatedCliente);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  

// Eliminar cliente
router.delete('/mis-clientes/:id', authMiddlewareUser, async (req, res) => {
  try {
    const userId = req.user._id; // Obtener el ID del usuario logueado
    const clienteId = req.params.id;

    // Buscar el cliente por ID y verificar si pertenece al usuario
    const cliente = await Cliente.findOneAndDelete({ _id: clienteId, user: userId });
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado o no autorizado' });
    }

    // Buscar al usuario
    const user = await Userweb.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Sumar 1 al número de móviles disponibles
    if (user.company) {
      user.company.mobiles += 1;
      await Userweb.findByIdAndUpdate(userId, { company: user.company });
    }

    // Responder con mensaje de éxito
    res.status(200).json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
  

module.exports = router;
