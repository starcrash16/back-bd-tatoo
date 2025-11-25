// /routes/usuarios.js
const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/usuarios
router.get('/', async (req, res) => {
    const queryText = `
        SELECT id, nombre_usuario, nombre, apellido, correo, activo, creado_en 
        FROM usuarios 
        ORDER BY id_rol, nombre_usuario ASC
    `;
    try {
        const result = await db.query(queryText);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener todos los usuarios:', err);
        res.status(500).json({ error: 'Error al consultar la tabla usuarios.' });
    }
});

module.exports = router;