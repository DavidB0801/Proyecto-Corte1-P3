const express = require('express');
const cors = require('cors');
const db = require('./database');
const bcrypt = require('bcrypt'); // Para hashear contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens de autenticación

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Middleware para verificar el token JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Acceso denegado. Token no proporcionado." });

    jwt.verify(token, 'secreto', (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido o expirado." });
        req.user = user;
        next();
    });
}

// Ruta para registrar un nuevo usuario
app.post('/registrar', async (req, res) => {
    const { nombre, correo, contraseña } = req.body;
    console.log("Datos recibidos:", { nombre, correo, contraseña }); // Log de depuración

    if (!nombre || !correo || !contraseña) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        return res.status(400).json({ error: "Por favor, introduce un correo electrónico válido." });
    }

    try {
        // Verificar si el correo ya está registrado
        const usuarioExistente = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuarios WHERE correo = ?", [correo], (err, row) => {
                if (err) {
                    console.error("Error al buscar usuario:", err.message); // Log de error
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        if (usuarioExistente) {
            console.log("Correo ya registrado:", correo); // Log de depuración
            return res.status(400).json({ error: "Este correo ya está registrado. Por favor, usa otro." });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(contraseña, 10);

        // Insertar el nuevo usuario en la base de datos
        await new Promise((resolve, reject) => {
            db.run(
                "INSERT INTO usuarios (id, nombre, correo, contraseña) VALUES (?, ?, ?, ?)",
                [Date.now().toString(), nombre, correo, hashedPassword],
                function (err) {
                    if (err) {
                        console.error("Error al insertar usuario:", err.message); // Log de error
                        reject(err);
                    } else {
                        console.log("Usuario insertado correctamente."); // Log de éxito
                        resolve(this.lastID);
                    }
                }
            );
        });

        res.json({ success: true, message: "Registro exitoso. ¡Bienvenido!" });
    } catch (error) {
        console.error("Error al registrar el usuario:", error);
        res.status(500).json({ error: "Hubo un error al registrar el usuario. Inténtalo de nuevo." });
    }
});

// Ruta para iniciar sesión
app.post('/iniciar-sesion', async (req, res) => {
    const { correo, contraseña } = req.body;

    if (!correo || !contraseña) {
        return res.status(400).json({ error: "Por favor, completa todos los campos." });
    }

    try {
        // Buscar el usuario en la base de datos
        const usuario = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuarios WHERE correo = ?", [correo], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!usuario) {
            return res.status(400).json({ error: "Correo o contraseña incorrectos." });
        }

        // Verificar la contraseña
        const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!contraseñaValida) {
            return res.status(400).json({ error: "Correo o contraseña incorrectos." });
        }

        // Generar un token JWT
        const token = jwt.sign({ id: usuario.id, correo: usuario.correo }, 'secreto', { expiresIn: '1h' });

        res.json({ success: true, token, message: "Inicio de sesión exitoso. ¡Bienvenido de nuevo!" });
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        res.status(500).json({ error: "Hubo un error al iniciar sesión. Inténtalo de nuevo." });
    }
});

// Ruta protegida de ejemplo
app.get('/perfil', authenticateToken, (req, res) => {
    res.json({ message: "Bienvenido a tu perfil.", user: req.user });
});

app.get('/tareas', (req, res) => {
    db.all("SELECT Id, titulo, descripcion, fecha_maxima, Estado, Prioridad, strftime('%Y-%m-%d', fecha_creacion) as fecha_creacion FROM tareas", (err, rows) => {
        if (err) {
            console.error("Error al obtener las tareas:", err.message);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.get('/tareas/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT Id, titulo, descripcion, fecha_maxima, Estado, Prioridad, strftime('%Y-%m-%d', fecha_creacion) as fecha_creacion FROM tareas WHERE Id = ?", [id], (err, row) => {
        if (err) {
            console.error("Error al obtener la tarea:", err.message);
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: "Tarea no encontrada" });
        } else {
            res.json(row);
        }
    });
});

app.post('/tareas', (req, res) => {
    const { titulo, descripcion, fecha_maxima, prioridad } = req.body;
    const fecha_creacion = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD

    if (!titulo || !descripcion || !fecha_maxima || !prioridad) {
        return res.status(400).json({ error: "Todos los campos son requeridos." });
    }

    db.run(
        "INSERT INTO tareas (titulo, descripcion, fecha_maxima, Estado, Prioridad, fecha_creacion) VALUES (?, ?, ?, 0, ?, ?)",
        [titulo, descripcion, fecha_maxima, prioridad, fecha_creacion],       
        function (err) {
            if (err) {
                console.error("Error al agregar tarea:", err.message);
                res.status(500).json({ error: err.message });
            } else {
                res.json({ success: true, id: this.lastID });
            }
        }
    );    
});

app.put('/tareas/:id/completar', (req, res) => {
    const id = req.params.id;
    db.run(
        "UPDATE tareas SET Estado = 1 WHERE Id = ?",
        [id],
        function (err) {
            if (err) {
                console.error("Error al marcar tarea como completada:", err.message);
                res.status(500).json({ error: err.message });
            } else {
                res.json({ success: true });
            }
        }
    );
});

app.put('/tareas/:id', (req, res) => {
    const id = req.params.id;
    const { titulo, descripcion, fecha_maxima, prioridad } = req.body;

    if (!titulo || !descripcion || !fecha_maxima || !prioridad) {
        return res.status(400).json({ error: "Todos los campos son requeridos: titulo, descripcion, fecha_maxima, prioridad." });
    }

    db.run(
        "UPDATE tareas SET titulo = ?, descripcion = ?, fecha_maxima = ?, Prioridad = ? WHERE Id = ?",
        [titulo, descripcion, fecha_maxima, prioridad, id],
        function (err) {
            if (err) {
                console.error("Error al editar tarea:", err.message);
                res.status(500).json({ error: err.message });
            } else {
                res.json({ success: true });
            }
        }
    );
});

app.delete('/tareas/:id', (req, res) => {
    const id = req.params.id;
    db.run(
        "DELETE FROM tareas WHERE Id = ?",
        [id],
        function (err) {
            if (err) {
                console.error("Error al eliminar tarea:", err.message);
                res.status(500).json({ error: err.message });
            } else {
                res.json({ success: true });
            }
        }
    );
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

