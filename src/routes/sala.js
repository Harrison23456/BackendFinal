const express = require('express');
const router = express.Router();
const Sala = require('../modelos/salajuego');
const authMiddlewareUser = require('../middlewares/authMiddlewareUser');
const Userweb = require('../modelos/usuario'); // Asegúrate de que la ruta sea correcta
const Consulta = require('../modelos/reportes_scan');
const authMiddleware = require('../middlewares/authMiddleware');


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
  
      // Buscar salas del usuario y poblar datos del usuario
      const salas = await Sala.find({ user: userId }).populate('user'); // Población con campos específicos
  
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
  
module.exports = router;
