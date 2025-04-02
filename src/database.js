const mongoose = require("mongoose");
const iniciarProgramador = require('./middlewares/cronMiddleware.js'); 

mongoose.connect("mongodb://127.0.0.1/AdminDB", {})
  .then(db => {
    console.log("Conectado a la db");
    iniciarProgramador(); // Iniciamos el programador después de conectar
  })
  .catch(err => console.log(err));