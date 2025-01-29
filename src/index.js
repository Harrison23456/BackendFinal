const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs'); // Para leer los archivos del certificado
const https = require('https'); // Importa el módulo HTTPS

require('./database');
require('dotenv').config();

const app = express();
app.use(express.json());

app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, authorization'); // Agregar Authorization
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200); // Responder con un 200 OK para las solicitudes OPTIONS
});

// Middleware adicional (opcional, para control de caché y CORS dinámico)
app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, authorization'); // Agregar Authorization
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

  app.use(bodyParser.json());

const authRoutes = require('./routes/auth');
const empresaRoutes = require('./routes/empresaroute');
const usuarioRoutes = require('./routes/userroute');
const salaRoutes = require('./routes/sala');
const clienteRoutes = require('./routes/clienteroute');
const usermobRoutes = require('./routes/mobile');


app.use('/api/auth', authRoutes);
app.use('/api/empresa', empresaRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/sala', salaRoutes);
app.use('/api/cliente', clienteRoutes);
app.use('/api/mobileroute', usermobRoutes);

const options = {
  key: fs.readFileSync('192.168.30.21+1-key.pem'),
  cert: fs.readFileSync('192.168.30.21+1.pem'),
};


const PORT = process.env.PORT || 3000;
try {
  https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
    
    console.log(`Servidor HTTPS corriendo en https://localhost:${PORT}`);
  });
} catch (err) {
  console.error('Error al iniciar el servidor HTTPS:', err);
}