
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// ==========================================
// RUTAS DE NEGOCIO
// ==========================================

const socioRoutes =
    require("./routes/socioRoutes");

const creditoRoutes =
    require("./routes/creditoRoutes");

const pagoRoutes =
    require("./routes/pagoRoutes");

const reporteRoutes =
    require("./routes/reporteRoutes");

const cuotaRoutes =
    require("./routes/cuotaRoutes");

const usuarioRoutes =
    require("./routes/usuarioRoutes");


    const perfilPermisoRoutes =
    require("./routes/perfilPermisoRoutes");
    
// ==========================================
// AUTENTICACIÓN
// ==========================================

const authRoutes =
    require("./routes/authRoutes");

const authMiddleware =
    require("./middlewares/authMiddleware");

const app = express();

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// ==========================================
// RUTA PRINCIPAL PÚBLICA
// ==========================================

app.get("/", (req, res) => {
    res.json({
        mensaje:
            "API de CrediControl funcionando correctamente"
    });
});

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

app.use("/api/auth", authRoutes);

// ==========================================
// PROTECCIÓN GENERAL DE LA API
// ==========================================

// Todo endpoint registrado después de esta línea
// requiere un JWT válido.

app.use("/api", authMiddleware);
app.use("/api/perfiles", perfilPermisoRoutes);
// ==========================================
// RUTAS PRIVADAS
// ==========================================

app.use("/api/socios", socioRoutes);

app.use("/api/creditos", creditoRoutes);

app.use("/api/pagos", pagoRoutes);

app.use("/api/reportes", reporteRoutes);

app.use("/api/cuotas", cuotaRoutes);

app.use("/api/usuarios", usuarioRoutes);

module.exports = app;
