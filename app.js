const express = require('express');
const cors = require('cors'); // 👈 IMPORTANTE
const app = express();
require('dotenv').config();

const authRoutes = require('./auth/auth.routes');
const pacientesRoutes = require('./routes/pacientes.routes');

// 🛡️ Configurar CORS
app.use(cors({
    origin: ['http://localhost:4200','https://farmacia-mercurio.com', 'http://mercurio.local'],
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    credentials: true
}));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);

app.listen(3000, () => {
    console.log('🚀 Backend iniciado en http://localhost:3000');
});
