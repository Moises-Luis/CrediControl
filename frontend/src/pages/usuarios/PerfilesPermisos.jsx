
import { useEffect, useState } from "react";

import perfilPermisoService from
    "../../services/perfilPermisoService";

import { useAuth } from "../../context/AuthContext";

const esencialesAdmin = [
    "perfiles.administrar",
    "usuarios.administrar",
    "usuarios.ver"
];

const obtenerError = (error) =>
    error?.response?.data?.mensaje ||
    error?.message ||
    "Ocurrió un error inesperado.";

function PerfilesPermisos({ onVolver }) {
    const { tienePermiso } = useAuth();

    const [perfiles, setPerfiles] = useState([]);
    const [catalogo, setCatalogo] = useState([]);
    const [idPerfil, setIdPerfil] = useState("");
    const [asignados, setAsignados] = useState([]);

    const [nuevoId, setNuevoId] = useState("");
    const [nuevaDescripcion, setNuevaDescripcion] =
        useState("");

    const [cargando, setCargando] = useState(true);
    const [cargandoPermisos, setCargandoPermisos] =
        useState(false);
    const [guardando, setGuardando] = useState(false);

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const autorizado =
        tienePermiso("perfiles.administrar");

    const cargarInicial = async () => {
        setCargando(true);
        setError("");

        try {
            const [respuestaPerfiles, respuestaCatalogo] =
                await Promise.all([
                    perfilPermisoService.listar(),
                    perfilPermisoService.catalogoPermisos()
                ]);

            const lista = respuestaPerfiles.datos || [];
            const permisos = respuestaCatalogo.datos || [];

            setPerfiles(lista);
            setCatalogo(permisos);

            if (lista.length > 0) {
                setIdPerfil(String(lista[0].idPerfil));
            }

        } catch (err) {
            setError(obtenerError(err));

        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (autorizado) {
            cargarInicial();
        }
    }, [autorizado]);

    useEffect(() => {
        let vigente = true;

        async function cargarAsignaciones() {
            if (!idPerfil) {
                setAsignados([]);
                return;
            }

            setCargandoPermisos(true);
            setError("");

            try {
                const respuesta =
                    await perfilPermisoService.obtenerPermisos(
                        idPerfil
                    );

                if (vigente) {
                    setAsignados(respuesta.datos || []);
                }

            } catch (err) {
                if (vigente) {
                    setError(obtenerError(err));
                    setAsignados([]);
                }

            } finally {
                if (vigente) {
                    setCargandoPermisos(false);
                }
            }
        }

        cargarAsignaciones();

        return () => {
            vigente = false;
        };
    }, [idPerfil]);

    const perfilActual = perfiles.find(
        (p) => String(p.idPerfil) === idPerfil
    );

    const grupos = catalogo.reduce((resultado, permiso) => {
        if (!resultado[permiso.modulo]) {
            resultado[permiso.modulo] = [];
        }

        resultado[permiso.modulo].push(permiso);

        return resultado;
    }, {});

    const marcarPermiso = (codigo) => {
        if (
            Number(idPerfil) === 1 &&
            esencialesAdmin.includes(codigo)
        ) {
            return;
        }

        setAsignados((anteriores) =>
            anteriores.includes(codigo)
                ? anteriores.filter((p) => p !== codigo)
                : [...anteriores, codigo]
        );
    };

    const marcarModulo = (permisosModulo, marcar) => {
        const codigos = permisosModulo.map((p) => p.codigo);

        setAsignados((anteriores) => {
            if (marcar) {
                return [
                    ...new Set([
                        ...anteriores,
                        ...codigos
                    ])
                ];
            }

            const protegidos =
                Number(idPerfil) === 1
                    ? esencialesAdmin
                    : [];

            return anteriores.filter(
                (codigo) =>
                    !codigos.includes(codigo) ||
                    protegidos.includes(codigo)
            );
        });
    };

    const crearPerfil = async (evento) => {
        evento.preventDefault();

        setGuardando(true);
        setError("");
        setMensaje("");

        try {
            const respuesta =
                await perfilPermisoService.crear({
                    idPerfil: Number(nuevoId),
                    descripcion: nuevaDescripcion.trim()
                });

            const nuevosPerfiles =
                await perfilPermisoService.listar();

            setPerfiles(nuevosPerfiles.datos || []);
            setIdPerfil(String(respuesta.datos.idPerfil));

            setNuevoId("");
            setNuevaDescripcion("");

            setMensaje(
                "Perfil creado. Ahora puedes asignarle permisos."
            );

        } catch (err) {
            setError(obtenerError(err));

        } finally {
            setGuardando(false);
        }
    };

    const guardarPermisos = async () => {
        if (!idPerfil) return;

        setGuardando(true);
        setError("");
        setMensaje("");

        try {
            const respuesta =
                await perfilPermisoService.guardarPermisos(
                    idPerfil,
                    asignados
                );

            setAsignados(respuesta.datos.permisos);

            setMensaje(
                "Permisos actualizados correctamente. " +
                "Los usuarios deben actualizar su sesión " +
                "para reflejar los cambios en el menú."
            );

        } catch (err) {
            setError(obtenerError(err));

        } finally {
            setGuardando(false);
        }
    };

    const cambiarEstado = async () => {
        if (!perfilActual || Number(idPerfil) === 1) {
            return;
        }

        const nuevoEstado =
            Number(perfilActual.activo) === 1 ? 0 : 1;

        if (
            !window.confirm(
                `¿Deseas ${
                    nuevoEstado ? "activar" : "desactivar"
                } el perfil "${perfilActual.descripcion}"?`
            )
        ) {
            return;
        }

        setGuardando(true);
        setError("");
        setMensaje("");

        try {
            await perfilPermisoService.cambiarEstado(
                idPerfil,
                nuevoEstado
            );

            setPerfiles((anteriores) =>
                anteriores.map((perfil) =>
                    String(perfil.idPerfil) === idPerfil
                        ? {
                            ...perfil,
                            activo: nuevoEstado
                        }
                        : perfil
                )
            );

            setMensaje(
                "Estado del perfil actualizado correctamente."
            );

        } catch (err) {
            setError(obtenerError(err));

        } finally {
            setGuardando(false);
        }
    };

    if (!autorizado) {
        return (
            <div className="alert alert-danger">
                No tienes permisos para administrar perfiles.
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                    <h3 className="fw-bold mb-1">
                        <i className="bi bi-shield-lock me-2 text-primary" />
                        Perfiles y Permisos
                    </h3>

                    <p className="text-muted mb-0">
                        Configura los accesos de cada perfil.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onVolver}
                >
                    <i className="bi bi-arrow-left me-2" />
                    Volver a Usuarios
                </button>
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {mensaje && (
                <div className="alert alert-success">
                    {mensaje}
                </div>
            )}

            {cargando ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" />
                    <p className="mt-2">
                        Cargando perfiles...
                    </p>
                </div>
            ) : (
                <div className="row g-4">

                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-white">
                                <h5 className="mb-0">
                                    Seleccionar perfil
                                </h5>
                            </div>

                            <div className="card-body">
                                <label className="form-label">
                                    Perfil
                                </label>

                                <select
                                    className="form-select mb-3"
                                    value={idPerfil}
                                    onChange={(e) =>
                                        setIdPerfil(e.target.value)
                                    }
                                >
                                    {perfiles.map((perfil) => (
                                        <option
                                            key={perfil.idPerfil}
                                            value={perfil.idPerfil}
                                        >
                                            {perfil.idPerfil} - {perfil.descripcion}
                                        </option>
                                    ))}
                                </select>

                                {perfilActual && (
                                    <>
                                        <p className="mb-2">
                                            Estado:{" "}
                                            <span
                                                className={`badge ${
                                                    Number(perfilActual.activo) === 1
                                                        ? "bg-success"
                                                        : "bg-secondary"
                                                }`}
                                            >
                                                {Number(perfilActual.activo) === 1
                                                    ? "Activo"
                                                    : "Inactivo"}
                                            </span>
                                        </p>

                                        {Number(idPerfil) !== 1 && (
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${
                                                    Number(perfilActual.activo) === 1
                                                        ? "btn-outline-danger"
                                                        : "btn-outline-success"
                                                }`}
                                                disabled={guardando}
                                                onClick={cambiarEstado}
                                            >
                                                {Number(perfilActual.activo) === 1
                                                    ? "Desactivar perfil"
                                                    : "Activar perfil"}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white">
                                <h5 className="mb-0">
                                    Nuevo perfil
                                </h5>
                            </div>

                            <form
                                className="card-body"
                                onSubmit={crearPerfil}
                            >
                                <div className="mb-3">
                                    <label className="form-label">
                                        Identificador
                                    </label>

                                    <input
                                        type="number"
                                        className="form-control"
                                        min="2"
                                        max="255"
                                        required
                                        value={nuevoId}
                                        onChange={(e) =>
                                            setNuevoId(e.target.value)
                                        }
                                        placeholder="Ej. 5"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        Descripción
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        maxLength={200}
                                        required
                                        value={nuevaDescripcion}
                                        onChange={(e) =>
                                            setNuevaDescripcion(e.target.value)
                                        }
                                        placeholder="Ej. Auditor"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={guardando}
                                >
                                    <i className="bi bi-plus-circle me-2" />
                                    Crear perfil
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    Permisos asignados
                                </h5>

                                <span className="badge bg-primary">
                                    {asignados.length} seleccionados
                                </span>
                            </div>

                            <div className="card-body">

                                {cargandoPermisos ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" />
                                    </div>
                                ) : (
                                    Object.entries(grupos).map(
                                        ([modulo, permisosModulo]) => {
                                            const todosMarcados =
                                                permisosModulo.every(
                                                    (p) =>
                                                        asignados.includes(
                                                            p.codigo
                                                        )
                                                );

                                            return (
                                                <div
                                                    key={modulo}
                                                    className="mb-4"
                                                >
                                                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                                                        <h6 className="fw-bold mb-0">
                                                            {modulo}
                                                        </h6>

                                                        <label className="form-check-label small">
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input me-2"
                                                                checked={todosMarcados}
                                                                disabled={
                                                                    !idPerfil ||
                                                                    cargandoPermisos ||
                                                                    guardando
                                                                }
                                                                onChange={(e) =>
                                                                    marcarModulo(
                                                                        permisosModulo,
                                                                        e.target.checked
                                                                    )
                                                                }
                                                            />
                                                            Seleccionar todos
                                                        </label>
                                                    </div>

                                                    <div className="row g-3">
                                                        {permisosModulo.map(
                                                            (permiso) => {
                                                                const obligatorio =
                                                                    Number(idPerfil) === 1 &&
                                                                    esencialesAdmin.includes(
                                                                        permiso.codigo
                                                                    );

                                                                return (
                                                                    <div
                                                                        className="col-md-6"
                                                                        key={permiso.codigo}
                                                                    >
                                                                        <label className="form-check">
                                                                            <input
                                                                                type="checkbox"
                                                                                className="form-check-input"
                                                                                checked={
                                                                                    asignados.includes(
                                                                                        permiso.codigo
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    obligatorio ||
                                                                                    guardando ||
                                                                                    cargandoPermisos
                                                                                }
                                                                                onChange={() =>
                                                                                    marcarPermiso(
                                                                                        permiso.codigo
                                                                                    )
                                                                                }
                                                                            />

                                                                            <span className="form-check-label">
                                                                                {permiso.descripcion}
                                                                            </span>
                                                                        </label>

                                                                        <small className="text-muted d-block ms-4">
                                                                            {permiso.codigo}
                                                                        </small>
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )
                                )}
                            </div>

                            <div className="card-footer bg-white text-end">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={guardarPermisos}
                                    disabled={
                                        !idPerfil ||
                                        guardando ||
                                        cargandoPermisos
                                    }
                                >
                                    {guardando
                                        ? "Guardando..."
                                        : "Guardar permisos"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PerfilesPermisos;
