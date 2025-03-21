const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/tareas', (req, res) => {
    db.all("SELECT Id, titulo, descripcion, fecha_maxima, Estado, Prioridad, strftime('%Y/%m/%d', fecha_creacion) as fecha_creacion FROM tareas", (err, rows) => {
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
    db.get("SELECT * FROM tareas WHERE Id = ?", [id], (err, row) => {
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
    const fecha_creacion = new Date().toISOString().split("T")[0].replace(/-/g, "/");

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