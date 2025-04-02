const mongoose = require('mongoose');

const ludopatasSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Userweb',
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  apellidoPaterno: {
    type: String,
    required: true
  },
  apellidoMaterno: {
    type: String,
    required: true
  },
  edad: {
    type: Number,
    required: true
  },
  dni: {
    type: Number,
    required: true
  },
  ludopata: {
    type: Boolean,
    required: true,
    default: true
  },

});

module.exports = mongoose.model('Ludopatas', ludopatasSchema);
