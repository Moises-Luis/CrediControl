
import {
    useEffect,
    useMemo,
    useState
} from "react";

import creditoService from "../../services/creditoService";
import pagoService from "../../services/pagoService";

import "./PagoModal.css";

// ==========================================
// CONFIGURACIÓN
// ==========================================

const TIPOS_PAGO = [
    {
        valor: "CUOTA",
        titulo: "Pago de cuota",
        descripcion: "Pagar la cuota exigible completa."
    },
    {
        valor: "PARCIAL",
        titulo: "Pago parcial",
        descripcion: "Abonar a las cuotas exigibles."
    },
    {
        valor: "EXTRAORDINARIO",
        titulo: "Abono extraordinario",
        descripcion: "Abono neto directamente al capital."
    }
];

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

const obtenerError = (error) =>
    error?.response?.data?.mensaje ||
    error?.response?.data?.error ||
    error?.message ||
    "No fue posible procesar la solicitud.";

const obtenerFechaLocal = () => {
    const ahora = new Date();

    const anio = ahora.getFullYear();

    const mes = String(
        ahora.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        ahora.getDate()
    ).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
};

const redondear = (valor) =>
    Math.round((Number(valor) + Number.EPSILON) * 100);

const leerCuotas = (respuesta) => {
    const datos = respuesta?.datos;

    if (Array.isArray(datos)) return datos;

    if (Array.isArray(datos?.cuotas)) {
        return datos.cuotas;
    }

    return [];
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function PagoModal({
    mostrar,
    credito,
    onCerrar
}) {
    // ======================================
    // ESTADOS
    // ======================================

    const [tipoPago, setTipoPago] = useState("CUOTA");
    const [monto, setMonto] = useState("");
    const [observacion, setObservacion] = useState("");

    const [cuotas, setCuotas] = useState([]);
    const [cargandoCuotas, setCargandoCuotas] =
        useState(false);

    const [errorCuotas, setErrorCuotas] =
        useState("");

    const [simulacion, setSimulacion] =
        useState(null);

    const [simulando, setSimulando] =
        useState(false);

    const [errorSimulacion, setErrorSimulacion] =
        useState("");

    // Impide mostrar una simulación obsoleta
    // si el usuario modifica los datos durante
    // una solicitud en curso.
    const [versionDatos, setVersionDatos] =
        useState(0);

    // ======================================
    // IDENTIFICADOR DEL CRÉDITO
    // ======================================

    const claveCredito = credito
        ? [
            credito.idPais,
            credito.idSocio,
            credito.idTipoServicio,
            credito.idCredito
        ].join("-")
        : "";

    // ======================================
    // LIMPIAR RESULTADO DE SIMULACIÓN
    // ======================================

    const limpiarSimulacion = () => {
        setSimulacion(null);
        setErrorSimulacion("");
        setVersionDatos((valor) => valor + 1);
    };

    // ======================================
    // CARGAR CRONOGRAMA
    // ======================================

    useEffect(() => {
        if (!mostrar || !credito) return;

        let activo = true;

        const cargar = async () => {
            setTipoPago("CUOTA");
            setMonto("");
            setObservacion("");
            setCuotas([]);
            setErrorCuotas("");
            setSimulacion(null);
            setErrorSimulacion("");
            setCargandoCuotas(true);
            setVersionDatos((valor) => valor + 1);

            try {
                const respuesta =
                    await creditoService.obtenerCuotas(
                        credito.idSocio,
                        credito.idTipoServicio,
                        credito.idCredito
                    );

                if (!activo) return;

                if (!respuesta.exito) {
                    throw new Error(
                        respuesta.mensaje ||
                        "No se pudieron consultar las cuotas."
                    );
                }

                setCuotas(leerCuotas(respuesta));
            } catch (error) {
                if (activo) {
                    setErrorCuotas(obtenerError(error));
                }
            } finally {
                if (activo) {
                    setCargandoCuotas(false);
                }
            }
        };

        cargar();

        return () => {
            activo = false;
        };
    }, [mostrar, claveCredito]);

    // ======================================
    // CUOTAS PENDIENTES
    // ======================================

    const pendientes = useMemo(() => {
        return cuotas
            .filter(
                (cuota) =>
                    Number(cuota.saldoCuota) > 0
            )
            .sort(
                (a, b) =>
                    Number(a.numeroCuota) -
                    Number(b.numeroCuota)
            );
    }, [cuotas]);

    // La exigibilidad que mostramos aquí
    // es orientativa según el navegador.
    // El servidor determina la fecha definitiva.

    const hoyLocal = obtenerFechaLocal();

    const cuotaExigible = pendientes.find(
        (cuota) =>
            String(cuota.fechaVencimiento)
                .slice(0, 10) <= hoyLocal
    );

    const proximaCuota = pendientes[0] || null;

    const saldoCapital =
        Number(credito?.saldo_actual) || 0;

    const montoNumerico = Number(monto);

    const montoValido =
        monto.trim() !== "" &&
        Number.isFinite(montoNumerico) &&
        montoNumerico > 0 &&
        Number.isSafeInteger(
            redondear(montoNumerico)
        ) &&
        Math.abs(
            montoNumerico * 100 -
            redondear(montoNumerico)
        ) < 0.000001;

    const tieneMora =
        Number(credito?.mora) === 1 ||
        Number(credito?.monto_mora) > 0;

    const tieneInteresesAnteriores =
        Number(credito?.intereses_venc) !== 0;

    // ======================================
    // CAMBIAR TIPO DE PAGO
    // ======================================

    const seleccionarTipo = (nuevoTipo) => {
        setTipoPago(nuevoTipo);
        limpiarSimulacion();

        if (
            nuevoTipo === "CUOTA" &&
            cuotaExigible
        ) {
            setMonto(
                Number(
                    cuotaExigible.saldoCuota
                ).toFixed(2)
            );
        } else {
            setMonto("");
        }
    };

    // ======================================
    // MODIFICAR MONTO
    // ======================================

    const cambiarMonto = (valor) => {
        setMonto(valor);
        limpiarSimulacion();
    };

    // ======================================
    // VALIDACIÓN LOCAL
    // ======================================

    const validarFormulario = () => {
        if (!credito) {
            return "Selecciona un crédito.";
        }

        if (!montoValido) {
            return (
                "Ingresa un monto mayor que cero " +
                "con un máximo de dos decimales."
            );
        }

        if (
            tipoPago === "EXTRAORDINARIO" &&
            redondear(montoNumerico) >=
            redondear(saldoCapital)
        ) {
            return (
                "El abono extraordinario debe ser " +
                "menor que el saldo de capital."
            );
        }

        if (
            tipoPago !== "EXTRAORDINARIO" &&
            !cuotaExigible
        ) {
            return (
                "No existen cuotas exigibles según " +
                "la fecha local. El servidor realizará " +
                "la validación definitiva."
            );
        }

        if (
            tipoPago === "CUOTA" &&
            cuotaExigible &&
            redondear(montoNumerico) !==
            redondear(cuotaExigible.saldoCuota)
        ) {
            return (
                "El monto debe coincidir con el " +
                "saldo de la primera cuota exigible."
            );
        }

        if (
            observacion.length > 500
        ) {
            return (
                "La observación no puede superar " +
                "500 caracteres."
            );
        }

        return "";
    };

    const errorValidacion = validarFormulario();

    // ======================================
    // SIMULAR PAGO
    // ======================================

    const simularPago = async () => {
        const errorFormulario = validarFormulario();

        if (errorFormulario) {
            setErrorSimulacion(errorFormulario);
            setSimulacion(null);
            return;
        }

        if (simulando) return;

        setSimulando(true);
        setErrorSimulacion("");
        setSimulacion(null);

        const versionActual = versionDatos;

        try {
            const datos = {
                idPais: Number(
                    credito.idPais ?? 320
                ),
                idSocio: credito.idSocio,
                idTipoServicio: Number(
                    credito.idTipoServicio
                ),
                idCredito: Number(
                    credito.idCredito
                ),
                tipoPago,
                monto: montoNumerico
            };

            const respuesta =
                await pagoService.simular(datos);

            if (!respuesta.exito) {
                throw new Error(
                    respuesta.mensaje ||
                    "No fue posible simular el pago."
                );
            }

            // Una nueva simulación se obtiene cada vez
            // que el usuario vuelve a pulsar el botón.
            setSimulacion(respuesta.datos);

        } catch (error) {
            setErrorSimulacion(
                obtenerError(error)
            );
        } finally {
            setSimulando(false);
        }
    };

    // ======================================
    // RENDERIZADO
    // ======================================

    if (!mostrar || !credito) {
        return null;
    }

    return (
        <div
            className="pago-modal-overlay"
            onMouseDown={(evento) => {
                if (
                    evento.target ===
                    evento.currentTarget
                ) {
                    onCerrar();
                }
            }}
        >
            <div
                className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable pago-modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tituloPagoModal"
            >
                <div className="modal-content border-0 shadow">
                    {/* ==========================
                        ENCABEZADO
                    ========================== */}

                    <div className="modal-header">
                        <div>
                            <h5
                                id="tituloPagoModal"
                                className="modal-title fw-bold"
                            >
                                <i className="bi bi-cash-coin me-2" />
                                Registrar pago
                            </h5>

                            <small className="text-muted">
                                Crédito #{credito.idCredito}
                            </small>
                        </div>

                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Cerrar"
                            onClick={onCerrar}
                        />
                    </div>

                    <div className="modal-body">
                        {/* ==========================
                            DATOS DEL CRÉDITO
                        ========================== */}

                        <div className="card border-0 bg-light mb-4">
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <small className="text-muted">
                                            Cliente
                                        </small>

                                        <div className="fw-semibold">
                                            {credito.nombreSocio}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <small className="text-muted">
                                            Servicio
                                        </small>

                                        <div className="fw-semibold">
                                            {credito.nombreServicio}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <small className="text-muted">
                                            Saldo de capital
                                        </small>

                                        <div className="fs-5 fw-bold">
                                            {moneda(saldoCapital)}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <small className="text-muted">
                                            Próximo pago
                                        </small>

                                        <div className="fw-semibold">
                                            {fecha(
                                                credito.fecha_proxpago
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ==========================
                            ALERTAS
                        ========================== */}

                        {errorCuotas && (
                            <div className="alert alert-danger">
                                {errorCuotas}
                            </div>
                        )}

                        {tieneMora && (
                            <div className="alert alert-warning">
                                <i className="bi bi-exclamation-triangle me-2" />
                                Este crédito presenta mora.
                                Su tratamiento aún no está habilitado.
                            </div>
                        )}

                        {tieneInteresesAnteriores && (
                            <div className="alert alert-warning">
                                Este crédito tiene intereses
                                anteriores pendientes de conciliación.
                            </div>
                        )}

                        {/* ==========================
                            TIPO DE PAGO
                        ========================== */}

                        <h6 className="fw-bold mb-3">
                            Tipo de operación
                        </h6>

                        <div className="row g-2 mb-4">
                            {TIPOS_PAGO.map((tipo) => (
                                <div
                                    className="col-md-4"
                                    key={tipo.valor}
                                >
                                    <button
                                        type="button"
                                        className={
                                            "pago-tipo-card w-100 " +
                                            (
                                                tipoPago === tipo.valor
                                                    ? "pago-tipo-activo"
                                                    : ""
                                            )
                                        }
                                        onClick={() =>
                                            seleccionarTipo(
                                                tipo.valor
                                            )
                                        }
                                    >
                                        <span className="fw-semibold d-block">
                                            {tipo.titulo}
                                        </span>

                                        <small className="text-muted">
                                            {tipo.descripcion}
                                        </small>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* ==========================
                            CRONOGRAMA
                        ========================== */}

                        {cargandoCuotas ? (
                            <div className="text-center py-4">
                                <div
                                    className="spinner-border text-primary"
                                    role="status"
                                />

                                <p className="mt-2 text-muted">
                                    Consultando cuotas...
                                </p>
                            </div>
                        ) : (
                            <div className="card mb-4">
                                <div className="card-header bg-white">
                                    <strong>
                                        Información del cronograma
                                    </strong>
                                </div>

                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-sm-6">
                                            <small className="text-muted">
                                                Cuotas pendientes
                                            </small>

                                            <div className="fw-bold">
                                                {pendientes.length}
                                            </div>
                                        </div>

                                        <div className="col-sm-6">
                                            <small className="text-muted">
                                                Próxima cuota
                                            </small>

                                            <div className="fw-bold">
                                                {proximaCuota
                                                    ? `#${proximaCuota.numeroCuota}`
                                                    : "Ninguna"}
                                            </div>

                                            {proximaCuota && (
                                                <small className="text-muted">
                                                    {fecha(
                                                        proximaCuota.fechaVencimiento
                                                    )}
                                                    {" — "}
                                                    {moneda(
                                                        proximaCuota.saldoCuota
                                                    )}
                                                </small>
                                            )}
                                        </div>

                                        <div className="col-sm-6">
                                            <small className="text-muted">
                                                Cuota exigible
                                            </small>

                                            <div className="fw-bold">
                                                {cuotaExigible
                                                    ? `#${cuotaExigible.numeroCuota}`
                                                    : "No hay cuotas exigibles"}
                                            </div>
                                        </div>

                                        <div className="col-sm-6">
                                            <small className="text-muted">
                                                Saldo de cuota exigible
                                            </small>

                                            <div className="fw-bold">
                                                {cuotaExigible
                                                    ? moneda(
                                                        cuotaExigible.saldoCuota
                                                    )
                                                    : "No aplica"}
                                            </div>
                                        </div>
                                    </div>

                                    <small className="text-muted d-block mt-3">
                                        Los datos de exigibilidad de esta
                                        sección son orientativos.
                                        La simulación utiliza la fecha
                                        del servidor.
                                    </small>
                                </div>
                            </div>
                        )}

                        {/* ==========================
                            FORMULARIO
                        ========================== */}

                        <div className="row g-3">
                            <div className="col-md-6">
                                <label
                                    htmlFor="pagoMonto"
                                    className="form-label fw-semibold"
                                >
                                    {tipoPago === "EXTRAORDINARIO"
                                        ? "Abono neto a capital"
                                        : "Monto del pago"}
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text">
                                        Q
                                    </span>

                                    <input
                                        id="pagoMonto"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        className="form-control"
                                        placeholder="0.00"
                                        value={monto}
                                        onChange={(e) =>
                                            cambiarMonto(
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-semibold">
                                    Fecha de operación
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    value="Determinada por el servidor"
                                    readOnly
                                />
                            </div>

                            <div className="col-12">
                                <label
                                    htmlFor="pagoObservacion"
                                    className="form-label fw-semibold"
                                >
                                    Observaciones
                                </label>

                                <textarea
                                    id="pagoObservacion"
                                    className="form-control"
                                    rows={3}
                                    maxLength={500}
                                    value={observacion}
                                    onChange={(e) =>
                                        setObservacion(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Observación opcional..."
                                />

                                <div className="text-end text-muted small mt-1">
                                    {observacion.length}/500
                                </div>
                            </div>
                        </div>

                        {/* ==========================
                            POLÍTICA EXTRAORDINARIA
                        ========================== */}

                        {tipoPago === "EXTRAORDINARIO" && (
                            <div className="alert alert-info mt-4">
                                <strong>
                                    Abono extraordinario neto a capital
                                </strong>

                                <p className="mt-2 mb-0">
                                    El abono ingresado se aplica
                                    completamente al capital. Los
                                    intereses devengados se calculan
                                    y cobran adicionalmente.
                                </p>
                            </div>
                        )}

                        {/* ==========================
                            BOTÓN DE SIMULACIÓN
                        ========================== */}

                        <div className="d-flex justify-content-end mt-4">
                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={simularPago}
                                disabled={
                                    cargandoCuotas ||
                                    simulando ||
                                    !!errorCuotas ||
                                    !!errorValidacion
                                }
                            >
                                {simulando ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Simulando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-calculator me-2" />
                                        Simular pago
                                    </>
                                )}
                            </button>
                        </div>

                        {/* ==========================
                            ERRORES DE SIMULACIÓN
                        ========================== */}

                        {errorSimulacion && (
                            <div className="alert alert-danger mt-3 mb-0">
                                <i className="bi bi-exclamation-triangle me-2" />
                                {errorSimulacion}
                            </div>
                        )}

                        {/* ==========================
                            RESULTADO DE SIMULACIÓN
                        ========================== */}

                        {simulacion && (
                            <div className="card border-primary mt-4">
                                <div className="card-header bg-primary text-white">
                                    <strong>
                                        <i className="bi bi-receipt me-2" />
                                        Resultado de la simulación
                                    </strong>
                                </div>

                                <div className="card-body">
                                    <div className="mb-3">
                                        <small className="text-muted">
                                            Fecha calculada por el servidor
                                        </small>

                                        <div className="fw-semibold">
                                            {fecha(
                                                simulacion.fechaSimulacion
                                            )}
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-between mb-2">
                                        <span>
                                            Capital aplicado
                                        </span>

                                        <strong>
                                            {moneda(
                                                simulacion.capitalAplicado
                                            )}
                                        </strong>
                                    </div>

                                    <div className="d-flex justify-content-between mb-2">
                                        <span>
                                            Intereses
                                        </span>

                                        <strong>
                                            {moneda(
                                                simulacion.interesAplicado
                                            )}
                                        </strong>
                                    </div>

                                    <div className="d-flex justify-content-between mb-2">
                                        <span>
                                            Mora
                                        </span>

                                        <strong>
                                            {moneda(
                                                simulacion.moraAplicada
                                            )}
                                        </strong>
                                    </div>

                                    <hr />

                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <strong>
                                            Total a cobrar
                                        </strong>

                                        <h4 className="fw-bold text-primary mb-0">
                                            {moneda(
                                                simulacion.montoTotal
                                            )}
                                        </h4>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-sm-6">
                                            <small className="text-muted">
                                                Saldo anterior
                                            </small>

                                            <div className="fw-semibold">
                                                {moneda(
                                                    simulacion.saldoAnterior
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-sm-6">
                                            <small className="text-muted">
                                                Nuevo saldo de capital
                                            </small>

                                            <div className="fw-bold text-success">
                                                {moneda(
                                                    simulacion.saldoActual
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Aplicaciones a cuotas */}

                                    {Array.isArray(
                                        simulacion.aplicaciones
                                    ) &&
                                        simulacion.aplicaciones.length > 0 && (
                                            <div className="mt-4">
                                                <h6 className="fw-bold">
                                                    Distribución por cuota
                                                </h6>

                                                <div className="table-responsive">
                                                    <table className="table table-sm table-striped align-middle">
                                                        <thead>
                                                            <tr>
                                                                <th>Cuota</th>
                                                                <th className="text-end">
                                                                    Capital
                                                                </th>
                                                                <th className="text-end">
                                                                    Interés
                                                                </th>
                                                                <th className="text-end">
                                                                    Total
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {simulacion.aplicaciones.map(
                                                                (item) => (
                                                                    <tr
                                                                        key={
                                                                            item.numeroCuota
                                                                        }
                                                                    >
                                                                        <td>
                                                                            #{item.numeroCuota}
                                                                        </td>

                                                                        <td className="text-end">
                                                                            {moneda(
                                                                                item.cantidadCapital
                                                                            )}
                                                                        </td>

                                                                        <td className="text-end">
                                                                            {moneda(
                                                                                item.cantidadInteres
                                                                            )}
                                                                        </td>

                                                                        <td className="text-end">
                                                                            {moneda(
                                                                                item.montoAplicado
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                    {/* Cronograma recalculado */}

                                    {Array.isArray(
                                        simulacion.nuevoCronograma
                                    ) &&
                                        simulacion.nuevoCronograma.length > 0 && (
                                            <div className="mt-4">
                                                <h6 className="fw-bold">
                                                    Cronograma recalculado
                                                </h6>

                                                <div className="table-responsive">
                                                    <table className="table table-sm table-striped align-middle">
                                                        <thead>
                                                            <tr>
                                                                <th>Cuota</th>
                                                                <th>Vencimiento</th>

                                                                <th className="text-end">
                                                                    Capital
                                                                </th>

                                                                <th className="text-end">
                                                                    Interés
                                                                </th>

                                                                <th className="text-end">
                                                                    Total
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {simulacion.nuevoCronograma.map(
                                                                (item) => (
                                                                    <tr
                                                                        key={
                                                                            item.numeroCuota
                                                                        }
                                                                    >
                                                                        <td>
                                                                            {item.numeroCuota}
                                                                        </td>

                                                                        <td>
                                                                            {fecha(
                                                                                item.fechaVencimiento
                                                                            )}
                                                                        </td>

                                                                        <td className="text-end">
                                                                            {moneda(
                                                                                item.capitalProgramado
                                                                            )}
                                                                        </td>

                                                                        <td className="text-end">
                                                                            {moneda(
                                                                                item.interesProgramado
                                                                            )}
                                                                        </td>

                                                                        <td className="text-end fw-semibold">
                                                                            {moneda(
                                                                                item.montoCuota
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                    <div className="alert alert-warning mt-3 mb-0">
                                        <i className="bi bi-info-circle me-2" />
                                        Esta operación es únicamente una
                                        simulación. Todavía no se ha
                                        registrado ningún pago.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ==========================
                        PIE DEL MODAL
                    ========================== */}

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={onCerrar}
                        >
                            Cerrar
                        </button>

                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled
                            title="El registro de pagos está pendiente de validación"
                        >
                            <i className="bi bi-lock me-2" />
                            Confirmar pago
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
