
const UsuarioService = require("../services/UsuarioService");

class UsuarioController {

    static responderError(res, error) {
        const status = error.status || 500;

        if (status === 500) {
            console.error("Error en Usuarios:", error);
        }

        return res.status(status).json({
            exito: false,
            mensaje:
                status === 500
                    ? "Error interno en el módulo de usuarios."
                    : error.message
        });
    }

    static async listar(req, res) {
        try {
            const datos = await UsuarioService.listar(
                req.query.idPais ?? 320,
                req.query.buscar ?? ""
            );

            return res.json({
                exito: true,
                datos
            });
        } catch (error) {
            return UsuarioController.responderError(
                res,
                error
            );
        }
    }

    static async obtenerPorId(req, res) {
        try {
            const datos =
                await UsuarioService.obtenerPorId(
                    req.query.idPais ?? 320,
                    req.params.idUsuario
                );

            return res.json({
                exito: true,
                datos
            });
        } catch (error) {
            return UsuarioController.responderError(
                res,
                error
            );
        }
    }

    static async obtenerPerfiles(req, res) {
        try {
            const datos =
                await UsuarioService.obtenerPerfiles(
                    req.query.idPais ?? 320
                );

            return res.json({
                exito: true,
                datos
            });
        } catch (error) {
            return UsuarioController.responderError(
                res,
                error
            );
        }
    }

    static async crear(req, res) {
        try {
            const datos = await UsuarioService.crear(
                req.body.idPais ?? 320,
                req.body
            );

            return res.status(201).json({
                exito: true,
                mensaje: "Usuario creado correctamente.",
                datos
            });
        } catch (error) {
            return UsuarioController.responderError(
                res,
                error
            );
        }
    }

    static async actualizar(req, res) {
        try {
            const datos = await UsuarioService.actualizar(
                req.body.idPais ?? 320,
                req.params.idUsuario,
                req.body
            );

            return res.json({
                exito: true,
                mensaje: "Usuario actualizado correctamente.",
                datos
            });
        } catch (error) {
            return UsuarioController.responderError(
                res,
                error
            );
        }
    }

    static async cambiarEstado(req, res) {
        try {
            const datos =
                await UsuarioService.cambiarEstado(
                    req.body.idPais ?? 320,
                    req.params.idUsuario,
                    req.body.estado
                );

            return res.json({
                exito: true,
                mensaje: "Estado actualizado correctamente.",
                datos
            });
        } catch (error) {
            return UsuarioController.responderError(
                res,
                error
            );
        }
    }

    static async cambiarPassword(req, res) {
        try {
            const resultado =
                await UsuarioService.cambiarPassword(
                    req.body.idPais ?? 320,
                    req.params.idUsuario,
                    req.body.password
                );

            return res.json({
                exito: true,
                ...resultado
            });
        } catch (error) {
            return UsuarioController.responderError(
                res,
                error
            );
        }
    }
}

module.exports = UsuarioController;
