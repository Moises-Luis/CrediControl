
import { useCallback, useEffect, useMemo, useState } from "react";
import pagoService from "../../services/pagoService";
import creditoService from "../../services/creditoService";
import PagoModal from "./PagoModal";
import "./Pagos.css";

const moneda = (valor) =>
    new Intl.NumberFormat("es-GT", {
        style: "currency",
        currency: "GTQ"
    }).format(Number(valor) || 0);

const fecha = (valor) => {
    if (!valor) return "—";

    const texto = String(valor).slice(0, 10);
    const partes = texto.split("-");

    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return texto;
};

const obtenerMensajeError = (error, mensajeDefecto) =>
    error?.response?.data?.mensaje ||
    error?.response?.data?.error ||
    error?.message ||
    mensajeDefecto;

function Pagos() {
    // ==========================================
    // LISTADO DE CRÉDITOS
    // ==========================================

    const [creditos, setCreditos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    // ==========================================
    // DETALLE DE CUOTAS E HISTORIAL
    // ==========================================

    const [creditoSeleccionado, setCreditoSeleccionado] =
        useState(null);

    const [vista, setVista] = useState("cuotas");
    const [cuotas, setCuotas] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [cargandoDetalle, setCargandoDetalle] =
        useState(false);
    const [errorDetalle, setErrorDetalle] = useState("");

    // ==========================================
    // MODAL PARA REGISTRAR PAGOS
    // ==========================================

    const [mostrarPagoModal, setMostrarPagoModal] =
        useState(false);

    const [creditoParaPago, setCreditoParaPago] =
        useState(null);

    // ==========================================
    // CARGAR CRÉDITOS
    // ==========================================

    const cargarCreditos = useCallback(async () => {
        try {
            setCargando(true);
            setError("");

            const respuesta =
                await pagoService.obtenerCreditos();

            if (!respuesta.exito) {
                throw new Error(
                    respuesta.mensaje ||
                    "No se pudieron obtener los créditos."
                );
            }

            setCreditos(
                Array.isArray(respuesta.datos)
                    ? respuesta.datos
                    : []
            );
        } catch (err) {
            setError(
                obtenerMensajeError(
                    err,
                    "Error al consultar los créditos."
                )
            );
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarCreditos();
    }, [cargarCreditos]);

    // ==========================================
    // FILTRAR CRÉDITOS
    // ==========================================

    const creditosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        if (!texto) return creditos;

        return creditos.filter((credito) => {
            const contenido = [
                credito.idSocio,
                credito.idCredito,
                credito.idTipoServicio,
                credito.nombreSocio,
                credito.nombreServicio
            ]
                .join(" ")
                .toLowerCase();

            return contenido.includes(texto);
        });
    }, [creditos, busqueda]);

    // ==========================================
    // INDICADORES GENERALES
    // ==========================================

    const resumen = useMemo(
        () => ({
            cantidad: creditos.length,

            cartera: creditos.reduce(
                (total, credito) =>
                    total +
                    Number(credito.saldo_actual || 0),
                0
            ),

            activos: creditos.filter(
                (credito) =>
                    Number(credito.idEstadoServicio) === 1
            ).length
        }),
        [creditos]
    );

    // ==========================================
    // ABRIR DETALLE DE CUOTAS O HISTORIAL
    // ==========================================

    const abrirDetalle = async (credito, tipoVista) => {
        setCreditoSeleccionado(credito);
        setVista(tipoVista);

        setCuotas([]);
        setHistorial([]);
        setErrorDetalle("");
        setCargandoDetalle(true);

        try {
            let respuesta;

            if (tipoVista === "cuotas") {
                respuesta =
                    await creditoService.obtenerCuotas(
                        credito.idSocio,
                        credito.idTipoServicio,
                        credito.idCredito
                    );
            } else {
                respuesta =
                    await pagoService.obtenerHistorial(
                        credito.idSocio,
                        credito.idTipoServicio,
                        credito.idCredito,
                        credito.idPais
                    );
            }

            if (!respuesta.exito) {
                throw new Error(
                    respuesta.mensaje ||
                    "No se pudo consultar el detalle."
                );
            }

            if (tipoVista === "cuotas") {
                const datos = respuesta.datos;

                setCuotas(
                    Array.isArray(datos)
                        ? datos
                        : Array.isArray(datos?.cuotas)
                            ? datos.cuotas
                            : []
                );
            } else {
                setHistorial(
                    Array.isArray(respuesta.datos)
                        ? respuesta.datos
                        : []
                );
            }
        } catch (err) {
            setErrorDetalle(
                obtenerMensajeError(
                    err,
                    "No fue posible consultar la información."
                )
            );
        } finally {
            setCargandoDetalle(false);
        }
    };

    // ==========================================
    // CERRAR DETALLE
    // ==========================================

    const cerrarDetalle = () => {
        setCreditoSeleccionado(null);
        setCuotas([]);
        setHistorial([]);
        setErrorDetalle("");
        setCargandoDetalle(false);
    };

    // ==========================================
    // ABRIR MODAL DE PAGO
    // ==========================================

    const abrirPagoModal = (credito) => {
        setCreditoParaPago(credito);
        setMostrarPagoModal(true);
    };

    // ==========================================
    // CERRAR MODAL DE PAGO
    // ==========================================

    const cerrarPagoModal = () => {
        setMostrarPagoModal(false);
        setCreditoParaPago(null);
    };

    return (
        <div className="container-fluid py-4 pagos-page">
            {/* ====================================
                ENCABEZADO
            ==================================== */}

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h3 className="fw-bold mb-1">
                        <i className="bi bi-cash-coin me-2 text-primary"></i>
                        Administración de Pagos
                    </h3>

                    <p className="text-muted mb-0">
                        Consulta de créditos, cuotas y movimientos.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={cargarCreditos}
                    disabled={cargando}
                >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Actualizar
                </button>
            </div>

            {/* ====================================
                TARJETAS DE RESUMEN
            ==================================== */}

            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-muted small mb-2">
                                Créditos disponibles
                            </div>

                            <h3 className="fw-bold mb-0">
                                {resumen.cantidad}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-muted small mb-2">
                                Saldo de cartera
                            </div>

                            <h3 className="fw-bold mb-0">
                                {moneda(resumen.cartera)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-muted small mb-2">
                                Créditos activos
                            </div>

                            <h3 className="fw-bold mb-0">
                                {resumen.activos}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* ====================================
                LISTADO DE CRÉDITOS
            ==================================== */}

            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <div className="row g-3 align-items-center mb-3">
                        <div className="col-md-7">
                            <h5 className="fw-semibold mb-0">
                                Listado de créditos
                            </h5>
                        </div>

                        <div className="col-md-5">
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <i className="bi bi-search"></i>
                                </span>

                                <input
                                    type="search"
                                    className="form-control"
                                    placeholder="Buscar socio, crédito o servicio..."
                                    value={busqueda}
                                    onChange={(e) =>
                                        setBusqueda(e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div
                            className="alert alert-danger"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    {cargando ? (
                        <div className="text-center py-5">
                            <div
                                className="spinner-border text-primary"
                                role="status"
                            />

                            <p className="text-muted mt-3">
                                Cargando créditos...
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Crédito</th>
                                        <th>Socio</th>
                                        <th>Servicio</th>

                                        <th className="text-end">
                                            Saldo
                                        </th>

                                        <th>Próximo pago</th>

                                        <th className="text-center">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {creditosFiltrados.map(
                                        (credito) => (
                                            <tr
                                                key={`${credito.idPais}-${credito.idSocio}-${credito.idTipoServicio}-${credito.idCredito}`}
                                            >
                                                <td>
                                                    <span className="fw-semibold">
                                                        #{credito.idCredito}
                                                    </span>

                                                    <div className="small text-muted">
                                                        {credito.idSocio}
                                                    </div>
                                                </td>

                                                <td>
                                                    {credito.nombreSocio}
                                                </td>

                                                <td>
                                                    {credito.nombreServicio}
                                                </td>

                                                <td className="text-end fw-semibold">
                                                    {moneda(
                                                        credito.saldo_actual
                                                    )}
                                                </td>

                                                <td>
                                                    {fecha(
                                                        credito.fecha_proxpago
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="d-flex justify-content-center gap-2">
                                                        {/* Ver cuotas */}
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary"
                                                            title="Ver cuotas"
                                                            aria-label="Ver cuotas"
                                                            onClick={() =>
                                                                abrirDetalle(
                                                                    credito,
                                                                    "cuotas"
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-table"></i>
                                                        </button>

                                                        {/* Historial */}
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            title="Historial de pagos"
                                                            aria-label="Historial de pagos"
                                                            onClick={() =>
                                                                abrirDetalle(
                                                                    credito,
                                                                    "historial"
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-clock-history"></i>
                                                        </button>

                                                        {/* Registrar pago */}
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-success"
                                                            title="Registrar pago"
                                                            aria-label="Registrar pago"
                                                            onClick={() =>
                                                                abrirPagoModal(
                                                                    credito
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-cash-coin"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}

                                    {creditosFiltrados.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="text-center text-muted py-4"
                                            >
                                                No se encontraron créditos.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ====================================
                MODAL DE CUOTAS E HISTORIAL
            ==================================== */}

            {creditoSeleccionado && (
                <div
                    className="modal fade show d-block pagos-modal"
                    tabIndex="-1"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <div>
                                    <h5 className="modal-title fw-bold">
                                        {vista === "cuotas"
                                            ? "Cronograma de cuotas"
                                            : "Historial de pagos"}
                                    </h5>

                                    <div className="small text-muted">
                                        {creditoSeleccionado.nombreSocio}
                                        {" — Crédito #"}
                                        {creditoSeleccionado.idCredito}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Cerrar"
                                    onClick={cerrarDetalle}
                                />
                            </div>

                            <div className="modal-body">
                                {errorDetalle && (
                                    <div
                                        className="alert alert-danger"
                                        role="alert"
                                    >
                                        {errorDetalle}
                                    </div>
                                )}

                                {cargandoDetalle ? (
                                    <div className="text-center py-5">
                                        <div
                                            className="spinner-border text-primary"
                                            role="status"
                                        />
                                    </div>
                                ) : vista === "cuotas" ? (
                                    <div className="table-responsive">
                                        <table className="table table-striped table-sm align-middle">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Vencimiento</th>

                                                    <th className="text-end">
                                                        Capital
                                                    </th>

                                                    <th className="text-end">
                                                        Interés
                                                    </th>

                                                    <th className="text-end">
                                                        Cuota
                                                    </th>

                                                    <th className="text-end">
                                                        Pagado
                                                    </th>

                                                    <th className="text-end">
                                                        Pendiente
                                                    </th>

                                                    <th>Estado</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {cuotas.map((cuota) => (
                                                    <tr
                                                        key={
                                                            cuota.numeroCuota
                                                        }
                                                    >
                                                        <td>
                                                            {cuota.numeroCuota}
                                                        </td>

                                                        <td>
                                                            {fecha(
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

                                                        <td className="text-end">
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
                                                                    Number(
                                                                        cuota.pagada
                                                                    ) === 1
                                                                        ? "bg-success"
                                                                        : "bg-warning text-dark"
                                                                }`}
                                                            >
                                                                {Number(
                                                                    cuota.pagada
                                                                ) === 1
                                                                    ? "Pagada"
                                                                    : "Pendiente"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {!cuotas.length && (
                                            <p className="text-center text-muted py-4">
                                                No hay cuotas registradas.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-striped table-sm align-middle">
                                            <thead>
                                                <tr>
                                                    <th>Pago</th>
                                                    <th>Fecha</th>

                                                    <th className="text-end">
                                                        Capital
                                                    </th>

                                                    <th className="text-end">
                                                        Interés
                                                    </th>

                                                    <th className="text-end">
                                                        Mora
                                                    </th>

                                                    <th className="text-end">
                                                        Total
                                                    </th>

                                                    <th>Observación</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {historial.map((pago) => (
                                                    <tr key={pago.idPago}>
                                                        <td>
                                                            #{pago.idPago}
                                                        </td>

                                                        <td>
                                                            {pago.fechaPago}
                                                        </td>

                                                        <td className="text-end">
                                                            {moneda(
                                                                pago.cantidadCapital
                                                            )}
                                                        </td>

                                                        <td className="text-end">
                                                            {moneda(
                                                                pago.cantidadInteres
                                                            )}
                                                        </td>

                                                        <td className="text-end">
                                                            {moneda(
                                                                pago.cantidadMora
                                                            )}
                                                        </td>

                                                        <td className="text-end fw-semibold">
                                                            {moneda(
                                                                pago.montoTotal
                                                            )}
                                                        </td>

                                                        <td>
                                                            {pago.observacion ||
                                                                "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {!historial.length && (
                                            <p className="text-center text-muted py-4">
                                                No hay pagos registrados.
                                            </p>
                                        )}
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
            )}

            {creditoSeleccionado && (
                <div className="modal-backdrop fade show" />
            )}

            {/* ====================================
                MODAL DE REGISTRO DE PAGO
            ==================================== */}

            <PagoModal
                mostrar={mostrarPagoModal}
                credito={creditoParaPago}
                onCerrar={cerrarPagoModal}
            />
        </div>
    );
}

export default Pagos;
