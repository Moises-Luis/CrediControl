
const db = require("../config/database");

class ReporteModel {

    static async obtenerResumen(idPais) {
        const [[creditos]] = await db.query(`
            SELECT
                COUNT(*) AS totalCreditos,
                COALESCE(SUM(monto_original), 0) AS montoOtorgado,
                COALESCE(SUM(
                    CASE
                        WHEN idEstadoServicio IN (1, 4, 5)
                        THEN saldo_actual
                        ELSE 0
                    END
                ), 0) AS carteraActual,
                SUM(CASE WHEN idEstadoServicio = 1 THEN 1 ELSE 0 END)
                    AS creditosActivos,
                SUM(CASE WHEN idEstadoServicio = 3 THEN 1 ELSE 0 END)
                    AS creditosPagados,
                SUM(CASE WHEN idEstadoServicio IN (4, 5) THEN 1 ELSE 0 END)
                    AS creditosVencidos
            FROM creditos
            WHERE idPais = ?
        `, [idPais]);

        const [[pagos]] = await db.query(`
            SELECT
                COUNT(*) AS cantidadPagos,
                COALESCE(SUM(cantidadCapital), 0) AS capitalRecuperado,
                COALESCE(SUM(cantidadInteres), 0) AS interesesCobrados,
                COALESCE(SUM(cantidadMora), 0) AS moraCobrada,
                COALESCE(SUM(montoTotal), 0) AS totalRecaudado
            FROM pagos
            WHERE idPais = ?
              AND activo = 1
        `, [idPais]);

        const [[socios]] = await db.query(`
            SELECT COUNT(*) AS totalSocios
            FROM socios
            WHERE idPais = ?
              AND activo = 1
        `, [idPais]);

        return {
            creditos,
            pagos,
            socios
        };
    }

    static async obtenerCartera(idPais) {
        const [filas] = await db.query(`
            SELECT
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
                c.cuota_fijada,
                DATE_FORMAT(
                    c.fecha_desembolso, '%Y-%m-%d'
                ) AS fechaDesembolso,
                DATE_FORMAT(
                    c.fecha_vencimiento, '%Y-%m-%d'
                ) AS fechaVencimiento,
                DATE_FORMAT(
                    c.fecha_proxpago, '%Y-%m-%d'
                ) AS fechaProximoPago,
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
            WHERE c.idPais = ?
            ORDER BY c.fecha_desembolso DESC,
                     c.idCredito DESC
        `, [idPais]);

        return filas;
    }

    static async obtenerPagos(idPais, fechaInicial, fechaFinal) {
        const [filas] = await db.query(`
            SELECT
                p.idPago,
                DATE_FORMAT(
                    p.fechaPago, '%Y-%m-%d %H:%i:%s'
                ) AS fechaPago,
                p.idSocio,
                p.idTipoServicio,
                p.idCredito,
                CONCAT_WS(
                    ' ',
                    s.primerNombre,
                    s.segundoNombre,
                    s.primerApellido,
                    s.segundoApellido
                ) AS nombreSocio,
                sv.nombreServicio,
                p.numeroCuota,
                p.cantidadCapital,
                p.cantidadInteres,
                p.cantidadMora,
                p.montoTotal,
                p.observacion
            FROM pagos p
            INNER JOIN socios s
                ON s.idPais = p.idPais
                AND s.idSocio = p.idSocio
            INNER JOIN servicios sv
                ON sv.idPais = p.idPais
                AND sv.idTipo = p.idTipoServicio
            WHERE p.idPais = ?
              AND p.activo = 1
              AND p.fechaPago >= ?
              AND p.fechaPago < DATE_ADD(?, INTERVAL 1 DAY)
            ORDER BY p.fechaPago DESC, p.idPago DESC
        `, [
            idPais,
            fechaInicial,
            fechaFinal
        ]);

        return filas;
    }
}

module.exports = ReporteModel;
