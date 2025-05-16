const express = require('express');
const router = express.Router();
const db = require('../config/db');
const {enabled} = require("express/lib/application"); // tu conexión a la base de datos

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
    const {
        title,
        start,
        horacita,
        end,
        color,
        id_cliente,
        id_horario,
        id_usuario
    } = req.body;

    try {
        const [result] = await db.query(`
            INSERT INTO citas (title, start, horacita, end, color, id_cliente, id_horario, id_usuario, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, start, horacita, end, color, id_cliente,id_horario, id_usuario, 1]);

        res.json({ message: 'Cita creada', id: result.insertId });
    } catch (error) {
        console.error('❌ Error al crear cita:', error);
        res.status(500).json({ message: 'Error al crear cita', error: error.message });
    }
});

// GET /api/citas/medicos - doctores disponibles
router.get('/medicos', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                m.idmedico,
                m.idespecialidad,
                c.nombrecliente,
                m.cedula,
                m.telefono,
                m.id_horariomedico,
                m.idusuario
            FROM medico m
                     INNER JOIN cliente c ON m.idusuario = c.id_usuario
                     INNER JOIN usuarios u ON m.idusuario = u.idusuario
            WHERE u.id_rol = 5;
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los doctores:', error);
        res.status(500).json({ message: 'Error al obtener doctores' });
    }
});
// GET /api/citas/fecha/:fecha - citas por fecha
router.get('/fecha/:fecha', async (req, res) => {
    const { fecha } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT c.title, c.start AS fecha, c.horacita AS hora, color, c.id_cliente AS Cliente,cli.nombrecliente AS Nombre,
                   cli.id_usuario AS Medico, cli.nombrecliente AS Nombre, u.nombreusuario AS nombreMedico
            FROM citas c inner join cliente cli on c.id_cliente = cli.idcliente
                         inner join usuarios u on c.id_usuario = u.idusuario
            WHERE start = ? AND c.enabled = 1
            ORDER BY horacita ASC;
        `, [fecha]);

        res.json(rows);
    } catch (error) {
        console.error('❌ Error al obtener citas por fecha:', error);
        res.status(500).json({ message: 'Error al obtener citas por fecha' });
    }
});


module.exports = router;
