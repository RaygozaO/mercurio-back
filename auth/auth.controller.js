const db = require('../config/db'); // Ahora es pool.promise()
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'mercurio';

// Registro de usuario
exports.register = async (req, res) => {
    const { nombreusuario, email, pass, id_rol } = req.body;

    if (!nombreusuario || !email || !pass) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    try {
        const hashedPass = bcrypt.hashSync(pass, 8);

        const query = 'INSERT INTO usuarios (nombreusuario, email, pass, id_rol) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(query, [nombreusuario, email, hashedPass, id_rol || 2]);

        res.status(201).json({ message: 'Usuario creado correctamente' });
    } catch (error) {
        console.error('❌ Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
    }
};

// Login de usuario
exports.login = async (req, res) => {
    const { email, pass, captchaAnswer, captchaExpected } = req.body;

    if (parseInt(captchaAnswer) !== parseInt(captchaExpected)) {
        return res.status(400).json({ message: 'Captcha incorrecto' });
    }

    try {
        const query = 'SELECT * FROM usuarios WHERE email = ?';
        const [results] = await db.query(query, [email]);

        if (results.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(pass, user.pass);

        if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { idusuario: user.idusuario, id_rol: user.id_rol },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.json({ token, role: user.id_rol });

        console.log('Login correcto');
    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ message: 'Error en el login', error: error.message });
    }
};
