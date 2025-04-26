const connection = require('../config/db'); // Ajusta si tienes otro nombre de conexión
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'mercurio';

// Registro de usuario
exports.register = (req, res) => {
    const { nombreusuario, email, pass, id_rol } = req.body;

    if (!nombreusuario || !email || !pass) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    const hashedPass = bcrypt.hashSync(pass, 8);

    const query = 'INSERT INTO usuarios (nombreusuario, email, pass, id_rol) VALUES (?, ?, ?, ?)';
    connection.query(query, [nombreusuario, email, hashedPass, id_rol || 2], (err) => {
        if (err) {
            console.error('❌ Error al registrar usuario:', err);
            return res.status(500).json({ message: 'Error al registrar usuario', error: err });
        }
        res.status(201).json({ message: 'Usuario creado correctamente' });
    });
};

// Login con captcha básico (ej: 3+4 = 7)
exports.login = (req, res) => {
    const { email, pass, captchaAnswer, captchaExpected } = req.body;

    if (parseInt(captchaAnswer) !== parseInt(captchaExpected)) {
        return res.status(400).json({ message: 'Captcha incorrecto' });
    }

    const query = 'SELECT * FROM usuarios WHERE email = ?';
    connection.query(query, [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error en la base de datos' });
        if (results.length === 0) return res.status(401).json({ message: 'Usuario no encontrado' });

        const user = results[0];
        bcrypt.compare(pass, user.pass, (err, isMatch) => {
            if (err || !isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

            const token = jwt.sign(
                { idusuario: user.idusuario, id_rol: user.id_rol },
                SECRET_KEY,
                { expiresIn: '1h' }
            );

            res.json({ token, role: user.id_rol });
        });
    });
};
