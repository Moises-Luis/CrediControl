
const db = require("../config/database");

class CuotaModel {

    // ==========================================
    // OBTENER LISTADO DE CUOTAS
    // ==========================================

    static async obtenerTodas({
        idPais = 320,
        estado = "TODAS",
        buscar = "",
        fechaInicial = null,
        fechaFinal = null
    } = {}) {

        const condiciones = ["c.idPais = ?"];
        const parametros = [idPais];

        // ======================================
        // FILTRO POR ESTADO
        // ======================================

        switch (estado) {
            case "PAGADAS":
                condiciones.push(`
                    (
                        q.pagada = 1
                        OR q.saldoCuota <= 0
                    )
                `);
                break;

            case "VENCIDAS":
                condiciones.push(`
                    q.pagada = 0
                    AND q.saldoCuota > 0
                    AND q.fechaVencimiento < CURDATE()
                `);
                break;

            case "HOY":
                condiciones.push(`
                    q.pagada = 0
                    AND q.saldoCuota > 0
                    AND q.fechaVencimiento = CURDATE()
                `);
                break;

            case "PENDIENTES":
                condiciones.push(`
                    q.pagada = 0
                    AND q.saldoCuota > 0
                    AND q.fechaVencimiento > CURDATE()
                `);
                break;
        }

        // ======================================
        // BÚSQUEDA
        // ======================================

        if (buscar) {
            condiciones.push(`
                (
                    c.idSocio LIKE ?
                    OR CONCAT_WS(
                        ' ',
                        s.primerNombre,
                        s.segundoNombre,
                        s.primerApellido,
                        s.segundoApellido
                    ) LIKE ?
                    OR CAST(c.idCredito AS CHAR) LIKE ?
                    OR sv.nombreServicio LIKE ?
                )
            `);

            const termino = `%${buscar}%`;

            parametros.push(
                termino,
                termino,
                termino,
                termino
            );
        }

        // ======================================
        // FILTRO POR FECHAS
        // ======================================

        if (fechaInicial) {
            condiciones.push(
                "q.fechaVencimiento >= ?"
            );

            parametros.push(fechaInicial);
        }

        if (fechaFinal) {
            condiciones.push(
                "q.fechaVencimiento <= ?"
            );

            parametros.push(fechaFinal);
        }

        const where = condiciones.join(" AND ");

        const [filas] = await db.query(`
            SELECT
                q.idPais,
                q.idSocio,
                q.idTipoServicio,
                q.idCredito,
                q.numeroCuota,

                CONCAT_WS(
                    ' ',
                    s.primerNombre,
                    s.segundoNombre,
                    s.primerApellido,
                    s.segundoApellido
                ) AS nombreSocio,

                sv.nombreServicio,

                DATE_FORMAT(
                    q.fechaVencimiento,
                    '%Y-%m-%d'
                ) AS fechaVencimiento,

                q.capitalProgramado,
                q.interesProgramado,
                q.montoCuota,
                q.montoPagado,
                q.saldoCuota,
                q.pagada,

                c.saldo_actual AS saldoCapitalCredito,
                c.tasa,
                c.idEstadoServicio,

                DATEDIFF(
                    CURDATE(),
                    q.fechaVencimiento
                ) AS diasTranscurridos,

                CASE
                    WHEN q.pagada = 1
                         OR q.saldoCuota <= 0
                        THEN 'PAGADA'

                    WHEN q.fechaVencimiento < CURDATE()
                        THEN 'VENCIDA'

                    WHEN q.fechaVencimiento = CURDATE()
                        THEN 'HOY'

                    ELSE 'PENDIENTE'
                END AS estadoCuota

            FROM cuotas q

            INNER JOIN creditos c
                ON c.idPais = q.idPais
                AND c.idSocio = q.idSocio
                AND c.idTipoServicio = q.idTipoServicio
                AND c.idCredito = q.idCredito

            INNER JOIN socios s
                ON s.idPais = c.idPais
                AND s.idSocio = c.idSocio

            INNER JOIN servicios sv
                ON sv.idPais = c.idPais
                AND sv.idTipo = c.idTipoServicio

            WHERE ${where}

            ORDER BY
                q.fechaVencimiento ASC,
                q.idSocio ASC,
                q.idCredito ASC,
                q.numeroCuota ASC
        `, parametros);

        return filas;
    }

    // ==========================================
    // OBTENER RESUMEN GENERAL
    // ==========================================

    static async obtenerResumen(idPais = 320) {
        const [[resumen]] = await db.query(`
            SELECT
                COUNT(*) AS totalCuotas,

                COALESCE(
                    SUM(
                        CASE
                            WHEN pagada = 1
                                 OR saldoCuota <= 0
                            THEN 1
                            ELSE 0
                        END
                    ), 0
                ) AS pagadas,

                COALESCE(
                    SUM(
                        CASE
                            WHEN pagada = 0
                                 AND saldoCuota > 0
                                 AND fechaVencimiento > CURDATE()
                            THEN 1
                            ELSE 0
                        END
                    ), 0
                ) AS pendientes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN pagada = 0
                                 AND saldoCuota > 0
                                 AND fechaVencimiento < CURDATE()
                            THEN 1
                            ELSE 0
                        END
                    ), 0
                ) AS vencidas,

                COALESCE(
                    SUM(
                        CASE
                            WHEN pagada = 0
                                 AND saldoCuota > 0
                                 AND fechaVencimiento = CURDATE()
                            THEN 1
                            ELSE 0
                        END
                    ), 0
                ) AS vencenHoy,

                COALESCE(
                    SUM(montoCuota), 0
                ) AS totalProgramado,

                COALESCE(
                    SUM(montoPagado), 0
                ) AS totalPagado,

                COALESCE(
                    SUM(saldoCuota), 0
                ) AS totalPendiente,

                COALESCE(
                    SUM(
                        CASE
                            WHEN pagada = 0
                                 AND saldoCuota > 0
                                 AND fechaVencimiento < CURDATE()
                            THEN saldoCuota
                            ELSE 0
                        END
                    ), 0
                ) AS montoVencido

            FROM cuotas

            WHERE idPais = ?
        `, [idPais]);

        return resumen;
    }

    // ==========================================
    // OBTENER DETALLE DE UNA CUOTA
    // ==========================================

    static async obtenerPorId(
        idPais,
        idSocio,
        idTipoServicio,
        idCredito,
        numeroCuota
    ) {
        const [filas] = await db.query(`
            SELECT
                q.idPais,
                q.idSocio,
                q.idTipoServicio,
                q.idCredito,
                q.numeroCuota,

                DATE_FORMAT(
                    q.fechaVencimiento,
                    '%Y-%m-%d'
                ) AS fechaVencimiento,

                q.capitalProgramado,
                q.interesProgramado,
                q.montoCuota,
                q.montoPagado,
                q.saldoCuota,
                q.pagada

            FROM cuotas q

            WHERE q.idPais = ?
              AND q.idSocio = ?
              AND q.idTipoServicio = ?
              AND q.idCredito = ?
              AND q.numeroCuota = ?
        `, [
            idPais,
            idSocio,
            idTipoServicio,
            idCredito,
            numeroCuota
        ]);

        return filas[0] || null;
    }
}

module.exports = CuotaModel;
