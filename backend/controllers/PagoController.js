
const PagoService = require("../services/PagoService");
const SimulacionPagoService = require("../services/SimulacionPagoService");

class PagoController {

    // ==========================================
    // RESPONDER ERRORES
    // ==========================================

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

    // ==========================================
    // VALIDAR ENTORNO LOCAL DE PRUEBAS
    // ==========================================

    static permitirRegistroDemo(req) {

        const habilitado =
            process.env.PAGOS_DEMO_HABILITADOS === "1";

        const direccionesLocales = [
            "127.0.0.1",
            "::1",
            "::ffff:127.0.0.1"
        ];

        const ip = req.socket.remoteAddress;

        return (
            habilitado &&
            direccionesLocales.includes(ip)
        );
    }

    // ==========================================
    // OBTENER CRÉDITOS
    // ==========================================

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

    // ==========================================
    // SIMULAR PAGO
    // ==========================================

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

    // ==========================================
    // REGISTRAR PAGO
    // ==========================================

    static async registrar(req, res) {
        try {

            // El registro únicamente estará disponible
            // en el entorno local y cuando se habilite
            // expresamente la variable de pruebas.

            if (!PagoController.permitirRegistroDemo(req)) {
                return res.status(403).json({
                    exito: false,
                    mensaje:
                        "El registro de pagos está deshabilitado. " +
                        "Solo se permite en un entorno local " +
                        "de pruebas expresamente habilitado."
                });
            }

            // Confirmación adicional para impedir
            // registros accidentales desde solicitudes
            // incompletas o controles no preparados.

            if (
                req.get("X-Confirmar-Pago") !== "SI"
            ) {
                return res.status(400).json({
                    exito: false,
                    mensaje:
                        "Debes confirmar expresamente " +
                        "el registro del pago."
                });
            }

            // Hasta implementar autenticación:
            // el usuario se determina en el servidor,
            // no se acepta desde el frontend.

            const datosPago = {
                ...req.body,
                idPais: 320,
                idUsuario: 1
            };

            // PagoService realiza todas las operaciones
            // dentro de una transacción MySQL.
            //
            // Si algo falla, ejecuta ROLLBACK.
            // Si todo resulta correcto, ejecuta COMMIT.

            const resultado =
                await PagoService.registrar(datosPago);

            return res.status(201).json({
                exito: true,
                mensaje:
                    resultado.mensaje ||
                    "Pago registrado correctamente.",
                datos: resultado
            });

        } catch (error) {
            return PagoController.responderError(
                res,
                error
            );
        }
    }

    // ==========================================
    // HISTORIAL DE PAGOS
    // ==========================================

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

    // ==========================================
    // DETALLE DE PAGO
    // ==========================================

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
