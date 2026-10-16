
const express = require("express");

const ReporteController = require("../controllers/ReporteController");

const verificarPermiso = require("../middlewares/permisoMiddleware");

const router = express.Router();

// ==========================================
// RESUMEN DE REPORTES
// ==========================================

router.get(
    "/resumen",
    verificarPermiso("reportes.ver"),
    ReporteController.resumen
);

// ==========================================
// REPORTE DE CARTERA
// ==========================================

router.get(
    "/cartera",
    verificarPermiso("reportes.ver"),
    ReporteController.cartera
);

// ==========================================
// REPORTE DE PAGOS
// ==========================================

router.get(
    "/pagos",
    verificarPermiso("reportes.ver"),
    ReporteController.pagos
);

module.exports = router;
