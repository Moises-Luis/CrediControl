
const db = require("../config/database");
const PagoModel = require("../models/PagoModel");

class PagoService {

    // ==========================================
    // UTILIDADES
    // ==========================================

    static ERROR(mensaje, estado = 400) {
        const error = new Error(mensaje);
        error.status = estado;
        return error;
    }

    static centavos(valor) {
        const numero = Number(valor);

        if (!Number.isFinite(numero)) {
            throw this.ERROR("El importe debe ser numérico.");
        }

        const resultado = Math.round(
            (numero + Number.EPSILON) * 100
        );

        if (!Number.isSafeInteger(resultado)) {
            throw this.ERROR(
                "El importe excede el rango permitido."
            );
        }

        return resultado;
    }

    static dinero(centavos) {
        return Number((centavos / 100).toFixed(2));
    }

    static fechaISO(valor) {
        if (!valor) return null;

        if (valor instanceof Date) {
            return [
                valor.getUTCFullYear(),
                String(valor.getUTCMonth() + 1).padStart(2, "0"),
                String(valor.getUTCDate()).padStart(2, "0")
            ].join("-");
        }

        return String(valor).slice(0, 10);
    }

    static diasEntre(inicio, fin) {
        const a = Date.parse(
            `${this.fechaISO(inicio)}T00:00:00Z`
        );

        const b = Date.parse(
            `${this.fechaISO(fin)}T00:00:00Z`
        );

        if (!Number.isFinite(a) || !Number.isFinite(b)) {
            throw this.ERROR(
                "Las fechas del cronograma son inválidas."
            );
        }

        return Math.round((b - a) / 86400000);
    }

    static validarIdentificadores(datos) {
        const idPais = Number(datos.idPais ?? 320);
        const idSocio = String(datos.idSocio ?? "").trim();
        const idTipoServicio = Number(datos.idTipoServicio);
        const idCredito = Number(datos.idCredito);
        const idUsuario = Number(datos.idUsuario);

        if (
            !Number.isInteger(idPais) ||
            idPais <= 0 ||
            !idSocio ||
            !Number.isInteger(idTipoServicio) ||
            idTipoServicio <= 0 ||
            !Number.isInteger(idCredito) ||
            idCredito <= 0 ||
            !Number.isInteger(idUsuario) ||
            idUsuario <= 0
        ) {
            throw this.ERROR(
                "Los identificadores del pago son inválidos."
            );
        }

        return {
            idPais,
            idSocio,
            idTipoServicio,
            idCredito,
            idUsuario
        };
    }

    static async fechaServidor(conexion) {
        const [filas] = await conexion.query(`
            SELECT
                DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy,
                NOW() AS fechaHora
        `);

        return filas[0];
    }

    static resumenCredito(credito, cuotas) {
        return {
            idPais: credito.idPais,
            idSocio: credito.idSocio,
            idTipoServicio: credito.idTipoServicio,
            idCredito: credito.idCredito,
            saldoCapital: this.dinero(
                this.centavos(credito.saldo_actual)
            ),
            fechaProximoPago: this.fechaISO(
                credito.fecha_proxpago
            ),
            cuotasPendientes: cuotas.filter(
                (c) => this.centavos(c.saldoCuota) > 0
            ).length
        };
    }

    static obtenerFechaProxima(cuotas) {
        const pendiente = cuotas.find(
            (cuota) => this.centavos(cuota.saldoCuota) > 0
        );

        return pendiente
            ? this.fechaISO(pendiente.fechaVencimiento)
            : null;
    }

    static prepararActualizacionCredito(credito, cambios) {
        return {
            saldo_actual: credito.saldo_actual,
            fecha_proxpago: credito.fecha_proxpago,
            fecha_calc_intereses: credito.fecha_calc_intereses,
            cuota_fijada: credito.cuota_fijada,
            pago_parcial: credito.pago_parcial,
            intereses_venc: credito.intereses_venc,
            mora: credito.mora,
            monto_mora: credito.monto_mora,
            veces_mora: credito.veces_mora,
            idEstadoServicio: credito.idEstadoServicio,
            ...cambios
        };
    }

    // ==========================================
    // REGISTRAR PAGO
    // ==========================================

