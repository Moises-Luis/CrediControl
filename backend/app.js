const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const socioRoutes = require("./routes/socioRoutes");

const app = express();

//Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// ========================================
app.get("/", (req, res) => {
    res.json({
        mensaje: "API de CrediControl funcionando correctamente"
    });
});

// Rutas de la API
app.use("/api/socios", socioRoutes);


module.exports = app;