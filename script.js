document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let usuario = document.getElementById("usuario").value;
    let password = document.getElementById("password").value;
    let mensaje = document.getElementById("mensaje");

    // Usuario y contraseña de prueba
    if (usuario === "admin" && password === "1234") {
        mensaje.style.color = "green";
        mensaje.textContent = "Inicio de sesión exitoso";
    } else {
        mensaje.style.color = "red";
        mensaje.textContent = "Usuario o contraseña incorrectos";
    }
});