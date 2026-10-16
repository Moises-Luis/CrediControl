
const express = require("express");

const UsuarioController =
    require("../controllers/UsuarioController");

const verificarPermiso =
    require("../middlewares/permisoMiddleware");

const router = express.Router();

// ==========================================
// CATÁLOGO DE PERFILES
// Solo administradores de usuarios
// ==========================================

router.get(
    "/perfiles",
    verificarPermiso("usuarios.administrar"),
    UsuarioController.obtenerPerfiles
);

// ==========================================
// LISTADO DE USUARIOS
// ==========================================

router.get(
    "/",
    verificarPermiso("usuarios.ver"),
    UsuarioController.listar
);

// ==========================================
// OBTENER USUARIO POR ID
// ==========================================

router.get(
    "/:idUsuario",
    verificarPermiso("usuarios.ver"),
    UsuarioController.obtenerPorId
);

// ==========================================
// REGISTRAR USUARIO
// ==========================================

router.post(
    "/",
    verificarPermiso("usuarios.administrar"),
    UsuarioController.crear
);

// ==========================================
// EDITAR USUARIO
// ==========================================

router.put(
    "/:idUsuario",
    verificarPermiso("usuarios.administrar"),
    UsuarioController.actualizar
);

// ==========================================
// ACTIVAR / DESACTIVAR USUARIO
// ==========================================

router.patch(
    "/:idUsuario/estado",
    verificarPermiso("usuarios.administrar"),
    UsuarioController.cambiarEstado
);

// ==========================================
// CAMBIAR CONTRASEÑA
// ==========================================

router.patch(
    "/:idUsuario/password",
    verificarPermiso("usuarios.administrar"),
    UsuarioController.cambiarPassword
);

module.exports = router;
