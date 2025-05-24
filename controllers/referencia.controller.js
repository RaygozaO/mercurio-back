const db = require('../config/db');

exports.crearReferencia = async (req, res) => {
    const { idmedico_origen, idmedico_destino, idpaciente, motivo } = req.body;

    if (!idmedico_origen || !idmedico_destino || !idpaciente || !motivo) {
        return res.status(400).json({ message: 'Datos incompletos' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO referencia (idmedico_origen, idmedico_destino, idpaciente, motivo)
       VALUES (?, ?, ?, ?)`,
            [idmedico_origen, idmedico_destino, idpaciente, motivo]
        );

        res.status(201).json({
            message: '✅ Referencia creada correctamente',
            idreferencia: result.insertId
        });
    } catch (error) {
        console.error('❌ Error al crear referencia:', error);
        res.status(500).json({ message: 'Error al registrar referencia', error });
    }
};
exports.obtenerTodasLasReferencias = async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT 
        r.idreferencia,
        u_origen.nombreusuario AS medico_origen,
        u_destino.nombreusuario AS medico_destino,
        CONCAT(c.nombrecliente, ' ', c.apellidopaterno, ' ', c.apellidomaterno) AS paciente,
        r.motivo,
        r.fecha_referencia,
        r.estado
      FROM referencia r
      JOIN medico m_origen ON r.idmedico_origen = m_origen.idmedico
      JOIN usuarios u_origen ON m_origen.idusuario = u_origen.idusuario
      JOIN medico m_destino ON r.idmedico_destino = m_destino.idmedico
      JOIN usuarios u_destino ON m_destino.idusuario = u_destino.idusuario
      JOIN cliente c ON r.idpaciente = c.idcliente
      ORDER BY r.fecha_referencia DESC
    `);

        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error obteniendo referencias:', error);
        res.status(500).json({ message: 'Error al obtener referencias', error });
    }
};

exports.obtenerIdMedicoPorUsuario = async (req, res) => {
    const idusuario = req.params.id;

    try {
        const [rows] = await db.query(
            'SELECT idmedico FROM medico WHERE idusuario = ?',
            [idusuario]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Médico no encontrado' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('❌ Error obteniendo médico por usuario:', error);
        res.status(500).json({ message: 'Error al obtener médico', error });
    }
};
