
import { useEffect, useRef, useState } from "react";
import creditoService from "../../services/creditoService";
import "./CreditoModal.css";

const fechaHoy = () => {
    const fecha = new Date();
    const offset = fecha.getTimezoneOffset() * 60000;

    return new Date(fecha.getTime() - offset)
        .toISOString()
        .slice(0, 10);
};

const formularioInicial = () => ({
    idSocio: "",
    idTipoServicio: "",
    monto_original: "",
    tasa: "",
    plazo: "",
    idFrecuencia: "",
    fecha_desembolso: fechaHoy(),
    nivelada: false
});

const formatoMoneda = (valor) =>
    new Intl.NumberFormat("es-GT", {
        style: "currency",
        currency: "GTQ"
    }).format(Number(valor || 0));

const formatoFecha = (fecha) => {
    if (!fecha) return "-";

    const [anio, mes, dia] = fecha.slice(0, 10).split("-");

    return `${dia}/${mes}/${anio}`;
};

const sumarMeses = (fechaTexto, meses) => {
    const origen = new Date(`${fechaTexto}T00:00:00Z`);

    if (Number.isNaN(origen.getTime())) return "";

    const diaOriginal = origen.getUTCDate();

    const destino = new Date(Date.UTC(
        origen.getUTCFullYear(),
        origen.getUTCMonth() + meses,
        1
    ));

    const ultimoDia = new Date(Date.UTC(
        destino.getUTCFullYear(),
        destino.getUTCMonth() + 1,
        0
    )).getUTCDate();

    destino.setUTCDate(Math.min(diaOriginal, ultimoDia));

    return destino.toISOString().slice(0, 10);
};

const sumarDias = (fechaTexto, dias) => {
    const fecha = new Date(`${fechaTexto}T00:00:00Z`);

    if (Number.isNaN(fecha.getTime())) return "";

    fecha.setUTCDate(fecha.getUTCDate() + dias);

    return fecha.toISOString().slice(0, 10);
};

