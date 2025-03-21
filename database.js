const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('tareas.db', (err) => {
    if (err) {
        console.error('Error al conectar con SQLite', err.message);
    } else {
        console.log('Conectado a la base de datos tareas.db');
    }
});

db.serialize(() => {
    db.run(
        `CREATE TABLE IF NOT EXISTS tareas (
            titulo TEXT PRIMARY KEY,
            descripcion TEXT NOT NULL,
            fecha_maxima TEXT NOT NULL,
            completada INTEGER DEFAULT 0
        )`,
        (err) => {
            if (err) {
                console.error("Error al crear la tabla tareas:", err.message);
            } else {
                console.log("Tabla tareas creada o ya existente.");
            }
        }
    );
});

module.exports = db;