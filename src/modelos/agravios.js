const mongoose = require('mongoose');

const agraviosSchema = new mongoose.Schema({
  agravio: { type: String, unique: true }
}, { timestamps: true });


module.exports = mongoose.model('Agravios', agraviosSchema);