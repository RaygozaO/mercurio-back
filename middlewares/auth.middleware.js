const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'mercurio';

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'Token requerido' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Token inválido' });

        req.user = decoded; // { idusuario, id_rol }
        next();
    });
}

module.exports = verifyToken;
