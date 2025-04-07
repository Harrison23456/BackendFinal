const mongoose = require('mongoose');

const agraviosSchema = new mongoose.Schema({
  agravio: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Userweb', required: true } // Relacionado con el usuario
}, { timestamps: true });


module.exports = mongoose.model('Agravios', agraviosSchema);