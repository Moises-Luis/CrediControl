
const db = require("../config/database");

class PermisoModel {

    // ==========================================
    // OBTENER PERMISOS DE UN PERFIL
    // ==========================================

    static async obtenerPorPerfil(idPais, idPerfil) {

        const [filas] = await db.query(
            `
            SELECT DISTINCT
                p.codigo,
                p.modulo,
                p.descripcion
            FROM permisosperfil pp

            INNER JOIN permisos p
                ON p.idPais = pp.idPais
                AND p.codigo = pp.codigo

            INNER JOIN perfilesusuarios pf
                ON pf.idPais = pp.idPais
                AND pf.idPerfil = pp.idPerfil

            WHERE pp.idPais = ?
              AND pp.idPerfil = ?
              AND pf.activo = 1
              AND p.activo = 1

            ORDER BY p.modulo, p.codigo
            `,
            [idPais, idPerfil]
        );

        return filas;
    }

    // ==========================================
    // VERIFICAR UN PERMISO
    // ==========================================

    static async tienePermiso(
        idPais,
        idPerfil,
        codigo
    ) {

        const [filas] = await db.query(
            `
            SELECT 1
            FROM permisosperfil pp

            INNER JOIN permisos p
                ON p.idPais = pp.idPais
                AND p.codigo = pp.codigo

            INNER JOIN perfilesusuarios pf
                ON pf.idPais = pp.idPais
                AND pf.idPerfil = pp.idPerfil

            WHERE pp.idPais = ?
              AND pp.idPerfil = ?
              AND pp.codigo = ?
              AND pf.activo = 1
              AND p.activo = 1

            LIMIT 1
            `,
            [idPais, idPerfil, codigo]
        );

        return filas.length > 0;
    }
}

module.exports = PermisoModel;
