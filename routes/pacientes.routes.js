const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacientes.controller');

// Crear paciente completo
router.post('/crear', pacienteController.crearPaciente);

// Buscar usuario por nombre o email
router.get('/buscar/:termino', pacienteController.buscarUsuario);

// Buscar colonias por código postal
router.get('/colonias/:cp', pacienteController.buscarColonias);

module.exports = router;
