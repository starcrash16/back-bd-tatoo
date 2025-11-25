// /routes/citas.js
const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/citas
router.get('/', async (req, res) => {
    const queryText = `
        SELECT id, id_cliente, id_artista, fecha_programada, total_estimado, estado 
        FROM citas 
        ORDER BY fecha_programada DESC
    `;
    try {
        const result = await db.query(queryText);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener citas:', err);
        res.status(500).json({ error: 'Error al consultar la tabla citas.' });
    }
});

// GET /api/citas/sesiones
router.get('/sesiones', async (req, res) => {
    const queryText = `
        SELECT id, id_cita, numero_sesion, fecha_programada, inicio_real, monto_cobrado, estado
        FROM sesiones 
        ORDER BY fecha_programada DESC
    `;
    try {
        const result = await db.query(queryText);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener sesiones:', err);
        res.status(500).json({ error: 'Error al consultar la tabla sesiones.' });
    }
});

module.exports = router;