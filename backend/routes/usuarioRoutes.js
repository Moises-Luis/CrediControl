
const express = require("express");
const UsuarioController = require("../controllers/UsuarioController");

const router = express.Router();

// Catálogo de perfiles existentes
router.get(
    "/perfiles",
    UsuarioController.obtenerPerfiles
);

// Listado de usuarios
router.get(
    "/",
    UsuarioController.listar
);

// Obtener usuario por ID
router.get(
    "/:idUsuario",
    UsuarioController.obtenerPorId
);

// Registrar usuario
router.post(
    "/",
    UsuarioController.crear
);

// Editar usuario
router.put(
    "/:idUsuario",
    UsuarioController.actualizar
);

// Activar / desactivar
router.patch(
    "/:idUsuario/estado",
    UsuarioController.cambiarEstado
);

// Cambiar contraseña
router.patch(
    "/:idUsuario/password",
    UsuarioController.cambiarPassword
);

module.exports = router;
