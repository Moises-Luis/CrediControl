const express = require("express");
const CreditoController = require("../controllers/CreditoController");

const router = express.Router();

// Consultar créditos
router.get("/", CreditoController.obtenerTodos);

// Catálogos para formulario
router.get("/catalogos", CreditoController.obtenerCatalogos);

// Simular amortización sin registrar
router.post("/simular", CreditoController.simular);

// Consultar cronograma de un crédito
router.get(
    "/:idSocio/:idTipoServicio/:idCredito/cuotas",
    CreditoController.obtenerCuotas
);

// Consultar un crédito específico
router.get(
    "/:idSocio/:idTipoServicio/:idCredito",
    CreditoController.obtenerPorId
);

// Registrar crédito y cuotas
router.post("/", CreditoController.crear);

module.exports = router;