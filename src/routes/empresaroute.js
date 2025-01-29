const express = require('express');
const router = express.Router();
const Company = require('../modelos/empresa');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/crear-empresa', authMiddleware, async (req, res) => {
  try {
    const { mobiles, ...empresaData } = req.body;

    const finalCompany = new Company({
      ...empresaData,  
      initialMobiles: mobiles, 
      mobiles: mobiles, 
    });

    const savedCompany = await finalCompany.save();
    res.status(201).json(savedCompany); 
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/mis-empresas', authMiddleware, async (req, res) => {
  try {
    const companies = await Company.find();
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/mis-empresas/:id', authMiddleware, async (req, res) => {
  try {
    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedCompany);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/mis-empresas/:id', authMiddleware, async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Company deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/empresas', authMiddleware, async (req, res) => {
  try {
    const empresas = await Company.find();
    res.status(200).json(empresas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
