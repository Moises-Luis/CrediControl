

const express = require("express");

const PagoController = require("../controllers/PagoController");

const verificarPermiso = require("../middlewares/permisoMiddleware");

const router = express.Router();

// ==========================================
// CONSULTAR CRÉDITOS PARA PAGOS
// ==========================================

router.get(
    "/creditos",
    verificarPermiso("pagos.ver"),
    PagoController.obtenerCreditos
);

// ==========================================
// SIMULAR PAGO
// ==========================================

router.post(
    "/simular",
    verificarPermiso("pagos.simular"),
    PagoController.simular
);

// ==========================================
// HISTORIAL DE PAGOS
// ==========================================

router.get(
    "/historial/:idSocio/:idTipoServicio/:idCredito",
    verificarPermiso("pagos.ver"),
    PagoController.obtenerHistorial
);

// ==========================================
// DETALLE DE PAGO
// ==========================================

router.get(
    "/:idPago/detalle",
    verificarPermiso("pagos.ver"),
    PagoController.obtenerDetalle
);

// ==========================================
// REGISTRAR PAGO
// ==========================================

router.post(
    "/",
    verificarPermiso("pagos.registrar"),
    PagoController.registrar
);

module.exports = router;
