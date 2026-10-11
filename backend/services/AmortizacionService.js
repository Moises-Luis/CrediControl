class AmortizacionService {
    static CENTAVOS = 100;

    static redondearCentavos(valor) {
        return Math.round(valor * this.CENTAVOS);
    }

    static fechaUTC(texto) {
        if (
            typeof texto !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(texto)
        ) {
            throw new Error("La fecha debe tener formato YYYY-MM-DD.");
        }

        const fecha = new Date(`${texto}T00:00:00Z`);

        if (
            Number.isNaN(fecha.getTime()) ||
            fecha.toISOString().slice(0, 10) !== texto
        ) {
            throw new Error("Fecha inválida.");
        }

        return fecha;
    }

    static formatearFecha(fecha) {
        return fecha.toISOString().slice(0, 10);
    }

    static sumarDias(fechaTexto, dias) {
        const fecha = this.fechaUTC(fechaTexto);
        fecha.setUTCDate(fecha.getUTCDate() + dias);
        return this.formatearFecha(fecha);
    }

    static sumarMeses(fechaTexto, meses) {
        const origen = this.fechaUTC(fechaTexto);
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

        return this.formatearFecha(destino);
    }

    static diferenciaDias(inicio, fin) {
        return Math.round(
            (
                this.fechaUTC(fin).getTime() -
                this.fechaUTC(inicio).getTime()
            ) / 86400000
        );
    }

    static generarFechas({
        fechaDesembolso,
        plazo,
        plazoMeses,
        diasEntrePagos,
        frecuenciaMensual
    }) {
        this.fechaUTC(fechaDesembolso);

        const fechas = [];

        if (frecuenciaMensual) {
            if (
                !Number.isInteger(plazoMeses) ||
                plazoMeses < 1 ||
                plazoMeses > 1200
            ) {
                throw new Error(
                    "El plazo debe estar entre 1 y 1200 meses."
                );
            }

            for (let numero = 1; numero <= plazoMeses; numero++) {
                fechas.push(
                    this.sumarMeses(fechaDesembolso, numero)
                );
            }
        } else {
            if (
                !Number.isInteger(plazo) ||
                plazo < 1 ||
                plazo > 65535 ||
                !Number.isInteger(diasEntrePagos) ||
                diasEntrePagos < 1
            ) {
                throw new Error("Plazo o frecuencia inválidos.");
            }

            for (
                let dias = diasEntrePagos;
                dias < plazo;
                dias += diasEntrePagos
            ) {
                fechas.push(
                    this.sumarDias(fechaDesembolso, dias)
                );
            }

            fechas.push(
                this.sumarDias(fechaDesembolso, plazo)
            );
        }

        return fechas;
    }

    static generar(parametros) {
        const {
            monto,
            tasa,
            plazo,
            plazoMeses,
            diasEntrePagos,
            fechaDesembolso,
            nivelada = false,
            frecuenciaMensual = false
        } = parametros;

        if (
            !Number.isFinite(monto) ||
            monto <= 0 ||
            monto > 9999999999999.99 ||
            !Number.isFinite(tasa) ||
            tasa < 0 ||
            tasa > 999.9999
        ) {
            throw new Error("Monto o tasa anual inválidos.");
        }

        if (
            Math.abs(monto * 100 - Math.round(monto * 100)) > 0.000001
        ) {
            throw new Error("El monto admite máximo dos decimales.");
        }

        const fechas = this.generarFechas({
            fechaDesembolso,
            plazo,
            plazoMeses,
            diasEntrePagos,
            frecuenciaMensual
        });

        if (fechas.length > 65535) {
            throw new Error("El número de cuotas es demasiado grande.");
        }

        const periodos = [];
        let fechaAnterior = fechaDesembolso;

        for (const fechaVencimiento of fechas) {
            const diasPeriodo = this.diferenciaDias(
                fechaAnterior,
                fechaVencimiento
            );

            periodos.push({
                fechaVencimiento,
                diasPeriodo,
                tasaPeriodo: (tasa / 100) * diasPeriodo / 365
            });

            fechaAnterior = fechaVencimiento;
        }

        const capitalInicial = this.redondearCentavos(monto);
        let saldoCapital = capitalInicial;

        // Calculamos una cuota uniforme considerando que
        // cada período puede tener una duración diferente.
        let cuotaNivelada = 0;

        if (nivelada) {
            let factor = 1;
            let sumaFactores = 0;

            for (const periodo of periodos) {
                factor *= 1 + periodo.tasaPeriodo;
                sumaFactores += 1 / factor;
            }

            cuotaNivelada = Math.round(
                capitalInicial / sumaFactores
            );
        }

        const capitalBase = Math.floor(
            capitalInicial / periodos.length
        );

        const cuotas = [];

        for (let indice = 0; indice < periodos.length; indice++) {
            const periodo = periodos[indice];
            const ultima = indice === periodos.length - 1;

            const interes = Math.round(
                saldoCapital * periodo.tasaPeriodo
            );

            let capital = nivelada
                ? cuotaNivelada - interes
                : capitalBase;

            if (ultima) {
                capital = saldoCapital;
            } else {
                capital = Math.min(
                    saldoCapital,
                    Math.max(0, capital)
                );
            }

            if (!ultima && capital <= 0) {
                throw new Error(
                    "La cuota calculada no amortiza capital. " +
                    "Revisa la tasa anual o el plazo."
                );
            }

            const montoCuota = capital + interes;
            saldoCapital -= capital;

            cuotas.push({
                numeroCuota: indice + 1,
                fechaVencimiento: periodo.fechaVencimiento,
                diasPeriodo: periodo.diasPeriodo,
                capitalProgramado: capital / 100,
                interesProgramado: interes / 100,
                montoCuota: montoCuota / 100,
                montoPagado: 0,
                saldoCuota: montoCuota / 100,
                pagada: false,
                saldoCapital: saldoCapital / 100
            });
        }

        const totalCapitalCentavos = cuotas.reduce(
            (total, cuota) =>
                total + this.redondearCentavos(
                    cuota.capitalProgramado
                ),
            0
        );

        const totalInteresesCentavos = cuotas.reduce(
            (total, cuota) =>
                total + this.redondearCentavos(
                    cuota.interesProgramado
                ),
            0
        );

        const fechaUltimoPago =
            cuotas[cuotas.length - 1].fechaVencimiento;

        return {
            cuotas,
            resumen: {
                numeroCuotas: cuotas.length,
                totalCapital: totalCapitalCentavos / 100,
                totalIntereses: totalInteresesCentavos / 100,
                totalPagar:
                    (totalCapitalCentavos + totalInteresesCentavos) / 100,
                primeraCuota: cuotas[0].montoCuota,
                fechaPrimerPago: cuotas[0].fechaVencimiento,
                fechaUltimoPago,
                plazoDias: this.diferenciaDias(
                    fechaDesembolso,
                    fechaUltimoPago
                )
            }
        };
    }
}

module.exports = AmortizacionService;