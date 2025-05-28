const db = require('../config/db');
const bcrypt = require('bcryptjs');
const querystring = require("node:querystring");


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
                `INSERT INTO usuarios (pass, nombreusuario,email, enabled, id_rol) VALUES (?, ?, ?, ?, ?)`,
                [hashedPassword, usuario.nombreusuario, usuario.nombre, usuario.apellidopaterno,
                 usuario.apellidomaterno,usuario.nss, usuario.email,  1, usuario.id_rol]
            );
            usuarioId = insertUsuario.insertId;
            console.log('✅ Usuario creado con ID:', usuarioId);
        } else {
            const hashedPassword = bcrypt.hashSync(usuario.password, 8);
            await db.query(
                `UPDATE usuarios SET pass = ?,nombreusuario = ?, email = ?,enabled = 1, id_rol = ?  WHERE idusuario = ?`,
                [hashedPassword,usuario.nombreusuario, usuario.email, usuario.id_rol, usuarioId]
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
        const { id_colonia, id_municipio, id_codigopostal } = domicilio;

        if (!id_colonia || !id_municipio || !id_codigopostal) {
            return res.status(400).json({ message: 'Faltan datos de colonia' });
        }

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

            idPaciente = idcliente;
        } else {
            // No existe cliente ➔ Insertar domicilio y cliente
            console.log('✅ Insertando nuevo cliente y domicilio...');

            const [insertDomicilio] = await db.query(
                'INSERT INTO domicilio (calle, numero, interior, id_cp, id_colonia, id_municipio, id_entidad) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    domicilio.calle,
                    domicilio.numero,
                    domicilio.interior || '',
                    domicilio.id_codigopostal,
                    domicilio.idcolonia,
                    domicilio.id_municipio,
                    domicilio.id_entidad
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
        // Si el usuario es un médico y se envió el objeto 'medico'
        if (Number(usuario.id_rol) === 5 && req.body.medico) {
            console.log('🩺 Entrando a la sección de médico');
            const { cedula, telefono, idespecialidad, id_horariomedico } = req.body.medico;

            // Verifica si ya existe el médico
            const [medicoExistente] = await db.query(
                'SELECT idmedico FROM medico WHERE idusuario = ?',
                [usuarioId]
            );
            console.log('Usuario del medico',usuarioId);
            if (medicoExistente.length > 0) {
                console.log('⚠️ Médico ya registrado, actualizando...');
                await db.query(
                    'UPDATE medico SET cedula = ?, telefono = ?, idespecialidad = ?, id_horariomedico = ? WHERE idusuario = ?',
                    [cedula, telefono, idespecialidad, usuarioId, id_horariomedico]
                );

                console.log('✅ Médico actualizado');
            } else {
                console.log('✅ Registrando nuevo médico...');
                await db.query(
                    'INSERT INTO medico (idusuario, cedula, telefono, idespecialidad, id_horariomedico) VALUES (?, ?, ?, ?, ?)',
                    [usuarioId, cedula, telefono, idespecialidad, id_horariomedico]
                );
                console.log('✅ Médico registrado');
            }
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

exports.buscarColonias = async (req, res) => {
    const { cp } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT
                c.idcolonia AS idcolonia,
                c.nombrecolonia AS nombrecolonia,
                c.id_municipio AS idmunicipio,
                m.nombremunicipio AS nombremunicipio,
                e.nombreentidad AS nombreentidad,
                m.id_entidadfederativa AS identidadfederativa,
                c.id_codigopostal AS id_codigopostal
            FROM colonias c
                     JOIN municipio m ON c.id_municipio = m.idmunicipio
                     JOIN entidadfederativa e ON m.id_entidadfederativa = e.identidadfederativa
                     JOIN codigopostal cp ON c.id_codigopostal = cp.idcodigopostal
            WHERE cp.codigopostal = ?
        `, [cp]);

        console.log('🔍 Resultado de colonias:', rows); // <--- agrega este log
        res.json(rows);
    } catch (error) {
        console.error('❌ Error buscando colonias:', error);
        res.status(500).json({ error: 'Error buscando colonias' });
    }
};

exports.buscarPaciente = async (req, res) => {
    const { term } = req.params;
    try {
        const [rows] = await db.query(`
      SELECT 
        c.idcliente,
        c.nombrecliente,
        c.apellidopaterno,
        c.apellidomaterno,
        u.idusuario
      FROM cliente c
      INNER JOIN usuarios u ON c.id_usuario = u.idusuario
      WHERE u.id_rol = 6 
        AND (
          c.nombrecliente LIKE ? 
          OR c.apellidopaterno LIKE ? 
          OR c.apellidomaterno LIKE ?
        )
    `, [`%${term}%`, `%${term}%`, `%${term}%`]);

        res.json(rows);
    } catch (error) {
        console.error('❌ Error al buscar pacientes:', error);
        res.status(500).json({ message: 'Error al buscar pacientes' });
    }
}
// controllers/usuario.controller.js
exports.getPerfil = async (req, res) => {
    const userId = req.userId; // Asumiendo que se obtiene desde JWT
    const [rows] = await db.query('SELECT nombreusuario, email FROM usuarios WHERE idusuario = ?', [userId]);
    res.json(rows[0]);
};

exports.updatePerfil = async (req, res) => {
    const userId = req.userId;
    const { nombreusuario, email, telefono } = req.body;

    await db.query(
        'UPDATE usuarios SET nombreusuario = ?, email = ? WHERE idusuario = ?',
        [nombreusuario, email, telefono, userId]
    );
    res.json({ message: 'Datos actualizados correctamente' });
};



