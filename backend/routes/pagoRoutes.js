

const express = require("express");
const PagoController = require("../controllers/PagoController");

const router = express.Router();

router.get(
    "/creditos",
    PagoController.obtenerCreditos
);

router.post(
    "/simular",
    PagoController.simular
);

router.get(
    "/historial/:idSocio/:idTipoServicio/:idCredito",
    PagoController.obtenerHistorial
);

router.get(
    "/:idPago/detalle",
    PagoController.obtenerDetalle
);

router.post(
    "/",
    PagoController.registrar
);

module.exports = router;
