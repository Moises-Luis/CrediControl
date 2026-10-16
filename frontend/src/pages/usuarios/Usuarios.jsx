
import { useEffect, useState } from "react";

import usuarioService from "../../services/usuarioService";
import PerfilesPermisos from "./PerfilesPermisos";
import { useAuth } from "../../context/AuthContext";

// ==========================================
// FORMULARIO INICIAL
// ==========================================

const formularioInicial = {
    nombre: "",
    usuario: "",
    idPerfil: "",
    password: "",
    confirmarPassword: ""
};

const obtenerError = (error) =>
    error?.response?.data?.mensaje ||
    error?.message ||
    "Ocurrió un error inesperado.";

function Usuarios() {

    const { tienePermiso } = useAuth();

    const puedeAdministrar =
        tienePermiso("usuarios.administrar");

    const puedeAdministrarPerfiles =
        tienePermiso("perfiles.administrar");

    // ==========================================
    // ESTADOS
    // ==========================================

    const [mostrarPerfiles, setMostrarPerfiles] =
        useState(false);

    const [usuarios, setUsuarios] = useState([]);
    const [perfiles, setPerfiles] = useState([]);

    const [buscar, setBuscar] = useState("");

    const [cargando, setCargando] = useState(false);
    const [cargandoPerfiles, setCargandoPerfiles] =
        useState(false);

    const [guardando, setGuardando] = useState(false);

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const [mostrarModal, setMostrarModal] =
        useState(false);

    const [modo, setModo] = useState("crear");

    const [usuarioSeleccionado, setUsuarioSeleccionado] =
        useState(null);

    const [formulario, setFormulario] =
        useState(formularioInicial);

    const [errorModal, setErrorModal] = useState("");

    // ==========================================
    // NOMBRE REAL DEL PERFIL
    // ==========================================

    const obtenerDescripcionPerfil = (idPerfil) => {
    const perfil = perfiles.find(
        (p) => Number(p.idPerfil) === Number(idPerfil)
    );

    return perfil?.descripcion?.trim() ||
        "Descripción no disponible";
};

    // ==========================================
    // CARGAR USUARIOS
    // ==========================================

    const cargarUsuarios = async (termino = "") => {
        setCargando(true);
        setError("");

        try {
            const respuesta =
                await usuarioService.listar(termino);

            if (!respuesta.exito) {
                throw new Error(
                    respuesta.mensaje ||
                    "No se pudieron cargar los usuarios."
                );
            }

            setUsuarios(
                Array.isArray(respuesta.datos)
                    ? respuesta.datos
                    : []
            );

        } catch (err) {
            setError(obtenerError(err));

        } finally {
            setCargando(false);
        }
    };

    // ==========================================
    // CARGAR PERFILES DESDE MYSQL
    // ==========================================

    const cargarPerfiles = async () => {
        setCargandoPerfiles(true);

        try {
            const respuesta =
                await usuarioService.obtenerPerfiles();

            if (!respuesta.exito) {
                throw new Error(
                    respuesta.mensaje ||
                    "No se pudieron cargar los perfiles."
                );
            }

            const lista = Array.isArray(respuesta.datos)
                ? respuesta.datos
                : [];

            setPerfiles(lista);

            if (
                lista.some(
                    (p) =>
                        !p.descripcion ||
                        !String(p.descripcion).trim()
                )
            ) {
                setError(
                    "El servicio de perfiles no devuelve " +
                    "la descripción de algunos perfiles. " +
                    "Revisa la consulta SQL del backend."
                );
            }

        } catch (err) {
            setError(obtenerError(err));

        } finally {
            setCargandoPerfiles(false);
        }
    };

    // ==========================================
    // CARGA INICIAL
    // ==========================================

    useEffect(() => {
        cargarUsuarios();
        cargarPerfiles();
    }, []);

    // ==========================================
    // ABRIR NUEVO USUARIO
    // ==========================================

    const abrirNuevo = () => {
        if (!puedeAdministrar) return;

        setModo("crear");
        setUsuarioSeleccionado(null);
        setErrorModal("");

        // Seleccionamos el primer perfil activo.
        const primerPerfilActivo = perfiles.find(
            (p) => Number(p.activo) === 1
        );

        setFormulario({
            ...formularioInicial,
            idPerfil: primerPerfilActivo
                ? String(primerPerfilActivo.idPerfil)
                : ""
        });

        setMostrarModal(true);
    };

    // ==========================================
    // ABRIR EDICIÓN
    // ==========================================

    const abrirEditar = (usuario) => {
        if (!puedeAdministrar) return;

        setModo("editar");
        setUsuarioSeleccionado(usuario);
        setErrorModal("");

        setFormulario({
            nombre: usuario.nombre || "",
            usuario: usuario.usuario || "",
            idPerfil: String(usuario.idPerfil),
            password: "",
            confirmarPassword: ""
        });

        setMostrarModal(true);
    };

    // ==========================================
    // CAMBIAR CONTRASEÑA
    // ==========================================

    const abrirPassword = (usuario) => {
        if (!puedeAdministrar) return;

        setModo("password");
        setUsuarioSeleccionado(usuario);
        setErrorModal("");

        setFormulario({
            ...formularioInicial
        });

        setMostrarModal(true);
    };

    // ==========================================
    // CERRAR MODAL
    // ==========================================

    const cerrarModal = () => {
        if (guardando) return;

        setMostrarModal(false);
        setUsuarioSeleccionado(null);
        setFormulario(formularioInicial);
        setErrorModal("");
    };

    // ==========================================
    // ACTUALIZAR CAMPOS
    // ==========================================

    const actualizarCampo = (evento) => {
        const { name, value } = evento.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    // ==========================================
    // GUARDAR USUARIO
    // ==========================================

    const guardar = async (evento) => {
        evento.preventDefault();

        if (!puedeAdministrar) {
            setErrorModal(
                "No tienes permisos para administrar usuarios."
            );
            return;
        }

        setErrorModal("");

        if (
            modo === "crear" ||
            modo === "password"
        ) {
            if (formulario.password.length < 8) {
                setErrorModal(
                    "La contraseña debe tener al menos 8 caracteres."
                );
                return;
            }

            if (
                formulario.password !==
                formulario.confirmarPassword
            ) {
                setErrorModal(
                    "Las contraseñas no coinciden."
                );
                return;
            }
        }

        if (modo !== "password") {
            if (!formulario.nombre.trim()) {
                setErrorModal(
                    "El nombre es obligatorio."
                );
                return;
            }

            if (!formulario.usuario.trim()) {
                setErrorModal(
                    "El usuario es obligatorio."
                );
                return;
            }

            if (!formulario.idPerfil) {
                setErrorModal(
                    "Selecciona un perfil."
                );
                return;
            }

            const perfilSeleccionado = perfiles.find(
                (p) =>
                    Number(p.idPerfil) ===
                    Number(formulario.idPerfil)
            );

            if (!perfilSeleccionado) {
                setErrorModal(
                    "El perfil seleccionado no existe."
                );
                return;
            }

            if (Number(perfilSeleccionado.activo) !== 1) {
                setErrorModal(
                    "No puedes asignar un perfil inactivo."
                );
                return;
            }
        }

        setGuardando(true);
        setMensaje("");

        try {
            let respuesta;

            if (modo === "crear") {

                respuesta =
                    await usuarioService.crear({
                        nombre: formulario.nombre.trim(),
                        usuario: formulario.usuario.trim(),
                        idPerfil: Number(
                            formulario.idPerfil
                        ),
                        password: formulario.password
                    });

            } else if (modo === "editar") {

                respuesta =
                    await usuarioService.actualizar(
                        usuarioSeleccionado.idUsuario,
                        {
                            nombre:
                                formulario.nombre.trim(),
                            usuario:
                                formulario.usuario.trim(),
                            idPerfil: Number(
                                formulario.idPerfil
                            )
                        }
                    );

            } else {

                respuesta =
                    await usuarioService.cambiarPassword(
                        usuarioSeleccionado.idUsuario,
                        formulario.password
                    );
            }

            if (!respuesta.exito) {
                throw new Error(
                    respuesta.mensaje ||
                    "No fue posible guardar."
                );
            }

            setMensaje(
                respuesta.mensaje ||
                "Operación realizada correctamente."
            );

            setMostrarModal(false);
            setUsuarioSeleccionado(null);
            setFormulario(formularioInicial);

            await cargarUsuarios(buscar);

        } catch (err) {
            setErrorModal(obtenerError(err));

        } finally {
            setGuardando(false);
        }
    };

    // ==========================================
    // ACTIVAR / DESACTIVAR USUARIO
    // ==========================================

    const cambiarEstado = async (usuario) => {
        if (!puedeAdministrar) return;

        const nuevoEstado =
            Number(usuario.estado) === 1 ? 0 : 1;

        const accion =
            nuevoEstado === 1
                ? "activar"
                : "desactivar";

        if (
            !window.confirm(
                `¿Deseas ${accion} al usuario "${usuario.usuario}"?`
            )
        ) {
            return;
        }

        setError("");
        setMensaje("");

        try {
            const respuesta =
                await usuarioService.cambiarEstado(
                    usuario.idUsuario,
                    nuevoEstado
                );

            if (!respuesta.exito) {
                throw new Error(
                    respuesta.mensaje ||
                    "No se pudo actualizar el estado."
                );
            }

            setMensaje(respuesta.mensaje);

            await cargarUsuarios(buscar);

        } catch (err) {
            setError(obtenerError(err));
        }
    };

    // ==========================================
    // ESTADÍSTICAS
    // ==========================================

    const usuariosActivos = usuarios.filter(
        (u) => Number(u.estado) === 1
    ).length;

    const usuariosInactivos =
        usuarios.length - usuariosActivos;

    // ==========================================
    // PANTALLA PERFILES Y PERMISOS
    // ==========================================

    if (mostrarPerfiles) {
        return (
            <PerfilesPermisos
                onVolver={() => {
                    setMostrarPerfiles(false);
                    cargarPerfiles();
                    cargarUsuarios(buscar);
                }}
            />
        );
    }

    // ==========================================
    // RENDERIZADO PRINCIPAL
    // ==========================================

    return (
        <div className="container-fluid py-4">

            {/* =====================================
                ENCABEZADO
            ===================================== */}

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

                <div>
                    <h3 className="fw-bold mb-1">
                        <i className="bi bi-person-gear me-2 text-primary" />
                        Usuarios
                    </h3>

                    <p className="text-muted mb-0">
                        Administración de usuarios del sistema.
                    </p>
                </div>

                <div className="d-flex flex-wrap gap-2">

                    {puedeAdministrarPerfiles && (
                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() =>
                                setMostrarPerfiles(true)
                            }
                        >
                            <i className="bi bi-shield-lock me-2" />
                            Perfiles y Permisos
                        </button>
                    )}

                    {puedeAdministrar && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={abrirNuevo}
                            disabled={cargandoPerfiles}
                        >
                            <i className="bi bi-person-plus me-2" />
                            Nuevo Usuario
                        </button>
                    )}

                </div>
            </div>

            {/* =====================================
                INDICADORES
            ===================================== */}

            <div className="row g-3 mb-4">

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <small className="text-muted">
                                Total de usuarios
                            </small>

                            <h3 className="fw-bold mt-2">
                                {usuarios.length}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <small className="text-muted">
                                Usuarios activos
                            </small>

                            <h3 className="fw-bold text-success mt-2">
                                {usuariosActivos}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <small className="text-muted">
                                Usuarios inactivos
                            </small>

                            <h3 className="fw-bold text-danger mt-2">
                                {usuariosInactivos}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* =====================================
                MENSAJES
            ===================================== */}

            {mensaje && (
                <div
                    className="alert alert-success alert-dismissible fade show"
                    role="alert"
                >
                    {mensaje}

                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Cerrar"
                        onClick={() => setMensaje("")}
                    />
                </div>
            )}

            {error && (
                <div
                    className="alert alert-danger"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {/* =====================================
                LISTADO DE USUARIOS
            ===================================== */}

            <div className="card border-0 shadow-sm">

                <div className="card-header bg-white p-3">

                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">

                        <h5 className="fw-semibold mb-0">
                            Listado de Usuarios
                        </h5>

                        <form
                            className="d-flex gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                cargarUsuarios(buscar);
                            }}
                        >
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Buscar usuario..."
                                value={buscar}
                                onChange={(e) =>
                                    setBuscar(e.target.value)
                                }
                            />

                            <button
                                type="submit"
                                className="btn btn-outline-primary"
                                disabled={cargando}
                            >
                                <i className="bi bi-search" />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="card-body">

                    {cargando || cargandoPerfiles ? (

                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" />
                            <p className="text-muted mt-2">
                                Cargando usuarios...
                            </p>
                        </div>

                    ) : (

                        <div className="table-responsive">

                            <table className="table table-striped table-hover align-middle">

                                <thead className="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Usuario</th>
                                        <th>Perfil</th>
                                        <th>Estado</th>
                                        <th>Fecha</th>

                                        {puedeAdministrar && (
                                            <th className="text-center">
                                                Acciones
                                            </th>
                                        )}
                                    </tr>
                                </thead>

                                <tbody>

                                    {usuarios.map((usuario) => (

                                        <tr
                                            key={`${usuario.idPais}-${usuario.idUsuario}`}
                                        >
                                            <td>
                                                {usuario.idUsuario}
                                            </td>

                                            <td className="fw-semibold">
                                                {usuario.nombre}
                                            </td>

                                            <td>
                                                {usuario.usuario}
                                            </td>

                                            {/* DESCRIPCIÓN REAL DEL PERFIL */}
                                            <td>
                                                <td>
    {usuario.descripcionPerfil ||
        obtenerDescripcionPerfil(usuario.idPerfil)}
</td>
                                            </td>

                                            <td>
                                                <span
                                                    className={`badge ${
                                                        Number(usuario.estado) === 1
                                                            ? "bg-success"
                                                            : "bg-secondary"
                                                    }`}
                                                >
                                                    {Number(usuario.estado) === 1
                                                        ? "Activo"
                                                        : "Inactivo"}
                                                </span>
                                            </td>

                                            <td>
                                                {usuario.fecha}
                                            </td>

                                            {puedeAdministrar && (
                                                <td>
                                                    <div className="d-flex justify-content-center gap-2">

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary"
                                                            title="Editar usuario"
                                                            onClick={() =>
                                                                abrirEditar(
                                                                    usuario
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-pencil" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            title="Cambiar contraseña"
                                                            onClick={() =>
                                                                abrirPassword(
                                                                    usuario
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-key" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm ${
                                                                Number(usuario.estado) === 1
                                                                    ? "btn-outline-danger"
                                                                    : "btn-outline-success"
                                                            }`}
                                                            title={
                                                                Number(usuario.estado) === 1
                                                                    ? "Desactivar"
                                                                    : "Activar"
                                                            }
                                                            onClick={() =>
                                                                cambiarEstado(
                                                                    usuario
                                                                )
                                                            }
                                                        >
                                                            <i
                                                                className={`bi ${
                                                                    Number(usuario.estado) === 1
                                                                        ? "bi-person-x"
                                                                        : "bi-person-check"
                                                                }`}
                                                            />
                                                        </button>

                                                    </div>
                                                </td>
                                            )}

                                        </tr>
                                    ))}

                                    {usuarios.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={
                                                    puedeAdministrar ? 7 : 6
                                                }
                                                className="text-center text-muted py-4"
                                            >
                                                No se encontraron usuarios.
                                            </td>
                                        </tr>
                                    )}

                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* =====================================
                MODAL CREAR / EDITAR / CONTRASEÑA
            ===================================== */}

            {mostrarModal && puedeAdministrar && (
                <>
                    <div
                        className="modal fade show d-block"
                        role="dialog"
                        aria-modal="true"
                        tabIndex="-1"
                    >
                        <div className="modal-dialog modal-dialog-centered">

                            <div className="modal-content">

                                <form onSubmit={guardar}>

                                    <div className="modal-header">

                                        <h5 className="modal-title fw-bold">
                                            {modo === "crear"
                                                ? "Nuevo Usuario"
                                                : modo === "editar"
                                                    ? "Editar Usuario"
                                                    : "Cambiar Contraseña"}
                                        </h5>

                                        <button
                                            type="button"
                                            className="btn-close"
                                            aria-label="Cerrar"
                                            onClick={cerrarModal}
                                            disabled={guardando}
                                        />
                                    </div>

                                    <div className="modal-body">

                                        {errorModal && (
                                            <div className="alert alert-danger">
                                                {errorModal}
                                            </div>
                                        )}

                                        {modo !== "password" && (
                                            <>

                                                {/* NOMBRE COMPLETO */}
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">
                                                        Nombre completo
                                                    </label>

                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="nombre"
                                                        maxLength={250}
                                                        required
                                                        autoComplete="off"
                                                        value={formulario.nombre}
                                                        onChange={actualizarCampo}
                                                    />
                                                </div>

                                                {/* USUARIO */}
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">
                                                        Usuario
                                                    </label>

                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="usuario"
                                                        maxLength={50}
                                                        required
                                                        autoComplete="off"
                                                        spellCheck={false}
                                                        value={formulario.usuario}
                                                        onChange={actualizarCampo}
                                                    />
                                                </div>

                                                {/* PERFIL */}
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">
                                                        Perfil
                                                    </label>

                                                    <select
                                                        className="form-select"
                                                        name="idPerfil"
                                                        value={formulario.idPerfil}
                                                        onChange={actualizarCampo}
                                                        required
                                                    >
                                                        <option value="">
                                                            Seleccione...
                                                        </option>

                                                        {perfiles
                                                            .filter(
                                                                (perfil) =>
                                                                    Number(perfil.activo) === 1 ||
                                                                    (
                                                                        modo === "editar" &&
                                                                        Number(perfil.idPerfil) ===
                                                                        Number(formulario.idPerfil)
                                                                    )
                                                            )
                                                            .map((perfil) => (
                                                                <option
    key={perfil.idPerfil}
    value={perfil.idPerfil}
>
    {perfil.descripcion}
</option>
                                                            ))}
                                                    </select>
                                                </div>

                                            </>
                                        )}

                                        {/* USUARIO AL CAMBIAR CONTRASEÑA */}
                                        {modo === "password" && (
                                            <p className="text-muted">
                                                Usuario:{" "}
                                                <strong>
                                                    {usuarioSeleccionado?.usuario}
                                                </strong>
                                            </p>
                                        )}

                                        {/* CONTRASEÑA */}
                                        {modo !== "editar" && (
                                            <>
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">
                                                        Contraseña
                                                    </label>

                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        name="password"
                                                        minLength={8}
                                                        autoComplete="new-password"
                                                        required
                                                        value={formulario.password}
                                                        onChange={actualizarCampo}
                                                    />
                                                </div>

                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">
                                                        Confirmar contraseña
                                                    </label>

                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        name="confirmarPassword"
                                                        minLength={8}
                                                        autoComplete="new-password"
                                                        required
                                                        value={
                                                            formulario.confirmarPassword
                                                        }
                                                        onChange={actualizarCampo}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="modal-footer">

                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={cerrarModal}
                                            disabled={guardando}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={
                                                guardando ||
                                                cargandoPerfiles
                                            }
                                        >
                                            {guardando
                                                ? "Guardando..."
                                                : "Guardar"}
                                        </button>

                                    </div>
                                </form>

                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show" />
                </>
            )}
        </div>
    );
}

export default Usuarios;
