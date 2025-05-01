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
        const [productos] = await db.query('SELECT idproductos, nombre, precio, codigobar, presentacion, gramaje, enabled FROM productos WHERE enabled = 1');
        res.json(productos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener productos' });
    }
});


app.listen(3000, () => {
    console.log('🚀 Backend iniciado en http://localhost:3000');
});

