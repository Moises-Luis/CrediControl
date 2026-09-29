import {
    useEffect,
    useMemo,
    useState
} from "react";

import socioService from "../../services/socioService";

import SocioModal from "./SocioModal";
import SocioDetalleModal from "./SocioDetalleModal";

import "./Socios.css";


function Socios() {

    const [socios, setSocios] =
        useState([]);

    const [cargando, setCargando] =
        useState(true);

    const [error, setError] =
        useState("");

    const [mensajeExito, setMensajeExito] =
        useState("");

    const [busqueda, setBusqueda] =
        useState("");

    const [filtroEstado, setFiltroEstado] =
        useState("activos");

    const [mostrarModal, setMostrarModal] =
        useState(false);

    const [socioEditar, setSocioEditar] =
        useState(null);

    const [socioDetalle, setSocioDetalle] =
        useState(null);


    // ========================================
    // CARGAR SOCIOS
    // ========================================

    const cargarSocios = async (
        estado = filtroEstado
    ) => {

        try {

            setCargando(true);
            setError("");

            let respuesta;

            if (estado === "inactivos") {

                respuesta =
                    await socioService
                        .obtenerInactivos();

            } else {

                respuesta =
                    await socioService
                        .obtenerTodos();
            }

            setSocios(
                respuesta.datos || []
            );

        } catch (error) {

            console.error(
                "Error al cargar socios:",
                error
            );

            setError(
                "No fue posible cargar los socios."
            );

        } finally {

            setCargando(false);
        }
    };


    useEffect(() => {

        cargarSocios(filtroEstado);

    }, [filtroEstado]);


    // ========================================
    // NOMBRE
    // ========================================

    const obtenerNombreCompleto = (socio) => {

        return [
            socio.primerNombre,
            socio.segundoNombre,
            socio.tercerNombre,
            socio.primerApellido,
            socio.segundoApellido,
            socio.apellidoCasada
        ]
            .filter(Boolean)
            .join(" ");
    };


    // ========================================
    // FILTRO
    // ========================================

    const sociosFiltrados =
        useMemo(() => {

            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            if (!texto) {
                return socios;
            }

            return socios.filter(
                (socio) => {

                    const nombre =
                        obtenerNombreCompleto(
                            socio
                        ).toLowerCase();

                    const documento =
                        String(
                            socio.noDocumento || ""
                        ).toLowerCase();

                    const telefono =
                        String(
                            socio.telefono || ""
                        ).toLowerCase();

                    const codigo =
                        String(
                            socio.idSocio || ""
                        ).toLowerCase();

                    return (
                        nombre.includes(texto) ||
                        documento.includes(texto) ||
                        telefono.includes(texto) ||
                        codigo.includes(texto)
                    );
                }
            );

        }, [socios, busqueda]);


    // ========================================
    // MENSAJE
    // ========================================

    const mostrarMensaje = (mensaje) => {

        setMensajeExito(mensaje);

        setTimeout(() => {
            setMensajeExito("");
        }, 4000);
    };


    // ========================================
    // NUEVO
    // ========================================

    const abrirNuevoSocio = () => {

        setSocioEditar(null);

        setMostrarModal(true);
    };


    // ========================================
    // EDITAR
    // ========================================

    const abrirEditarSocio = (socio) => {

        setSocioEditar(socio);

        setMostrarModal(true);
    };


    // ========================================
    // GUARDADO
    // ========================================

    const socioGuardado = async (mensaje) => {

        setMostrarModal(false);
        setSocioEditar(null);

        mostrarMensaje(mensaje);

        await cargarSocios(
            filtroEstado
        );
    };


    // ========================================
    // DESACTIVAR
    // ========================================

    const desactivarSocio = async (socio) => {

        const nombre =
            obtenerNombreCompleto(socio);

        const confirmar =
            window.confirm(
                `¿Deseas desactivar al socio ${nombre}?`
            );

        if (!confirmar) {
            return;
        }

        try {

            await socioService.eliminar(
                socio.idSocio
            );

            mostrarMensaje(
                "Socio desactivado correctamente."
            );

            await cargarSocios("activos");

        } catch (error) {

            console.error(
                "Error al desactivar socio:",
                error
            );

            setError(
                error.response?.data?.mensaje ||
                "No fue posible desactivar el socio."
            );
        }
    };


    // ========================================
    // REACTIVAR
    // ========================================

    const reactivarSocio = async (socio) => {

        const nombre =
            obtenerNombreCompleto(socio);

        const confirmar =
            window.confirm(
                `¿Deseas reactivar al socio ${nombre}?`
            );

        if (!confirmar) {
            return;
        }

        try {

            await socioService.reactivar(
                socio.idSocio
            );

            mostrarMensaje(
                "Socio reactivado correctamente."
            );

            await cargarSocios("inactivos");

        } catch (error) {

            console.error(
                "Error al reactivar socio:",
                error
            );

            setError(
                error.response?.data?.mensaje ||
                "No fue posible reactivar el socio."
            );
        }
    };


    // ========================================
    // RENDER
    // ========================================

    return (

        <div className="socios-page">

            {/* CABECERA */}

            <div className="socios-header">

                <div>

                    <h1>
                        Directorio de Socios
                    </h1>

                    <p>
                        Consulta y administra los socios
                        registrados en CrediControl.
                    </p>

                </div>


                <button
                    type="button"
                    className="btn-register-member"
                    onClick={abrirNuevoSocio}
                >
                    <i className="bi bi-person-plus"></i>

                    <span>
                        Registrar Socio
                    </span>
                </button>

            </div>


            {/* MENSAJE */}

            {mensajeExito && (

                <div
                    className="alert alert-success d-flex align-items-center"
                    role="alert"
                >
                    <i className="bi bi-check-circle-fill me-2"></i>

                    {mensajeExito}
                </div>

            )}


            {error && (

                <div
                    className="alert alert-danger d-flex align-items-center"
                    role="alert"
                >

                    <i className="bi bi-exclamation-triangle me-2"></i>

                    <span className="flex-grow-1">
                        {error}
                    </span>

                    <button
                        type="button"
                        className="btn-close"
                        onClick={() =>
                            setError("")
                        }
                    >
                    </button>

                </div>

            )}


            {/* TOOLBAR */}

            <div className="socios-toolbar">

                <div className="socios-search">

                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        value={busqueda}
                        onChange={(event) =>
                            setBusqueda(
                                event.target.value
                            )
                        }
                        placeholder="Buscar por código, DPI, nombre o teléfono..."
                    />

                </div>


                <div className="socios-summary">

                    <button
                        type="button"
                        className={
                            filtroEstado === "activos"
                                ? "summary-item active"
                                : "summary-item"
                        }
                        onClick={() =>
                            setFiltroEstado(
                                "activos"
                            )
                        }
                    >

                        <span className="status-dot status-active">
                        </span>

                        <span>
                            Activos
                        </span>

                    </button>


                    <button
                        type="button"
                        className={
                            filtroEstado === "inactivos"
                                ? "summary-item active"
                                : "summary-item"
                        }
                        onClick={() =>
                            setFiltroEstado(
                                "inactivos"
                            )
                        }
                    >

                        <span className="status-dot status-inactive">
                        </span>

                        <span>
                            Inactivos
                        </span>

                    </button>

                </div>

            </div>


            <div className="socios-count">

                {sociosFiltrados.length}

                {" "}

                {sociosFiltrados.length === 1
                    ? "socio encontrado"
                    : "socios encontrados"
                }

            </div>


            {/* TABLA */}

            <div className="socios-table-card">

                {cargando ? (

                    <div className="socios-loading">

                        <div
                            className="spinner-border"
                            role="status"
                        >
                            <span className="visually-hidden">
                                Cargando...
                            </span>
                        </div>

                        <span>
                            Cargando socios...
                        </span>

                    </div>

                ) : (

                    <div className="table-responsive">

                        <table className="socios-table">

                            <thead>

                                <tr>
                                    <th>SOCIO</th>
                                    <th>DOCUMENTO</th>
                                    <th>TELÉFONO</th>
                                    <th>DIRECCIÓN</th>
                                    <th>ESTADO</th>
                                    <th>REGISTRO</th>
                                    <th>ACCIONES</th>
                                </tr>

                            </thead>


                            <tbody>

                                {sociosFiltrados.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            className="empty-table"
                                        >

                                            <i className="bi bi-people"></i>

                                            <strong>
                                                No se encontraron socios
                                            </strong>

                                            <span>
                                                No existen registros
                                                para mostrar.
                                            </span>

                                        </td>

                                    </tr>

                                ) : (

                                    sociosFiltrados.map(
                                        (socio) => (

                                            <tr
                                                key={
                                                    `${socio.idPais}-${socio.idSocio}`
                                                }
                                            >

                                                {/* SOCIO */}

                                                <td>

                                                    <div className="member-info">

                                                        <div
                                                            className={
                                                                filtroEstado === "activos"
                                                                    ? "member-status"
                                                                    : "member-status inactive"
                                                            }
                                                        >
                                                        </div>


                                                        <div className="member-avatar">

                                                            {socio.primerNombre
                                                                ?.charAt(0)
                                                                .toUpperCase()
                                                            }

                                                            {socio.primerApellido
                                                                ?.charAt(0)
                                                                .toUpperCase()
                                                            }

                                                        </div>


                                                        <div>

                                                            <div className="member-name">

                                                                {
                                                                    obtenerNombreCompleto(
                                                                        socio
                                                                    )
                                                                }

                                                            </div>

                                                            <div className="member-code">

                                                                Socio #

                                                                {
                                                                    socio.idSocio
                                                                }

                                                            </div>

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* DOCUMENTO */}

                                                <td>

                                                    <span className="table-mono">

                                                        {
                                                            socio.noDocumento
                                                        }

                                                    </span>

                                                </td>


                                                {/* TELÉFONO */}

                                                <td>

                                                    {
                                                        socio.telefono ||
                                                        "Sin teléfono"
                                                    }

                                                </td>


                                                {/* DIRECCIÓN */}

                                                <td>

                                                    <span
                                                        className="member-address"
                                                        title={
                                                            socio.direccion ||
                                                            ""
                                                        }
                                                    >

                                                        {
                                                            socio.direccion ||
                                                            "Sin dirección"
                                                        }

                                                    </span>

                                                </td>


                                                {/* ESTADO */}

                                                <td>

                                                    {filtroEstado === "activos" ? (

                                                        <span className="member-badge active">

                                                            <span></span>

                                                            Activo

                                                        </span>

                                                    ) : (

                                                        <span className="member-badge inactive">

                                                            <span></span>

                                                            Inactivo

                                                        </span>

                                                    )}

                                                </td>


                                                {/* REGISTRO */}

                                                <td>

                                                    {
                                                        socio.fecha
                                                            ? new Date(
                                                                socio.fecha
                                                            )
                                                                .toLocaleDateString(
                                                                    "es-GT"
                                                                )
                                                            : "-"
                                                    }

                                                </td>


                                                {/* ACCIONES */}

                                                <td>

                                                    <div className="table-actions">

                                                        <button
                                                            type="button"
                                                            className="action-button view"
                                                            title="Ver socio"
                                                            onClick={() =>
                                                                setSocioDetalle(
                                                                    socio
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </button>


                                                        {filtroEstado === "activos" && (

                                                            <button
                                                                type="button"
                                                                className="action-button edit"
                                                                title="Editar socio"
                                                                onClick={() =>
                                                                    abrirEditarSocio(
                                                                        socio
                                                                    )
                                                                }
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>

                                                        )}


                                                        {filtroEstado === "activos" ? (

                                                            <button
                                                                type="button"
                                                                className="action-button delete"
                                                                title="Desactivar socio"
                                                                onClick={() =>
                                                                    desactivarSocio(
                                                                        socio
                                                                    )
                                                                }
                                                            >
                                                                <i className="bi bi-person-x"></i>
                                                            </button>

                                                        ) : (

                                                            <button
                                                                type="button"
                                                                className="action-button reactivate"
                                                                title="Reactivar socio"
                                                                onClick={() =>
                                                                    reactivarSocio(
                                                                        socio
                                                                    )
                                                                }
                                                            >
                                                                <i className="bi bi-person-check"></i>
                                                            </button>

                                                        )}

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                )}


                {!cargando && (

                    <div className="table-footer">

                        <span>

                            Mostrando{" "}

                            <strong>
                                {sociosFiltrados.length}
                            </strong>

                            {" "}de{" "}

                            <strong>
                                {socios.length}
                            </strong>

                            {" "}socios

                        </span>

                    </div>

                )}

            </div>


            {/* MODAL CREAR / EDITAR */}

            <SocioModal
                mostrar={mostrarModal}
                socioEditar={socioEditar}
                onCerrar={() => {

                    setMostrarModal(false);
                    setSocioEditar(null);

                }}
                onGuardado={socioGuardado}
            />


            {/* DETALLE */}

            <SocioDetalleModal
                socio={socioDetalle}
                onCerrar={() =>
                    setSocioDetalle(null)
                }
            />

        </div>
    );
}

export default Socios;