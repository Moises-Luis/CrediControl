
const CuotaModel = require("../models/CuotaModel");

class CuotaController {

    // ==========================================
    // MANEJO DE ERRORES
    // ==========================================

    static responderError(res, error) {
        const estado = error.status || 500;

        if (estado === 500) {
            console.error("Error en Cuotas:", error);
        }

        return res.status(estado).json({
            exito: false,
            mensaje:
                estado === 500
                    ? "Error interno al consultar las cuotas."
                    : error.message
        });
    }

    static errorValidacion(mensaje) {
        const error = new Error(mensaje);
        error.status = 400;
        return error;
    }

    static validarEntero(valor, nombre) {
        const numero = Number(valor);

        if (
            !Number.isSafeInteger(numero) ||
            numero <= 0
        ) {
            throw this.errorValidacion(
                `${nombre} debe ser un entero positivo.`
            );
        }

        return numero;
    }

    static validarFecha(valor) {
        if (
            typeof valor !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(valor)
        ) {
            return false;
        }

        const fecha = new Date(
            `${valor}T00:00:00Z`
        );

        return !Number.isNaN(fecha.getTime()) &&
            fecha.toISOString().slice(0, 10) === valor;
    }

    // ==========================================
    // LISTAR CUOTAS
    // ==========================================

    static async obtenerTodas(req, res) {
        try {
            const idPais =
                CuotaController.validarEntero(
                    req.query.idPais ?? 320,
                    "idPais"
                );

            const estado = String(
                req.query.estado ?? "TODAS"
            ).trim().toUpperCase();

            const estadosPermitidos = [
                "TODAS",
                "PENDIENTES",
                "PAGADAS",
                "VENCIDAS",
                "HOY"
            ];

            if (!estadosPermitidos.includes(estado)) {
                throw CuotaController.errorValidacion(
                    "El estado de cuotas solicitado no es válido."
                );
            }

            const buscar = String(
                req.query.buscar ?? ""
            ).trim();

            if (buscar.length > 100) {
                throw CuotaController.errorValidacion(
                    "La búsqueda no puede superar 100 caracteres."
                );
            }

            const fechaInicial =
                req.query.fechaInicial || null;

            const fechaFinal =
                req.query.fechaFinal || null;

            if (
                fechaInicial &&
                !CuotaController.validarFecha(fechaInicial)
            ) {
                throw CuotaController.errorValidacion(
                    "La fecha inicial no es válida."
                );
            }

            if (
                fechaFinal &&
                !CuotaController.validarFecha(fechaFinal)
            ) {
                throw CuotaController.errorValidacion(
                    "La fecha final no es válida."
                );
            }

            if (
                fechaInicial &&
                fechaFinal &&
                fechaInicial > fechaFinal
            ) {
                throw CuotaController.errorValidacion(
                    "La fecha inicial no puede superar la fecha final."
                );
            }

            const datos = await CuotaModel.obtenerTodas({
                idPais,
                estado,
                buscar,
                fechaInicial,
                fechaFinal
            });

            return res.json({
                exito: true,
                datos
            });

        } catch (error) {
            return CuotaController.responderError(
                res,
                error
            );
        }
    }

    // ==========================================
    // RESUMEN GENERAL
    // ==========================================

    static async obtenerResumen(req, res) {
        try {
            const idPais =
                CuotaController.validarEntero(
                    req.query.idPais ?? 320,
                    "idPais"
                );

            const datos =
                await CuotaModel.obtenerResumen(idPais);

            return res.json({
                exito: true,
                datos
            });

        } catch (error) {
            return CuotaController.responderError(
                res,
                error
            );
        }
    }

    // ==========================================
    // CONSULTAR UNA CUOTA
    // ==========================================

    static async obtenerPorId(req, res) {
        try {
            const idPais =
                CuotaController.validarEntero(
                    req.query.idPais ?? 320,
                    "idPais"
                );

            const idSocio = String(
                req.params.idSocio ?? ""
            ).trim();

            if (!idSocio) {
                throw CuotaController.errorValidacion(
                    "El identificador del socio es obligatorio."
                );
            }

            const idTipoServicio =
                CuotaController.validarEntero(
                    req.params.idTipoServicio,
                    "idTipoServicio"
                );

            const idCredito =
                CuotaController.validarEntero(
                    req.params.idCredito,
                    "idCredito"
                );

            const numeroCuota =
                CuotaController.validarEntero(
                    req.params.numeroCuota,
                    "numeroCuota"
                );

            const datos = await CuotaModel.obtenerPorId(
                idPais,
                idSocio,
                idTipoServicio,
                idCredito,
                numeroCuota
            );

            if (!datos) {
                return res.status(404).json({
                    exito: false,
                    mensaje: "La cuota no existe."
                });
            }

            return res.json({
                exito: true,
                datos
            });

        } catch (error) {
            return CuotaController.responderError(
                res,
                error
            );
        }
    }
}

module.exports = CuotaController;
