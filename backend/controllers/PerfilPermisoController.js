
const PerfilPermisoModel =
    require("../models/PerfilPermisoModel");

class PerfilPermisoController {

    static responderError(res, error) {
        const estado = Number(error.status);

        const codigo =
            Number.isInteger(estado) &&
            estado >= 400 &&
            estado < 500
                ? estado
                : 500;

        if (codigo === 500) {
            console.error(
                "Error en Perfiles y Permisos:",
                error
            );
        }

        return res.status(codigo).json({
            exito: false,
            mensaje:
                codigo === 500
                    ? "Error interno al administrar perfiles."
                    : error.message
        });
    }

    static async listar(req, res) {
        try {
            const datos =
                await PerfilPermisoModel.listarPerfiles(
                    req.usuario.idPais
                );

            return res.json({
                exito: true,
                datos
            });

        } catch (error) {
            return PerfilPermisoController.responderError(res, error);
        }
    }

    static async catalogoPermisos(req, res) {
        try {
            const datos =
                await PerfilPermisoModel.listarPermisos(
                    req.usuario.idPais
                );

            return res.json({
                exito: true,
                datos
            });

        } catch (error) {
            return PerfilPermisoController.responderError(res, error);
        }
    }

    static async obtenerPermisos(req, res) {
        try {
            const datos =
                await PerfilPermisoModel.obtenerAsignados(
                    req.usuario.idPais,
                    Number(req.params.idPerfil)
                );

            return res.json({
                exito: true,
                datos
            });

        } catch (error) {
            return PerfilPermisoController.responderError(res, error);
        }
    }

    static async crear(req, res) {
        try {
            const datos =
                await PerfilPermisoModel.crearPerfil(
                    req.usuario.idPais,
                    req.body
                );

            return res.status(201).json({
                exito: true,
                mensaje: "Perfil creado correctamente.",
                datos
            });

        } catch (error) {
            return PerfilPermisoController.responderError(res, error);
        }
    }

    static async cambiarEstado(req, res) {
        try {
            const datos =
                await PerfilPermisoModel.cambiarEstado(
                    req.usuario.idPais,
                    Number(req.params.idPerfil),
                    req.body?.activo
                );

            return res.json({
                exito: true,
                mensaje: "Estado actualizado correctamente.",
                datos
            });

        } catch (error) {
            return PerfilPermisoController.responderError(res, error);
        }
    }

    static async guardarPermisos(req, res) {
        try {
            const datos =
                await PerfilPermisoModel.guardarPermisos(
                    req.usuario.idPais,
                    Number(req.params.idPerfil),
                    req.body?.permisos
                );

            return res.json({
                exito: true,
                mensaje: "Permisos guardados correctamente.",
                datos
            });

        } catch (error) {
            return PerfilPermisoController.responderError(res, error);
        }
    }
}

module.exports = PerfilPermisoController;
