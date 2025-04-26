const express = require('express');
const router = express.Router();
const connection = require('../config/db'); // ✅ Importar la conexión
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

    connection.query(query, [cp], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al consultar colonias', err });
        res.json(results);
    });
});

module.exports = router;
