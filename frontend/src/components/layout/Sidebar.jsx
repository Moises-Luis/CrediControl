
import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";

import "./Sidebar.css";

function Sidebar() {
    const {
        usuario,
        cerrarSesion,
        tienePermiso
    } = useAuth();

    const obtenerRutaActual = () =>
        window.location.hash.replace("#", "") || "/socios";

    const [rutaActual, setRutaActual] =
        useState(obtenerRutaActual);

    useEffect(() => {
        const actualizarRuta = () =>
            setRutaActual(obtenerRutaActual());

        window.addEventListener(
            "hashchange",
            actualizarRuta
        );

        return () =>
            window.removeEventListener(
                "hashchange",
                actualizarRuta
            );
    }, []);

    const obtenerClase = (ruta) =>
        `sidebar-link ${
            rutaActual === ruta ? "active" : ""
        }`;

    const nombre = usuario?.nombre || "Usuario";

    const iniciales = nombre
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase() || "")
        .join("");

    const perfiles = {
        1: "Administrador",
        2: "Asesor de créditos",
        3: "Cajero",
        4: "Supervisor"
    };

    const nombrePerfil =
        perfiles[Number(usuario?.idPerfil)] ||
        `Perfil ${usuario?.idPerfil ?? ""}`;

    const puedeVerPrincipal = [
        "socios.ver",
        "creditos.ver",
        "pagos.ver",
        "cuotas.ver"
    ].some(tienePermiso);

    return (
        <aside className="sidebar">

            {/* LOGO */}
            <div className="sidebar-brand">
                <div className="brand-logo">
                    <i className="bi bi-cash-coin" />
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

            {/* NUEVO CRÉDITO */}
            {tienePermiso("creditos.crear") && (
                <div className="sidebar-action">
                    <button
                        type="button"
                        className="btn-new-credit"
                        onClick={() => {
                            window.location.hash = "/creditos";
                        }}
                    >
                        <i className="bi bi-plus-circle" />
                        <span>Nuevo Crédito</span>
                    </button>
                </div>
            )}

            <nav className="sidebar-navigation">

                {puedeVerPrincipal && (
                    <div className="sidebar-section-title">
                        PRINCIPAL
                    </div>
                )}

                {tienePermiso("socios.ver") && (
                    <a
                        href="#/socios"
                        className={obtenerClase("/socios")}
                    >
                        <i className="bi bi-people" />
                        <span>Socios</span>
                    </a>
                )}

                {tienePermiso("creditos.ver") && (
                    <a
                        href="#/creditos"
                        className={obtenerClase("/creditos")}
                    >
                        <i className="bi bi-cash-stack" />
                        <span>Créditos</span>
                    </a>
                )}

                {tienePermiso("pagos.ver") && (
                    <a
                        href="#/pagos"
                        className={obtenerClase("/pagos")}
                    >
                        <i className="bi bi-wallet2" />
                        <span>Pagos</span>
                    </a>
                )}

                {tienePermiso("cuotas.ver") && (
                    <a
                        href="#/cuotas"
                        className={obtenerClase("/cuotas")}
                    >
                        <i className="bi bi-calendar-check" />
                        <span>Cuotas</span>
                    </a>
                )}

                {tienePermiso("reportes.ver") && (
                    <>
                        <div className="sidebar-separator" />

                        <div className="sidebar-section-title">
                            CONSULTAS
                        </div>

                        <a
                            href="#/reportes"
                            className={obtenerClase("/reportes")}
                        >
                            <i className="bi bi-bar-chart-line" />
                            <span>Reportes</span>
                        </a>
                    </>
                )}

                {tienePermiso("usuarios.ver") && (
                    <>
                        <div className="sidebar-separator" />

                        <div className="sidebar-section-title">
                            SISTEMA
                        </div>

                        <a
                            href="#/usuarios"
                            className={obtenerClase("/usuarios")}
                        >
                            <i className="bi bi-person-gear" />
                            <span>Usuarios</span>
                        </a>
                    </>
                )}

            </nav>

            {/* PERFIL */}
            <div className="sidebar-user">
                <div className="user-avatar">
                    {iniciales || "US"}
                </div>

                <div className="user-information">
                    <div className="user-name">
                        {nombre}
                    </div>

                    <div className="user-role">
                        {nombrePerfil}
                    </div>
                </div>

                <button
                    type="button"
                    className="user-menu-button"
                    title="Cerrar sesión"
                    aria-label="Cerrar sesión"
                    onClick={cerrarSesion}
                >
                    <i className="bi bi-box-arrow-right" />
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;



