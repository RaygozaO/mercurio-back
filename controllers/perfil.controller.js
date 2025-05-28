const db = require('../config/db');

exports.obtenerPerfil = async (req, res) => {
    const userId = req.userId;
    console.log('🔍 Buscando datos para userId:', userId);

    try {
        const [usuario] = await db.query(
            'SELECT idusuario, nombreusuario, email, id_rol FROM usuarios WHERE idusuario = ?',
            [userId]
        );
        if (!usuario.length) {
            console.log('⚠️ Usuario no encontrado');
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        console.log('👤 Usuario:', usuario[0]);

        const [paciente] = await db.query(
            'SELECT * FROM cliente WHERE id_usuario = ?',
            [userId]
        );
        if (!paciente.length) {
            console.log('⚠️ Paciente no encontrado');
            return res.status(404).json({ message: 'Paciente no encontrado' });
        }
        console.log('🧑‍⚕️ Paciente:', paciente[0]);

        const idDomicilio = paciente[0].id_domicilio;
        const [domicilio] = await db.query(
            'SELECT * FROM domicilio WHERE iddireccioncliente = ?',
            [idDomicilio]
        );
        if (!domicilio.length) {
            console.log('⚠️ Domicilio no encontrado');
            return res.status(404).json({ message: 'Domicilio no encontrado' });
        }
        console.log('🏠 Domicilio:', domicilio[0]);

        let medico = null;
        if (usuario[0].id_rol === 5) {
            const [datosMedico] = await db.query(
                'SELECT * FROM medico WHERE idusuario = ?',
                [userId]
            );
            if (datosMedico.length) {
                medico = datosMedico[0];
                console.log('🩺 Médico:', medico);
            } else {
                console.log('ℹ️ Usuario es médico, pero no hay datos');
            }
        }

        res.json({
            usuario: usuario[0],
            paciente: paciente[0],
            domicilio: domicilio[0],
            medico
        });
    } catch (err) {
        console.error('❌ Error obteniendo perfil:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.actualizarPerfil = async (req, res) => {
    try {
        const { usuario, paciente, domicilio, medico } = req.body;
        const idusuario = usuario.idusuario;

        // Actualizar usuario
        await db.query(
            'UPDATE usuarios SET nombreusuario = ?, email = ?, pass = ?, id_rol = ? WHERE idusuario = ?',
            [usuario.nombreusuario, usuario.email, usuario.password, usuario.id_rol, idusuario]
        );

        // Actualizar paciente
        await db.query(
            'UPDATE cliente SET nombrecliente = ?, apellidopaterno = ?, apellidomaterno = ?, telefono = ? WHERE id_usuario = ?',
            [paciente.nombrecliente, paciente.apellidopaterno, paciente.apellidomaterno, paciente.telefono, idusuario]
        );

        // Actualizar domicilio
        const [cliente] = await db.query(
            'SELECT id_domicilio FROM cliente WHERE id_usuario = ?',
            [idusuario]
        );

        if (cliente.length) {
            const iddireccioncliente = cliente[0].id_domicilio;

            await db.query(
                'UPDATE domicilio SET calle = ?, numero = ?, interior = ?, id_colonia = ?, id_municipio = ?, id_codigopostal = ?, id_entidad = ? WHERE iddireccioncliente = ?',
                [domicilio.calle, domicilio.numero, domicilio.interior, domicilio.id_colonia, domicilio.id_municipio, domicilio.id_codigopostal, domicilio.id_entidad, iddireccioncliente]
            );
        }

        // Si es médico, actualizar sus datos
        if (usuario.id_rol == 5 && medico) {
            const [existeMedico] = await db.query(
                'SELECT idmedico FROM medico WHERE idusuario = ?',
                [idusuario]
            );

            if (existeMedico.length) {
                await db.query(
                    'UPDATE medico SET telefono = ?, cedula = ?, idespecialidad = ?, id_turno = ? WHERE idusuario = ?',
                    [medico.telefono, medico.cedula, medico.idespecialidad, medico.id_turno, idusuario]
                );
            } else {
                await db.query(
                    'INSERT INTO medico (telefono, cedula, idespecialidad, id_turno, idusuario) VALUES (?, ?, ?, ?, ?)',
                    [medico.telefono, medico.cedula, medico.idespecialidad, medico.id_turno, idusuario]
                );
            }
        }

        res.status(200).json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('❌ Error al actualizar perfil:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
