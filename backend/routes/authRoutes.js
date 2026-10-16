
const express = require("express");

const AuthController =
    require("../controllers/AuthController");

const authMiddleware =
    require("../middlewares/authMiddleware");

const PermisoModel =
    require("../models/PermisoModel");

const router = express.Router();

// ==========================================
// LOGIN PÚBLICO
// ==========================================

router.post(
    "/login",
    AuthController.login
);

// ==========================================
// INFORMACIÓN DEL USUARIO AUTENTICADO
// ==========================================

router.get(
    "/me",
    authMiddleware,
    AuthController.me
);

// ==========================================
// PERMISOS DEL USUARIO AUTENTICADO
// ==========================================

router.get(
    "/permisos",
    authMiddleware,
    async (req, res) => {

        try {
            const {
                idPais,
                idPerfil
            } = req.usuario;

            const permisos =
                await PermisoModel.obtenerPorPerfil(
                    idPais,
                    idPerfil
                );

            return res.json({
                exito: true,
                datos: permisos
            });

        } catch (error) {
            console.error(
                "Error al consultar permisos:",
                error
            );

            return res.status(500).json({
                exito: false,
                mensaje:
                    "No fue posible obtener los permisos."
            });
        }
    }
);

module.exports = router;
