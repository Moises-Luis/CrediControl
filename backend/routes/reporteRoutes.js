
const express = require("express");
const ReporteController = require("../controllers/ReporteController");

const router = express.Router();

router.get("/resumen", ReporteController.resumen);
router.get("/cartera", ReporteController.cartera);
router.get("/pagos", ReporteController.pagos);

module.exports = router;
