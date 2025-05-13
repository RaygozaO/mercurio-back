const express = require('express');
const router = express.Router();
const db = require('../config/db'); // tu conexión a la base de datos

router.get('/medicos', async (req, res) => {
    try {
        const [rows] = await db.query(`
            select m.idmedico,m.idespecialidad, m.cedula,m.telefono,m.id_horariomedico from medico m
    `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener todas las citas:', error);
        res.status(500).json({ message: 'Error al obtener citas' });
    }
})