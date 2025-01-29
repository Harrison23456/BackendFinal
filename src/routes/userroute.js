const express = require('express');
const router = express.Router();
const Userweb = require('../modelos/usuario'); // Asegúrate de que la ruta sea correcta
const Company = require('../modelos/empresa');
const bcrypt = require('bcryptjs'); // Asegúrate de importar bcrypt
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/crear-usuario', async (req, res) => {
  try {
    const { ...userData } = req.body;
    console.log(userData)
    // Obtener datos de la empresa
    const company = await Company.findById(userData.company);
    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    // Crear usuario con los datos de la empresa
    const newUser = new Userweb({
      ...userData,
      company: company.toObject() // Guardar todos los datos de la empresa
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Obtener todos los usuarios
router.get('/mis-usuarios', async (req, res) => {
  try {
    const users = await Userweb.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.put('/mis-usuarios/:id', async (req, res) => {
  try {
    // Asegúrate de validar los datos de entrada antes de proceder
    const { name, paternalsurname, maternalsurname, userweb, passwordweb, usermobile, passwordmobile, company } = req.body;

    if (!name || !paternalsurname || !maternalsurname || !userweb || !usermobile || !company) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    // Validar si el ID de la compañía existe en la base de datos
    const companyExists = await Company.findById(company);
    if (!companyExists) {
      return res.status(400).json({ message: 'La compañía no existe' });
    }

    // Obtener el usuario actual para obtener las contraseñas anteriores
    const currentUser = await Userweb.findById(req.params.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si se ha proporcionado una nueva contraseña web y encriptarla si es necesario
    if (passwordweb) {
      const salt = await bcrypt.genSalt(10); // Generar un "salt"
      req.body.passwordweb = await bcrypt.hash(passwordweb, salt); // Encriptar la contraseña web
    } else {
      // Si no se proporciona una nueva contraseña web, mantener la contraseña anterior
      req.body.passwordweb = currentUser.passwordweb;
    }

    // Verificar si se ha proporcionado una nueva contraseña móvil y encriptarla si es necesario
    if (passwordmobile) {
      const salt = await bcrypt.genSalt(10); // Generar un "salt"
      req.body.passwordmobile = await bcrypt.hash(passwordmobile, salt); // Encriptar la contraseña móvil
    } else {
      // Si no se proporciona una nueva contraseña móvil, mantener la contraseña anterior
      req.body.passwordmobile = currentUser.passwordmobile;
    }

    // Hacer populate en el campo de la compañía para obtener el objeto completo
    const updatedUser = await Userweb.findByIdAndUpdate(
      req.params.id,
      { ...req.body, company: companyExists }, // Guardar el objeto completo de la empresa
      { new: true }
    ).populate('company');  // Esto asegura que el campo 'company' sea un objeto completo

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});


// Eliminar usuario
router.delete('/mis-usuarios/:id', async (req, res) => {
  try {
    const deletedUser = await Userweb.findOneAndDelete({ id: req.params.id });
    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;