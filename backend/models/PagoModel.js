
const db = require("../config/database");

class PagoModel {

    static validarActualizacion(resultado, operacion) {
        if (resultado.affectedRows !== 1) {
            throw new Error(
                `No se pudo completar la operación: ${operacion}.`
            );
        }
    }

    // ==========================================
    // CRÉDITOS DISPONIBLES PARA PAGOS
    // ==========================================

    static async obtenerCreditos() {
        const [filas] = await db.query(`
            SELECT
                c.idPais,
                c.idSocio,
                c.idTipoServicio,
                c.idCredito,

                CONCAT_WS(
                    ' ',
                    s.primerNombre,
                    s.segundoNombre,
                    s.primerApellido,
                    s.segundoApellido
                ) AS nombreSocio,

                sv.nombreServicio,
                c.monto_original,
                c.saldo_actual,
                c.tasa,

                DATE_FORMAT(
                    c.fecha_desembolso, '%Y-%m-%d'
                ) AS fecha_desembolso,

                DATE_FORMAT(
                    c.fecha_vencimiento, '%Y-%m-%d'
                ) AS fecha_vencimiento,

                DATE_FORMAT(
                    c.fecha_proxpago, '%Y-%m-%d'
                ) AS fecha_proxpago,

                DATE_FORMAT(
                    c.fecha_calc_intereses, '%Y-%m-%d'
                ) AS fecha_calc_intereses,

                c.idFrecuencia,
                c.nivelada,
                c.idEstadoServicio,
                c.intereses_venc,
                c.monto_mora

            FROM creditos c

            INNER JOIN socios s
                ON s.idPais = c.idPais
                AND s.idSocio = c.idSocio

            INNER JOIN servicios sv
                ON sv.idPais = c.idPais
                AND sv.idTipo = c.idTipoServicio

            WHERE c.idPais = 320
                AND c.idEstadoServicio IN (1, 4, 5)

            ORDER BY
                c.fecha_desembolso DESC,
                c.idSocio,
                c.idCredito
        `);

        return filas;
    }

    // ==========================================
    // BLOQUEAR CRÉDITO PARA ACTUALIZACIÓN
    // ==========================================

    static async obtenerCreditoParaActualizar(
        conexion,
        idPais,
        idSocio,
        idTipoServicio,
        idCredito
    ) {
        const [filas] = await conexion.query(`
            SELECT
                c.*,

                DATE_FORMAT(
                    c.fecha_desembolso, '%Y-%m-%d'
                ) AS fecha_desembolso,

                DATE_FORMAT(
                    c.fecha_vencimiento, '%Y-%m-%d'
                ) AS fecha_vencimiento,

                DATE_FORMAT(
                    c.fecha_proxpago, '%Y-%m-%d'
                ) AS fecha_proxpago,

                DATE_FORMAT(
                    c.fecha_calc_intereses, '%Y-%m-%d'
                ) AS fecha_calc_intereses

            FROM creditos c

            WHERE c.idPais = ?
                AND c.idSocio = ?
                AND c.idTipoServicio = ?
                AND c.idCredito = ?

            FOR UPDATE
        `, [
            idPais,
            idSocio,
            idTipoServicio,
            idCredito
        ]);

        return filas[0] || null;
    }

    // ==========================================
    // BLOQUEAR CUOTAS PARA ACTUALIZACIÓN
    // ==========================================

    static async obtenerCuotasParaActualizar(
        conexion,
        idPais,
        idSocio,
        idTipoServicio,
        idCredito
    ) {
        const [filas] = await conexion.query(`
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

            FOR UPDATE
        `, [
            idPais,
            idSocio,
            idTipoServicio,
            idCredito
        ]);

        return filas;
    }

    // ==========================================
    // HISTORIAL DE PAGOS
    // ==========================================

