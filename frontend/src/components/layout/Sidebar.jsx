
import { useEffect, useState } from "react";

import "./Sidebar.css";

function Sidebar() {

    // ==========================================
    // OBTENER RUTA ACTUAL
    // ==========================================

    const obtenerRutaActual = () => {
        const ruta = window.location.hash.replace("#", "");
        return ruta || "/socios";
    };

    const [rutaActual, setRutaActual] = useState(obtenerRutaActual);

    // ==========================================
    // DETECTAR CAMBIOS DE RUTA
    // ==========================================

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

    // ==========================================
    // CLASE ACTIVA
    // ==========================================

    const obtenerClase = (ruta) => {
        return `sidebar-link ${rutaActual === ruta ? "active" : ""}`;
    };

    return (
        <aside className="sidebar">

            {/* ====================================
                LOGO
            ==================================== */}

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

            {/* ====================================
                ACCIÓN PRINCIPAL
            ==================================== */}

            <div className="sidebar-action">

                <button
                    type="button"
                    className="btn-new-credit"
                    onClick={() => {
                        window.location.hash = "/creditos";
                    }}
                    title="Ir al módulo de créditos"
                >
                    <i className="bi bi-plus-circle"></i>

                    <span>
                        Nuevo Crédito
                    </span>
                </button>

            </div>

            {/* ====================================
                MENÚ PRINCIPAL
            ==================================== */}

            <nav className="sidebar-navigation">

                <div className="sidebar-section-title">
                    PRINCIPAL
                </div>

                {/* DASHBOARD - PENDIENTE */}

                <div
                    className="sidebar-link opacity-50"
                    title="Módulo pendiente"
                    aria-disabled="true"
                >
                    <i className="bi bi-grid"></i>
                    <span>Dashboard</span>
                </div>

                {/* SOCIOS */}

                <a
                    href="#/socios"
                    className={obtenerClase("/socios")}
                    aria-current={
                        rutaActual === "/socios"
                            ? "page"
                            : undefined
                    }
                >
                    <i className="bi bi-people"></i>
                    <span>Socios</span>
                </a>

                {/* CRÉDITOS */}

                <a
                    href="#/creditos"
                    className={obtenerClase("/creditos")}
                    aria-current={
                        rutaActual === "/creditos"
                            ? "page"
                            : undefined
                    }
                >
                    <i className="bi bi-cash-stack"></i>
                    <span>Créditos</span>
                </a>

                {/* PAGOS */}

                <a
                    href="#/pagos"
                    className={obtenerClase("/pagos")}
                    aria-current={
                        rutaActual === "/pagos"
                            ? "page"
                            : undefined
                    }
                >
                    <i className="bi bi-wallet2"></i>
                    <span>Pagos</span>
                </a>

                {/* CUOTAS - PENDIENTE */}

                <div
                    className="sidebar-link opacity-50"
                    title="Módulo pendiente"
                    aria-disabled="true"
                >
                    <i className="bi bi-calendar-check"></i>
                    <span>Cuotas</span>
                </div>

                <div className="sidebar-separator"></div>

                <div className="sidebar-section-title">
                    CONSULTAS
                </div>

                {/* REPORTES - HABILITADO */}

                <a
                    href="#/reportes"
                    className={obtenerClase("/reportes")}
                    aria-current={
                        rutaActual === "/reportes"
                            ? "page"
                            : undefined
                    }
                >
                    <i className="bi bi-bar-chart-line"></i>
                    <span>Reportes</span>
                </a>

                <div className="sidebar-separator"></div>

                <div className="sidebar-section-title">
                    SISTEMA
                </div>

                {/* USUARIOS - PENDIENTE */}

                <div
                    className="sidebar-link opacity-50"
                    title="Módulo pendiente"
                    aria-disabled="true"
                >
                    <i className="bi bi-person-gear"></i>
                    <span>Usuarios</span>
                </div>

                {/* CONFIGURACIÓN - PENDIENTE */}

                <div
                    className="sidebar-link opacity-50"
                    title="Módulo pendiente"
                    aria-disabled="true"
                >
                    <i className="bi bi-gear"></i>
                    <span>Configuración</span>
                </div>

            </nav>

            {/* ====================================
                USUARIO
            ==================================== */}

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
