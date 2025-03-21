document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("container");
    const overlayCon = document.getElementById("overlayCon");
    const overlayBtn = document.getElementById("overlayBtn");

    if (overlayBtn) {
        overlayBtn.addEventListener("click", () => {
            container.classList.toggle("right-panel-active");

            overlayBtn.classList.remove("btnScaled");
            window.requestAnimationFrame(() => {
                overlayBtn.classList.add("btnScaled");
            });
        });
    }
});

// Función para registrar un nuevo usuario
async function registrarUsuario(nombre, correo, contraseña) {
    const response = await fetch('http://localhost:3000/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correo, contraseña }),
    });

    const data = await response.json();
    if (response.ok) {
        alert(data.message);
        window.location.href = 'Index.html'; // Redirigir a index.html
    } else {
        alert(data.error);
    }
}



// Función para iniciar sesión
async function iniciarSesion(correo, contraseña) {
    const response = await fetch('http://localhost:3000/iniciar-sesion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contraseña }),
    });

    const data = await response.json();
    if (response.ok) {
        alert(data.message);
        window.location.href = 'Index.html'; // Redirigir a index.html
    } else {
        alert(data.error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const registroForm = document.getElementById("registroForm");
    const inicioSesionForm = document.getElementById("inicioSesionForm");

    if (registroForm) {
        registroForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Evitar que el formulario se envíe

            const nombre = document.getElementById("nombre").value;
            const correo = document.getElementById("correo").value;
            const contraseña = document.getElementById("contraseña").value;

            if (!nombre || !correo || !contraseña) {
                alert("Todos los campos son obligatorios.");
                return;
            }

            await registrarUsuario(nombre, correo, contraseña);
        });
    }

    if (inicioSesionForm) {
        inicioSesionForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Evitar que el formulario se envíe

            const correo = document.getElementById("correoLogin").value;
            const contraseña = document.getElementById("contraseñaLogin").value;

            if (!correo || !contraseña) {
                alert("Por favor, completa todos los campos.");
                return;
            }

            await iniciarSesion(correo, contraseña);
        });
    }
});

