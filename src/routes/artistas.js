// /routes/artistas.js
const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/artistas
router.get('/', async (req, res) => {
    const queryText = `
        SELECT 
            a.id, a.biografia, a.especialidades, a.tarifa_hora, a.activo, 
            u.nombre_usuario, u.correo
        FROM artistas a
        JOIN usuarios u ON a.id_usuario = u.id
        ORDER BY u.nombre_usuario ASC
    `;
    try {
        const result = await db.query(queryText);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener artistas:', err);
        res.status(500).json({ error: 'Error al consultar la tabla artistas.' });
    }
});

module.exports = router;