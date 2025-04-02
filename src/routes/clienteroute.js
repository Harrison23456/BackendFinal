const express = require('express');
const router = express.Router();
const Cliente = require('../modelos/cliente');
const authMiddlewareUser = require('../middlewares/authMiddlewareUser');
const Userweb = require('../modelos/usuario');

// Crear Cliente
router.post('/crear-cliente', authMiddlewareUser, async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { imei, sala } = req.body;

    if (await Cliente.exists({ imei })) {
      return res.status(400).json({ message: 'El Android ID ya está registrado.' });
    }

    const user = await Userweb.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (!user.company?.mobiles) {
      return res.status(400).json({ message: 'No hay móviles disponibles para crear un cliente' });
    }

    const newCliente = await Cliente.create({ ...req.body, user: userId, sala });

    await Userweb.findByIdAndUpdate(userId, { $inc: { 'company.mobiles': -1 } });

    res.status(201).json(newCliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Obtener Clientes del Usuario
router.get('/mis-clientes', authMiddlewareUser, async (req, res) => {
  try {
    const clientes = await Cliente.find({ user: req.user._id }).populate('user sala');
    res.status(200).json(clientes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los clientes' });
  }
});

// Editar Cliente
router.put('/mis-clientes/:id', authMiddlewareUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { imei, sala } = req.body;

    const cliente = await Cliente.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: { imei, sala } },
      { new: true }
    );

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado o no autorizado' });
    }

    res.status(200).json(cliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar Cliente
router.delete('/mis-clientes/:id', authMiddlewareUser, async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { id: clienteId } = req.params;

    const cliente = await Cliente.findOneAndDelete({ _id: clienteId, user: userId });

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado o no autorizado' });
    }

    await Userweb.findByIdAndUpdate(userId, { $inc: { 'company.mobiles': 1 } });

    res.status(200).json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
