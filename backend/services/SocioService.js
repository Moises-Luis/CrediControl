const SocioModel = require("../models/SocioModel");

class SocioService {

    // ========================================
    // Crear socio
    // ========================================
    static async crear(socio) {

        const idPais = 320;

        socio.idPais = idPais;

        // Validar campos obligatorios
        if (
            !socio.idSocio ||
            !socio.primerNombre ||
            !socio.primerApellido ||
            !socio.idDocumento ||
            !socio.noDocumento ||
            !socio.idUsuario
        ) {
            const error = new Error("Faltan campos obligatorios");
            error.statusCode = 400;
            throw error;
        }

        // Verificar que no exista el código del socio
        const socioPorId = await SocioModel.obtenerPorId(
            idPais,
            socio.idSocio
        );

        if (socioPorId) {
            const error = new Error(
                "Ya existe un socio con ese código"
            );

            error.statusCode = 409;
            throw error;
        }

        // Verificar que no exista el documento
        const socioPorDocumento =
            await SocioModel.obtenerPorDocumento(
                idPais,
                socio.idDocumento,
                socio.noDocumento
            );

        if (socioPorDocumento) {
            const error = new Error(
                "Ya existe un socio registrado con ese documento"
            );

            error.statusCode = 409;
            throw error;
        }

        await SocioModel.crear(socio);

        return {
            idSocio: socio.idSocio
        };
    }


    // Actualizar socio
    static async actualizar(idSocio, socio) {

        const idPais = 320;

        // Validar campos obligatorios
        if (
            !socio.primerNombre ||
            !socio.primerApellido ||
            !socio.idDocumento ||
            !socio.noDocumento
        ) {
            const error = new Error(
                "Faltan campos obligatorios"
            );

            error.statusCode = 400;
            throw error;
        }

        // Verificar que el socio exista
        const socioExistente =
            await SocioModel.obtenerPorId(
                idPais,
                idSocio
            );

        if (!socioExistente) {
            const error = new Error(
                "Socio no encontrado"
            );

            error.statusCode = 404;
            throw error;
        }

        // Verificar que el documento no pertenezca
        // a otro socio
        const socioPorDocumento =
            await SocioModel.obtenerPorDocumento(
                idPais,
                socio.idDocumento,
                socio.noDocumento
            );

        if (
            socioPorDocumento &&
            socioPorDocumento.idSocio !== idSocio
        ) {
            const error = new Error(
                "El documento ya pertenece a otro socio"
            );

            error.statusCode = 409;
            throw error;
        }

        await SocioModel.actualizar(
            idPais,
            idSocio,
            socio
        );

        return {
            idSocio
        };
    }


    // Desactivar socio
    static async eliminar(idSocio) {

        const idPais = 320;

        // Buscar socio
        const socio = await SocioModel.obtenerPorId(
            idPais,
            idSocio
        );

        if (!socio) {
            const error = new Error(
                "Socio no encontrado"
            );

            error.statusCode = 404;
            throw error;
        }

        // Verificar que no esté desactivado
        if (!socio.activo) {
            const error = new Error(
                "El socio ya se encuentra inactivo"
            );

            error.statusCode = 400;
            throw error;
        }

        // Eliminación lógica
        await SocioModel.desactivar(
            idPais,
            idSocio
        );
    }

    // Reactivar socio
    static async reactivar(idSocio) {

        const idPais = 320;

        // Buscar socio
        const socio = await SocioModel.obtenerPorId(
            idPais,
            idSocio
        );

        if (!socio) {
            const error = new Error(
                "Socio no encontrado"
            );

            error.statusCode = 404;
            throw error;
        }

        // Verificar que realmente esté inactivo
        if (socio.activo) {
            const error = new Error(
                "El socio ya se encuentra activo"
            );

            error.statusCode = 400;
            throw error;
        }

        await SocioModel.reactivar(
            idPais,
            idSocio
        );
    }
}

module.exports = SocioService;