const mongoose = require('mongoose');

const ConsultaSchema = new mongoose.Schema({
  cliente: {
    dni: { type: String, required: true },
    nombres: { type: String, required: true },
    apellidoPaterno: { type: String, required: true },
    apellidoMaterno: { type: String, required: true },
  },
  user:{
    userId: {type: String, required: true},
    nombre_user: { type: String }, // Nombre del usuario que hizo la consulta
    apellidoPaterno_user: {type: String},
    apellidoMaterno_user: {type: String},
    empresa: { type: String }, // Empresa del usuario
  },
  sala: {
    idSala: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String },
  },
  fechaConsulta: { type: Date, default: Date.now },
  tipo: { type: String, required: true },
  androidId: {type: String}
});

module.exports = mongoose.model('Consulta', ConsultaSchema);

/*
const mongoose = require('mongoose');

const ConsultaSchema = new mongoose.Schema({
  cliente: {
    dni: { type: String, required: true },
    nombres: { type: String, required: true },
    apellidoPaterno: { type: String, required: true },
    apellidoMaterno: { type: String, required: true },
  },
  user:{
    userId: {type: String, required: true},
    nombre_user: { type: String }, // Nombre del usuario que hizo la consulta
    apellidoPaterno_user: {type: String},
    apellidoMaterno_user: {type: String},
    empresa: { type: String }, // Empresa del usuario
  },
  sala: {
    idSala: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String },
  },
  fechaConsulta: { type: Date, default: Date.now },
  tipo: { type: String, required: true },
  androidId: {type: String}
});

module.exports = mongoose.model('Consulta', ConsultaSchema);
*/