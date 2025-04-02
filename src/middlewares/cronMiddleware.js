const cron = require('node-cron');
const Company = require('../modelos/empresa');

function iniciarProgramador() {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Ejecutando verificación de licencias expiradas...');
      const cantidad = await Company.actualizarLicenciasExpiradas();
      console.log(`Licencias actualizadas: ${cantidad} empresas marcadas como expiradas`);
    } catch (error) {
      console.error('Error en la verificación de licencias:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Lima"
  });
}

module.exports = iniciarProgramador;