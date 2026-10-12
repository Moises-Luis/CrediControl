
import { useEffect, useState } from "react";

import "./Sidebar.css";

function Sidebar() {

    const obtenerRutaActual = () => {
        const ruta = window.location.hash.replace("#", "");
        return ruta || "/socios";
    };

    const [rutaActual, setRutaActual] = useState(obtenerRutaActual);

    useEffect(() => {
        const actualizarRuta = () => {
            setRutaActual(obtenerRutaActual());
        };

        window.addEventListener("hashchange", actualizarRuta);

        return () => {
            window.removeEventListener(
                "hashchange",
                actualizarRuta
            );
        };
    }, []);

    const obtenerClase = (ruta) => {
        return `sidebar-link ${
            rutaActual === ruta ? "active" : ""
        }`;
    };

    return (
        <aside className="sidebar">

            {/* LOGO */}

            <div className="sidebar-brand">
                <div className="brand-logo">
                    <i className="bi bi-cash-coin"></i>
                </div>

                <div>
                    <div className="brand-name">
                        CrediControl
                    </div>

                    <div className="brand-description">
                        Gestión de créditos
                    </div>
                </div>
            </div>

            {/* ACCIÓN PRINCIPAL */}

            <div className="sidebar-action">
                <button
                    type="button"
                    className="btn-new-credit"
                    onClick={() => {
                        window.location.hash = "/creditos";
                    }}
                >
                    <i className="bi bi-plus-circle"></i>

                    <span>Nuevo Crédito</span>
                </button>
            </div>

            {/* NAVEGACIÓN */}

            <nav className="sidebar-navigation">

                <div className="sidebar-section-title">
                    PRINCIPAL
                </div>

                {/* DASHBOARD PENDIENTE */}

                <div
                    className="sidebar-link opacity-50"
                    title="Módulo pendiente"
                    aria-disabled="true"
                >
                    <i className="bi bi-grid"></i>
                    <span>Dashboard</span>
                </div>

                <a
                    href="#/socios"
                    className={obtenerClase("/socios")}
                >
                    <i className="bi bi-people"></i>
                    <span>Socios</span>
                </a>

                <a
                    href="#/creditos"
                    className={obtenerClase("/creditos")}
                >
                    <i className="bi bi-cash-stack"></i>
                    <span>Créditos</span>
                </a>

                <a
                    href="#/pagos"
                    className={obtenerClase("/pagos")}
                >
                    <i className="bi bi-wallet2"></i>
                    <span>Pagos</span>
                </a>

                <a
                    href="#/cuotas"
                    className={obtenerClase("/cuotas")}
                >
                    <i className="bi bi-calendar-check"></i>
                    <span>Cuotas</span>
                </a>

                <div className="sidebar-separator"></div>

                <div className="sidebar-section-title">
                    CONSULTAS
                </div>

                <a
                    href="#/reportes"
                    className={obtenerClase("/reportes")}
                >
                    <i className="bi bi-bar-chart-line"></i>
                    <span>Reportes</span>
                </a>

                <div className="sidebar-separator"></div>

                <div className="sidebar-section-title">
                    SISTEMA
                </div>

                {/* USUARIOS HABILITADO */}

                <a
                    href="#/usuarios"
                    className={obtenerClase("/usuarios")}
                >
                    <i className="bi bi-person-gear"></i>
                    <span>Usuarios</span>
                </a>

                {/* CONFIGURACIÓN PENDIENTE */}

                <div
                    className="sidebar-link opacity-50"
                    title="Módulo pendiente"
                    aria-disabled="true"
                >
                    <i className="bi bi-gear"></i>
                    <span>Configuración</span>
                </div>

            </nav>

            {/* PERFIL */}

            <div className="sidebar-user">
                <div className="user-avatar">
                    AD
                </div>

                <div className="user-information">
                    <div className="user-name">
                        Administrador
                    </div>

                    <div className="user-role">
                        Administrador
                    </div>
                </div>

                <button
                    type="button"
                    className="user-menu-button"
                    title="Opciones de usuario"
                >
                    <i className="bi bi-three-dots-vertical"></i>
                </button>
            </div>

        </aside>
    );
}

export default Sidebar;

