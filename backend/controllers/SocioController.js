const SocioModel = require("../models/SocioModel");

class SocioController {
    static async obtenerPorId(req, res) {
    try {

        const { idSocio } = req.params;

        const socio = await SocioModel.obtenerPorId(320, idSocio);

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

    static async obtenerTodos(req, res) {
        try {

            const socios = await SocioModel.obtenerTodos();

            res.status(200).json({
                exito: true,
                datos: socios
            });

        } catch (error) {

            console.error("Error al obtener socios:", error);

            res.status(500).json({
                exito: false,
                mensaje: "Error interno del servidor"
            });
        }
    }
    static async crear(req, res) {
    try {

        const socio = req.body;

        // Validaciones básicas
        if (
            !socio.idSocio ||
            !socio.primerNombre ||
            !socio.primerApellido ||
            !socio.idDocumento ||
            !socio.noDocumento ||
            !socio.idUsuario
        ) {
            return res.status(400).json({
                exito: false,
                mensaje: "Faltan campos obligatorios"
            });
        }

        // Valores controlados por la aplicación
        socio.idPais = 320;

        const socioPorId = await SocioModel.obtenerPorId(
            socio.idPais,
            socio.idSocio
        );

        if (socioPorId) {
            return res.status(409).json({
              exito: false,
               mensaje: "Ya existe un socio con ese código"
            });
        }

        const socioPorDocumento = await SocioModel.obtenerPorDocumento(
            socio.idPais,
            socio.idDocumento,
            socio.noDocumento
        );

        if (socioPorDocumento) {
            return res.status(409).json({
                exito: false,
                mensaje: "Ya existe un socio registrado con ese documento"
            });
        }
        const resultado = await SocioModel.crear(socio);

        return res.status(201).json({
            exito: true,
            mensaje: "Socio registrado correctamente",
            datos: {
                idSocio: socio.idSocio
            }
        });

    } catch (error) {

        console.error("Error al registrar socio:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                exito: false,
                mensaje: "Ya existe un registro con esos datos únicos"
            });
        }
        return res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor"
        });
    }
}

static async actualizar(req, res) {
    try {

        const { idSocio } = req.params;
        const socio = req.body;

        // ========================================
        // Validaciones básicas
        // ========================================

        if (
            !socio.primerNombre ||
            !socio.primerApellido ||
            !socio.idDocumento ||
            !socio.noDocumento
        ) {
            return res.status(400).json({
                exito: false,
                mensaje: "Faltan campos obligatorios"
            });
        }

        // ========================================
        // Verificar que el socio exista
        // ========================================

        const socioExistente = await SocioModel.obtenerPorId(
            320,
            idSocio
        );

        if (!socioExistente) {
            return res.status(404).json({
                exito: false,
                mensaje: "Socio no encontrado"
            });
        }
        const socioPorDocumento = await SocioModel.obtenerPorDocumento(320, socio.idDocumento, socio.noDocumento);

    if (
        socioPorDocumento &&
        socioPorDocumento.idSocio !== idSocio
    ) {
        return res.status(409).json({
            exito: false,
            mensaje: "El documento ya pertenece a otro socio"
        });
    }
        // ========================================
        // Actualizar
        // ========================================

        await SocioModel.actualizar(
            320,
            idSocio,
            socio
        );

        return res.status(200).json({
            exito: true,
            mensaje: "Socio actualizado correctamente",
            datos: {
                idSocio: idSocio
            }
        });

    } catch (error) {

        console.error("Error al actualizar socio:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                exito: false,
                mensaje: "Ya existe otro socio con ese documento"
            });
        }

        return res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor"
        });
    }
    }

    static async eliminar(req, res) {
    try {

        const { idSocio } = req.params;

        // ========================================
        // Verificar que el socio exista
        // ========================================

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

        // ========================================
        // Verificar si ya está inactivo
        // ========================================

        if (!socio.activo) {
            return res.status(400).json({
                exito: false,
                mensaje: "El socio ya se encuentra inactivo"
            });
        }

        // ========================================
        // Eliminación lógica
        // ========================================

        await SocioModel.desactivar(
            320,
            idSocio
        );

        return res.status(200).json({
            exito: true,
            mensaje: "Socio desactivado correctamente"
        });

    } catch (error) {

        console.error("Error al desactivar socio:", error);

        return res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor"
        });
    }
    }

    static async reactivar(req, res) {
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

        if (socio.activo) {
            return res.status(400).json({
                exito: false,
                mensaje: "El socio ya se encuentra activo"
            });
        }

        await SocioModel.reactivar(
            320,
            idSocio
        );

        return res.status(200).json({
            exito: true,
            mensaje: "Socio reactivado correctamente"
        });

    } catch (error) {

        console.error("Error al reactivar socio:", error);

        return res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor"
        });
    }
    }

    static async obtenerInactivos(req, res) {
    try {

        const socios = await SocioModel.obtenerInactivos();

        return res.status(200).json({
            exito: true,
            datos: socios
        });

    } catch (error) {

        console.error("Error al obtener socios inactivos:", error);

        return res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor"
        });
    }
    }
    
}

module.exports = SocioController;