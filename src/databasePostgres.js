const pgp = require('pg-promise')();

const db = pgp({
  host: 'localhost', // Servidor local
  port: 5433, // Puerto por defecto de PostgreSQL
  database: 'ludopatas13', // Reemplaza con el nombre de tu base de datos
  user: 'postgres', // Usuario por defecto
  password: '123456', // Reemplaza con tu contraseña
});

// Verificar conexión
db.connect()
  .then(() => console.log('🟢 Conectado a PostgreSQL en local'))
  .catch(err => console.error('🔴 Error al conectar con PostgreSQL:', err));

module.exports = db;
