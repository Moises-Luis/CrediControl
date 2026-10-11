const CreditoModel = require("../models/CreditoModel");
const AmortizacionService = require("./AmortizacionService");

class CreditoService {

    static errorValidacion(mensaje) {
        const error = new Error(mensaje);
        error.statusCode = 400;
        throw error;
    }

    static validarDatos(datos) {
        if (!datos || typeof datos !== "object") {
            this.errorValidacion("Debes proporcionar los datos del crédito.");
        }

        const idSocio = String(datos.idSocio ?? "").trim();
        const idTipoServicio = Number(datos.idTipoServicio);
        const idFrecuencia = Number(datos.idFrecuencia);
        const monto = Number(datos.monto_original);
        const tasa = Number(datos.tasa);
        const fechaDesembolso = datos.fecha_desembolso;

        if (!idSocio) {
            this.errorValidacion("Debes seleccionar un socio.");
        }

        if (
            !Number.isInteger(idTipoServicio) ||
            idTipoServicio <= 0
        ) {
            this.errorValidacion("Selecciona un servicio válido.");
        }

        if (
            !Number.isInteger(idFrecuencia) ||
            idFrecuencia <= 0
        ) {
            this.errorValidacion("Selecciona una frecuencia válida.");
        }

        if (
            datos.monto_original == null ||
            datos.monto_original === "" ||
            !Number.isFinite(monto) ||
            monto <= 0 ||
            monto > 9999999999999.99 ||
            Math.abs(monto * 100 - Math.round(monto * 100)) > 0.000001
        ) {
            this.errorValidacion(
                "El monto debe ser positivo y tener máximo dos decimales."
            );
        }

        if (
            datos.tasa == null ||
            datos.tasa === "" ||
            !Number.isFinite(tasa) ||
            tasa < 0 ||
            tasa > 999.9999
        ) {
            this.errorValidacion("La tasa anual no es válida.");
        }

        try {
            AmortizacionService.fechaUTC(fechaDesembolso);
        } catch {
            this.errorValidacion("La fecha de desembolso no es válida.");
        }

        if (typeof datos.nivelada !== "boolean") {
            this.errorValidacion(
                "Debes indicar si la amortización es nivelada."
            );
        }

        const unidadPlazo = String(
            datos.unidadPlazo ?? "DIAS"
        ).toUpperCase();

        if (!["DIAS", "MESES"].includes(unidadPlazo)) {
            this.errorValidacion(
                "La unidad del plazo debe ser DIAS o MESES."
            );
        }

        const plazo = unidadPlazo === "DIAS"
            ? Number(datos.plazo)
            : null;

        const plazoMeses = unidadPlazo === "MESES"
            ? Number(datos.plazoMeses)
            : null;

        if (unidadPlazo === "DIAS") {
            if (
                !Number.isInteger(plazo) ||
                plazo < 1 ||
                plazo > 65535
            ) {
                this.errorValidacion(
                    "El plazo debe estar entre 1 y 65535 días."
                );
            }
        } else {
            if (
                !Number.isInteger(plazoMeses) ||
                plazoMeses < 1 ||
                plazoMeses > 1200
            ) {
                this.errorValidacion(
                    "El plazo debe estar entre 1 y 1200 meses."
                );
            }
        }

        return {
            idPais: 320,
            idSocio,
            idTipoServicio,
            idFrecuencia,
            monto_original: monto,
            tasa,
            fecha_desembolso: fechaDesembolso,
            nivelada: datos.nivelada ? 1 : 0,
            unidadPlazo,
            plazo,
            plazoMeses
        };
    }

    static async prepararAmortizacion(datos) {
        const credito = this.validarDatos(datos);

        const diasEntrePagos = Number(
            await CreditoModel.obtenerDiasFrecuencia(
                credito.idFrecuencia
            )
        );

        if (
            !Number.isInteger(diasEntrePagos) ||
            diasEntrePagos <= 0
        ) {
            this.errorValidacion(
                "La frecuencia seleccionada no está disponible."
            );
        }

        // En la tabla frecuencias, la frecuencia mensual
        // está identificada por idFrecuencia = 4.
        const frecuenciaMensual = credito.idFrecuencia === 4;

        if (frecuenciaMensual && credito.unidadPlazo !== "MESES") {
            this.errorValidacion(
                "Para pagos mensuales, indica el plazo en meses."
            );
        }

        if (!frecuenciaMensual && credito.unidadPlazo !== "DIAS") {
            this.errorValidacion(
                "Para esta frecuencia, indica el plazo en días."
            );
        }

        let amortizacion;

        try {
            amortizacion = AmortizacionService.generar({
                monto: credito.monto_original,
                tasa: credito.tasa,
                plazo: credito.plazo,
                plazoMeses: credito.plazoMeses,
                diasEntrePagos,
                fechaDesembolso: credito.fecha_desembolso,
                nivelada: credito.nivelada === 1,
                frecuenciaMensual
            });
        } catch (error) {
            this.errorValidacion(error.message);
        }

        if (amortizacion.resumen.plazoDias > 65535) {
            this.errorValidacion(
                "El plazo supera la capacidad del campo creditos.plazo."
            );
        }

        return {
            credito: {
                ...credito,
                plazo: amortizacion.resumen.plazoDias,
                fecha_vencimiento:
                    amortizacion.resumen.fechaUltimoPago
            },
            amortizacion
        };
    }

    static async simular(datos) {
        const resultado = await this.prepararAmortizacion(datos);

        return resultado.amortizacion;
    }

    static async crear(datos) {
        const resultado = await this.prepararAmortizacion(datos);

        return CreditoModel.crear(
            resultado.credito,
            resultado.amortizacion.cuotas
        );
    }
}

module.exports = CreditoService;