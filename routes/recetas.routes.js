const express = require('express');
const router = express.Router();
const recetaController = require('../controllers/receta.controller');

// Ruta POST /api/recetas
router.post('/', recetaController.guardarReceta);

module.exports = router;