    static async registrar(datos) {
        const tipo = String(datos.tipoPago ?? "")
            .trim()
            .toUpperCase();

        if (
            !["CUOTA", "PARCIAL", "EXTRAORDINARIO"]
                .includes(tipo)
        ) {
            throw this.ERROR(
                "Tipo de pago inválido. Utiliza CUOTA, PARCIAL o EXTRAORDINARIO."
            );
        }

        const ids = this.validarIdentificadores(datos);

        const montoCentavos = this.centavos(datos.monto);

        if (montoCentavos <= 0) {
            throw this.ERROR(
                "El monto del pago debe ser mayor que cero."
            );
        }

        const observacion = String(
            datos.observacion ?? ""
        ).trim();

        if (observacion.length > 500) {
            throw this.ERROR(
                "La observación no puede superar 500 caracteres."
            );
        }

        const conexion = await db.getConnection();

        try {
            await conexion.beginTransaction();

            const fechaServidor =
                await this.fechaServidor(conexion);

            const hoy = fechaServidor.hoy;

            const credito =
                await PagoModel.obtenerCreditoParaActualizar(
                    conexion,
                    ids.idPais,
                    ids.idSocio,
                    ids.idTipoServicio,
                    ids.idCredito
                );

            if (!credito) {
                throw this.ERROR(
                    "El crédito no existe.", 404
                );
            }

            if (
                ![1, 4, 5].includes(
                    Number(credito.idEstadoServicio)
                )
            ) {
                throw this.ERROR(
                    "El estado actual del crédito no permite registrar pagos."
                );
            }

            if (
                this.centavos(credito.saldo_actual) <= 0
            ) {
                throw this.ERROR(
                    "El crédito no tiene capital pendiente."
                );
            }

            // Temporalmente no se procesan créditos
            // con mora hasta implementar su cálculo.
            if (
                Number(credito.mora) === 1 ||
                this.centavos(credito.monto_mora) > 0
            ) {
                throw this.ERROR(
                    "Este crédito tiene mora. Debe liquidarse mediante una " +
                    "operación específica antes de registrar pagos."
                );
            }

            // No mezclar intereses históricos pendientes
            // con la nueva política de pagos.
            if (
                this.centavos(
                    credito.intereses_venc || 0
                ) !== 0
            ) {
                throw this.ERROR(
                    "Existen intereses anteriores pendientes; se requiere conciliación."
                );
            }

            const cuotas =
                await PagoModel.obtenerCuotasParaActualizar(
                    conexion,
                    ids.idPais,
                    ids.idSocio,
                    ids.idTipoServicio,
                    ids.idCredito
                );

            if (!cuotas.length) {
                throw this.ERROR(
                    "El crédito no tiene un cronograma registrado."
                );
            }

            let resultado;

            if (tipo === "EXTRAORDINARIO") {
                resultado = await this.registrarExtraordinario({
                    conexion,
                    ids,
                    credito,
                    cuotas,
                    montoCentavos,
                    observacion,
                    hoy,
                    fechaHora: fechaServidor.fechaHora
                });
            } else {
                resultado = await this.registrarOrdinario({
                    conexion,
                    ids,
                    credito,
                    cuotas,
                    tipo,
                    montoCentavos,
                    observacion,
                    hoy,
                    fechaHora: fechaServidor.fechaHora
                });
            }

            await conexion.commit();

            return resultado;

        } catch (error) {
            await conexion.rollback();
            throw error;

        } finally {
            conexion.release();
        }
    }

    // ==========================================
    // PAGO DE CUOTA O PARCIAL
    // POLÍTICA B: INTERESES PRIMERO
    // ==========================================

