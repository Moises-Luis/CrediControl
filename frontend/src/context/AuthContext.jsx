
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    iniciarSesion,
    validarSesion,
    obtenerPermisos
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [permisos, setPermisos] = useState([]);
    const [cargando, setCargando] = useState(true);

    const limpiarSesion = () => {
        localStorage.removeItem("credicontrol_token");
        setUsuario(null);
        setPermisos([]);
    };

    const cerrarSesion = () => {
        limpiarSesion();
        window.location.hash = "/login";
    };

    useEffect(() => {
        let activo = true;

        async function comprobarSesion() {
            const token = localStorage.getItem(
                "credicontrol_token"
            );

            if (!token) {
                if (activo) setCargando(false);
                return;
            }

            try {
                const [datosUsuario, datosPermisos] =
                    await Promise.all([
                        validarSesion(),
                        obtenerPermisos()
                    ]);

                if (activo) {
                    setUsuario(datosUsuario);
                    setPermisos(
                        datosPermisos.map((p) => p.codigo)
                    );
                }

            } catch (error) {
                localStorage.removeItem(
                    "credicontrol_token"
                );

                if (activo) {
                    setUsuario(null);
                    setPermisos([]);
                }

            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        }

        comprobarSesion();

        return () => {
            activo = false;
        };
    }, []);

    const login = async (nombreUsuario, password) => {
        setCargando(true);

        try {
            const resultado = await iniciarSesion(
                nombreUsuario,
                password
            );

            localStorage.setItem(
                "credicontrol_token",
                resultado.token
            );

            const datosPermisos = await obtenerPermisos();

            setUsuario(resultado.usuario);
            setPermisos(
                datosPermisos.map((p) => p.codigo)
            );

            window.location.hash = "/socios";

            return resultado.usuario;

        } catch (error) {
            limpiarSesion();
            throw error;

        } finally {
            setCargando(false);
        }
    };

    const tienePermiso = (codigo) => {
        return permisos.includes(codigo);
    };

    return (
        <AuthContext.Provider
            value={{
                usuario,
                permisos,
                autenticado: Boolean(usuario),
                cargando,
                login,
                cerrarSesion,
                tienePermiso
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const contexto = useContext(AuthContext);

    if (!contexto) {
        throw new Error(
            "useAuth debe utilizarse dentro de AuthProvider"
        );
    }

    return contexto;
}
