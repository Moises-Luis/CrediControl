
const express = require("express");
const CuotaController = require("../controllers/CuotaController");

const router = express.Router();

// ==========================================
// CONSULTAR CUOTAS
// ==========================================

// Resumen estadístico
router.get(
    "/resumen",
    CuotaController.obtenerResumen
);

// Listado general con filtros
router.get(
    "/",
    CuotaController.obtenerTodas
);

// Detalle de una cuota específica
router.get(
    "/:idSocio/:idTipoServicio/:idCredito/:numeroCuota",
    CuotaController.obtenerPorId
);

module.exports = router;
