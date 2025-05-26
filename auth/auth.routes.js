const express = require('express');
const { register, login, obtenerUsuarioPorId} = require('./auth.controller');
const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/ping', (req, res) => {
    res.send('pong');
});

const verifyToken = require('../middlewares/auth.middleware');

router.get('/perfil', verifyToken, (req, res) => {
    res.json({
        message: 'Ruta protegida accedida correctamente',
        usuario: req.user
    });
});

router.post('/test', (req, res) => {
    res.send('Ruta funcionando');
});

router.get('/usuario/:id', obtenerUsuarioPorId);

module.exports = router;
