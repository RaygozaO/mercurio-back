const express = require('express');
const router = express.Router();
const referenciaController = require('../controllers/referencia.controller');

// Ruta para crear referencia
router.post('/crear', referenciaController.crearReferencia);
router.get('/todas', referenciaController.obtenerTodasLasReferencias);


module.exports = router;
