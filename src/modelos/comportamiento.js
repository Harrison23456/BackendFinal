const mongoose = require('mongoose');

const comportamientoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Userweb',
    required: true
  },
  nombre: { type: String, required: true },
  apellidoPaterno: { type: String, required: true },
  apellidoMaterno: { type: String, required: true },
  edad: { type: Number, required: true, default: 'Sin edad específica' },
  dni: { type: Number, required: true },
  departamento: { type: String, required: true },
  provincia: { type: String, required: true },
  distrito: { type: String, required: true },
  descripcion: { type: String, required: true, default: 'Sin descripción' },
  tipoDeAgravio: { type: String, required: true, default: 'Ninguno' },
  ludopata: { type: Boolean, required: true, default: false },
  fechaRegistro: { type: Date, default: Date.now },
  imagen: { type: String }, 
  nroRegistro: { type: Number, required: true, default: 0 }, 
  tipoJugador: { type: String, required: true, default: 'No especificado' }
});

module.exports = mongoose.model('Comportamiento', comportamientoSchema);

