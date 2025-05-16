const db = require('../config/db');

exports.guardarReceta = async (req, res) => {
    const { resumenclinico, indicaciones, idmedico, idpaciente, productos } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [recetaResult] = await connection.query(`
      INSERT INTO receta (idmedico, resumenclinico, medicamentos, indicaciones, enabled)
      VALUES (?, ?, ?, ?, 1)
    `, [idmedico, resumenclinico, 'DETALLADO_EN_TABLA', indicaciones]);

        const idreceta = recetaResult.insertId;

        for (const prod of productos) {
            await connection.query(`
        INSERT INTO detallereceta (id_productos, id_receta)
        VALUES (?, ?)
      `, [prod.id_productos, idreceta]);
        }

        await connection.commit();
        res.status(201).json({ message: 'Receta guardada', idreceta });
    } catch (err) {
        await connection.rollback();
        console.error('❌ Error guardando receta:', err);
        res.status(500).json({ message: 'Error al guardar receta' });
    } finally {
        connection.release();
    }
};
