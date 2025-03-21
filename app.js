document.addEventListener("DOMContentLoaded", () => {
    cargarTareas();
});

function cargarTareas() {
    fetch("http://localhost:3000/tareas")
        .then(response => response.json())
        .then(tareas => {
            const listaTareas = document.getElementById("lista-tareas");
            listaTareas.innerHTML = "";

            tareas.forEach(tarea => {
                const tareaElemento = document.createElement("div");
                tareaElemento.className = "tarea";

                // Determinar el estado de la tarea
                const estado = determinarEstado(tarea.fecha_maxima, tarea.completada);
                const estadoColor = estado === "rojo" ? "rojo" : estado === "gris" ? "gris" : "verde";

                tareaElemento.innerHTML = `
                    <div class="estado ${estadoColor}"></div>
                    <div class="info">
                        <h3>${tarea.titulo}</h3>
                        <p>${tarea.descripcion}</p>
                        <p><strong>Fecha máxima:</strong> ${tarea.fecha_maxima}</p>
                    </div>
                    <div class="acciones">
                        <button onclick="marcarCompletada('${tarea.titulo}')" class="${tarea.completada ? 'completada' : ''}">
                            ${tarea.completada ? "Completada" : "Completar"}
                        </button>
                        <button class="editar" onclick="editarTarea('${tarea.titulo}')">Editar</button>
                        <button class="eliminar" onclick="eliminarTarea('${tarea.titulo}')">Eliminar</button>
                    </div>
                `;
                listaTareas.appendChild(tareaElemento);
            });
        })
        .catch(error => console.error("Error:", error));
}

function determinarEstado(fechaMaxima, completada) {
    if (completada) return "verde"; // Tarea completada
    const hoy = new Date().toISOString().split("T")[0]; // Fecha actual en formato YYYY-MM-DD
    if (fechaMaxima < hoy) return "rojo"; // Tarea vencida
    return "gris"; // Tarea pendiente
}

function agregarTarea() {
    const titulo = document.getElementById("titulo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const fechaMaxima = document.getElementById("fecha_maxima").value;

    if (!titulo || !descripcion || !fechaMaxima) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    fetch("http://localhost:3000/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, descripcion, fecha_maxima: fechaMaxima })
    })
    .then(() => {
        cargarTareas();
        document.getElementById("titulo").value = "";
        document.getElementById("descripcion").value = "";
        document.getElementById("fecha_maxima").value = "";
    })
    .catch(error => console.error("Error:", error));
}

function marcarCompletada(titulo) {
    fetch(`http://localhost:3000/tareas/${titulo}/completar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Error al marcar la tarea como completada");
        }
        return response.json();
    })
    .then(() => cargarTareas())
    .catch(error => console.error("Error:", error));
}

function eliminarTarea(titulo) {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
        fetch(`http://localhost:3000/tareas/${titulo}`, { method: "DELETE" })
            .then(() => cargarTareas())
            .catch(error => console.error("Error:", error));
    }
}

// Funcionalidad para editar tareas
let tareaActual = null;

function editarTarea(titulo) {
    console.log("Intentando editar la tarea con título:", titulo);
    fetch(`http://localhost:3000/tareas/${encodeURIComponent(titulo)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al obtener la tarea");
            }
            return response.json();
        })
        .then(tarea => {
            tareaActual = tarea.titulo; // Guardar el título original para la actualización
            document.getElementById("editar-titulo").value = tarea.titulo;
            document.getElementById("editar-descripcion").value = tarea.descripcion;
            document.getElementById("editar-fecha_maxima").value = tarea.fecha_maxima;
            document.getElementById("formulario-edicion").style.display = "block"; // Mostrar el formulario de edición
        })
        .catch(error => {
            console.error("Error al obtener la tarea:", error);
            alert("Hubo un error al cargar la tarea para editar.");
        });
}

function guardarEdicion() {
    const titulo = document.getElementById("editar-titulo").value.trim();
    const descripcion = document.getElementById("editar-descripcion").value.trim();
    const fechaMaxima = document.getElementById("editar-fecha_maxima").value;

    if (!titulo || !descripcion || !fechaMaxima) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    fetch(`http://localhost:3000/tareas/${tareaActual}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, descripcion, fecha_maxima: fechaMaxima })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Error al guardar los cambios");
        }
        return response.json();
    })
    .then(() => {
        cargarTareas(); // Recargar la lista de tareas
        cancelarEdicion(); // Ocultar el formulario de edición
    })
    .catch(error => {
        console.error("Error al guardar los cambios:", error);
        alert("Hubo un error al guardar los cambios.");
    });
}

function cancelarEdicion() {
    document.getElementById("formulario-edicion").style.display = "none"; // Ocultar el formulario de edición
    tareaActual = null; // Limpiar la tarea actual
}