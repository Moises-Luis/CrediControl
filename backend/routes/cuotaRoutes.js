
const express = require("express");

const CuotaController = require("../controllers/CuotaController");

const verificarPermiso = require("../middlewares/permisoMiddleware");

const router = express.Router();

// ==========================================
// RESUMEN ESTADÍSTICO
// ==========================================

router.get(
    "/resumen",
    verificarPermiso("cuotas.ver"),
    CuotaController.obtenerResumen
);

// ==========================================
// CONSULTAR CUOTAS
// ==========================================

router.get(
    "/",
    verificarPermiso("cuotas.ver"),
    CuotaController.obtenerTodas
);

// ==========================================
// CONSULTAR DETALLE DE CUOTA
// ==========================================

router.get(
    "/:idSocio/:idTipoServicio/:idCredito/:numeroCuota",
    verificarPermiso("cuotas.ver"),
    CuotaController.obtenerPorId
);

module.exports = router;
