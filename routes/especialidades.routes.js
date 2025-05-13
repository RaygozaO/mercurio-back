const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ajusta el path a tu conexión

// GET /api/especialidades
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT idesepecialidad, nombreespecialidad FROM especialidad');
        res.json(rows);
    } catch (err) {
        console.error('❌ Error al obtener especialidades:', err);
        res.status(500).json({ error: 'Error al obtener especialidades' });
    }
});

module.exports = router;
