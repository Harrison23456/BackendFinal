const mongoose = require('mongoose');

// Definir el esquema para las solicitudes de escaneo de DNI
const DniScanSchema = new mongoose.Schema({
  dni: { type: String, required: true },
  barcodeDni: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const DniScan = mongoose.model('DniScan', DniScanSchema);

module.exports = DniScan;