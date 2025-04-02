const mongoose = require('mongoose');
const Counter = require('./contadores');

// Definir el esquema de Company
const companySchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  ruc: { type: Number, required: true, unique: true },
  address: { type: String, required: true },
  mobiles: { type: Number, required: true },
  initialMobiles: { type: Number, required: true },
  expirationTime: { type: Number, required: true },
  status: { type: Boolean, default: true },
  fechaInicio: { type: Date },
  fechaFin: { type: Date },
  licencia: { type: String },
}, { timestamps: true });

// Función para formatear fechas
const formatearFecha = (fecha) => {
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}-${mes}-${anio}`;
};

// Middleware para calcular fechas de licencia al crear una nueva empresa
companySchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { modelName: 'Company' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );

    this.id = counter.sequenceValue.toString().padStart(6, '0');

    const fechaInicio = new Date();
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + this.expirationTime);

    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.licencia = `del ${formatearFecha(fechaInicio)} al ${formatearFecha(fechaFin)}`;

    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para actualizar la licencia al modificar expirationTime
companySchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.expirationTime) {
    const expirationTime = update.expirationTime;

    const fechaInicio = new Date();
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + expirationTime);

    const licencia = `del ${formatearFecha(fechaInicio)} al ${formatearFecha(fechaFin)}`;

    this.setUpdate({
      ...update,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      licencia: licencia,
    });
  }
  next();
});

// Middleware para actualizar datos de la empresa en Userweb
companySchema.post('save', async function () {
  await actualizarDatosEnUserweb(this);
});

companySchema.post('findOneAndUpdate', async function () {
  const updatedCompany = await this.model.findOne(this.getQuery());
  await actualizarDatosEnUserweb(updatedCompany);
});

// Función para actualizar los documentos de Userweb
async function actualizarDatosEnUserweb(company) {
  try {
    if (!company) return;
    // Retrasar la importación de Userweb para evitar dependencia circular
    const Userweb = require('./usuario');
    await Userweb.updateMany(
      { 'company.id': company.id },
      { $set: { company: company.toObject() } }
    );
  } catch (error) {
    console.error('Error actualizando datos de empresa en Userweb:', error);
  }
}

// Función para verificar y actualizar licencias expiradas
companySchema.statics.actualizarLicenciasExpiradas = async function() {
  const ahora = new Date();
  
  // Encontrar empresas cuya fechaFin haya pasado y aún estén activas
  const empresasExpiradas = await this.find({
    fechaFin: { $lt: ahora },
    status: true
  });

  // Actualizar cada empresa expirada
  for (const empresa of empresasExpiradas) {
    await this.findByIdAndUpdate(empresa._id, { status: false });
    
    // También actualizar en Userweb
    await actualizarDatosEnUserweb({
      ...empresa.toObject(),
      status: false
    });
  }

  return empresasExpiradas.length;
};

const Company = mongoose.model('Company', companySchema);

module.exports = Company;