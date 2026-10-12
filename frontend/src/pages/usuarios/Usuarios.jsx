
import { useEffect, useState } from "react";
import usuarioService from "../../services/usuarioService";

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

    const [usuarios, setUsuarios] = useState([]);
    const [perfiles, setPerfiles] = useState([]);

    const [buscar, setBuscar] = useState("");
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const [mostrarModal, setMostrarModal] = useState(false);
    const [modo, setModo] = useState("crear");
    const [usuarioSeleccionado, setUsuarioSeleccionado] =
        useState(null);

    const [formulario, setFormulario] = useState(
        formularioInicial
    );

    const [errorModal, setErrorModal] = useState("");

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

    const cargarPerfiles = async () => {
        try {
            const respuesta =
                await usuarioService.obtenerPerfiles();

            if (respuesta.exito) {
                setPerfiles(
                    Array.isArray(respuesta.datos)
                        ? respuesta.datos
                        : []
                );
            }
        } catch (err) {
            setError(obtenerError(err));
        }
    };

    useEffect(() => {
        cargarUsuarios();
        cargarPerfiles();
    }, []);

    // ==========================================
    // MODALES
    // ==========================================

    const abrirNuevo = () => {
        setModo("crear");
        setUsuarioSeleccionado(null);
        setErrorModal("");

        setFormulario({
            ...formularioInicial,
            idPerfil: perfiles[0]?.idPerfil
                ? String(perfiles[0].idPerfil)
                : ""
        });

        setMostrarModal(true);
    };

    const abrirEditar = (usuario) => {
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

    const abrirPassword = (usuario) => {
        setModo("password");
        setUsuarioSeleccionado(usuario);
        setErrorModal("");

        setFormulario({
            ...formularioInicial
        });

        setMostrarModal(true);
    };

    const cerrarModal = () => {
        if (guardando) return;

        setMostrarModal(false);
        setUsuarioSeleccionado(null);
        setFormulario(formularioInicial);
        setErrorModal("");
    };

    const actualizarCampo = (evento) => {
        const { name, value } = evento.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    // ==========================================
    // GUARDAR
    // ==========================================

    const guardar = async (evento) => {
        evento.preventDefault();
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

        if (
            modo !== "password" &&
            !formulario.idPerfil
        ) {
            setErrorModal(
                "Selecciona un perfil."
            );
            return;
        }

        setGuardando(true);

        try {
            let respuesta;

            if (modo === "crear") {
                respuesta = await usuarioService.crear({
                    nombre: formulario.nombre.trim(),
                    usuario: formulario.usuario.trim(),
                    idPerfil: Number(formulario.idPerfil),
                    password: formulario.password
                });

            } else if (modo === "editar") {
                respuesta = await usuarioService.actualizar(
                    usuarioSeleccionado.idUsuario,
                    {
                        nombre: formulario.nombre.trim(),
                        usuario: formulario.usuario.trim(),
                        idPerfil: Number(formulario.idPerfil)
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
    // ACTIVAR / DESACTIVAR
    // ==========================================

    const cambiarEstado = async (usuario) => {
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

    const usuariosActivos = usuarios.filter(
        (u) => Number(u.estado) === 1
    ).length;

    return (
        <div className="container-fluid py-4">

            {/* ENCABEZADO */}

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h3 className="fw-bold mb-1">
                        <i className="bi bi-person-gear me-2 text-primary"></i>
                        Usuarios
                    </h3>

                    <p className="text-muted mb-0">
                        Administración de usuarios del sistema.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={abrirNuevo}
                >
                    <i className="bi bi-person-plus me-2"></i>
                    Nuevo Usuario
                </button>
            </div>

            {/* INDICADORES */}

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
                                {usuarios.length - usuariosActivos}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* MENSAJES */}

            {mensaje && (
                <div
                    className="alert alert-success alert-dismissible fade show"
                    role="alert"
                >
                    {mensaje}

                    <button
                        type="button"
                        className="btn-close"
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

            {/* LISTADO */}

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
                            >
                                <i className="bi bi-search"></i>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="card-body">
                    {cargando ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary"></div>
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
                                        <th className="text-center">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {usuarios.map((usuario) => (
                                        <tr key={`${usuario.idPais}-${usuario.idUsuario}`}>
                                            <td>
                                                {usuario.idUsuario}
                                            </td>

                                            <td className="fw-semibold">
                                                {usuario.nombre}
                                            </td>

                                            <td>
                                                {usuario.usuario}
                                            </td>

                                            <td>
                                                Perfil {usuario.idPerfil}
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

                                            <td>
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary"
                                                        title="Editar"
                                                        onClick={() =>
                                                            abrirEditar(usuario)
                                                        }
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        title="Cambiar contraseña"
                                                        onClick={() =>
                                                            abrirPassword(usuario)
                                                        }
                                                    >
                                                        <i className="bi bi-key"></i>
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
                                                            cambiarEstado(usuario)
                                                        }
                                                    >
                                                        <i
                                                            className={`bi ${
                                                                Number(usuario.estado) === 1
                                                                    ? "bi-person-x"
                                                                    : "bi-person-check"
                                                            }`}
                                                        ></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {usuarios.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="7"
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

            {/* MODAL */}

            {mostrarModal && (
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
                                            onClick={cerrarModal}
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
                                                        value={formulario.nombre}
                                                        onChange={actualizarCampo}
                                                    />
                                                </div>

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
                                                        value={formulario.usuario}
                                                        onChange={actualizarCampo}
                                                    />
                                                </div>

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

                                                        {perfiles.map((perfil) => (
                                                            <option
                                                                key={perfil.idPerfil}
                                                                value={perfil.idPerfil}
                                                            >
                                                                Perfil {perfil.idPerfil}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </>
                                        )}

                                        {modo === "password" && (
                                            <p className="text-muted">
                                                Usuario: <strong>
                                                    {usuarioSeleccionado?.usuario}
                                                </strong>
                                            </p>
                                        )}

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
                                                        value={formulario.confirmarPassword}
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
                                            disabled={guardando}
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

                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </div>
    );
}

export default Usuarios;