    static async registrarOrdinario({
        conexion,
        ids,
        credito,
        cuotas,
        tipo,
        montoCentavos,
        observacion,
        hoy,
        fechaHora
    }) {
        const exigibles = cuotas.filter(
            (cuota) =>
                this.centavos(cuota.saldoCuota) > 0 &&
                this.fechaISO(cuota.fechaVencimiento) <= hoy
        );

        if (!exigibles.length) {
            throw this.ERROR(
                "No existen cuotas vencidas o exigibles. " +
                "Para reducir capital anticipadamente utiliza un abono extraordinario."
            );
        }

        const totalExigible = exigibles.reduce(
            (total, cuota) =>
                total + this.centavos(cuota.saldoCuota),
            0
        );

        if (montoCentavos > totalExigible) {
            throw this.ERROR(
                `El monto supera el total exigible de ${this.dinero(totalExigible)}.`
            );
        }

        if (tipo === "CUOTA") {
            const primera = this.centavos(
                exigibles[0].saldoCuota
            );

            if (montoCentavos !== primera) {
                throw this.ERROR(
                    `Para pagar la cuota completa debes ingresar ${this.dinero(primera)}.`
                );
            }
        }

        let restante = montoCentavos;
        let totalCapital = 0;
        let totalInteres = 0;

        const aplicaciones = [];

        for (const cuota of exigibles) {
            if (restante <= 0) break;

            const saldoCuota = this.centavos(
                cuota.saldoCuota
            );

            const aplicar = Math.min(
                restante,
                saldoCuota
            );

            // Obtener los pagos anteriores de esta cuota
            // para no volver a cobrar intereses pagados.
            const [pagosPrevios] =
                await conexion.query(`
                    SELECT
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
                      AND pd.numeroCuota = ?
                      AND p.activo = 1
                `, [
                    ids.idPais,
                    ids.idSocio,
                    ids.idTipoServicio,
                    ids.idCredito,
                    cuota.numeroCuota
                ]);

            const previo = pagosPrevios[0];

            const interesPendiente = Math.max(
                0,
                this.centavos(
                    cuota.interesProgramado
                ) -
                this.centavos(
                    previo.interesPagado
                )
            );

            const capitalPendiente = Math.max(
                0,
                this.centavos(
                    cuota.capitalProgramado
                ) -
                this.centavos(
                    previo.capitalPagado
                )
            );

            if (
                interesPendiente +
                capitalPendiente !== saldoCuota
            ) {
                throw this.ERROR(
                    `La cuota ${cuota.numeroCuota} presenta diferencias ` +
                    "entre su saldo y los pagos registrados."
                );
            }

            // Intereses primero; resto a capital.
            const interes = Math.min(
                aplicar,
                interesPendiente
            );

            const capital = aplicar - interes;

            if (capital > capitalPendiente) {
                throw this.ERROR(
                    `El capital aplicado a la cuota ${cuota.numeroCuota} es inválido.`
                );
            }

            aplicaciones.push({
                numeroCuota: cuota.numeroCuota,
                cantidadCapital: this.dinero(capital),
                cantidadInteres: this.dinero(interes),
                cantidadMora: 0,
                montoAplicado: this.dinero(aplicar),

                montoPagado: this.dinero(
                    this.centavos(cuota.montoPagado) +
                    aplicar
                ),

                saldoCuota: this.dinero(
                    saldoCuota - aplicar
                ),

                pagada:
                    saldoCuota - aplicar === 0
            });

            totalCapital += capital;
            totalInteres += interes;
            restante -= aplicar;

            if (tipo === "CUOTA") break;
        }

        if (restante !== 0) {
            throw this.ERROR(
                "No fue posible distribuir completamente el pago."
            );
        }

        const saldoAnterior = this.centavos(
            credito.saldo_actual
        );

        const saldoActual =
            saldoAnterior - totalCapital;

        if (saldoActual < 0) {
            throw this.ERROR(
                "El capital aplicado supera el saldo del crédito."
            );
        }

        // ==================================
        // INSERTAR PAGO
        // ==================================

        const idPago = await PagoModel.insertarPago(
            conexion,
            {
                ...ids,

                numeroCuota:
                    aplicaciones.length === 1
                        ? aplicaciones[0].numeroCuota
                        : null,

                fechaPago: fechaHora,

                cantidadCapital:
                    this.dinero(totalCapital),

                cantidadInteres:
                    this.dinero(totalInteres),

                cantidadMora: 0,

                montoTotal:
                    this.dinero(montoCentavos),

                observacion
            }
        );

        // ==================================
        // ACTUALIZAR CUOTAS
        // ==================================

        for (const aplicacion of aplicaciones) {
            await PagoModel.insertarPagoDetalle(
                conexion,
                idPago,
                aplicacion
            );

            await PagoModel.actualizarCuota(
                conexion,
                ids,
                aplicacion
            );

            const cuota = cuotas.find(
                (c) =>
                    Number(c.numeroCuota) ===
                    Number(aplicacion.numeroCuota)
            );

            cuota.montoPagado =
                aplicacion.montoPagado;

            cuota.saldoCuota =
                aplicacion.saldoCuota;

            cuota.pagada =
                aplicacion.pagada;
        }

        const fechaProxima =
            this.obtenerFechaProxima(cuotas);

        const todasPagadas = cuotas.every(
            (c) =>
                this.centavos(c.saldoCuota) === 0
        );

        if (todasPagadas && saldoActual !== 0) {
            throw this.ERROR(
                "Todas las cuotas están pagadas, pero aún existe saldo de capital."
            );
        }

        if (saldoActual === 0 && !todasPagadas) {
            throw this.ERROR(
                "El saldo de capital llegó a cero, pero existen cuotas pendientes."
            );
        }

        const estadoNuevo = todasPagadas
            ? 3
            : credito.idEstadoServicio;

        // ==================================
        // FECHA DE CÁLCULO DE INTERESES
        // ==================================

        const ultimaFechaLiquidada = cuotas
            .filter(
                (c) =>
                    this.centavos(c.saldoCuota) === 0 &&
                    this.fechaISO(
                        c.fechaVencimiento
                    ) <= hoy
            )
            .map(
                (c) =>
                    this.fechaISO(
                        c.fechaVencimiento
                    )
            )
            .sort()
            .at(-1);

        const fechaBaseAnterior = this.fechaISO(
            credito.fecha_calc_intereses ||
            credito.fecha_desembolso
        );

        const fechaBaseNueva =
            ultimaFechaLiquidada &&
            ultimaFechaLiquidada > fechaBaseAnterior
                ? ultimaFechaLiquidada
                : fechaBaseAnterior;

        // pago_parcial representa el dinero abonado
        // a la primera cuota todavía no liquidada.
        const cuotaParcial = cuotas.find(
            (c) =>
                this.centavos(c.saldoCuota) > 0 &&
                this.centavos(c.montoPagado) > 0
        );

        const datosCredito =
            this.prepararActualizacionCredito(
                credito,
                {
                    saldo_actual:
                        this.dinero(saldoActual),

                    fecha_proxpago:
                        fechaProxima,

                    fecha_calc_intereses:
                        fechaBaseNueva,

                    intereses_venc: 0,

                    idEstadoServicio:
                        estadoNuevo,

                    pago_parcial: cuotaParcial
                        ? this.dinero(
                            this.centavos(
                                cuotaParcial.montoPagado
                            )
                        )
                        : 0
                }
            );

        await PagoModel.actualizarCredito(
            conexion,
            ids,
            datosCredito
        );

        // ==================================
        // MOVIMIENTO DEL CRÉDITO
        // ==================================

        await PagoModel.insertarMovimiento(
            conexion,
            {
                ...ids,

                idPago,

                tipoMovimiento:
                    tipo === "CUOTA"
                        ? "PAGO_CUOTA"
                        : "PAGO_PARCIAL",

                cantidadCapital:
                    this.dinero(totalCapital),

                cantidadInteres:
                    this.dinero(totalInteres),

                cantidadMora: 0,

                saldoAnterior:
                    this.dinero(saldoAnterior),

                saldoActual:
                    this.dinero(saldoActual),

                fechaProximoPagoAnterior:
                    this.fechaISO(
                        credito.fecha_proxpago
                    ),

                fechaProximoPago:
                    fechaProxima,

                fechaCalculoInteresesAnterior:
                    this.fechaISO(
                        credito.fecha_calc_intereses
                    ),

                fechaCalculoIntereses:
                    fechaBaseNueva,

                moraAnterior:
                    credito.mora,

                montoMoraAnterior:
                    credito.monto_mora,

                vecesMoraAnterior:
                    credito.veces_mora,

                idEstado:
                    estadoNuevo,

                observacion
            }
        );

        return {
            exito: true,
            mensaje: "Pago registrado correctamente.",
            idPago,
            tipoPago: tipo,

            montoPagado:
                this.dinero(montoCentavos),

            capitalAplicado:
                this.dinero(totalCapital),

            interesAplicado:
                this.dinero(totalInteres),

            interesesPendientes: 0,

            saldoAnterior:
                this.dinero(saldoAnterior),

            saldoActual:
                this.dinero(saldoActual),

            cuotasAfectadas:
                aplicaciones
        };
    }

