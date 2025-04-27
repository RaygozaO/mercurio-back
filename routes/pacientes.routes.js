const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ✅ Importar la conexión
const pacienteController = require('../controllers/pacientes.controller');

router.post('/crear', pacienteController.crearPaciente);

// Ruta para obtener colonias por código postal
router.get('/colonias/:cp', (req, res) => {
    const { cp } = req.params;

    const query = `
        SELECT
            c.nombrecolonia,
            m.nombremunicipio,
            e.nombreentidad
        FROM colonias c
                 JOIN municipio m ON c.id_municipio = m.idmunicipio
                 JOIN entidadfederativa e ON m.id_entidadfederativa = e.identidadfederativa
                 JOIN codigopostal cp ON c.id_codigopostal = cp.idcodigopostal
        WHERE cp.codigopostal = ?;
    `;

    db.query(query, [cp], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al consultar colonias', err });
        res.json(results);
    });
});
// usuarios.routes.js
router.get('/buscar/:termino', async (req, res) => {
    const termino = req.params.termino;
    try {
        const [rows] = await db.query(
            `SELECT idusuario, nombreusuario, email FROM usuarios 
       WHERE nombreusuario LIKE ? OR email LIKE ? 
       LIMIT 10`,
            [`%${termino}%`, `%${termino}%`]
        );
        res.json(rows);
    } catch (error) {
        console.error('❌ Error buscando usuario:', error);
        res.status(500).json({ error: 'Error buscando usuario' });
    }
});

module.exports = router;
