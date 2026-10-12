
const db = require("../config/database");
const PagoService = require("./PagoService");

class SimulacionPagoService {
    static error(mensaje, status = 400) {
        const error = new Error(mensaje);
        error.status = status;
        return error;
    }

    static centavos(valor) {
        return PagoService.centavos(valor);
    }

    static dinero(valor) {
        return PagoService.dinero(valor);
    }

    static fechaISO(valor) {
        return PagoService.fechaISO(valor);
    }

    static async simular(datos = {}) {
        const idPais = Number(datos.idPais ?? 320);
        const idSocio = String(datos.idSocio ?? "").trim();
        const idTipoServicio = Number(datos.idTipoServicio);
        const idCredito = Number(datos.idCredito);
        const tipoPago = String(datos.tipoPago ?? "")
            .trim()
            .toUpperCase();

        const monto = Number(datos.monto);

        if (
            !Number.isSafeInteger(idPais) ||
            idPais <= 0 ||
            !idSocio ||
            !Number.isSafeInteger(idTipoServicio) ||
            idTipoServicio <= 0 ||
            !Number.isSafeInteger(idCredito) ||
            idCredito <= 0
        ) {
            throw this.error(
                "Los identificadores del crédito son inválidos."
            );
        }

        if (
            !["CUOTA", "PARCIAL", "EXTRAORDINARIO"]
                .includes(tipoPago)
        ) {
            throw this.error("El tipo de pago es inválido.");
        }

        if (
            !Number.isFinite(monto) ||
            monto <= 0 ||
            Math.abs(
                Math.round(monto * 100) - monto * 100
            ) > 0.000001
        ) {
            throw this.error(
                "El importe debe ser positivo y tener como máximo dos decimales."
            );
        }

        const montoCentavos = this.centavos(monto);
        const conexion = await db.getConnection();
        let transaccionIniciada = false;

        try {
            // Lectura consistente, sin modificaciones.
            await conexion.query(
                "START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY"
            );

            transaccionIniciada = true;

            const [[reloj]] = await conexion.query(
                "SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy"
            );

            const hoy = reloj.hoy;

            const parametros = [
                idPais,
                idSocio,
                idTipoServicio,
                idCredito
            ];

            const [creditos] = await conexion.query(`
                SELECT
                    saldo_actual,
                    tasa,
                    fecha_desembolso,
                    fecha_calc_intereses,
                    idEstadoServicio,
                    mora,
                    monto_mora,
                    intereses_venc,
                    nivelada
                FROM creditos
                WHERE idPais = ?
                    AND idSocio = ?
                    AND idTipoServicio = ?
                    AND idCredito = ?
            `, parametros);

            const credito = creditos[0];

            if (!credito) {
                throw this.error(
                    "El crédito no existe.", 404
                );
            }

            if (
                ![1, 4, 5].includes(
                    Number(credito.idEstadoServicio)
                )
            ) {
                throw this.error(
                    "El estado del crédito no permite pagos."
                );
            }

            if (
                Number(credito.mora) === 1 ||
                this.centavos(credito.monto_mora) > 0
            ) {
                throw this.error(
                    "El crédito tiene mora y requiere tratamiento específico."
                );
            }

            const saldoAnterior = this.centavos(
                credito.saldo_actual
            );

            if (saldoAnterior <= 0) {
                throw this.error(
                    "El crédito no tiene capital pendiente."
                );
            }

            const [cuotas] = await conexion.query(`
                SELECT
                    numeroCuota,
                    DATE_FORMAT(
                        fechaVencimiento, '%Y-%m-%d'
                    ) AS fechaVencimiento,
                    capitalProgramado,
                    interesProgramado,
                    montoCuota,
                    montoPagado,
                    saldoCuota,
                    pagada
                FROM cuotas
                WHERE idPais = ?
                    AND idSocio = ?
                    AND idTipoServicio = ?
                    AND idCredito = ?
                ORDER BY numeroCuota
            `, parametros);

            if (!cuotas.length) {
                throw this.error(
                    "No existe un cronograma para el crédito."
                );
            }

            let capitalAplicado = 0;
            let interesAplicado = 0;
            let montoTotal = montoCentavos;
            let nuevoCronograma = [];

            const aplicaciones = [];

            // ==================================
            // ABONO EXTRAORDINARIO - OPCIÓN A
            // ==================================

            if (tipoPago === "EXTRAORDINARIO") {
                if (montoCentavos >= saldoAnterior) {
                    throw this.error(
                        "El abono debe ser menor al saldo capital; " +
                        "la liquidación total es otra operación."
                    );
                }

                if (cuotas.some((c) =>
                    this.centavos(c.saldoCuota) > 0 &&
                    c.fechaVencimiento <= hoy
                )) {
                    throw this.error(
                        "Debes cancelar las cuotas exigibles " +
                        "antes del abono extraordinario."
                    );
                }

                const futuras = cuotas.filter((c) =>
                    this.centavos(c.saldoCuota) > 0 &&
                    c.fechaVencimiento > hoy
                );

                if (
                    !futuras.length ||
                    futuras.some((c) =>
                        this.centavos(c.montoPagado) > 0
                    )
                ) {
                    throw this.error(
                        "No se pueden recalcular cuotas futuras " +
                        "ya pagadas parcialmente."
                    );
                }

                if (
                    this.centavos(
                        credito.intereses_venc
                    ) !== 0
                ) {
                    throw this.error(
                        "Existen intereses pendientes anteriores " +
                        "que deben conciliarse."
                    );
                }

                const fechaBase = this.fechaISO(
                    credito.fecha_calc_intereses ||
                    credito.fecha_desembolso
                );

                const diasDevengados =
                    PagoService.diasEntre(
                        fechaBase,
                        hoy
                    );

                if (diasDevengados < 0) {
                    throw this.error(
                        "La fecha base de intereses es futura."
                    );
                }

                const tasa = Number(credito.tasa);

                if (
                    !Number.isFinite(tasa) ||
                    tasa < 0
                ) {
                    throw this.error(
                        "Tasa anual inválida."
                    );
                }

                interesAplicado = Math.round(
                    saldoAnterior *
                    (tasa / 100 / 365) *
                    diasDevengados
                );

                capitalAplicado = montoCentavos;

                montoTotal =
                    capitalAplicado + interesAplicado;

                if (!Number.isSafeInteger(montoTotal)) {
                    throw this.error(
                        "Importe fuera de rango."
                    );
                }

                nuevoCronograma =
                    PagoService.calcularCronograma({
                        capitalCentavos:
                            saldoAnterior - capitalAplicado,
                        tasaAnual: tasa,
                        fechaInicio: hoy,
                        cuotas: futuras,
                        nivelada:
                            Number(credito.nivelada) === 1
                    });

            } else {
                // ==================================
                // CUOTA Y PARCIAL - OPCIÓN B
                // ==================================

                const exigibles = cuotas.filter((c) =>
                    this.centavos(c.saldoCuota) > 0 &&
                    c.fechaVencimiento <= hoy
                );

                if (!exigibles.length) {
                    throw this.error(
                        "No hay cuotas exigibles actualmente."
                    );
                }

                const totalExigible = exigibles.reduce(
                    (s, c) =>
                        s + this.centavos(c.saldoCuota),
                    0
                );

                if (montoCentavos > totalExigible) {
                    throw this.error(
                        `El pago supera lo exigible: Q${this.dinero(totalExigible).toFixed(2)}.`
                    );
                }

                if (
                    tipoPago === "CUOTA" &&
                    montoCentavos !==
                    this.centavos(exigibles[0].saldoCuota)
                ) {
                    throw this.error(
                        "El pago completo de la primera cuota es " +
                        `Q${Number(exigibles[0].saldoCuota).toFixed(2)}.`
                    );
                }

                if (
                    this.centavos(
                        credito.intereses_venc
                    ) !== 0
                ) {
                    throw this.error(
                        "Existen intereses pendientes anteriores; " +
                        "se requiere conciliación."
                    );
                }

                const [pagosPrevios] =
                    await conexion.query(`
                        SELECT
                            pd.numeroCuota,
                            COALESCE(
                                SUM(pd.cantidadCapital), 0
                            ) AS capitalPagado,
                            COALESCE(
                                SUM(pd.cantidadInteres), 0
                            ) AS interesPagado
                        FROM pagosdetalle pd
                        INNER JOIN pagos p
                            ON p.idPago = pd.idPago
                        WHERE p.idPais = ?
                            AND p.idSocio = ?
                            AND p.idTipoServicio = ?
                            AND p.idCredito = ?
                            AND p.activo = 1
                        GROUP BY pd.numeroCuota
                    `, parametros);

                const previos = new Map(
                    pagosPrevios.map((p) => [
                        Number(p.numeroCuota),
                        p
                    ])
                );

                let restante = montoCentavos;

                for (const cuota of exigibles) {
                    if (restante === 0) break;

                    const previo = previos.get(
                        Number(cuota.numeroCuota)
                    );

                    const saldo = this.centavos(
                        cuota.saldoCuota
                    );

                    const interesPendiente = Math.max(
                        0,
                        this.centavos(
                            cuota.interesProgramado
                        ) -
                        this.centavos(
                            previo?.interesPagado ?? 0
                        )
                    );

                    const capitalPendiente = Math.max(
                        0,
                        this.centavos(
                            cuota.capitalProgramado
                        ) -
                        this.centavos(
                            previo?.capitalPagado ?? 0
                        )
                    );

                    if (
                        interesPendiente +
                        capitalPendiente !== saldo
                    ) {
                        throw this.error(
                            `La cuota ${cuota.numeroCuota} ` +
                            "presenta diferencias contables."
                        );
                    }

                    const aplicar = Math.min(
                        restante,
                        saldo
                    );

                    const interes = Math.min(
                        aplicar,
                        interesPendiente
                    );

                    const capital = aplicar - interes;

                    capitalAplicado += capital;
                    interesAplicado += interes;

                    aplicaciones.push({
                        numeroCuota: cuota.numeroCuota,
                        fechaVencimiento:
                            cuota.fechaVencimiento,
                        montoAplicado:
                            this.dinero(aplicar),
                        cantidadInteres:
                            this.dinero(interes),
                        cantidadCapital:
                            this.dinero(capital),
                        saldoCuotaResultante:
                            this.dinero(saldo - aplicar)
                    });

                    restante -= aplicar;

                    if (tipoPago === "CUOTA") break;
                }

                if (restante !== 0) {
                    throw this.error(
                        "No fue posible distribuir todo el importe."
                    );
                }

                if (capitalAplicado > saldoAnterior) {
                    throw this.error(
                        "El abono supera el saldo de capital."
                    );
                }
            }

            await conexion.commit();
            transaccionIniciada = false;

            return {
                tipoPago,
                fechaSimulacion: hoy,

                montoIngresado:
                    this.dinero(montoCentavos),

                capitalAplicado:
                    this.dinero(capitalAplicado),

                interesAplicado:
                    this.dinero(interesAplicado),

                moraAplicada: 0,

                montoTotal:
                    this.dinero(montoTotal),

                saldoAnterior:
                    this.dinero(saldoAnterior),

                saldoActual:
                    this.dinero(
                        saldoAnterior - capitalAplicado
                    ),

                aplicaciones,
                nuevoCronograma,

                requiereConfirmacionServidor: true
            };

        } catch (error) {
            if (transaccionIniciada) {
                await conexion.rollback();
            }

            throw error;

        } finally {
            conexion.release();
        }
    }
}

module.exports = SimulacionPagoService;