    static async obtenerHistorial(
        idPais,
        idSocio,
        idTipoServicio,
        idCredito
    ) {
        const [filas] = await db.query(`
            SELECT
                p.idPago,
                p.idPais,
                p.idSocio,
                p.idTipoServicio,
                p.idCredito,
                p.numeroCuota,
                p.idUsuario,

                DATE_FORMAT(
                    p.fechaPago,
                    '%Y-%m-%d %H:%i:%s'
                ) AS fechaPago,

                p.cantidadCapital,
                p.cantidadInteres,
                p.cantidadMora,
                p.montoTotal,
                p.observacion,
                p.activo

            FROM pagos p

            WHERE p.idPais = ?
                AND p.idSocio = ?
                AND p.idTipoServicio = ?
                AND p.idCredito = ?

            ORDER BY
                p.fechaPago DESC,
                p.idPago DESC
        `, [
            idPais,
            idSocio,
            idTipoServicio,
            idCredito
        ]);

        return filas;
    }

    // ==========================================
    // INSERTAR PAGO
    // ==========================================

    static async insertarPago(conexion, datos) {
        const [resultado] = await conexion.query(`
            INSERT INTO pagos (
                idPais,
                idSocio,
                idTipoServicio,
                idCredito,
                numeroCuota,
                idUsuario,
                fechaPago,
                cantidadCapital,
                cantidadInteres,
                cantidadMora,
                montoTotal,
                observacion,
                activo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            datos.idPais,
            datos.idSocio,
            datos.idTipoServicio,
            datos.idCredito,
            datos.numeroCuota ?? null,
            datos.idUsuario,
            datos.fechaPago,
            datos.cantidadCapital,
            datos.cantidadInteres,
            datos.cantidadMora,
            datos.montoTotal,
            datos.observacion ?? null
        ]);

        if (resultado.affectedRows !== 1) {
            throw new Error("No se pudo registrar el pago.");
        }

        return resultado.insertId;
    }

    // ==========================================
    // INSERTAR DETALLE DE PAGO
    // ==========================================

    static async insertarPagoDetalle(
        conexion,
        idPago,
        detalle
    ) {
        const [resultado] = await conexion.query(`
            INSERT INTO pagosdetalle (
                idPago,
                numeroCuota,
                cantidadCapital,
                cantidadInteres,
                cantidadMora,
                montoAplicado
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            idPago,
            detalle.numeroCuota,
            detalle.cantidadCapital,
            detalle.cantidadInteres,
            detalle.cantidadMora,
            detalle.montoAplicado
        ]);

        this.validarActualizacion(
            resultado,
            "registrar el detalle del pago"
        );
    }

    // ==========================================
    // ACTUALIZAR CUOTA PAGADA O PARCIAL
    // ==========================================

    static async actualizarCuota(
        conexion,
        identificadores,
        cuota
    ) {
        const [resultado] = await conexion.query(`
            UPDATE cuotas
            SET
                montoPagado = ?,
                saldoCuota = ?,
                pagada = ?
            WHERE idPais = ?
                AND idSocio = ?
                AND idTipoServicio = ?
                AND idCredito = ?
                AND numeroCuota = ?
        `, [
            cuota.montoPagado,
            cuota.saldoCuota,
            cuota.pagada ? 1 : 0,

            identificadores.idPais,
            identificadores.idSocio,
            identificadores.idTipoServicio,
            identificadores.idCredito,
            cuota.numeroCuota
        ]);

        this.validarActualizacion(
            resultado,
            `actualizar la cuota ${cuota.numeroCuota}`
        );
    }

    // ==========================================
    // RECALCULAR CUOTA FUTURA
    // ==========================================

    static async actualizarCuotaProgramada(
        conexion,
        identificadores,
        cuota
    ) {
        const [resultado] = await conexion.query(`
            UPDATE cuotas
            SET
                capitalProgramado = ?,
                interesProgramado = ?,
                montoCuota = ?,
                montoPagado = 0,
                saldoCuota = ?,
                pagada = 0

            WHERE idPais = ?
                AND idSocio = ?
                AND idTipoServicio = ?
                AND idCredito = ?
                AND numeroCuota = ?

                AND montoPagado = 0
                AND pagada = 0
        `, [
            cuota.capitalProgramado,
            cuota.interesProgramado,
            cuota.montoCuota,
            cuota.saldoCuota,

            identificadores.idPais,
            identificadores.idSocio,
            identificadores.idTipoServicio,
            identificadores.idCredito,
            cuota.numeroCuota
        ]);

        this.validarActualizacion(
            resultado,
            `recalcular la cuota ${cuota.numeroCuota}`
        );
    }

