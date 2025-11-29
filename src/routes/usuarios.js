// /routes/usuarios.js
const express = require('express');
const bcrypt = require('bcrypt');
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

// GET /api/usuarios/roles
router.get('/roles', async (req, res) => {
    const queryText = `
        SELECT id, nombre, descripcion FROM roles ORDER BY id ASC
    `;
    try {
        const result = await db.query(queryText);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener roles:', err);
        res.status(500).json({ error: 'Error al consultar la tabla roles.' });
    }
});

// POST /api/usuarios/registro - Registrar nuevo usuario con contraseña hasheada
router.post('/registro', async (req, res) => {
    // 1. Desestructuración de variables. Capturamos 'telefono' para la inserción.
    const { 
        nombre_usuario, 
        nombre, 
        apellido, 
        correo, 
        contrasena, 
        id_rol, 
        telefono // <--- Capturamos el teléfono
    } = req.body;

    // 2. Validación básica de campos obligatorios
    if (!nombre_usuario || !contrasena || !correo) {
        return res.status(400).json({ error: 'nombre_usuario, contrasena y correo son obligatorios.' });
    }
    
    // 3. Validación de ID de Rol (Debe existir)
    // Asignamos un rol por defecto (ej. 'artista' o 'cliente') si no se proporciona, o validamos que exista.
    const rol_final = id_rol || 2; // Asumimos ID 2 es el rol por defecto (Artista o Cliente).

    try {
        // 4. Verificar si el usuario ya existe (nombre_usuario o correo)
        const checkUser = await db.query('SELECT id FROM usuarios WHERE nombre_usuario = $1 OR correo = $2', [nombre_usuario, correo]);
        
        if (checkUser.rows.length > 0) {
            // console.log('--- DEBUG 4: Enviando respuesta 409 (Usuario duplicado) ---');
            return res.status(409).json({ error: 'El nombre de usuario o correo ya está registrado.' });
        }

        // 5. Hashear la contraseña con bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
        // console.log('--- DEBUG 6: Hash generado ---');


        // 6. Insertar nuevo usuario (CORRECCIÓN DE LA SINTAXIS SQL)
        const insertQuery = `
            INSERT INTO usuarios (nombre_usuario, nombre, apellido, correo, contrasena_hash, id_rol, activo, telefono)
            VALUES ($1, $2, $3, $4, $5, $6, true, $7)
            RETURNING id, nombre_usuario, nombre, apellido, correo, id_rol, activo, creado_en
        `;
        
        const values = [
            nombre_usuario, 
            nombre || null, 
            apellido || null, 
            correo, 
            hashedPassword, 
            rol_final, 
            telefono || null 
        ];

        // console.log('--- DEBUG 7: Antes de insertar en DB ---');
        const result = await db.query(insertQuery, values);
        // console.log('--- DEBUG 8: Después de insertar en DB ---');

        // 7. Respuesta exitosa
        // Eliminamos el hash de la respuesta antes de enviarla
        const { contrasena_hash, ...usuarioRegistrado } = result.rows[0]; 

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente.',
            usuario: usuarioRegistrado
        });
    } catch (err) {
        console.error('--- DEBUG ERROR: Error en registro: ---', err);
        // En caso de error de llave foránea (rol_id no existe) o cualquier otro error de DB
        if (err.code === '23503') {
             return res.status(400).json({ error: 'El ID de rol proporcionado no existe.' });
        }
        res.status(500).json({ error: 'Error al registrar el usuario.' });
    }
});

// POST /api/usuarios/login - Login de usuario
// /routes/usuarios.js

router.post('/login', async (req, res) => {
    // 1. Capturamos un solo campo como 'identificador' (puede ser usuario o correo)
    const { identificador, contrasena } = req.body;

    // Validación básica: El identificador y la contraseña son obligatorios
    if (!identificador || !contrasena) {
        return res.status(400).json({ error: 'Identificador (usuario o correo) y contraseña son obligatorios.' });
    }

    try {
        // 2. Buscar usuario por nombre de usuario O correo electrónico
        // Usamos el operador OR en la cláusula WHERE para la búsqueda flexible.
        const queryText = `
            SELECT id, nombre_usuario, nombre, apellido, correo, contrasena_hash, id_rol, activo
            FROM usuarios
            WHERE nombre_usuario = $1 OR correo = $1
        `;
        // Nota: Ambos lados de la OR usan $1, ya que solo necesitamos un valor de entrada (identificador)
        const result = await db.query(queryText, [identificador]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const usuario = result.rows[0];

        // 3. Verificar si el usuario está activo
        if (!usuario.activo) {
            return res.status(403).json({ error: 'Usuario inactivo.' });
        }

        // 4. Comparar contraseña con bcrypt
        const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 5. Login exitoso - remover hash antes de enviar
        const { contrasena_hash, ...usuarioSinPassword } = usuario;

        res.status(200).json({
            message: 'Login exitoso.',
            usuario: usuarioSinPassword
        });
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error al procesar el login.' });
    }
});

module.exports = router;