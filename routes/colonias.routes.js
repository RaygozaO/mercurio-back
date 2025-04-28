// colonias.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // o pool de conexión

router.get('/:cp', async (req, res) => {
    const { cp } = req.params;

    try {
        const [colonias] = await db.query(`
            SELECT 
              c.nombrecolonia,
              m.nombremunicipio,
              e.nombreentidad
            FROM colonias c
            JOIN municipio m ON c.id_municipio = m.idmunicipio
            JOIN entidadfederativa e ON m.id_entidadfederativa = e.identidadfederativa
            JOIN codigopostal cp ON c.id_codigopostal = cp.idcodigopostal
            WHERE cp.codigopostal = ?
        `, [cp]);

        res.json(colonias);
    } catch (error) {
        console.error('❌ Error buscando colonias:', error);
        res.status(500).json({ message: 'Error interno' });
    }
});

module.exports = router;
