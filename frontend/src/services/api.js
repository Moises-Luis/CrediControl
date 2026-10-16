
import axios from "axios";

// ==========================================
// CONFIGURACIÓN GENERAL DE LA API
// ==========================================

const api = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// ==========================================
// INTERCEPTOR DE SOLICITUDES
// ==========================================

// Antes de enviar cada petición al backend,
// obtenemos el token almacenado durante el login.

api.interceptors.request.use(
    (config) => {

        const token = localStorage.getItem(
            "credicontrol_token"
        );

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ==========================================
// INTERCEPTOR DE RESPUESTAS
// ==========================================

api.interceptors.response.use(
    (response) => response,

    (error) => {

        if (error.response?.status === 401) {

            // No tratar el rechazo de credenciales
            // durante el login como sesión expirada.

            const url = error.config?.url || "";

            if (!url.includes("/auth/login")) {

                localStorage.removeItem(
                    "credicontrol_token"
                );

                window.location.hash = "/login";

                // El AuthContext actualizará su estado
                // al validar la sesión nuevamente.
                window.location.reload();
            }
        }

        return Promise.reject(error);
    }
);

export default api;
