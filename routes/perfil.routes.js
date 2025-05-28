const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfil.controller');
const verifyToken = require('../middlewares/auth.middleware');

router.get('/', verifyToken, perfilController.obtenerPerfil);
router.put('/', verifyToken, perfilController.actualizarPerfil);

module.exports = router;
