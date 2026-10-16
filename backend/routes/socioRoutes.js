
const express = require("express");

const SocioController = require("../controllers/SocioController");

const verificarPermiso = require("../middlewares/permisoMiddleware");

const router = express.Router();

// ==========================================
// CONSULTAR SOCIOS
// ==========================================

router.get(
    "/",
    verificarPermiso("socios.ver"),
    SocioController.obtenerTodos
);

// ==========================================
// REGISTRAR SOCIO
// ==========================================

router.post(
    "/",
    verificarPermiso("socios.crear"),
    SocioController.crear
);

// ==========================================
// CONSULTAR SOCIOS INACTIVOS
// ==========================================

router.get(
    "/inactivos",
    verificarPermiso("socios.ver"),
    SocioController.obtenerInactivos
);

// ==========================================
// CONSULTAR SOCIO POR ID
// ==========================================

router.get(
    "/:idSocio",
    verificarPermiso("socios.ver"),
    SocioController.obtenerPorId
);

// ==========================================
// ACTUALIZAR SOCIO
// ==========================================

router.put(
    "/:idSocio",
    verificarPermiso("socios.editar"),
    SocioController.actualizar
);

// ==========================================
// DESACTIVAR SOCIO
// ==========================================

router.delete(
    "/:idSocio",
    verificarPermiso("socios.eliminar"),
    SocioController.eliminar
);

// ==========================================
// REACTIVAR SOCIO
// ==========================================

router.patch(
    "/:idSocio/reactivar",
    verificarPermiso("socios.reactivar"),
    SocioController.reactivar
);

module.exports = router;
