const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Counter = require('./contadores');
const Company = require('./empresa');

const userwebSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  paternalsurname: { type: String, required: true },
  maternalsurname: { type: String, required: true },
  userweb: { type: String, required: true },
  passwordweb: { type: String, required: true },
  usermobile: { type: String, required: true },
  passwordmobile: { type: String, required: true },
  company: { 
    type: mongoose.Schema.Types.Mixed,  // Para guardar un objeto con los datos de la empresa
    required: true
  }
}, { timestamps: true });


// Middleware para autoincrementar el ID y calcular las fechas de licencia
userwebSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  try {
    // Si las contraseñas han cambiado o son nuevas, cifrarlas
    if (this.isModified('passwordweb')) {
      this.passwordweb = await bcrypt.hash(this.passwordweb, 10);  // 10 es el número de saltos para bcrypt
    }
    if (this.isModified('passwordmobile')) {
      this.passwordmobile = await bcrypt.hash(this.passwordmobile, 10);
    }

    // Obtener el contador para autoincrementar el ID
    const counter = await Counter.findOneAndUpdate(
      { modelName: 'Userweb' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );

    this.id = counter.sequenceValue.toString().padStart(6, '0'); // 000001, 000002, etc.

    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para sincronizar el campo `mobile` dentro de `company` en Userweb con la colección Company
userwebSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();

  // Verificar si se ha modificado el campo `company.mobile`
  if (update.company && update.company.mobiles) {
    const newMobile = update.company.mobiles;

    try {
      // Buscar la empresa correspondiente en la colección `Company`
      const existingCompany = await Company.findOne({ id: update.company.id });

      if (existingCompany) {
        // Actualizar el campo `mobiles` en la colección `Company` con el nuevo valor
        await Company.findOneAndUpdate(
          { id: update.company.id },
          { $set: { mobiles: newMobile } },  // Solo se actualiza el campo `mobiles`
          { new: true }
        );
      }
    } catch (error) {
      console.error('Error sincronizando el campo mobile con Company:', error);
    }
  }

  next();
});

module.exports = mongoose.model('Userweb', userwebSchema);