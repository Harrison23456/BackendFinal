const mongoose = require('mongoose');
const Counter = require('./contadores');

const salaSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Userweb', required: true },  
}, { timestamps: true });

salaSchema.pre('save', async function (next) {

  try {
    // Obtener el contador para autoincrementar el ID
    const counter = await Counter.findOneAndUpdate(
      { modelName: 'Sala' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );

    this.id = counter.sequenceValue.toString().padStart(6, '0');

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Sala', salaSchema);
