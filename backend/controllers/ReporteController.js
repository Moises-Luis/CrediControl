
const ReporteModel = require("../models/ReporteModel");

class ReporteController {

    static validarPais(valor) {
        const idPais = Number(valor ?? 320);

        if (!Number.isSafeInteger(idPais) || idPais <= 0) {
            throw new Error("El país es inválido.");
        }

        return idPais;
    }

    static validarFecha(valor) {
        if (
            typeof valor !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(valor)
        ) {
            return false;
        }

        const fecha = new Date(`${valor}T00:00:00Z`);

        return !Number.isNaN(fecha.getTime()) &&
            fecha.toISOString().slice(0, 10) === valor;
    }

    static responderError(res, error) {
        console.error("Error reportes:", error);

        const esValidacion =
            error.message === "El país es inválido." ||
            error.message?.startsWith("Las fechas");

        return res.status(esValidacion ? 400 : 500).json({
            exito: false,
            mensaje: esValidacion
                ? error.message
                : "No fue posible generar el reporte."
        });
    }

    static async resumen(req, res) {
        try {
            const idPais = ReporteController.validarPais(
                req.query.idPais
            );

            const datos = await ReporteModel.obtenerResumen(
                idPais
            );

            return res.json({
                exito: true,
                datos
            });
        } catch (error) {
            return ReporteController.responderError(
                res, error
            );
        }
    }

    static async cartera(req, res) {
        try {
            const idPais = ReporteController.validarPais(
                req.query.idPais
            );

            const datos = await ReporteModel.obtenerCartera(
                idPais
            );

            return res.json({
                exito: true,
                datos
            });
        } catch (error) {
            return ReporteController.responderError(
                res, error
            );
        }
    }

    static async pagos(req, res) {
        try {
            const idPais = ReporteController.validarPais(
                req.query.idPais
            );

            const { fechaInicial, fechaFinal } = req.query;

            if (
                !ReporteController.validarFecha(fechaInicial) ||
                !ReporteController.validarFecha(fechaFinal) ||
                fechaInicial > fechaFinal
            ) {
                return res.status(400).json({
                    exito: false,
                    mensaje:
                        "Las fechas son inválidas o el rango está invertido."
                });
            }

            const datos = await ReporteModel.obtenerPagos(
                idPais,
                fechaInicial,
                fechaFinal
            );

            return res.json({
                exito: true,
                datos
            });
        } catch (error) {
            return ReporteController.responderError(
                res, error
            );
        }
    }
}

module.exports = ReporteController;
