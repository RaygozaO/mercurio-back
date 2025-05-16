const express = require('express');
const cors = require('cors'); // 👈 IMPORTANTE
const app = express();
require('dotenv').config();
const db = require('./config/db');

const authRoutes = require('./auth/auth.routes');
const pacientesRoutes = require('./routes/pacientes.routes');
const coloniasRoutes = require('./routes/colonias.routes');


// 🛡️ Configurar CORS
app.use(cors({
    origin: ['http://localhost:4200','https://farmacia-mercurio.com', 'http://mercurio.local'],
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    credentials: true
}));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/colonias', coloniasRoutes);

/*end point Definicion de roles*/
app.get('/api/roles', async (req, res) => {
    const [rows] = await db.query('SELECT idroles, nombrerol FROM roles WHERE enabled = 1');
    res.json(rows);
});
app.get('/api/productos', async (req, res) => {
    try {
        const [productos] = await db.query(`
      SELECT p.idproductos, p.nombre, p.precio, p.codigobar, p.presentacion, p.gramaje, p.enabled, SUM(CAST(s.numexistencia AS UNSIGNED)) AS stock
      FROM productos p LEFT JOIN stock s ON p.idproductos = s.idproductos
      WHERE p.enabled = 1 GROUP BY p.idproductos, p.nombre, p.precio, p.codigobar, p.presentacion, p.gramaje, p.enabled
    `);
        res.json(productos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener productos' });
    }
});

app.post('/api/productos', async (req, res) => {
    const { nombre, precio, codigobar, presentacion, gramaje, enabled } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO productos (nombre, precio, codigobar, presentacion, gramaje, enabled) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, precio, codigobar, presentacion, gramaje, enabled ? 1 : 0]
        );
        res.json({ message: 'Producto creado', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al crear producto' });
    }
});

const productosRoutes = require('./routes/productos.routes');
app.use('/api/productos', productosRoutes);

const especialidadesRoutes = require('./routes/especialidades.routes');
app.use('/api/especialidades', especialidadesRoutes);

const horariosRoutes = require('./routes/horarios.routes');
app.use('/api/horarios', horariosRoutes);

const citasRoutes = require('./routes/citas.routes');
app.use('/api/citas', citasRoutes);

app.get('/api/test-cors', (req, res) => {
    res.json({ message: 'CORS funcionando correctamente' });
});

const recetaRoutes = require('./routes/recetas.routes');
app.use('/api/recetas', recetaRoutes);

app.listen(3000, () => {
    console.log('🚀 Backend iniciado en http://localhost:3000');
});

