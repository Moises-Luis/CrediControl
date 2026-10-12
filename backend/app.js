const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const socioRoutes = require("./routes/socioRoutes");
const creditoRoutes = require("./routes/creditoRoutes");
const pagoRoutes = require("./routes/pagoRoutes");
const reporteRoutes = require("./routes/reporteRoutes");
const cuotaRoutes = require("./routes/cuotaRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// RUTA PRINCIPAL
app.get("/", (req, res) => {
    res.json({
        mensaje: "API de CrediControl funcionando correctamente"
    });
});

// RUTAS DE API
app.use("/api/socios", socioRoutes);
app.use("/api/creditos", creditoRoutes);
app.use("/api/pagos", pagoRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/cuotas", cuotaRoutes);
app.use("/api/usuarios", usuarioRoutes);

module.exports = app;

