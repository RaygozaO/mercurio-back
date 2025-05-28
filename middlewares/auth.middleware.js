const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'mercurio';

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1]; // 👈 Extrae solo el token

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Token inválido' });

        req.user = decoded; // ej: { id: usuario.idusuario }
        req.userId = decoded.idusuario; // opcional para facilitar acceso
        next();
    });
}

module.exports = verifyToken;

