const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  modelName: { type: String, required: true, unique: true },
  sequenceValue: { type: Number, required: true, default: 1 },
});

module.exports = mongoose.model('Counter', counterSchema);
