
import { useCallback, useEffect, useMemo, useState } from "react";
import creditoService from "../../services/creditoService";
import CreditoModal from "./CreditoModal";
import "./Creditos.css";

const moneda = (valor) =>
    new Intl.NumberFormat("es-GT", {
        style: "currency",
        currency: "GTQ"
    }).format(Number(valor || 0));

const fecha = (valor) => {
    if (!valor) return "-";

    const texto = String(valor).slice(0, 10);
    const partes = texto.split("-");

    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return texto;
};

function Creditos() {
    const [creditos, setCreditos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [busqueda, setBusqueda] = useState("");

    const [mostrarModal, setMostrarModal] = useState(false);
    const [creditoDetalle, setCreditoDetalle] = useState(null);
    const [creditoAmortizacion, setCreditoAmortizacion] = useState(null);

    const [cuotas, setCuotas] = useState([]);
    const [cargandoCuotas, setCargandoCuotas] = useState(false);
    const [errorCuotas, setErrorCuotas] = useState("");

    const cargarCreditos = useCallback(async () => {
        try {
            setCargando(true);
            setError("");

            const respuesta = await creditoService.obtenerTodos();
            setCreditos(respuesta.datos || []);
        } catch (err) {
            setError(
                err.response?.data?.mensaje ||
                "No fue posible cargar los créditos."
            );
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarCreditos();
    }, [cargarCreditos]);

    const creditosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        if (!texto) return creditos;

        return creditos.filter((credito) =>
            [
                credito.idSocio,
                credito.idCredito,
                credito.nombreSocio,
                credito.nombreServicio,
                credito.estado
            ]
                .map((valor) => String(valor ?? "").toLowerCase())
                .some((valor) => valor.includes(texto))
        );
    }, [creditos, busqueda]);

    const totalCartera = creditos.reduce(
        (total, credito) =>
            total + (
                [1, 4, 5].includes(Number(credito.idEstadoServicio))
                    ? Number(credito.saldo_actual || 0)
                    : 0
            ),
        0
    );

    const creditosActivos = creditos.filter(
        (credito) => Number(credito.idEstadoServicio) === 1
    ).length;

    const creditoGuardado = async (texto) => {
        setMostrarModal(false);
        setMensaje(texto);
        await cargarCreditos();
    };

    const cerrarAmortizacion = () => {
        setCreditoAmortizacion(null);
        setCuotas([]);
        setErrorCuotas("");
    };

    const abrirAmortizacion = (credito) => {
        setCreditoAmortizacion(credito);
        setCuotas([]);
        setErrorCuotas("");
    };

    // Consulta las cuotas cada vez que se selecciona otro crédito.
    // La bandera evita actualizar el modal con una respuesta antigua.
    useEffect(() => {
        if (!creditoAmortizacion) return;

        let activo = true;

        const consultar = async () => {
            try {
                setCargandoCuotas(true);
                setErrorCuotas("");

                const respuesta = await creditoService.obtenerCuotas(
                    creditoAmortizacion.idSocio,
                    creditoAmortizacion.idTipoServicio,
                    creditoAmortizacion.idCredito
                );

                if (activo) {
                    setCuotas(respuesta.datos || []);
                }
            } catch (err) {
                if (activo) {
                    setErrorCuotas(
                        err.response?.data?.mensaje ||
                        "No fue posible consultar las cuotas."
                    );
                }
            } finally {
                if (activo) setCargandoCuotas(false);
            }
        };

        consultar();

        return () => {
            activo = false;
        };
    }, [creditoAmortizacion]);

    const resumenCuotas = useMemo(() => {
        return cuotas.reduce(
            (resumen, cuota) => {
                resumen.capital += Number(cuota.capitalProgramado || 0);
                resumen.intereses += Number(cuota.interesProgramado || 0);
                resumen.total += Number(cuota.montoCuota || 0);
                resumen.pagado += Number(cuota.montoPagado || 0);
                resumen.pendiente += Number(cuota.saldoCuota || 0);

                if (Number(cuota.pagada) === 1) {
                    resumen.cuotasPagadas++;
                } else {
                    resumen.cuotasPendientes++;
                }

                return resumen;
            },
            {
                capital: 0,
                intereses: 0,
                total: 0,
                pagado: 0,
                pendiente: 0,
                cuotasPagadas: 0,
                cuotasPendientes: 0
            }
        );
    }, [cuotas]);

    return (
        <div className="creditos-page">
            <div className="creditos-header">
                <div>
                    <h1>Administración de Créditos</h1>
                    <p>
                        Gestiona los préstamos, consulta sus condiciones
                        financieras y revisa sus cronogramas de pago.
                    </p>
                </div>

                <button
                    type="button"
                    className="creditos-btn-primary"
                    onClick={() => setMostrarModal(true)}
                >
                    <i className="bi bi-plus-circle" />
                    Nuevo Crédito
                </button>
            </div>

            {mensaje && (
                <div className="alert alert-success alert-dismissible">
                    {mensaje}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setMensaje("")}
                        aria-label="Cerrar"
                    />
                </div>
            )}

            {error && (
                <div className="alert alert-danger">
                    {error}
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger ms-3"
                        onClick={cargarCreditos}
                    >
                        Reintentar
                    </button>
                </div>
            )}

            <div className="creditos-stats">
                <div className="creditos-stat-card">
                    <div className="creditos-stat-icon blue">
                        <i className="bi bi-file-earmark-text" />
                    </div>
                    <div>
                        <span>Total de créditos</span>
                        <strong>{creditos.length}</strong>
                    </div>
                </div>

                <div className="creditos-stat-card">
                    <div className="creditos-stat-icon green">
                        <i className="bi bi-check-circle" />
                    </div>
                    <div>
                        <span>Créditos activos</span>
                        <strong>{creditosActivos}</strong>
                    </div>
                </div>

                <div className="creditos-stat-card">
                    <div className="creditos-stat-icon purple">
                        <i className="bi bi-wallet2" />
                    </div>
                    <div>
                        <span>Cartera pendiente</span>
                        <strong>{moneda(totalCartera)}</strong>
                    </div>
                </div>
            </div>

            <div className="creditos-toolbar">
                <div className="creditos-search">
                    <i className="bi bi-search" />
                    <input
                        type="text"
                        placeholder="Buscar por socio, crédito, servicio o estado..."
                        value={busqueda}
                        onChange={(event) => setBusqueda(event.target.value)}
                    />
                </div>

                <button
                    type="button"
                    className="creditos-btn-refresh"
                    onClick={cargarCreditos}
                    disabled={cargando}
                >
                    <i className="bi bi-arrow-clockwise" />
                    Actualizar
                </button>
            </div>

            <div className="creditos-table-card">
                {cargando ? (
                    <div className="creditos-empty">
                        <div className="spinner-border text-primary" />
                        <p>Cargando créditos...</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="creditos-table">
                            <thead>
                                <tr>
                                    <th>CRÉDITO</th>
                                    <th>SOCIO</th>
                                    <th>SERVICIO</th>
                                    <th>MONTO ORIGINAL</th>
                                    <th>SALDO</th>
                                    <th>TASA</th>
                                    <th>ESTADO</th>
                                    <th>ACCIONES</th>
                                </tr>
                            </thead>

                            <tbody>
                                {creditosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="8">
                                            <div className="creditos-empty">
                                                <i className="bi bi-inbox" />
                                                <strong>
                                                    No se encontraron créditos
                                                </strong>
                                                <p>
                                                    Registra un crédito para comenzar.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    creditosFiltrados.map((credito) => (
                                        <tr
                                            key={`${credito.idPais}-${credito.idSocio}-${credito.idTipoServicio}-${credito.idCredito}`}
                                        >
                                            <td>
                                                <strong>
                                                    #{credito.idCredito}
                                                </strong>
                                                <small>
                                                    {fecha(credito.fecha_desembolso)}
                                                </small>
                                            </td>

                                            <td>
                                                <strong>
                                                    {credito.nombreSocio}
                                                </strong>
                                                <small>
                                                    Socio #{credito.idSocio}
                                                </small>
                                            </td>

                                            <td>
                                                {credito.nombreServicio}
                                            </td>

                                            <td>
                                                {moneda(credito.monto_original)}
                                            </td>

                                            <td>
                                                {moneda(credito.saldo_actual)}
                                            </td>

                                            <td>
                                                {credito.tasa}%
                                                <small>Anual</small>
                                            </td>

                                            <td>
                                                <span
                                                    className={`credito-badge ${
                                                        Number(credito.idEstadoServicio) === 1
                                                            ? "activo"
                                                            : "otro"
                                                    }`}
                                                >
                                                    {credito.estado}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="creditos-action"
                                                        title="Ver detalles"
                                                        aria-label="Ver detalles"
                                                        onClick={() =>
                                                            setCreditoDetalle(credito)
                                                        }
                                                    >
                                                        <i className="bi bi-eye" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="creditos-action"
                                                        title="Ver amortización"
                                                        aria-label="Ver amortización"
                                                        onClick={() =>
                                                            abrirAmortizacion(credito)
                                                        }
                                                    >
                                                        <i className="bi bi-table" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="creditos-table-footer">
                    Mostrando {creditosFiltrados.length} de{" "}
                    {creditos.length} créditos
                </div>
            </div>

            <CreditoModal
                mostrar={mostrarModal}
                onCerrar={() => setMostrarModal(false)}
                onGuardado={creditoGuardado}
            />

            {/* MODAL DE DETALLES */}
            {creditoDetalle && (
                <div className="credito-detail-overlay">
                    <div
                        className="credito-detail-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="credito-detail-title"
                    >
                        <div className="credito-detail-header">
                            <h2 id="credito-detail-title">
                                Detalle del Crédito #{creditoDetalle.idCredito}
                            </h2>

                            <button
                                type="button"
                                onClick={() => setCreditoDetalle(null)}
                                aria-label="Cerrar"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <div className="credito-detail-body">
                            <dl className="credito-detail-grid">
                                <div>
                                    <dt>Socio</dt>
                                    <dd>{creditoDetalle.nombreSocio}</dd>
                                </div>

                                <div>
                                    <dt>Código de socio</dt>
                                    <dd>{creditoDetalle.idSocio}</dd>
                                </div>

                                <div>
                                    <dt>Servicio</dt>
                                    <dd>{creditoDetalle.nombreServicio}</dd>
                                </div>

                                <div>
                                    <dt>Garantía</dt>
                                    <dd>{creditoDetalle.garantia}</dd>
                                </div>

                                <div>
                                    <dt>Monto original</dt>
                                    <dd>{moneda(creditoDetalle.monto_original)}</dd>
                                </div>

                                <div>
                                    <dt>Saldo actual</dt>
                                    <dd>{moneda(creditoDetalle.saldo_actual)}</dd>
                                </div>

                                <div>
                                    <dt>Tasa anual</dt>
                                    <dd>{creditoDetalle.tasa}%</dd>
                                </div>

                                <div>
                                    <dt>Frecuencia</dt>
                                    <dd>{creditoDetalle.frecuencia}</dd>
                                </div>

                                <div>
                                    <dt>Plazo</dt>
                                    <dd>{creditoDetalle.plazo} días</dd>
                                </div>

                                <div>
                                    <dt>Amortización</dt>
                                    <dd>
                                        {Number(creditoDetalle.nivelada) === 1
                                            ? "Cuota nivelada"
                                            : "Sobre saldos"}
                                    </dd>
                                </div>

                                <div>
                                    <dt>Desembolso</dt>
                                    <dd>{fecha(creditoDetalle.fecha_desembolso)}</dd>
                                </div>

                                <div>
                                    <dt>Vencimiento</dt>
                                    <dd>{fecha(creditoDetalle.fecha_vencimiento)}</dd>
                                </div>

                                <div>
                                    <dt>Estado</dt>
                                    <dd>{creditoDetalle.estado}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="credito-detail-footer">
                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={() => {
                                    const credito = creditoDetalle;
                                    setCreditoDetalle(null);
                                    abrirAmortizacion(credito);
                                }}
                            >
                                <i className="bi bi-table me-2" />
                                Ver amortización
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setCreditoDetalle(null)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE AMORTIZACIÓN */}
            {creditoAmortizacion && (
                <div className="credito-detail-overlay">
                    <div
                        className="credito-detail-card credito-amortizacion-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="credito-amortizacion-title"
                    >
                        <div className="credito-detail-header">
                            <div>
                                <h2 id="credito-amortizacion-title">
                                    Cronograma de Amortización
                                </h2>
                                <small>
                                    Crédito #{creditoAmortizacion.idCredito}
                                    {" · "}
                                    {creditoAmortizacion.nombreSocio}
                                </small>
                            </div>

                            <button
                                type="button"
                                onClick={cerrarAmortizacion}
                                aria-label="Cerrar"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <div className="credito-detail-body">
                            <div className="mb-3">
                                <strong>
                                    {creditoAmortizacion.nombreServicio}
                                </strong>
                                <div className="text-muted small">
                                    Monto original:{" "}
                                    {moneda(creditoAmortizacion.monto_original)}
                                    {" · "}
                                    Tasa: {creditoAmortizacion.tasa}% anual
                                    {" · "}
                                    {Number(creditoAmortizacion.nivelada) === 1
                                        ? "Cuota nivelada"
                                        : "Capital constante"}
                                </div>
                            </div>

                            {cargandoCuotas ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" />
                                    <p className="mt-3">
                                        Consultando cuotas...
                                    </p>
                                </div>
                            ) : errorCuotas ? (
                                <div className="alert alert-danger">
                                    {errorCuotas}
                                </div>
                            ) : cuotas.length === 0 ? (
                                <div className="alert alert-warning">
                                    Este crédito no tiene cuotas registradas.
                                </div>
                            ) : (
                                <>
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-4 col-6">
                                            <div className="credito-amortizacion-stat">
                                                <span>Capital programado</span>
                                                <strong>
                                                    {moneda(resumenCuotas.capital)}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="col-md-4 col-6">
                                            <div className="credito-amortizacion-stat">
                                                <span>Intereses programados</span>
                                                <strong>
                                                    {moneda(resumenCuotas.intereses)}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="col-md-4 col-6">
                                            <div className="credito-amortizacion-stat">
                                                <span>Total programado</span>
                                                <strong>
                                                    {moneda(resumenCuotas.total)}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="col-md-4 col-6">
                                            <div className="credito-amortizacion-stat">
                                                <span>Pagado en cuotas</span>
                                                <strong>
                                                    {moneda(resumenCuotas.pagado)}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="col-md-4 col-6">
                                            <div className="credito-amortizacion-stat">
                                                <span>Pendiente en cuotas</span>
                                                <strong>
                                                    {moneda(resumenCuotas.pendiente)}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="col-md-4 col-6">
                                            <div className="credito-amortizacion-stat">
                                                <span>Cuotas pagadas</span>
                                                <strong>
                                                    {resumenCuotas.cuotasPagadas}
                                                    {" / "}
                                                    {cuotas.length}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="credito-amortizacion-tabla">
                                        <table className="table table-striped table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Vencimiento</th>
                                                    <th className="text-end">Capital</th>
                                                    <th className="text-end">Interés</th>
                                                    <th className="text-end">Cuota</th>
                                                    <th className="text-end">Pagado</th>
                                                    <th className="text-end">Pendiente</th>
                                                    <th>Estado</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {cuotas.map((cuota) => (
                                                    <tr key={cuota.numeroCuota}>
                                                        <td>{cuota.numeroCuota}</td>

                                                        <td>
                                                            {fecha(cuota.fechaVencimiento)}
                                                        </td>

                                                        <td className="text-end">
                                                            {moneda(cuota.capitalProgramado)}
                                                        </td>

                                                        <td className="text-end">
                                                            {moneda(cuota.interesProgramado)}
                                                        </td>

                                                        <td className="text-end fw-semibold">
                                                            {moneda(cuota.montoCuota)}
                                                        </td>

                                                        <td className="text-end">
                                                            {moneda(cuota.montoPagado)}
                                                        </td>

                                                        <td className="text-end">
                                                            {moneda(cuota.saldoCuota)}
                                                        </td>

                                                        <td>
                                                            {Number(cuota.pagada) === 1 ? (
                                                                <span className="badge bg-success">
                                                                    Pagada
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-secondary">
                                                                    Pendiente
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>

                                            <tfoot className="table-light fw-bold">
                                                <tr>
                                                    <td colSpan={2}>Totales</td>

                                                    <td className="text-end">
                                                        {moneda(resumenCuotas.capital)}
                                                    </td>

                                                    <td className="text-end">
                                                        {moneda(resumenCuotas.intereses)}
                                                    </td>

                                                    <td className="text-end">
                                                        {moneda(resumenCuotas.total)}
                                                    </td>

                                                    <td className="text-end">
                                                        {moneda(resumenCuotas.pagado)}
                                                    </td>

                                                    <td className="text-end">
                                                        {moneda(resumenCuotas.pendiente)}
                                                    </td>

                                                    <td />
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    <div className="mt-3 text-muted small">
                                        <i className="bi bi-info-circle me-2" />
                                        Los valores corresponden al cronograma
                                        almacenado en la base de datos. El saldo
                                        pendiente incluye capital e intereses
                                        programados aún no pagados.
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="credito-detail-footer">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={cerrarAmortizacion}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Creditos;
