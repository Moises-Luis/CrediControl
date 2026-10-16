
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AuthModel = require("../models/AuthModel");

class AuthController {
    static async login(req, res) {
        try {
            const { usuario, password } = req.body || {};

            if (
                typeof usuario !== "string" ||
                typeof password !== "string" ||
                !usuario.trim() ||
                !password
            ) {
                return res.status(400).json({
                    exito: false,
                    mensaje: "Ingresa usuario y contraseña."
                });
            }

            const encontrado =
                await AuthModel.buscarPorUsuario(
                    usuario.trim()
                );

            const mensajeError =
                "Usuario o contraseña incorrectos.";

            if (
                !encontrado ||
                Number(encontrado.estado) !== 1
            ) {
                return res.status(401).json({
                    exito: false,
                    mensaje: mensajeError
                });
            }

            const passwordValida =
                await bcrypt.compare(
                    password,
                    encontrado.password || ""
                );

            if (!passwordValida) {
                return res.status(401).json({
                    exito: false,
                    mensaje: mensajeError
                });
            }

            if (!process.env.JWT_SECRET) {
                throw new Error(
                    "JWT_SECRET no está configurado."
                );
            }

            const payload = {
                idPais: encontrado.idPais,
                idUsuario: encontrado.idUsuario
            };

            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                {
                    expiresIn:
                        process.env.JWT_EXPIRES_IN || "8h",
                    algorithm: "HS256"
                }
            );

            const datosUsuario = {
                idPais: encontrado.idPais,
                idUsuario: encontrado.idUsuario,
                idPerfil: encontrado.idPerfil,
                usuario: encontrado.usuario,
                nombre: encontrado.nombre
            };

            return res.json({
                exito: true,
                mensaje: "Inicio de sesión correcto.",
                datos: {
                    token,
                    usuario: datosUsuario
                }
            });

        } catch (error) {
            console.error("Error de login:", error);

            return res.status(500).json({
                exito: false,
                mensaje: "No fue posible iniciar sesión."
            });
        }
    }

    static async me(req, res) {
        return res.json({
            exito: true,
            datos: req.usuario
        });
    }
}

module.exports = AuthController;
