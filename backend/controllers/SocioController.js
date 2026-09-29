const SocioModel = require("../models/SocioModel");
const SocioService = require("../services/SocioService");

class SocioController {

    // Obtener todos los socios activos
    static async obtenerTodos(req, res) {
        try {

            const socios = await SocioModel.obtenerTodos();

            return res.status(200).json({
                exito: true,
                datos: socios
            });

        } catch (error) {

            console.error("Error al obtener socios:", error);

            return res.status(500).json({
                exito: false,
                mensaje: "Error interno del servidor"
            });
        }
    }


    // Obtener socio por ID
    static async obtenerPorId(req, res) {
        try {

            const { idSocio } = req.params;

            const socio = await SocioModel.obtenerPorId(
                320,
                idSocio
            );

            if (!socio) {
                return res.status(404).json({
                    exito: false,
                    mensaje: "Socio no encontrado"
                });
            }

            return res.status(200).json({
                exito: true,
                datos: socio
            });

        } catch (error) {

            console.error("Error al obtener socio:", error);

            return res.status(500).json({
                exito: false,
                mensaje: "Error interno del servidor"
            });
        }
    }


    // Obtener socios inactivos
    static async obtenerInactivos(req, res) {
        try {

            const socios = await SocioModel.obtenerInactivos();

            return res.status(200).json({
                exito: true,
                datos: socios
            });

        } catch (error) {

            console.error(
                "Error al obtener socios inactivos:",
                error
            );

            return res.status(500).json({
                exito: false,
                mensaje: "Error interno del servidor"
            });
        }
    }


    // Crear socio
    static async crear(req, res) {
        try {

            const resultado = await SocioService.crear(
                req.body
            );

            return res.status(201).json({
                exito: true,
                mensaje: "Socio registrado correctamente",
                datos: resultado
            });

        } catch (error) {

            console.error("Error al registrar socio:", error);

            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    exito: false,
                    mensaje:
                        "Ya existe un registro con esos datos únicos"
                });
            }

            return res.status(error.statusCode || 500).json({
                exito: false,
                mensaje: error.statusCode
                    ? error.message
                    : "Error interno del servidor"
            });
        }
    }


    // Actualizar socio
    static async actualizar(req, res) {
        try {

            const { idSocio } = req.params;

            const resultado = await SocioService.actualizar(
                idSocio,
                req.body
            );

            return res.status(200).json({
                exito: true,
                mensaje: "Socio actualizado correctamente",
                datos: resultado
            });

        } catch (error) {

            console.error("Error al actualizar socio:", error);

            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    exito: false,
                    mensaje:
                        "Ya existe otro socio con ese documento"
                });
            }

            return res.status(error.statusCode || 500).json({
                exito: false,
                mensaje: error.statusCode
                    ? error.message
                    : "Error interno del servidor"
            });
        }
    }


    // Eliminación lógica

    static async eliminar(req, res) {
        try {

            const { idSocio } = req.params;

            await SocioService.eliminar(idSocio);

            return res.status(200).json({
                exito: true,
                mensaje: "Socio desactivado correctamente"
            });

        } catch (error) {

            console.error("Error al desactivar socio:", error);

            return res.status(error.statusCode || 500).json({
                exito: false,
                mensaje: error.statusCode
                    ? error.message
                    : "Error interno del servidor"
            });
        }
    }


    // Reactivar socio
    static async reactivar(req, res) {
        try {

            const { idSocio } = req.params;

            await SocioService.reactivar(idSocio);

            return res.status(200).json({
                exito: true,
                mensaje: "Socio reactivado correctamente"
            });

        } catch (error) {

            console.error("Error al reactivar socio:", error);

            return res.status(error.statusCode || 500).json({
                exito: false,
                mensaje: error.statusCode
                    ? error.message
                    : "Error interno del servidor"
            });
        }
    }
}

module.exports = SocioController;