function CreditoModal({ mostrar, onCerrar, onGuardado }) {
    const [formulario, setFormulario] = useState(formularioInicial);

    const [catalogos, setCatalogos] = useState({
        socios: [],
        servicios: [],
        frecuencias: []
    });

    const [cargando, setCargando] = useState(false);
    const [simulando, setSimulando] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const [error, setError] = useState("");
    const [simulacion, setSimulacion] = useState(null);

    // Evita utilizar una simulación antigua si el usuario
    // cambia datos mientras la petición sigue en proceso.
    const versionFormulario = useRef(0);

    useEffect(() => {
        if (!mostrar) return;

        let activo = true;

        const cargar = async () => {
            versionFormulario.current += 1;

            setCargando(true);
            setError("");
            setSimulacion(null);
            setFormulario(formularioInicial());

            try {
                const respuesta = await creditoService.obtenerCatalogos();

                if (activo) {
                    setCatalogos(respuesta.datos);
                }
            } catch (err) {
                if (activo) {
                    setError(
                        err.response?.data?.mensaje ||
                        "No fue posible cargar los catálogos."
                    );
                }
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargar();

        return () => {
            activo = false;
            versionFormulario.current += 1;
        };
    }, [mostrar]);

    const actualizarFormulario = (cambios) => {
        versionFormulario.current += 1;
        setSimulacion(null);
        setError("");

        setFormulario((anterior) => ({
            ...anterior,
            ...cambios
        }));
    };

    const cambiarCampo = (event) => {
        const { name, value, type, checked } = event.target;

        actualizarFormulario({
            [name]: type === "checkbox" ? checked : value
        });
    };

    const cambiarServicio = (event) => {
        const idTipoServicio = event.target.value;

        const servicio = catalogos.servicios.find(
            (item) => String(item.idTipo) === idTipoServicio
        );

        actualizarFormulario({
            idTipoServicio,
            tasa: servicio ? String(servicio.tasa) : ""
        });
    };

    const cambiarFrecuencia = (event) => {
        actualizarFormulario({
            idFrecuencia: event.target.value,
            plazo: ""
        });
    };

    const cambiarModalidad = (event) => {
        actualizarFormulario({
            nivelada: event.target.value === "1"
        });
    };

    const servicioSeleccionado = catalogos.servicios.find(
        (item) =>
            String(item.idTipo) === String(formulario.idTipoServicio)
    );

    const frecuenciaSeleccionada = catalogos.frecuencias.find(
        (item) =>
            String(item.idFrecuencia) === String(formulario.idFrecuencia)
    );

    // Coincide con la frecuencia mensual de la base de datos.
    const frecuenciaMensual =
        Number(formulario.idFrecuencia) === 4;

    const unidadPlazo = frecuenciaMensual ? "MESES" : "DIAS";

    const calcularVencimiento = () => {
        if (!formulario.fecha_desembolso || !formulario.plazo) {
            return "";
        }

        const plazo = Number(formulario.plazo);

        if (!Number.isInteger(plazo) || plazo <= 0) {
            return "";
        }

        return frecuenciaMensual
            ? sumarMeses(formulario.fecha_desembolso, plazo)
            : sumarDias(formulario.fecha_desembolso, plazo);
    };

    const construirDatos = () => {
        if (
            !formulario.idSocio ||
            !formulario.idTipoServicio ||
            !formulario.idFrecuencia ||
            formulario.monto_original === "" ||
            formulario.tasa === "" ||
            !formulario.plazo ||
            !formulario.fecha_desembolso
        ) {
            throw new Error(
                "Completa todos los campos obligatorios."
            );
        }

        const monto = Number(formulario.monto_original);
        const tasa = Number(formulario.tasa);
        const plazo = Number(formulario.plazo);

        if (!Number.isFinite(monto) || monto <= 0) {
            throw new Error("Ingresa un monto válido.");
        }

        if (
            !Number.isFinite(tasa) ||
            tasa < 0 ||
            tasa > 999.9999
        ) {
            throw new Error("Ingresa una tasa anual válida.");
        }

        if (
            !Number.isInteger(plazo) ||
            plazo < 1 ||
            plazo > (frecuenciaMensual ? 1200 : 65535)
        ) {
            throw new Error("Ingresa un plazo válido.");
        }

        const datos = {
            idSocio: formulario.idSocio,
            idTipoServicio: Number(formulario.idTipoServicio),
            monto_original: monto,
            tasa,
            unidadPlazo,
            idFrecuencia: Number(formulario.idFrecuencia),
            fecha_desembolso: formulario.fecha_desembolso,
            nivelada: formulario.nivelada
        };

        if (frecuenciaMensual) {
            datos.plazoMeses = plazo;
        } else {
            datos.plazo = plazo;
        }

        return datos;
    };

    const simular = async () => {
        const versionActual = versionFormulario.current;

        try {
            const datos = construirDatos();

            setSimulando(true);
            setError("");
            setSimulacion(null);

            const respuesta = await creditoService.simular(datos);

            if (versionActual !== versionFormulario.current) {
                return;
            }

            if (!respuesta.exito || !respuesta.datos?.cuotas?.length) {
                throw new Error(
                    "El servidor no devolvió un cronograma válido."
                );
            }

            setSimulacion({
                ...respuesta.datos,
                datosCredito: datos
            });
        } catch (err) {
            if (versionActual === versionFormulario.current) {
                setError(
                    err.response?.data?.mensaje ||
                    err.message ||
                    "No fue posible calcular la amortización."
                );
            }
        } finally {
            setSimulando(false);
        }
    };

    const guardar = async (event) => {
        event.preventDefault();

        if (!simulacion) {
            setError(
                "Debes simular la amortización antes de registrar el crédito."
            );
            return;
        }

        const versionActual = versionFormulario.current;

        try {
            setGuardando(true);
            setError("");

            const datos = construirDatos();

            // El backend vuelve a calcular las cuotas y las guarda
            // junto con el crédito dentro de una transacción.
            await creditoService.crear(datos);

            if (versionActual === versionFormulario.current) {
                onGuardado("Crédito y cuotas registrados correctamente.");
            }
        } catch (err) {
            setError(
                err.response?.data?.mensaje ||
                err.message ||
                "No fue posible registrar el crédito."
            );
        } finally {
            setGuardando(false);
        }
    };

    if (!mostrar) return null;

    const ocupado = cargando || simulando || guardando;

    return (
        <div className="credito-modal-overlay">
            <div
                className="credito-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-credito"
            >
                <div className="credito-modal-header">
                    <div>
                        <h2 id="titulo-credito">
                            Registrar Crédito
                        </h2>
                        <p>
                            Configura las condiciones y simula
                            la amortización antes de registrar.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="credito-modal-close"
                        onClick={onCerrar}
                        disabled={guardando}
                        aria-label="Cerrar"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <form onSubmit={guardar}>
                    <div className="credito-modal-body">
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
                                <div className="spinner-border" />
                                <p className="mt-3">
                                    Cargando catálogos...
                                </p>
                            </div>
                        ) : (
                            <>
                                <fieldset
                                    disabled={guardando}
                                    style={{
                                        border: 0,
                                        padding: 0,
                                        margin: 0,
                                        minWidth: 0
                                    }}
                                >
                                    <div className="credito-section-title">
                                        <i className="bi bi-person-vcard" />
                                        <span>Socio y servicio</span>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Socio *
                                            </label>

                                            <select
                                                className="form-select"
                                                name="idSocio"
                                                value={formulario.idSocio}
                                                onChange={cambiarCampo}
                                                required
                                            >
                                                <option value="">
                                                    Selecciona un socio
                                                </option>

                                                {catalogos.socios.map((socio) => (
                                                    <option
                                                        key={socio.idSocio}
                                                        value={socio.idSocio}
                                                    >
                                                        {socio.idSocio} - {socio.nombreCompleto}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Servicio *
                                            </label>

                                            <select
                                                className="form-select"
                                                name="idTipoServicio"
                                                value={formulario.idTipoServicio}
                                                onChange={cambiarServicio}
                                                required
                                            >
                                                <option value="">
                                                    Selecciona un servicio
                                                </option>

                                                {catalogos.servicios.map((servicio) => (
                                                    <option
                                                        key={servicio.idTipo}
                                                        value={servicio.idTipo}
                                                    >
                                                        {servicio.nombreServicio}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {servicioSeleccionado && (
                                            <div className="col-12">
                                                <div className="credito-info">
                                                    <i className="bi bi-shield-check" />
                                                    {" "}Garantía:{" "}
                                                    <strong>
                                                        {servicioSeleccionado.garantia}
                                                    </strong>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="credito-section-title">
                                        <i className="bi bi-cash-stack" />
                                        <span>Condiciones financieras</span>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Monto del crédito (Q) *
                                            </label>

                                            <input
                                                type="number"
                                                className="form-control"
                                                name="monto_original"
                                                value={formulario.monto_original}
                                                onChange={cambiarCampo}
                                                min="0.01"
                                                step="0.01"
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Tasa de interés anual (%) *
                                            </label>

                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="tasa"
                                                    value={formulario.tasa}
                                                    onChange={cambiarCampo}
                                                    min="0"
                                                    max="999.9999"
                                                    step="0.0001"
                                                    required
                                                />
                                                <span className="input-group-text">
                                                    % anual
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Frecuencia de pago *
                                            </label>

                                            <select
                                                className="form-select"
                                                name="idFrecuencia"
                                                value={formulario.idFrecuencia}
                                                onChange={cambiarFrecuencia}
                                                required
                                            >
                                                <option value="">
                                                    Selecciona una frecuencia
                                                </option>

                                                {catalogos.frecuencias.map((frecuencia) => (
                                                    <option
                                                        key={frecuencia.idFrecuencia}
                                                        value={frecuencia.idFrecuencia}
                                                    >
                                                        {frecuencia.descripcion}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Plazo ({frecuenciaMensual ? "meses" : "días"}) *
                                            </label>

                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="plazo"
                                                    value={formulario.plazo}
                                                    onChange={cambiarCampo}
                                                    min="1"
                                                    max={frecuenciaMensual ? 1200 : 65535}
                                                    step="1"
                                                    required
                                                />
                                                <span className="input-group-text">
                                                    {frecuenciaMensual ? "Meses" : "Días"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Fecha de desembolso *
                                            </label>

                                            <input
                                                type="date"
                                                className="form-control"
                                                name="fecha_desembolso"
                                                value={formulario.fecha_desembolso}
                                                onChange={cambiarCampo}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Fecha de vencimiento
                                            </label>

                                            <input
                                                type="date"
                                                className="form-control"
                                                value={
                                                    simulacion?.resumen?.fechaUltimoPago ||
                                                    calcularVencimiento()
                                                }
                                                readOnly
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label">
                                                Modalidad de amortización
                                            </label>

                                            <select
                                                className="form-select"
                                                value={formulario.nivelada ? "1" : "0"}
                                                onChange={cambiarModalidad}
                                            >
                                                <option value="0">
                                                    Sobre saldos (capital constante)
                                                </option>
                                                <option value="1">
                                                    Cuota nivelada
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="credito-info mt-4">
                                        <i className="bi bi-info-circle" />
                                        {" "}Los intereses se calculan sobre
                                        el saldo de capital, utilizando la
                                        tasa anual y los días reales
                                        transcurridos / 365.
                                    </div>
                                </fieldset>

                                <div className="d-flex justify-content-end mt-4">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={simular}
                                        disabled={ocupado}
                                    >
                                        {simulando ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    aria-hidden="true"
                                                />
                                                Calculando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-calculator me-2" />
                                                Simular amortización
                                            </>
                                        )}
                                    </button>
                                </div>

                                {simulacion && (
                                    <div className="mt-4">
                                        <div className="credito-section-title">
                                            <i className="bi bi-table" />
                                            <span>
                                                Tabla de amortización
                                            </span>
                                        </div>

                                        <div className="row g-3 mb-3">
                                            <div className="col-md-3 col-6">
                                                <div className="border rounded p-3 h-100">
                                                    <small className="text-muted">
                                                        Cuotas
                                                    </small>
                                                    <div className="fw-bold fs-5">
                                                        {simulacion.resumen.numeroCuotas}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-3 col-6">
                                                <div className="border rounded p-3 h-100">
                                                    <small className="text-muted">
                                                        Capital
                                                    </small>
                                                    <div className="fw-bold">
                                                        {formatoMoneda(
                                                            simulacion.resumen.totalCapital
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-3 col-6">
                                                <div className="border rounded p-3 h-100">
                                                    <small className="text-muted">
                                                        Intereses
                                                    </small>
                                                    <div className="fw-bold">
                                                        {formatoMoneda(
                                                            simulacion.resumen.totalIntereses
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-3 col-6">
                                                <div className="border rounded p-3 h-100">
                                                    <small className="text-muted">
                                                        Total a pagar
                                                    </small>
                                                    <div className="fw-bold">
                                                        {formatoMoneda(
                                                            simulacion.resumen.totalPagar
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="table-responsive border rounded"
                                            style={{
                                                maxHeight: "350px",
                                                overflowY: "auto"
                                            }}
                                        >
                                            <table className="table table-sm table-hover table-striped align-middle mb-0">
                                                <thead
                                                    className="table-light"
                                                    style={{
                                                        position: "sticky",
                                                        top: 0,
                                                        zIndex: 1
                                                    }}
                                                >
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Vencimiento</th>
                                                        <th className="text-end">
                                                            Días
                                                        </th>
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
                                                            Saldo capital
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {simulacion.cuotas.map((cuota) => (
                                                        <tr key={cuota.numeroCuota}>
                                                            <td>
                                                                {cuota.numeroCuota}
                                                            </td>
                                                            <td>
                                                                {formatoFecha(
                                                                    cuota.fechaVencimiento
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                {cuota.diasPeriodo}
                                                            </td>
                                                            <td className="text-end">
                                                                {formatoMoneda(
                                                                    cuota.capitalProgramado
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                {formatoMoneda(
                                                                    cuota.interesProgramado
                                                                )}
                                                            </td>
                                                            <td className="text-end fw-semibold">
                                                                {formatoMoneda(
                                                                    cuota.montoCuota
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                {formatoMoneda(
                                                                    cuota.saldoCapital
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>

                                                <tfoot className="table-light">
                                                    <tr className="fw-bold">
                                                        <td colSpan={3}>
                                                            Totales
                                                        </td>
                                                        <td className="text-end">
                                                            {formatoMoneda(
                                                                simulacion.resumen.totalCapital
                                                            )}
                                                        </td>
                                                        <td className="text-end">
                                                            {formatoMoneda(
                                                                simulacion.resumen.totalIntereses
                                                            )}
                                                        </td>
                                                        <td className="text-end">
                                                            {formatoMoneda(
                                                                simulacion.resumen.totalPagar
                                                            )}
                                                        </td>
                                                        <td className="text-end">
                                                            {formatoMoneda(0)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        <div className="alert alert-success mt-3 mb-0">
                                            <i className="bi bi-check-circle me-2" />
                                            Simulación completada. Revisa las
                                            cuotas antes de registrar el crédito.
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="credito-modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={onCerrar}
                            disabled={guardando}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                                ocupado ||
                                !simulacion
                            }
                        >
                            {guardando ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        aria-hidden="true"
                                    />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-circle me-2" />
                                    Registrar Crédito
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreditoModal;