    // ==========================================
    // ACTUALIZAR CRÉDITO
    // ==========================================

    static async actualizarCredito(
        conexion,
        identificadores,
        datos
    ) {
        const [resultado] = await conexion.query(`
            UPDATE creditos
            SET
                saldo_actual = ?,
                fecha_proxpago = ?,
                fecha_calc_intereses = ?,
                cuota_fijada = ?,
                pago_parcial = ?,
                intereses_venc = ?,
                mora = ?,
                monto_mora = ?,
                veces_mora = ?,
                idEstadoServicio = ?

            WHERE idPais = ?
                AND idSocio = ?
                AND idTipoServicio = ?
                AND idCredito = ?
        `, [
            datos.saldo_actual,
            datos.fecha_proxpago,
            datos.fecha_calc_intereses,
            datos.cuota_fijada,
            datos.pago_parcial,
            datos.intereses_venc,
            datos.mora,
            datos.monto_mora,
            datos.veces_mora,
            datos.idEstadoServicio,

            identificadores.idPais,
            identificadores.idSocio,
            identificadores.idTipoServicio,
            identificadores.idCredito
        ]);

        this.validarActualizacion(
            resultado,
            "actualizar el crédito"
        );
    }

    // ==========================================
    // REGISTRAR MOVIMIENTO DEL CRÉDITO
    // ==========================================

    static async insertarMovimiento(
        conexion,
        datos
    ) {
        const [resultado] = await conexion.query(`
            INSERT INTO movimientoscreditos (
                idPais,
                idSocio,
                idTipoServicio,
                idCredito,
                idUsuario,
                idPago,
                tipoMovimiento,
                cantidadCapital,
                cantidadInteres,
                cantidadMora,
                saldoAnterior,
                saldoActual,
                fechaProximoPagoAnterior,
                fechaProximoPago,
                fechaCalculoInteresesAnterior,
                fechaCalculoIntereses,
                moraAnterior,
                montoMoraAnterior,
                vecesMoraAnterior,
                idEstado,
                observacion
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        `, [
            datos.idPais,
            datos.idSocio,
            datos.idTipoServicio,
            datos.idCredito,
            datos.idUsuario,
            datos.idPago,
            datos.tipoMovimiento,

            datos.cantidadCapital,
            datos.cantidadInteres,
            datos.cantidadMora,

            datos.saldoAnterior,
            datos.saldoActual,

            datos.fechaProximoPagoAnterior ?? null,
            datos.fechaProximoPago ?? null,

            datos.fechaCalculoInteresesAnterior ?? null,
            datos.fechaCalculoIntereses ?? null,

            datos.moraAnterior ?? 0,
            datos.montoMoraAnterior ?? 0,
            datos.vecesMoraAnterior ?? 0,

            datos.idEstado ?? null,
            datos.observacion ?? null
        ]);

        if (resultado.affectedRows !== 1) {
            throw new Error(
                "No se pudo registrar el movimiento del crédito."
            );
        }

        return resultado.insertId;
    }

    // ==========================================
    // CONSULTAR DISTRIBUCIÓN DE UN PAGO
    // ==========================================

    static async obtenerDetallePago(idPago) {
        const [filas] = await db.query(`
            SELECT
                pd.idPago,
                pd.numeroCuota,
                pd.cantidadCapital,
                pd.cantidadInteres,
                pd.cantidadMora,
                pd.montoAplicado,

                DATE_FORMAT(
                    c.fechaVencimiento,
                    '%Y-%m-%d'
                ) AS fechaVencimiento

            FROM pagosdetalle pd

            INNER JOIN pagos p
                ON p.idPago = pd.idPago

            INNER JOIN cuotas c
                ON c.idPais = p.idPais
                AND c.idSocio = p.idSocio
                AND c.idTipoServicio = p.idTipoServicio
                AND c.idCredito = p.idCredito
                AND c.numeroCuota = pd.numeroCuota

            WHERE pd.idPago = ?

            ORDER BY pd.numeroCuota
        `, [idPago]);

        return filas;
    }
}

module.exports = PagoModel;
