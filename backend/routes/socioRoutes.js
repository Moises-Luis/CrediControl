const express = require("express");
const SocioController = require("../controllers/SocioController");

const router = express.Router();

router.get("/", SocioController.obtenerTodos);

module.exports = router;