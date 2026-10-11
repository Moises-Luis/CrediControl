const pool = require("../config/database");

class CreditoModel {

    static async obtenerTodos() {
        const [rows] = await pool.execute(`
            SELECT
                c.idPais,
                c.idSocio,
                CONCAT_WS(' ',
                    s.primerNombre,
                    s.segundoNombre,
                    s.primerApellido,
                    s.segundoApellido
                ) AS nombreSocio,
                c.idTipoServicio,
                sv.nombreServicio,
                g.descripcion AS garantia,
                c.idCredito,
                c.tasa,
                DATE_FORMAT(c.fecha_desembolso, '%Y-%m-%d')
                    AS fecha_desembolso,
                DATE_FORMAT(c.fecha_vencimiento, '%Y-%m-%d')
                    AS fecha_vencimiento,
                c.monto_original,
                c.saldo_actual,
                c.plazo,
                c.idFrecuencia,
                f.descripcion AS frecuencia,
                c.cuota_fijada,
                c.idEstadoServicio,
                es.descripcion AS estado,
                c.nivelada,
                c.fecha
            FROM creditos c
            INNER JOIN socios s
                ON s.idPais = c.idPais
                AND s.idSocio = c.idSocio
            INNER JOIN servicios sv
                ON sv.idPais = c.idPais
                AND sv.idTipo = c.idTipoServicio
            INNER JOIN garantias g
                ON g.idPais = sv.idPais
                AND g.idGarantia = sv.idGarantia
            INNER JOIN frecuencias f
                ON f.idPais = c.idPais
                AND f.idFrecuencia = c.idFrecuencia
            INNER JOIN estadoservicios es
                ON es.idPais = c.idPais
                AND es.idEstado = c.idEstadoServicio
            WHERE c.idPais = ?
            ORDER BY c.fecha DESC
        `, [320]);

        return rows;
    }

    static async obtenerSociosActivos() {
        const [rows] = await pool.execute(`
            SELECT
                idSocio,
                CONCAT_WS(' ',
                    primerNombre,
                    segundoNombre,
                    primerApellido,
                    segundoApellido
                ) AS nombreCompleto,
                noDocumento
            FROM socios
            WHERE idPais = ?
                AND activo = 1
            ORDER BY primerNombre, primerApellido
        `, [320]);

        return rows;
    }

    static async obtenerServiciosActivos() {
        const [rows] = await pool.execute(`
            SELECT
                sv.idTipo,
                sv.nombreServicio,
                sv.tasa,
                sv.tasaMora,
                g.descripcion AS garantia
            FROM servicios sv
            INNER JOIN garantias g
                ON g.idPais = sv.idPais
                AND g.idGarantia = sv.idGarantia
            WHERE sv.idPais = ?
                AND sv.activo = 1
                AND g.activo = 1
            ORDER BY sv.idTipo
        `, [320]);

        return rows;
    }

    static async obtenerFrecuencias() {
        const [rows] = await pool.execute(`
            SELECT
                idFrecuencia,
                descripcion,
                diasEntrePagos
            FROM frecuencias
            WHERE idPais = ?
                AND activo = 1
            ORDER BY idFrecuencia
        `, [320]);

        return rows;
    }

    static async obtenerDiasFrecuencia(idFrecuencia) {
        const [rows] = await pool.execute(`
            SELECT diasEntrePagos
            FROM frecuencias
            WHERE idPais = ?
                AND idFrecuencia = ?
                AND activo = 1
        `, [320, idFrecuencia]);

        return rows[0]?.diasEntrePagos ?? null;
    }

    static async obtenerPorId(idSocio, idTipoServicio, idCredito) {
        const [rows] = await pool.execute(`
            SELECT
                c.*,
                DATE_FORMAT(c.fecha_desembolso, '%Y-%m-%d')
                    AS fechaDesembolsoTexto,
                DATE_FORMAT(c.fecha_vencimiento, '%Y-%m-%d')
                    AS fechaVencimientoTexto
            FROM creditos c
            WHERE c.idPais = ?
                AND c.idSocio = ?
                AND c.idTipoServicio = ?
                AND c.idCredito = ?
        `, [320, idSocio, idTipoServicio, idCredito]);

        return rows[0] || null;
    }

    static async obtenerCuotas(idSocio, idTipoServicio, idCredito) {
        const [rows] = await pool.execute(`
            SELECT
                numeroCuota,
                DATE_FORMAT(fechaVencimiento, '%Y-%m-%d')
                    AS fechaVencimiento,
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
        `, [320, idSocio, idTipoServicio, idCredito]);

        return rows;
    }

