const SocioModel = require("../models/SocioModel");

class SocioService {

    static async crear(socio) {

        // Valores controlados por el sistema
        socio.idPais = 320;

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

        // Verificar código de socio
        const socioPorId = await SocioModel.obtenerPorId(
            socio.idPais,
            socio.idSocio
        );

        if (socioPorId) {
            const error = new Error("Ya existe un socio con ese código");
            error.statusCode = 409;
            throw error;
        }

        // Verificar documento
        const socioPorDocumento = await SocioModel.obtenerPorDocumento(
            socio.idPais,
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
}

module.exports = SocioService;