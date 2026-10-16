
const jwt = require("jsonwebtoken");
const AuthModel = require("../models/AuthModel");

async function authMiddleware(req, res, next) {
    try {
        // Obtener el token de Authorization
        const authorization = req.headers.authorization || "";

        const partes = authorization.split(" ");

        if (
            partes.length !== 2 ||
            partes[0] !== "Bearer" ||
            !partes[1]
        ) {
            return res.status(401).json({
                exito: false,
                mensaje: "Debes iniciar sesión."
            });
        }

        // Verificar la clave JWT
        if (!process.env.JWT_SECRET) {
            throw new Error(
                "JWT_SECRET no está configurado."
            );
        }

        // Validar firma y vencimiento del token
        const payload = jwt.verify(
            partes[1],
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"]
            }
        );

        // Consultar al usuario actual en MySQL
        const usuario = await AuthModel.buscarPorId(
            payload.idPais,
            payload.idUsuario
        );

        // Verificar que continúe activo
        if (
            !usuario ||
            Number(usuario.estado) !== 1
        ) {
            return res.status(401).json({
                exito: false,
                mensaje: "La sesión ya no es válida."
            });
        }

        // Guardar los datos del usuario autenticado
        req.usuario = {
            idPais: usuario.idPais,
            idUsuario: usuario.idUsuario,
            idPerfil: usuario.idPerfil,
            usuario: usuario.usuario,
            nombre: usuario.nombre
        };

        // Permitir continuar al controlador
        next();

    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                exito: false,
                mensaje:
                    "Sesión inválida o expirada. Inicia sesión nuevamente."
            });
        }

        console.error(
            "Error al validar autenticación:",
            error
        );

        return res.status(500).json({
            exito: false,
            mensaje: "Error al validar la sesión."
        });
    }
}

module.exports = authMiddleware;