    static async crear(datos, cuotas) {
        if (!Array.isArray(cuotas) || cuotas.length === 0) {
            const error = new Error(
                "No es posible registrar un crédito sin cuotas."
            );
            error.statusCode = 400;
            throw error;
        }

        const conexion = await pool.getConnection();

        const nombreBloqueo =
            `cc:${datos.idPais}:${datos.idSocio}:${datos.idTipoServicio}`;

        let bloqueoAdquirido = false;
        let transaccionIniciada = false;

        try {
            // Evita que dos solicitudes simultáneas generen
            // el mismo idCredito para un socio y servicio.
            const [[bloqueo]] = await conexion.execute(
                "SELECT GET_LOCK(?, 10) AS adquirido",
                [nombreBloqueo]
            );

            if (Number(bloqueo.adquirido) !== 1) {
                const error = new Error(
                    "No fue posible reservar el número del crédito."
                );
                error.statusCode = 503;
                throw error;
            }

            bloqueoAdquirido = true;

            await conexion.beginTransaction();
            transaccionIniciada = true;

            const [socios] = await conexion.execute(`
                SELECT idSocio
                FROM socios
                WHERE idPais = ?
                    AND idSocio = ?
                    AND activo = 1
            `, [datos.idPais, datos.idSocio]);

            if (socios.length === 0) {
                const error = new Error(
                    "El socio no existe o está inactivo."
                );
                error.statusCode = 400;
                throw error;
            }

            const [servicios] = await conexion.execute(`
                SELECT idTipo
                FROM servicios
                WHERE idPais = ?
                    AND idTipo = ?
                    AND activo = 1
            `, [datos.idPais, datos.idTipoServicio]);

            if (servicios.length === 0) {
                const error = new Error(
                    "El servicio no existe o está inactivo."
                );
                error.statusCode = 400;
                throw error;
            }

            const [frecuencias] = await conexion.execute(`
                SELECT idFrecuencia
                FROM frecuencias
                WHERE idPais = ?
                    AND idFrecuencia = ?
                    AND activo = 1
            `, [datos.idPais, datos.idFrecuencia]);

            if (frecuencias.length === 0) {
                const error = new Error(
                    "La frecuencia no existe o está inactiva."
                );
                error.statusCode = 400;
                throw error;
            }

            const [[numeracion]] = await conexion.execute(`
                SELECT COALESCE(MAX(idCredito), 0) + 1 AS siguiente
                FROM creditos
                WHERE idPais = ?
                    AND idSocio = ?
                    AND idTipoServicio = ?
            `, [
                datos.idPais,
                datos.idSocio,
                datos.idTipoServicio
            ]);

            const idCredito = Number(numeracion.siguiente);

            if (idCredito > 255) {
                const error = new Error(
                    "Se alcanzó el máximo de créditos para este socio y servicio."
                );
                error.statusCode = 409;
                throw error;
            }

            const primeraCuota = cuotas[0];
            const ultimaCuota = cuotas[cuotas.length - 1];

            // 1. Registrar encabezado del crédito.
            await conexion.execute(`
                INSERT INTO creditos (
                    idPais,
                    idSocio,
                    idTipoServicio,
                    idCredito,
                    tasa,
                    fecha_desembolso,
                    fecha_vencimiento,
                    monto_original,
                    saldo_actual,
                    plazo,
                    fecha_proxpago,
                    cuota_fijada,
                    idFrecuencia,
                    fecha_calc_intereses,
                    idEstadoServicio,
                    fecha_primer_pago,
                    nivelada
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                datos.idPais,
                datos.idSocio,
                datos.idTipoServicio,
                idCredito,
                datos.tasa,
                datos.fecha_desembolso,
                ultimaCuota.fechaVencimiento,
                datos.monto_original,
                datos.monto_original,
                datos.plazo,
                primeraCuota.fechaVencimiento,
                datos.nivelada === 1
                    ? primeraCuota.montoCuota
                    : null,
                datos.idFrecuencia,
                datos.fecha_desembolso,
                1,
                primeraCuota.fechaVencimiento,
                datos.nivelada
            ]);

            // 2. Registrar cada cuota del cronograma.
            for (const cuota of cuotas) {
                await conexion.execute(`
                    INSERT INTO cuotas (
                        idPais,
                        idSocio,
                        idTipoServicio,
                        idCredito,
                        numeroCuota,
                        fechaVencimiento,
                        capitalProgramado,
                        interesProgramado,
                        montoCuota,
                        montoPagado,
                        saldoCuota,
                        pagada
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    datos.idPais,
                    datos.idSocio,
                    datos.idTipoServicio,
                    idCredito,
                    cuota.numeroCuota,
                    cuota.fechaVencimiento,
                    cuota.capitalProgramado,
                    cuota.interesProgramado,
                    cuota.montoCuota,
                    0,
                    cuota.montoCuota,
                    0
                ]);
            }

            await conexion.commit();
            transaccionIniciada = false;

            return {
                idPais: datos.idPais,
                idSocio: datos.idSocio,
                idTipoServicio: datos.idTipoServicio,
                idCredito,
                numeroCuotas: cuotas.length,
                fechaPrimerPago: primeraCuota.fechaVencimiento,
                fechaUltimoPago: ultimaCuota.fechaVencimiento
            };

        } catch (error) {
            if (transaccionIniciada) {
                await conexion.rollback();
            }

            throw error;

        } finally {
            try {
                if (bloqueoAdquirido) {
                    await conexion.execute(
                        "SELECT RELEASE_LOCK(?)",
                        [nombreBloqueo]
                    );
                }
            } finally {
                conexion.release();
            }
        }
    }
}

module.exports = CreditoModel;