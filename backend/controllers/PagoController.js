
const PagoService = require("../services/PagoService");
const SimulacionPagoService = require("../services/SimulacionPagoService");

class PagoController {
    static responderError(res, error) {
        const estado = Number(
            error.status || error.statusCode
        );

        const codigo =
            Number.isInteger(estado) &&
            estado >= 400 &&
            estado < 600
                ? estado
                : 500;

        if (codigo === 500) {
            console.error("Error en pagos:", error);
        }

        return res.status(codigo).json({
            exito: false,
            mensaje:
                codigo === 500
                    ? "Error interno al procesar la solicitud."
                    : error.message
        });
    }

    static async obtenerCreditos(req, res) {
        try {
            const datos =
                await PagoService.obtenerCreditos();

            return res.json({
                exito: true,
                datos
            });
        } catch (error) {
            return PagoController.responderError(
                res,
                error
            );
        }
    }

    static async simular(req, res) {
        try {
            const datos =
                await SimulacionPagoService.simular(
                    req.body
                );

            return res.json({
                exito: true,
                datos
            });
        } catch (error) {
            return PagoController.responderError(
                res,
                error
            );
        }
    }

    static async registrar(req, res) {
        // Temporalmente bloqueado hasta unificar
        // el registro y la simulación bajo la misma
        // política de abonos extraordinarios.
        return res.status(503).json({
            exito: false,
            mensaje:
                "Registro de pagos temporalmente deshabilitado. " +
                "Valida la simulación y la política de abonos " +
                "antes de activarlo."
        });
    }

    static async obtenerHistorial(req, res) {
        try {
            const {
                idSocio,
                idTipoServicio,
                idCredito
            } = req.params;

            const idPais = Number(
                req.query.idPais ?? 320
            );

            const datos =
                await PagoService.obtenerHistorial(
                    idPais,
                    idSocio,
                    Number(idTipoServicio),
                    Number(idCredito)
                );

            return res.json({
                exito: true,
                datos
            });
        } catch (error) {
            return PagoController.responderError(
                res,
                error
            );
        }
    }

    static async obtenerDetalle(req, res) {
        try {
            const datos =
                await PagoService.obtenerDetallePago(
                    Number(req.params.idPago)
                );

            return res.json({
                exito: true,
                datos
            });
        } catch (error) {
            return PagoController.responderError(
                res,
                error
            );
        }
    }
}

module.exports = PagoController;
