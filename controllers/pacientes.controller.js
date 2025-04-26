// archivo: controllers/pacientes.controller.js
const connection = require('../config/db');
const bcrypt = require('bcryptjs');

exports.crearPaciente = async (req, res) => {
    const { paciente, usuario, domicilio } = req.body;

    try {
        // Validación básica
        if (!usuario || !usuario.email || !usuario.password || !paciente || !domicilio) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        // Hashear contraseña
        const hashedPassword = bcrypt.hashSync(usuario.password, 8);

        // Insertar usuario
        const insertUsuario = await new Promise((resolve, reject) => {
            const query = 'INSERT INTO usuarios (nombreusuario, email, pass, id_rol) VALUES (?, ?, ?, ?)';
            connection.query(query, [usuario.nombreusuario, usuario.email, hashedPassword, 3], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        });

        // Buscar IDs de colonia, municipio y entidad por nombre
        const [colonia] = await connection.promise().query('SELECT idcolonia, id_municipio, id_codigopostal FROM colonias WHERE nombrecolonia = ? LIMIT 1', [domicilio.coloniasSelected]);
        if (!colonia.length) return res.status(400).json({ message: 'Colonia no encontrada' });

        const id_colonia = colonia[0].idcolonia;
        const id_cp = colonia[0].id_codigopostal;
        const id_municipio = colonia[0].id_municipio;

        const [municipio] = await connection.promise().query('SELECT id_entidad FROM municipio WHERE idmunicipio = ? LIMIT 1', [id_municipio]);
        const id_entidad = municipio[0][0].id_entidad;

        // Insertar domicilio
        const insertDomicilio = await new Promise((resolve, reject) => {
            const query = 'INSERT INTO domicilio (calle, numero, interior, id_cp, id_colonia, id_municipio, id_entidad) VALUES (?, ?, ?, ?, ?, ?, ?)';
            connection.query(query, [
                domicilio.calle,
                domicilio.numero,
                domicilio.interior || '',
                id_cp,
                id_colonia,
                id_municipio,
                id_entidad
            ], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        });

        // Insertar paciente
        const insertPaciente = await new Promise((resolve, reject) => {
            const query = 'INSERT INTO cliente (nombrecliente, apellidopaterno, apellidomaterno, telefono, id_usuario, id_domicilio) VALUES (?, ?, ?, ?, ?, ?)';
            connection.query(query, [
                paciente.nombrecliente,
                paciente.apellidopaterno,
                paciente.apellidomaterno,
                paciente.telefono,
                insertUsuario,
                insertDomicilio
            ], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        });

        res.status(201).json({ message: 'Paciente creado correctamente', id: insertPaciente });

    } catch (err) {
        console.error('❌ Error al crear paciente:', err);
        res.status(500).json({ message: 'Error interno', error: err });
    }
    console.log('Verificando el jenkins');
};
