
const express = require("express");

const PerfilPermisoController =
    require("../controllers/PerfilPermisoController");

const verificarPermiso =
    require("../middlewares/permisoMiddleware");

const router = express.Router();

// Todas las operaciones de administración
// requieren este permiso.
router.use(
    verificarPermiso("perfiles.administrar")
);

router.get(
    "/",
    PerfilPermisoController.listar
);

router.get(
    "/catalogo-permisos",
    PerfilPermisoController.catalogoPermisos
);

router.get(
    "/:idPerfil/permisos",
    PerfilPermisoController.obtenerPermisos
);

router.post(
    "/",
    PerfilPermisoController.crear
);

router.patch(
    "/:idPerfil/estado",
    PerfilPermisoController.cambiarEstado
);

router.put(
    "/:idPerfil/permisos",
    PerfilPermisoController.guardarPermisos
);

module.exports = router;
