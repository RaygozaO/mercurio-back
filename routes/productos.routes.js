const express = require('express');
const router = express.Router();
const db = require('../config/db'); // tu conexión a MySQL

router.get('/faltantes', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT productos.idproductos, nombre, numexistencia FROM productos
            join stock on productos.idproductos = stock.idproductos WHERE stock.numexistencia < 3`);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener faltantes:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


// Obtener producto por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE idproductos = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json(rows[0]); // solo un producto
    } catch (err) {
        console.error('Error al obtener producto:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});
// Actualizar producto por ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, codigobar, presentacion, gramaje } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE productos SET nombre = ?, precio = ?, codigobar = ?, presentacion = ?, gramaje = ? WHERE idproductos = ?',
            [nombre, precio, codigobar, presentacion, gramaje, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado o no modificado' });
        }

        res.json({ message: 'Producto actualizado correctamente' });
    } catch (err) {
        console.error('Error al actualizar producto:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


module.exports = router;