    // ==========================================
    // RECALCULAR CRONOGRAMA
    // ==========================================

    static calcularCronograma({
        capitalCentavos,
        tasaAnual,
        fechaInicio,
        cuotas,
        nivelada
    }) {
        const tasaDiaria =
            Number(tasaAnual) / 100 / 365;

        if (
            !Number.isFinite(tasaDiaria) ||
            tasaDiaria < 0
        ) {
            throw this.ERROR(
                "La tasa anual es inválida."
            );
        }

        const periodos = [];
        let fechaAnterior = fechaInicio;

        for (const cuota of cuotas) {
            const vencimiento = this.fechaISO(
                cuota.fechaVencimiento
            );

            const dias = this.diasEntre(
                fechaAnterior,
                vencimiento
            );

            if (dias <= 0) {
                throw this.ERROR(
                    "Las fechas futuras del cronograma no son válidas."
                );
            }

            periodos.push({
                numeroCuota: cuota.numeroCuota,
                fechaVencimiento: vencimiento,
                dias
            });

            fechaAnterior = vencimiento;
        }

        const factores = periodos.map(
            (p) => tasaDiaria * p.dias
        );

        let cuotaNivelada = 0;

        if (nivelada) {
            // Cuota constante considerando la duración
            // real de cada período (Actual/365).
            const saldoFinal = (pago) => {
                let saldo = capitalCentavos / 100;

                for (const factor of factores) {
                    const interes = saldo * factor;
                    saldo = saldo + interes - pago;
                }

                return saldo;
            };

            let inferior = 0;
            let superior = capitalCentavos / 100;

            for (let i = 0; i < 100; i++) {
                const medio =
                    (inferior + superior) / 2;

                if (saldoFinal(medio) > 0) {
                    inferior = medio;
                } else {
                    superior = medio;
                }
            }

            cuotaNivelada = Math.round(
                superior * 100
            );
        }

        let saldo = capitalCentavos;
        const resultado = [];

        for (let i = 0; i < periodos.length; i++) {
            const periodo = periodos[i];

            const ultimo =
                i === periodos.length - 1;

            const interes = Math.round(
                saldo * factores[i]
            );

            let capital;

            if (ultimo) {
                capital = saldo;

            } else if (nivelada) {
                capital = Math.max(
                    0,
                    cuotaNivelada - interes
                );

                capital = Math.min(
                    capital,
                    saldo
                );

            } else {
                const pendientes =
                    periodos.length - i;

                capital = Math.round(
                    saldo / pendientes
                );
            }

            const montoCuota =
                capital + interes;

            resultado.push({
                numeroCuota:
                    periodo.numeroCuota,

                fechaVencimiento:
                    periodo.fechaVencimiento,

                capitalProgramado:
                    this.dinero(capital),

                interesProgramado:
                    this.dinero(interes),

                montoCuota:
                    this.dinero(montoCuota),

                montoPagado: 0,

                saldoCuota:
                    this.dinero(montoCuota),

                pagada: false
            });

            saldo -= capital;
        }

        if (saldo !== 0) {
            throw this.ERROR(
                "El recálculo no logró distribuir todo el capital."
            );
        }

        return resultado;
    }

