const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express(); // Inicializa la aplicación Express
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Ruta para obtener todas las tareas
app.get('/tareas', (req, res) => {
    db.all("SELECT * FROM tareas", (err, rows) => {
        if (err) {
            console.error("Error al obtener las tareas:", err.message);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Ruta para obtener una tarea específica
app.get('/tareas/:titulo', (req, res) => {
    const titulo = req.params.titulo;
    db.get("SELECT * FROM tareas WHERE titulo = ?", [titulo], (err, row) => {
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

// Ruta para agregar una tarea
app.post('/tareas', (req, res) => {
    const { titulo, descripcion, fecha_maxima } = req.body;

    if (!titulo || !descripcion || !fecha_maxima) {
        return res.status(400).json({ error: "Todos los campos son requeridos." });
    }

    db.run(
        "INSERT INTO tareas (titulo, descripcion, fecha_maxima) VALUES (?, ?, ?)",
        [titulo, descripcion, fecha_maxima],
        function (err) {
            if (err) {
                console.error("Error al agregar tarea:", err.message);
                res.status(500).json({ error: err.message });
            } else {
                res.json({ success: true });
            }
        }
    );
});

// Ruta para marcar una tarea como completada
app.put('/tareas/:titulo/completar', (req, res) => {
    const titulo = req.params.titulo;
    db.run(
        "UPDATE tareas SET completada = 1 WHERE titulo = ?",
        [titulo],
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

// Ruta para editar una tarea
app.put('/tareas/:titulo', (req, res) => {
    const tituloOriginal = req.params.titulo;
    const { titulo, descripcion, fecha_maxima } = req.body;

    if (!titulo || !descripcion || !fecha_maxima) {
        return res.status(400).json({ error: "Todos los campos son requeridos." });
    }

    db.run(
        "UPDATE tareas SET titulo = ?, descripcion = ?, fecha_maxima = ? WHERE titulo = ?",
        [titulo, descripcion, fecha_maxima, tituloOriginal],
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

// Ruta para eliminar una tarea
app.delete('/tareas/:titulo', (req, res) => {
    const titulo = req.params.titulo;
    db.run(
        "DELETE FROM tareas WHERE titulo = ?",
        [titulo],
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

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});