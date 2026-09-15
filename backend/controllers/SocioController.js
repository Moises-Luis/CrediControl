const SocioModel = require("../models/SocioModel");

class SocioController {

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
}

module.exports = SocioController;