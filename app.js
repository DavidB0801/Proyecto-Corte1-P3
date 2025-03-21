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
                console.log("Fecha de creación:", tarea.fecha_creacion); // Verifica el valor de fecha_creacion
                const estado = determinarEstado(tarea.fecha_maxima, tarea.Estado);
                const estadoColor = estado === "rojo" ? "rojo" : estado === "gris" ? "gris" : "verde";

                // Asegurar que la fecha de creación se muestra en formato YYYY/MM/DD
                const fechaCreacion = tarea.fecha_creacion ? tarea.fecha_creacion : "No disponible"; // Aquí ya está formateada

                const tareaElemento = document.createElement("div");
                tareaElemento.className = "tarea";

                tareaElemento.innerHTML = `
                    <div class="estado ${estadoColor}"></div>
                    <div class="info">
                        <h3>${tarea.titulo}</h3>
                        <p>${tarea.descripcion}</p>
                        <p><strong>Fecha máxima:</strong> ${tarea.fecha_maxima.replace(/-/g, "/")}</p>
                        <p><strong>Fecha de creación:</strong> ${fechaCreacion}</p> <!-- Aquí se muestra -->
                        <p><strong>Prioridad:</strong> ${tarea.Prioridad}</p>
                    </div>
                    <div class="acciones">
                        <button onclick="marcarCompletada(${tarea.Id})" class="${tarea.Estado ? 'completada' : ''}">
                            ${tarea.Estado ? "Completada" : "Completar"}
                        </button>
                        <button class="editar" onclick="editarTarea(${tarea.Id})">Editar</button>
                        <button class="eliminar" onclick="eliminarTarea(${tarea.Id})">Eliminar</button>
                    </div>
                `;
                listaTareas.appendChild(tareaElemento);
            });
        })
        .catch(error => console.error("Error al cargar las tareas:", error));
}

function determinarEstado(fechaMaxima, estado) {
    if (estado === 1) return "verde"; // Completada
    const hoy = new Date().toISOString().split("T")[0];
    return new Date(fechaMaxima) < new Date(hoy) ? "rojo" : "gris"; // Rojo si vencida, gris si pendiente
}

function obtenerFechaActual() {
    return new Date().toISOString().split('T')[0].replace(/-/g, "/"); // YYYY/MM/DD
}

function agregarTarea() {
    const titulo = document.getElementById("titulo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const fechaMaxima = document.getElementById("fecha_maxima").value;
    const prioridad = document.getElementById("prioridad").value;

    if (!titulo || !descripcion || !fechaMaxima || !prioridad) {
        alert("Todos los campos son obligatorios.");
        return;
    }

    const nuevaTarea = { titulo, descripcion, fecha_maxima: fechaMaxima, prioridad };

    fetch("http://localhost:3000/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaTarea)
    })
    .then(response => response.json())
    .then(() => cargarTareas())
    .catch(error => console.error("Error al agregar tarea:", error));
}

function marcarCompletada(id) {
    fetch(`http://localhost:3000/tareas/${id}/completar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
    })
    .then(() => cargarTareas())
    .catch(error => console.error("Error al marcar tarea como completada:", error));
}

function eliminarTarea(id) {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
        fetch(`http://localhost:3000/tareas/${id}`, { method: "DELETE" })
            .then(() => cargarTareas())
            .catch(error => console.error("Error al eliminar tarea:", error));
    }
}

// Funcionalidad para editar tareas
let tareaActual = null;

// Función para abrir el modal de edición
function editarTarea(id) {
    console.log("Intentando editar la tarea con ID:", id);
    id = Number(id); // Convertir el ID a número
    fetch(`http://localhost:3000/tareas/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al obtener la tarea");
            }
            return response.json();
        })
        .then(tarea => {
            tareaActual = tarea.Id; // Guardar el ID de la tarea en edición
            document.getElementById("editar-titulo").value = tarea.titulo;
            document.getElementById("editar-descripcion").value = tarea.descripcion;
            document.getElementById("editar-fecha_maxima").value = tarea.fecha_maxima;
            document.getElementById("modal-edicion").style.display = "flex"; // Mostrar el modal
        })
        .catch(error => {
            console.error("Error al obtener la tarea:", error);
            alert("Hubo un error al cargar la tarea para editar.");
        });
}

// Función para guardar los cambios
function guardarEdicion() {
    const titulo = document.getElementById("editar-titulo").value.trim();
    const descripcion = document.getElementById("editar-descripcion").value.trim();
    const fechaMaxima = document.getElementById("editar-fecha_maxima").value;
    const prioridad = document.getElementById("editar-prioridad").value; // Asegúrate de que este campo exista en tu HTML

    if (!titulo || !descripcion || !fechaMaxima || !prioridad) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    console.log("ID de la tarea en edición:", tareaActual); // Depuración
    console.log("Datos enviados:", { titulo, descripcion, fecha_maxima: fechaMaxima, prioridad }); // Depuración

    fetch(`http://localhost:3000/tareas/${tareaActual}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, descripcion, fecha_maxima: fechaMaxima, prioridad }) // Incluye prioridad
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(`Error al guardar los cambios: ${err.error || response.statusText}`);
            });
        }
        return response.json();
    })
    .then(() => {
        cargarTareas();
        cancelarEdicion();
    })
    .catch(error => {
        console.error("Error al guardar los cambios:", error);
        alert(error.message); // Muestra el mensaje de error
    });
}

function cancelarEdicion() {
    document.getElementById("formulario-edicion").style.display = "none";
    tareaActual = null;
}

// Función para cerrar el modal
function cancelarEdicion() {
    document.getElementById("modal-edicion").style.display = "none"; // Ocultar el modal
    tareaActual = null;
}