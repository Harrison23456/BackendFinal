const Userweb = require('./userweb'); // Asegúrate de importar el modelo Userweb

// Middleware para actualizar datos de la empresa en los documentos de Userweb
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
    await Userweb.updateMany(
      { 'company.id': company.id }, // Buscar usuarios con la empresa correspondiente
      { $set: { company: company.toObject() } } // Actualizar el objeto company
    );
  } catch (error) {
    console.error('Error actualizando datos de empresa en Userweb:', error);
  }
}

module.exports = comapnyMiddleware;