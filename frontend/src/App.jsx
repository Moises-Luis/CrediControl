
import { useEffect, useState } from "react";

import Layout from "./components/layout/Layout";

import Socios from "./pages/socios/Socios";
import Creditos from "./pages/creditos/Creditos";
import Pagos from "./pages/pagos/Pagos";
import Cuotas from "./pages/cuotas/Cuotas";
import Reportes from "./pages/reportes/Reportes";
import Usuarios from "./pages/usuarios/Usuarios";
import Login from "./pages/Login";

import {
    AuthProvider,
    useAuth
} from "./context/AuthContext";

import "./App.css";

const paginas = {
    "/socios": {
        componente: Socios,
        permiso: "socios.ver"
    },
    "/creditos": {
        componente: Creditos,
        permiso: "creditos.ver"
    },
    "/pagos": {
        componente: Pagos,
        permiso: "pagos.ver"
    },
    "/cuotas": {
        componente: Cuotas,
        permiso: "cuotas.ver"
    },
    "/reportes": {
        componente: Reportes,
        permiso: "reportes.ver"
    },
    "/usuarios": {
        componente: Usuarios,
        permiso: "usuarios.ver"
    }
};

function ContenidoApp() {
    const {
        autenticado,
        cargando,
        permisos,
        tienePermiso
    } = useAuth();

    const obtenerRuta = () => {
        return window.location.hash.replace("#", "") ||
            "/socios";
    };

    const [rutaActual, setRutaActual] =
        useState(obtenerRuta);

    useEffect(() => {
        const cambiarRuta = () => {
            setRutaActual(obtenerRuta());
        };

        window.addEventListener(
            "hashchange",
            cambiarRuta
        );

        return () => {
            window.removeEventListener(
                "hashchange",
                cambiarRuta
            );
        };
    }, []);

    const primeraRutaPermitida = Object.keys(paginas)
        .find((ruta) =>
            permisos.includes(paginas[ruta].permiso)
        );

    useEffect(() => {
        if (cargando) return;

        if (!autenticado) {
            if (rutaActual !== "/login") {
                window.location.hash = "/login";
            }
            return;
        }

        const ruta = paginas[rutaActual];

        if (
            rutaActual === "/login" ||
            (ruta && !tienePermiso(ruta.permiso))
        ) {
            window.location.hash =
                primeraRutaPermitida || "/sin-permisos";
        }

    }, [
        cargando,
        autenticado,
        rutaActual,
        permisos,
        tienePermiso,
        primeraRutaPermitida
    ]);

    if (cargando) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" />
                    <p className="text-muted">
                        Verificando sesión y permisos...
                    </p>
                </div>
            </div>
        );
    }

    if (!autenticado) {
        return <Login />;
    }

    const configuracion = paginas[rutaActual];

    if (
        rutaActual === "/login" ||
        (
            configuracion &&
            !tienePermiso(configuracion.permiso)
        )
    ) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <p>Redirigiendo...</p>
            </div>
        );
    }

    if (
        rutaActual === "/sin-permisos" ||
        !primeraRutaPermitida
    ) {
        return (
            <Layout>
                <div className="alert alert-warning m-4">
                    Tu perfil no tiene módulos habilitados.
                    Contacta al administrador.
                </div>
            </Layout>
        );
    }

    if (!configuracion) {
        window.location.hash = primeraRutaPermitida;

        return (
            <div className="p-4">
                Redirigiendo...
            </div>
        );
    }

    const Pagina = configuracion.componente;

    return (
        <Layout>
            <Pagina />
        </Layout>
    );
}

function App() {
    return (
        <AuthProvider>
            <ContenidoApp />
        </AuthProvider>
    );
}

export default App;