    // ==========================================
    // ABONO EXTRAORDINARIO
    // POLÍTICA A:
    // CAPITAL NETO + INTERESES ADICIONALES
    // ==========================================

    static async registrarExtraordinario({
        conexion,
        ids,
        credito,
        cuotas,
        montoCentavos,
        observacion,
        hoy,
        fechaHora
    }) {
        const saldoAnterior = this.centavos(
            credito.saldo_actual
        );

        if (montoCentavos >= saldoAnterior) {
            throw this.ERROR(
                "El abono extraordinario debe ser menor que el capital pendiente. " +
                "La liquidación total requiere otra operación."
            );
        }

        const exigibles = cuotas.filter(
            (c) =>
                this.centavos(c.saldoCuota) > 0 &&
                this.fechaISO(c.fechaVencimiento) <= hoy
        );

        if (exigibles.length) {
            throw this.ERROR(
                "Primero debes pagar las cuotas exigibles."
            );
        }

        const futuras = cuotas.filter(
            (c) =>
                this.centavos(c.saldoCuota) > 0 &&
                this.fechaISO(c.fechaVencimiento) > hoy
        );

        if (
            !futuras.length ||
            futuras.some(
                (c) =>
                    this.centavos(c.montoPagado) > 0
            )
        ) {
            throw this.ERROR(
                "No pueden recalcularse cuotas futuras con pagos anticipados."
            );
        }

        // ==================================
        // INTERESES DEVENGADOS
        // ==================================

        const fechaBase = this.fechaISO(
            credito.fecha_calc_intereses ||
            credito.fecha_desembolso
        );

        const dias = this.diasEntre(
            fechaBase,
            hoy
        );

        if (dias < 0) {
            throw this.ERROR(
                "La fecha base de intereses es futura."
            );
        }

        const tasa = Number(credito.tasa);

        if (
            !Number.isFinite(tasa) ||
            tasa < 0
        ) {
            throw this.ERROR(
                "La tasa anual es inválida."
            );
        }

        const interesCentavos = Math.round(
            saldoAnterior *
            (tasa / 100 / 365) *
            dias
        );

        // El monto ingresado es neto a capital.
        // Los intereses se suman al total a pagar.
        const totalRecibido =
            montoCentavos + interesCentavos;

        if (!Number.isSafeInteger(totalRecibido)) {
            throw this.ERROR(
                "El importe excede el rango permitido."
            );
        }

        const saldoNuevo =
            saldoAnterior - montoCentavos;

        // ==================================
        // RECALCULAR CUOTAS FUTURAS
        // ==================================

        const nuevasCuotas =
            this.calcularCronograma({
                capitalCentavos: saldoNuevo,
                tasaAnual: tasa,
                fechaInicio: hoy,
                cuotas: futuras,
                nivelada:
                    Number(credito.nivelada) === 1
            });

        const primera = nuevasCuotas[0];

        // ==================================
        // INSERTAR PAGO
        // ==================================

        const idPago = await PagoModel.insertarPago(
            conexion,
            {
                ...ids,
                numeroCuota: null,
                fechaPago: fechaHora,

                cantidadCapital:
                    this.dinero(montoCentavos),

                cantidadInteres:
                    this.dinero(interesCentavos),

                cantidadMora: 0,

                montoTotal:
                    this.dinero(totalRecibido),

                observacion
            }
        );

        // ==================================
        // ACTUALIZAR CUOTAS FUTURAS
        // ==================================

        for (const cuota of nuevasCuotas) {
            await PagoModel.actualizarCuotaProgramada(
                conexion,
                ids,
                cuota
            );
        }

        // ==================================
        // ACTUALIZAR CRÉDITO
        // ==================================

        await PagoModel.actualizarCredito(
            conexion,
            ids,
            this.prepararActualizacionCredito(
                credito,
                {
                    saldo_actual:
                        this.dinero(saldoNuevo),

                    fecha_proxpago:
                        primera.fechaVencimiento,

                    cuota_fijada:
                        primera.montoCuota,

                    fecha_calc_intereses:
                        hoy,

                    intereses_venc: 0,

                    pago_parcial: 0
                }
            )
        );

        // ==================================
        // MOVIMIENTO CONTABLE
        // ==================================

        await PagoModel.insertarMovimiento(
            conexion,
            {
                ...ids,
                idPago,

                tipoMovimiento:
                    "ABONO_EXTRAORDINARIO",

                cantidadCapital:
                    this.dinero(montoCentavos),

                cantidadInteres:
                    this.dinero(interesCentavos),

                cantidadMora: 0,

                saldoAnterior:
                    this.dinero(saldoAnterior),

                saldoActual:
                    this.dinero(saldoNuevo),

                fechaProximoPagoAnterior:
                    this.fechaISO(
                        credito.fecha_proxpago
                    ),

                fechaProximoPago:
                    primera.fechaVencimiento,

                fechaCalculoInteresesAnterior:
                    this.fechaISO(
                        credito.fecha_calc_intereses
                    ),

                fechaCalculoIntereses:
                    hoy,

                moraAnterior:
                    credito.mora,

                montoMoraAnterior:
                    credito.monto_mora,

                vecesMoraAnterior:
                    credito.veces_mora,

                idEstado:
                    credito.idEstadoServicio,

                observacion
            }
        );

        return {
            exito: true,

            mensaje:
                "Abono extraordinario registrado correctamente.",

            idPago,

            tipoPago:
                "EXTRAORDINARIO",

            montoPagado:
                this.dinero(totalRecibido),

            capitalAplicado:
                this.dinero(montoCentavos),

            interesAplicado:
                this.dinero(interesCentavos),

            interesesPendientes: 0,

            saldoAnterior:
                this.dinero(saldoAnterior),

            saldoActual:
                this.dinero(saldoNuevo),

            cuotasRecalculadas:
                nuevasCuotas.length,

            nuevoCronograma:
                nuevasCuotas
        };
    }

    // ==========================================
    // CONSULTAS
    // ==========================================

    static async obtenerCreditos() {
        return await PagoModel.obtenerCreditos();
    }

    static async obtenerHistorial(
        idPais,
        idSocio,
        idTipoServicio,
        idCredito
    ) {
        return await PagoModel.obtenerHistorial(
            idPais,
            idSocio,
            idTipoServicio,
            idCredito
        );
    }

    static async obtenerDetallePago(idPago) {
        return await PagoModel.obtenerDetallePago(
            idPago
        );
    }
}

module.exports = PagoService;
