const CreditoModel = require("../models/CreditoModel");
const CreditoService = require("../services/CreditoService");

class CreditoController {

    static responderError(res, error, mensaje) {
        console.error(error);

        return res.status(error.statusCode || 500).json({
            exito: false,
            mensaje: error.statusCode
                ? error.message
                : mensaje
        });
    }

    static async obtenerTodos(req, res) {
        try {
            const creditos = await CreditoModel.obtenerTodos();

            return res.status(200).json({
                exito: true,
                datos: creditos
            });

        } catch (error) {
            return CreditoController.responderError(
                res,
                error,
                "Error al consultar los créditos."
            );
        }
    }

    static async obtenerCatalogos(req, res) {
        try {
            const [socios, servicios, frecuencias] =
                await Promise.all([
                    CreditoModel.obtenerSociosActivos(),
                    CreditoModel.obtenerServiciosActivos(),
                    CreditoModel.obtenerFrecuencias()
                ]);

            return res.status(200).json({
                exito: true,
                datos: {
                    socios,
                    servicios,
                    frecuencias
                }
            });

        } catch (error) {
            return CreditoController.responderError(
                res,
                error,
                "Error al consultar los catálogos."
            );
        }
    }

    static async obtenerPorId(req, res) {
        try {
            const {
                idSocio,
                idTipoServicio,
                idCredito
            } = req.params;

            const credito = await CreditoModel.obtenerPorId(
                idSocio,
                idTipoServicio,
                idCredito
            );

            if (!credito) {
                return res.status(404).json({
                    exito: false,
                    mensaje: "Crédito no encontrado."
                });
            }

            return res.status(200).json({
                exito: true,
                datos: credito
            });

        } catch (error) {
            return CreditoController.responderError(
                res,
                error,
                "Error al consultar el crédito."
            );
        }
    }

    static async obtenerCuotas(req, res) {
        try {
            const {
                idSocio,
                idTipoServicio,
                idCredito
            } = req.params;

            const credito = await CreditoModel.obtenerPorId(
                idSocio,
                idTipoServicio,
                idCredito
            );

            if (!credito) {
                return res.status(404).json({
                    exito: false,
                    mensaje: "Crédito no encontrado."
                });
            }

            const cuotas = await CreditoModel.obtenerCuotas(
                idSocio,
                idTipoServicio,
                idCredito
            );

            return res.status(200).json({
                exito: true,
                datos: cuotas
            });

        } catch (error) {
            return CreditoController.responderError(
                res,
                error,
                "Error al consultar las cuotas."
            );
        }
    }

    static async simular(req, res) {
        try {
            const resultado = await CreditoService.simular(
                req.body
            );

            return res.status(200).json({
                exito: true,
                mensaje: "Amortización calculada correctamente.",
                datos: resultado
            });

        } catch (error) {
            return CreditoController.responderError(
                res,
                error,
                "No fue posible simular la amortización."
            );
        }
    }

    static async crear(req, res) {
        try {
            const resultado = await CreditoService.crear(
                req.body
            );

            return res.status(201).json({
                exito: true,
                mensaje: "Crédito y cuotas registrados correctamente.",
                datos: resultado
            });

        } catch (error) {
            return CreditoController.responderError(
                res,
                error,
                "No fue posible registrar el crédito."
            );
        }
    }
}

module.exports = CreditoController;