
const express = require("express");

const CreditoController = require("../controllers/CreditoController");

const verificarPermiso = require("../middlewares/permisoMiddleware");

const router = express.Router();

// ==========================================
// CONSULTAR CRÉDITOS
// ==========================================

router.get(
    "/",
    verificarPermiso("creditos.ver"),
    CreditoController.obtenerTodos
);

// ==========================================
// CATÁLOGOS DEL FORMULARIO
// ==========================================

router.get(
    "/catalogos",
    verificarPermiso("creditos.ver"),
    CreditoController.obtenerCatalogos
);

// ==========================================
// SIMULAR AMORTIZACIÓN
// ==========================================

router.post(
    "/simular",
    verificarPermiso("creditos.crear"),
    CreditoController.simular
);

// ==========================================
// CONSULTAR CRONOGRAMA
// ==========================================

router.get(
    "/:idSocio/:idTipoServicio/:idCredito/cuotas",
    verificarPermiso("creditos.ver"),
    CreditoController.obtenerCuotas
);

// ==========================================
// CONSULTAR CRÉDITO ESPECÍFICO
// ==========================================

router.get(
    "/:idSocio/:idTipoServicio/:idCredito",
    verificarPermiso("creditos.ver"),
    CreditoController.obtenerPorId
);

// ==========================================
// REGISTRAR CRÉDITO
// ==========================================

router.post(
    "/",
    verificarPermiso("creditos.crear"),
    CreditoController.crear
);

module.exports = router;
