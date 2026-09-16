const express = require("express");
const SocioController = require("../controllers/SocioController");

const router = express.Router();

router.get("/", SocioController.obtenerTodos);
router.post("/", SocioController.crear);
router.get("/inactivos", SocioController.obtenerInactivos);
router.get("/:idSocio", SocioController.obtenerPorId);
router.put("/:idSocio", SocioController.actualizar);
router.delete("/:idSocio", SocioController.eliminar);
router.patch("/:idSocio/reactivar", SocioController.reactivar);

module.exports = router;