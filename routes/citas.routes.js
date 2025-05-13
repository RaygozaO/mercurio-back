const express = require('express');
const router = express.Router();
const db = require('../config/db'); // tu conexión a la base de datos

// GET /api/citas - todas las citas
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
        SELECT c.idcitas, title, start, horacita, end, color, createdAt, updatedAt, enabled, id_cliente, id_referencia, id_horario, id_usuario
        FROM citas c
    `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener todas las citas:', error);
        res.status(500).json({ message: 'Error al obtener citas' });
    }
});

// GET /api/citas/medico/:idmedico - citas por médico
router.get('/medico/:idmedico', async (req, res) => {
    const { idmedico } = req.params;
    try {
        const [rows] = await db.query(`
      SELECT c.idcita, c.idpaciente, c.idmedico, c.fecha, c.hora, c.motivo
      FROM citas c
      WHERE c.idmedico = ?
    `, [idmedico]);
        res.json(rows);
    } catch (error) {
        console.error(`Error al obtener citas para médico ${idmedico}:`, error);
        res.status(500).json({ message: 'Error al obtener citas del médico' });
    }
});
router.post('/', async (req, res) => {
    const { motivo, fecha, hora, idmedico, idpaciente } = req.body;
    try {
        const [result] = await db.query(`
      INSERT INTO citas (motivo, fecha, hora, idmedico, idpaciente)
      VALUES (?, ?, ?, ?, ?)
    `, [motivo, fecha, hora, idmedico, idpaciente]);
        res.json({ message: 'Cita creada', id: result.insertId });
    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({ message: 'Error al crear cita' });
    }
});


module.exports = router;
