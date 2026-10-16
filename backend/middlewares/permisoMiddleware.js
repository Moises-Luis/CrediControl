
const PermisoModel = require("../models/PermisoModel");

function verificarPermiso(codigoPermiso) {

    return async (req, res, next) => {

        try {
            // authMiddleware debe ejecutarse antes.
            if (!req.usuario) {
                return res.status(401).json({
                    exito: false,
                    mensaje: "Debes iniciar sesión."
                });
            }

            const {
                idPais,
                idPerfil
            } = req.usuario;

            const autorizado =
                await PermisoModel.tienePermiso(
                    idPais,
                    idPerfil,
                    codigoPermiso
                );

            if (!autorizado) {
                return res.status(403).json({
                    exito: false,
                    mensaje:
                        "No tienes permisos para " +
                        "realizar esta operación."
                });
            }

            next();

        } catch (error) {
            console.error(
                "Error al verificar permiso:",
                error
            );

            return res.status(500).json({
                exito: false,
                mensaje:
                    "No fue posible verificar " +
                    "los permisos del usuario."
            });
        }
    };
}

module.exports = verificarPermiso;
