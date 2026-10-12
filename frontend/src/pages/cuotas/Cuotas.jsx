
import {
    useCallback,
    useEffect,
    useState
} from "react";

import cuotaService from "../../services/cuotaService";

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

const moneda = (valor) =>
    new Intl.NumberFormat("es-GT", {
        style: "currency",
        currency: "GTQ"
    }).format(Number(valor) || 0);

const fechaTexto = (valor) => {
    if (!valor) return "—";

    const texto = String(valor).slice(0, 10);
    const partes = texto.split("-");

    return partes.length === 3
        ? `${partes[2]}/${partes[1]}/${partes[0]}`
        : texto;
};

const obtenerError = (error) =>
    error?.response?.data?.mensaje ||
    error?.message ||
    "No se pudo completar la consulta.";

const estadoClase = {
    PAGADA: "bg-success",
    VENCIDA: "bg-danger",
    HOY: "bg-warning text-dark",
    PENDIENTE: "bg-primary"
};

// ==========================================
// COMPONENTE CUOTAS
// ==========================================

function Cuotas() {

    // ======================================
    // ESTADOS
    // ======================================

    const [cuotas, setCuotas] = useState([]);
    const [resumen, setResumen] = useState(null);

    const [buscar, setBuscar] = useState("");
    const [estado, setEstado] = useState("TODAS");
    const [fechaInicial, setFechaInicial] = useState("");
    const [fechaFinal, setFechaFinal] = useState("");

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    const [cuotaSeleccionada, setCuotaSeleccionada] =
        useState(null);

    const [cargandoDetalle, setCargandoDetalle] =
        useState(false);

    const [errorDetalle, setErrorDetalle] =
        useState("");

    // ======================================
    // CARGAR RESUMEN
    // ======================================

    const cargarResumen = useCallback(async () => {
        try {
            const respuesta =
                await cuotaService.obtenerResumen();

            if (respuesta.exito) {
                setResumen(respuesta.datos);
            }
        } catch (err) {
            console.error(
                "Error al cargar resumen de cuotas:",
                err
            );
        }
    }, []);

    // ======================================
    // CARGAR CUOTAS
    // ======================================

    const cargarCuotas = useCallback(async (
        filtros = {}
    ) => {
        setCargando(true);
        setError("");

        try {
            const respuesta =
                await cuotaService.obtenerTodas(filtros);

            if (!respuesta.exito) {
                throw new Error(
                    respuesta.mensaje ||
                    "No fue posible obtener las cuotas."
                );
            }

            setCuotas(
                Array.isArray(respuesta.datos)
                    ? respuesta.datos
                    : []
            );
        } catch (err) {
            setError(obtenerError(err));
            setCuotas([]);
        } finally {
            setCargando(false);
        }
    }, []);

    // ======================================
    // CARGA INICIAL
    // ======================================

    useEffect(() => {
        cargarResumen();
        cargarCuotas();
    }, [cargarResumen, cargarCuotas]);

    // ======================================
    // CONSULTAR CON FILTROS
    // ======================================

    const consultar = async (evento) => {
        evento?.preventDefault();

        if (
            fechaInicial &&
            fechaFinal &&
            fechaInicial > fechaFinal
        ) {
            setError(
                "La fecha inicial no puede ser mayor que la fecha final."
            );
            return;
        }

        await cargarCuotas({
            estado,
            buscar: buscar.trim(),
            ...(fechaInicial ? { fechaInicial } : {}),
            ...(fechaFinal ? { fechaFinal } : {})
        });

        await cargarResumen();
    };

    // ======================================
    // LIMPIAR FILTROS
    // ======================================

    const limpiarFiltros = async () => {
        setBuscar("");
        setEstado("TODAS");
        setFechaInicial("");
        setFechaFinal("");

        await cargarCuotas();
        await cargarResumen();
    };

    // ======================================
    // CONSULTAR UNA CUOTA
    // ======================================

    const abrirDetalle = async (cuota) => {
        setErrorDetalle("");
        setCuotaSeleccionada({ ...cuota });
        setCargandoDetalle(true);

        try {
            const respuesta =
                await cuotaService.obtenerPorId(
                    cuota.idSocio,
                    cuota.idTipoServicio,
                    cuota.idCredito,
                    cuota.numeroCuota,
                    cuota.idPais
                );

            if (!respuesta.exito) {
                throw new Error(
                    respuesta.mensaje ||
                    "No se pudo consultar la cuota."
                );
            }

            setCuotaSeleccionada({
                ...cuota,
                ...respuesta.datos
            });
        } catch (err) {
            setErrorDetalle(obtenerError(err));
        } finally {
            setCargandoDetalle(false);
        }
    };

    const cerrarDetalle = () => {
        setCuotaSeleccionada(null);
        setErrorDetalle("");
    };

    // ======================================
    // TOTAL DE FILAS CONSULTADAS
    // ======================================

    const totalConsultado = cuotas.reduce(
        (total, cuota) =>
            total + Number(cuota.saldoCuota || 0),
        0
    );

    // ======================================
    // INTERFAZ
    // ======================================

    return (
        <div className="container-fluid py-4">

            {/* ENCABEZADO */}

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h3 className="fw-bold mb-1">
                        <i className="bi bi-calendar-check me-2 text-primary"></i>
                        Administración de Cuotas
                    </h3>

                    <p className="text-muted mb-0">
                        Consulta y seguimiento de cuotas de créditos.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-outline-primary"
                    disabled={cargando}
                    onClick={() => consultar()}
                >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Actualizar
                </button>
            </div>

            {/* INDICADORES */}

            <div className="row g-3 mb-4">

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <small className="text-muted">
                                Total de cuotas
                            </small>

                            <h3 className="fw-bold mt-2 mb-0">
                                {resumen?.totalCuotas ?? 0}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <small className="text-muted">
                                Pagadas
                            </small>

                            <h3 className="fw-bold mt-2 mb-0 text-success">
                                {resumen?.pagadas ?? 0}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <small className="text-muted">
                                Pendientes futuras
                            </small>

                            <h3 className="fw-bold mt-2 mb-0 text-primary">
                                {resumen?.pendientes ?? 0}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <small className="text-muted">
                                Vencidas
                            </small>

                            <h3 className="fw-bold mt-2 mb-0 text-danger">
                                {resumen?.vencidas ?? 0}
                            </h3>
                        </div>
                    </div>
                </div>

            </div>

            {/* FILTROS */}

            <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white p-3">
                    <h5 className="fw-semibold mb-0">
                        Filtros de búsqueda
                    </h5>
                </div>

                <div className="card-body p-3">
                    <form onSubmit={consultar}>
                        <div className="row g-3 align-items-end">

                            <div className="col-lg-4">
                                <label className="form-label fw-semibold">
                                    Buscar
                                </label>

                                <input
                                    type="search"
                                    className="form-control"
                                    placeholder="Socio, nombre, crédito o servicio..."
                                    value={buscar}
                                    onChange={(e) =>
                                        setBuscar(e.target.value)
                                    }
                                />
                            </div>

                            <div className="col-lg-2">
                                <label className="form-label fw-semibold">
                                    Estado
                                </label>

                                <select
                                    className="form-select"
                                    value={estado}
                                    onChange={(e) =>
                                        setEstado(e.target.value)
                                    }
                                >
                                    <option value="TODAS">
                                        Todas
                                    </option>

                                    <option value="PENDIENTES">
                                        Pendientes
                                    </option>

                                    <option value="PAGADAS">
                                        Pagadas
                                    </option>

                                    <option value="VENCIDAS">
                                        Vencidas
                                    </option>

                                    <option value="HOY">
                                        Vencen hoy
                                    </option>
                                </select>
                            </div>

                            <div className="col-lg-2">
                                <label className="form-label fw-semibold">
                                    Fecha inicial
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    value={fechaInicial}
                                    onChange={(e) =>
                                        setFechaInicial(e.target.value)
                                    }
                                />
                            </div>

                            <div className="col-lg-2">
                                <label className="form-label fw-semibold">
                                    Fecha final
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    value={fechaFinal}
                                    onChange={(e) =>
                                        setFechaFinal(e.target.value)
                                    }
                                />
                            </div>

                            <div className="col-lg-2">
                                <div className="d-flex gap-2">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={cargando}
                                        title="Buscar cuotas"
                                    >
                                        <i className="bi bi-search"></i>
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        disabled={cargando}
                                        title="Limpiar filtros"
                                        onClick={limpiarFiltros}
                                    >
                                        <i className="bi bi-x-circle"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* TABLA DE CUOTAS */}

            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white p-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h5 className="fw-semibold mb-0">
                            Listado de Cuotas
                        </h5>

                        <span className="badge bg-primary">
                            {cuotas.length} registros
                        </span>
                    </div>
                </div>

                <div className="card-body p-3">

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    {cargando ? (
                        <div className="text-center py-5">
                            <div
                                className="spinner-border text-primary"
                                role="status"
                            ></div>

                            <p className="text-muted mt-3">
                                Consultando cuotas...
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Socio</th>
                                        <th>Crédito</th>
                                        <th>Cuota</th>
                                        <th>Vencimiento</th>

                                        <th className="text-end">
                                            Capital
                                        </th>

                                        <th className="text-end">
                                            Interés
                                        </th>

                                        <th className="text-end">
                                            Cuota total
                                        </th>

                                        <th className="text-end">
                                            Pagado
                                        </th>

                                        <th className="text-end">
                                            Pendiente
                                        </th>

                                        <th>Estado</th>
                                        <th className="text-center">
                                            Acción
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {cuotas.map((cuota) => (
                                        <tr
                                            key={`${cuota.idPais}-${cuota.idSocio}-${cuota.idTipoServicio}-${cuota.idCredito}-${cuota.numeroCuota}`}
                                        >
                                            <td>
                                                <div className="fw-semibold">
                                                    {cuota.nombreSocio}
                                                </div>

                                                <small className="text-muted">
                                                    {cuota.idSocio}
                                                </small>
                                            </td>

                                            <td>
                                                <div className="fw-semibold">
                                                    #{cuota.idCredito}
                                                </div>

                                                <small className="text-muted">
                                                    {cuota.nombreServicio}
                                                </small>
                                            </td>

                                            <td>
                                                {cuota.numeroCuota}
                                            </td>

                                            <td>
                                                {fechaTexto(
                                                    cuota.fechaVencimiento
                                                )}
                                            </td>

                                            <td className="text-end">
                                                {moneda(
                                                    cuota.capitalProgramado
                                                )}
                                            </td>

                                            <td className="text-end">
                                                {moneda(
                                                    cuota.interesProgramado
                                                )}
                                            </td>

                                            <td className="text-end fw-semibold">
                                                {moneda(
                                                    cuota.montoCuota
                                                )}
                                            </td>

                                            <td className="text-end">
                                                {moneda(
                                                    cuota.montoPagado
                                                )}
                                            </td>

                                            <td className="text-end">
                                                {moneda(
                                                    cuota.saldoCuota
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={`badge ${
                                                        estadoClase[
                                                            cuota.estadoCuota
                                                        ] || "bg-secondary"
                                                    }`}
                                                >
                                                    {cuota.estadoCuota}
                                                </span>
                                            </td>

                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    title="Ver detalle"
                                                    onClick={() =>
                                                        abrirDetalle(cuota)
                                                    }
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {cuotas.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="11"
                                                className="text-center text-muted py-4"
                                            >
                                                No se encontraron cuotas.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!cargando && cuotas.length > 0 && (
                        <div className="d-flex flex-wrap justify-content-between align-items-center border-top pt-3 gap-2">
                            <span className="text-muted small">
                                Total pendiente de la consulta
                            </span>

                            <h5 className="fw-bold mb-0">
                                {moneda(totalConsultado)}
                            </h5>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE DETALLE */}

            {cuotaSeleccionada && (
                <>
                    <div
                        className="modal fade show d-block"
                        role="dialog"
                        aria-modal="true"
                        tabIndex="-1"
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">

                                <div className="modal-header">
                                    <h5 className="modal-title fw-bold">
                                        Detalle de cuota #{cuotaSeleccionada.numeroCuota}
                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Cerrar"
                                        onClick={cerrarDetalle}
                                    />
                                </div>

                                <div className="modal-body">

                                    {errorDetalle && (
                                        <div className="alert alert-danger">
                                            {errorDetalle}
                                        </div>
                                    )}

                                    {cargandoDetalle ? (
                                        <div className="text-center py-4">
                                            <div className="spinner-border text-primary"></div>
                                        </div>
                                    ) : (
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <small className="text-muted">
                                                    Socio
                                                </small>

                                                <div className="fw-semibold">
                                                    {cuotaSeleccionada.nombreSocio}
                                                </div>
                                            </div>

                                            <div className="col-6">
                                                <small className="text-muted">
                                                    Crédito
                                                </small>

                                                <div className="fw-semibold">
                                                    #{cuotaSeleccionada.idCredito}
                                                </div>
                                            </div>

                                            <div className="col-6">
                                                <small className="text-muted">
                                                    Vencimiento
                                                </small>

                                                <div className="fw-semibold">
                                                    {fechaTexto(
                                                        cuotaSeleccionada.fechaVencimiento
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-6">
                                                <small className="text-muted">
                                                    Capital
                                                </small>

                                                <div className="fw-semibold">
                                                    {moneda(
                                                        cuotaSeleccionada.capitalProgramado
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-6">
                                                <small className="text-muted">
                                                    Intereses
                                                </small>

                                                <div className="fw-semibold">
                                                    {moneda(
                                                        cuotaSeleccionada.interesProgramado
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-6">
                                                <small className="text-muted">
                                                    Total de cuota
                                                </small>

                                                <div className="fw-semibold">
                                                    {moneda(
                                                        cuotaSeleccionada.montoCuota
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-6">
                                                <small className="text-muted">
                                                    Saldo pendiente
                                                </small>

                                                <div className="fw-bold text-primary">
                                                    {moneda(
                                                        cuotaSeleccionada.saldoCuota
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={cerrarDetalle}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </div>
    );
}

export default Cuotas;
