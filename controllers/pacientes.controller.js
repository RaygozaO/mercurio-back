const db = require('../config/db');
const bcrypt = require('bcryptjs');


exports.crearPaciente = async (req, res) => {
    console.log('👉 Recibida solicitud crearPaciente', req.body);

    const { paciente, usuario, domicilio } = req.body;

    try {
        if (!usuario || !usuario.email || !usuario.password || !paciente || !domicilio) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        // Insertar o actualizar usuario
        let usuarioId = usuario.idusuario;

        if (!usuarioId || usuarioId === 0) {
            const hashedPassword = bcrypt.hashSync(usuario.password, 8);
            const [insertUsuario] = await db.query(
                'INSERT INTO usuarios (nombreusuario, email, pass,enabled, id_rol) VALUES (?, ?, ?, ?, ?)',
                [usuario.nombreusuario, usuario.email, hashedPassword, 1, 6]
            );
            usuarioId = insertUsuario.insertId;
            console.log('✅ Usuario creado con ID:', usuarioId);
        } else {
            const hashedPassword = bcrypt.hashSync(usuario.password, 8);
            await db.query(
                'UPDATE usuarios SET nombreusuario = ?, email = ?, pass = ? WHERE idusuario = ?',
                [usuario.nombreusuario, usuario.email, hashedPassword, usuarioId]
            );
            console.log('✅ Usuario actualizado correctamente');
        }

        // Buscar si ya existe cliente para este usuario
        const [clienteExistente] = await db.query(
            `SELECT idcliente, id_domicilio FROM cliente c JOIN mercurio.usuarios u
                                                                on u.idusuario = c.idcliente WHERE idusuario = ? LIMIT 1`,
            [usuarioId]
        );

        // Buscar colonia, municipio y entidad
        const [coloniaResult] = await db.query(
            'SELECT idcolonia, id_municipio, id_codigopostal FROM colonias WHERE nombrecolonia = ? LIMIT 1',
            [domicilio.coloniasSelected]
        );

        if (coloniaResult.length === 0) {
            return res.status(400).json({ message: 'Colonia no encontrada' });
        }

        const { idcolonia, id_municipio, id_codigopostal } = coloniaResult[0];

        const [municipioResult] = await db.query(
            'SELECT id_entidadfederativa FROM municipio WHERE idmunicipio = ? LIMIT 1',
            [id_municipio]
        );

        const id_entidad = municipioResult[0].id_entidadfederativa;

        let id_domicilio;
        let idPaciente;

        if (clienteExistente.length > 0) {
            // Ya existe cliente ➔ Actualizar cliente y domicilio
            console.log('⚡ Cliente ya existe. Actualizando cliente y domicilio...');

            const idcliente = clienteExistente[0].idcliente;
            id_domicilio = clienteExistente[0].id_domicilio;

            // Actualizar cliente
            await db.query(
                'UPDATE cliente SET nombrecliente = ?, apellidopaterno = ?, apellidomaterno = ?, telefono = ? WHERE idcliente = ?',
                [
                    paciente.nombrecliente,
                    paciente.apellidopaterno,
                    paciente.apellidomaterno,
                    paciente.telefono,
                    idcliente
                ]
            );

            // Actualizar domicilio
            await db.query(
                'UPDATE domicilio SET calle = ?, numero = ?, interior = ?, id_cp = ?, id_colonia = ?, id_municipio = ?, id_entidad = ? WHERE iddireccioncliente = ?',
                [
                    domicilio.calle,
                    domicilio.numero,
                    domicilio.interior || '',
                    id_codigopostal,
                    idcolonia,
                    id_municipio,
                    id_entidad,
                    id_domicilio
                ]
            );

            console.log('✅ Cliente y domicilio actualizados correctamente');

            idPaciente = idcliente; // <-- aquí asignas bien
        } else {
            // No existe cliente ➔ Insertar domicilio y cliente
            console.log('✅ Insertando nuevo cliente y domicilio...');

            const [insertDomicilio] = await db.query(
                'INSERT INTO domicilio (calle, numero, interior, id_cp, id_colonia, id_municipio, id_entidad) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    domicilio.calle,
                    domicilio.numero,
                    domicilio.interior || '',
                    id_codigopostal,
                    idcolonia,
                    id_municipio,
                    id_entidad
                ]
            );
            id_domicilio = insertDomicilio.insertId;

            const [insertPaciente] = await db.query(
                'INSERT INTO cliente (nombrecliente, apellidopaterno, apellidomaterno, telefono, id_usuario, id_domicilio) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    paciente.nombrecliente,
                    paciente.apellidopaterno,
                    paciente.apellidomaterno,
                    paciente.telefono,
                    usuarioId,
                    id_domicilio
                ]
            );
            idPaciente = insertPaciente.insertId;

            console.log('✅ Paciente nuevo creado con ID:', idPaciente);
        }

        // 🔥🔥 Finalmente solo un res.json:
        res.status(200).json({
            message: "Paciente registrado o actualizado correctamente",
            id: idPaciente
        });

    } catch (err) {
        console.error('❌ Error al crear/actualizar paciente:', err);
        res.status(500).json({ message: 'Error interno', error: err.message });
    }
};



// Buscar usuario
exports.buscarUsuario = async (req, res) => {
    const { termino } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT idusuario, nombreusuario, email
             FROM usuarios
             WHERE nombreusuario LIKE ? OR email LIKE ?
                 LIMIT 10`,
            [`%${termino}%`, `%${termino}%`]
        );
        res.json(rows);
    } catch (error) {
        console.error('❌ Error buscando usuario:', error);
        res.status(500).json({ error: 'Error buscando usuario' });
    }
};
// Buscar colonias por código postal
exports.buscarColonias = async (req, res) => {
    const { cp } = req.params;
    try {
        const [rows] = await connection.promise().query(
            `SELECT
          c.nombrecolonia,
          m.nombremunicipio,
          e.nombreentidad
       FROM colonias c
       JOIN municipio m ON c.id_municipio = m.idmunicipio
       JOIN entidadfederativa e ON m.id_entidadfederativa = e.identidadfederativa
       JOIN codigopostal cp ON c.id_codigopostal = cp.idcodigopostal
       WHERE cp.codigopostal = ?`,
            [cp]
        );
        res.json(rows);
    } catch (error) {
        console.error('❌ Error buscando colonias:', error);
        res.status(500).json({ error: 'Error buscando colonias' });
    }
};
