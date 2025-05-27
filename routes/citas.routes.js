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
        // 🔎 1. Obtener horario del médico
        const [horarios] = await db.query(`
            SELECT hm.horaingreso AS desde, hm.horasalida AS hasta
            FROM medico m
                     LEFT JOIN horariomedicos hm ON m.id_horariomedico = hm.idhorario
            WHERE m.idusuario = ?
        `, [id_usuario]);

        if (!horarios.length) {
            return res.status(400).json({ message: 'El médico no tiene horario asignado.' });
        }

        const { desde, hasta } = horarios[0];

        // 🔒 2. Validar que la hora esté dentro del rango
        if (horacita < desde || horacita > hasta) {
            return res.status(400).json({ message: `La hora ${horacita} está fuera del horario permitido: ${desde} - ${hasta}` });
        }

        // ✅ 3. Insertar si pasa la validación
        const [result] = await db.query(`
      INSERT INTO citas (title, start, horacita, end, color, id_cliente, id_horario, id_usuario, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, start, horacita, end, color, id_cliente, id_horario, id_usuario, 1]);

        res.json({ message: 'Cita creada', id: result.insertId });

    } catch (error) {
        console.error('❌ Error al crear cita:', error);
        res.status(500).json({ message: 'Error al crear cita', error: error.message });
    }
});


router.get('/medicos', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                m.idmedico,
                m.idespecialidad,
                c.nombrecliente,
                m.cedula,
                m.telefono,
                m.idusuario,
                m.id_horariomedico AS id_horario,
                hm.horaingreso AS desde,
                hm.horasalida AS hasta
            FROM medico m
                     INNER JOIN cliente c ON m.idusuario = c.id_usuario
                     INNER JOIN usuarios u ON m.idusuario = u.idusuario
                     LEFT JOIN horariomedicos hm ON m.id_horariomedico = hm.idhorario
            WHERE u.id_rol = 5;
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los doctores con horario:', error);
        res.status(500).json({ message: 'Error al obtener doctores' });
    }
});



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
