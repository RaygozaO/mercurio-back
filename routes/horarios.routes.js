// horarios.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT idhorarios, nombre_horario
            FROM horarios
            WHERE enabled = 1
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener horarios:', err);
        res.status(500).json({ error: 'Error al obtener horarios' });
    }
});

module.exports = router;
