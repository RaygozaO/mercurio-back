const jwt = require('jsonwebtoken');
const db = require('../config/db');
const SECRET_KEY = process.env.SECRET_KEY || 'mercurio';
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    const { email, clave_log } = req.body;

    console.log('📥 Login solicitado:', email, clave_log);

    try {
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        console.log('👤 Usuarios encontrados:', usuarios.length);

        if (!usuarios.length) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        const usuario = usuarios[0];
        console.log('🔐 Validando contraseña...');

        const passwordValida = bcrypt.compareSync(clave_log, usuario.pass);
        if (!passwordValida) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        console.log('✅ Contraseña válida. Buscando cliente...');

        const [clientes] = await db.query('SELECT idcliente FROM cliente WHERE id_usuario = ?', [usuario.idusuario]);
        const idcliente = clientes.length ? clientes[0].idcliente : null;

        console.log('🧾 Cliente:', idcliente);

        const token = jwt.sign(
            { idusuario: usuario.idusuario, id_rol: usuario.id_rol },
            SECRET_KEY,
            { expiresIn: '4h' }
        );

        console.log('🎫 Token generado. Enviando respuesta...');

        res.json({
            token,
            role: usuario.id_rol,
            idusuario: usuario.idusuario,
            idcliente
        });
    } catch (err) {
        console.error('❌ Error en login:', err);
        res.status(500).json({ message: 'Error interno del servidor', error: err.message });
    }
};

exports.register = async (req, res) => {
    const { nombreusuario, email, pass, id_rol = 6 } = req.body; // Rol por defecto: 6

    if (!nombreusuario || !email || !pass) {
        return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    try {
        // Verifica si ya existe un usuario con ese correo
        const [usuariosExistentes] = await db.query(
            'SELECT idusuario FROM usuarios WHERE email = ?',
            [email]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(409).json({ message: 'El email ya está registrado' });
        }

        // Hashea la contraseña
        const hashedPassword = bcrypt.hashSync(pass, 8);

        // Inserta el usuario en la base de datos
        const [resultado] = await db.query(
            'INSERT INTO usuarios (nombreusuario, email, pass, id_rol, enabled) VALUES (?, ?, ?, ?, ?)',
            [nombreusuario, email, hashedPassword, id_rol, 6]
        );

        res.status(201).json({ message: 'Usuario registrado correctamente', idusuario: resultado.insertId });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};