
import api from "./api";

// ==========================================
// INICIAR SESIÓN
// ==========================================

export async function iniciarSesion(usuario, password) {
    const response = await api.post("/auth/login", {
        usuario,
        password
    });

    return response.data.datos;
}

// ==========================================
// VALIDAR SESIÓN
// ==========================================

export async function validarSesion() {
    const response = await api.get("/auth/me");
    return response.data.datos;
}

// ==========================================
// OBTENER PERMISOS DEL USUARIO
// ==========================================

export async function obtenerPermisos() {
    const response = await api.get("/auth/permisos");
    return response.data.datos;
}
