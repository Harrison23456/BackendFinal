const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  dni: String,
  nombre: String,
  apellido_paterno: String,
  apellido_materno: String,
  date: { type: Date, default: Date.now }
});

const ReportModel = mongoose.model('Reportes', reportSchema);

module.exports = ReportModel;
