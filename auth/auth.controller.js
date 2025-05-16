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
    res.send('Registro funcionando'); // ← puedes dejar esto como prueba por ahora
};
