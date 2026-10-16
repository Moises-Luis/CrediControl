
const db = require("../config/database");

class PerfilPermisoModel {

    static async listarPerfiles(idPais) {
        const [filas] = await db.query(
            `
            SELECT
                idPais,
                idPerfil,
                descripcion,
                activo,
                fecha
            FROM perfilesusuarios
            WHERE idPais = ?
            ORDER BY idPerfil
            `,
            [idPais]
        );

        return filas;
    }

    static async listarPermisos(idPais) {
        const [filas] = await db.query(
            `
            SELECT
                codigo,
                modulo,
                descripcion,
                activo
            FROM permisos
            WHERE idPais = ?
              AND activo = 1
            ORDER BY modulo, codigo
            `,
            [idPais]
        );

        return filas;
    }

    static async obtenerAsignados(idPais, idPerfil) {
        const [filas] = await db.query(
            `
            SELECT pp.codigo
            FROM permisosperfil pp
            INNER JOIN perfilesusuarios pf
                ON pf.idPais = pp.idPais
                AND pf.idPerfil = pp.idPerfil
            WHERE pp.idPais = ?
              AND pp.idPerfil = ?
            ORDER BY pp.codigo
            `,
            [idPais, idPerfil]
        );

        return filas.map((fila) => fila.codigo);
    }

    static async crearPerfil(idPais, datos) {
        const idPerfil = Number(datos.idPerfil);
        const descripcion = String(
            datos.descripcion || ""
        ).trim();

        if (
            !Number.isInteger(idPerfil) ||
            idPerfil < 2 ||
            idPerfil > 255
        ) {
            const error = new Error(
                "El identificador debe estar entre 2 y 255."
            );
            error.status = 400;
            throw error;
        }

        if (
            !descripcion ||
            descripcion.length > 200
        ) {
            const error = new Error(
                "La descripción es obligatoria " +
                "y no debe superar 200 caracteres."
            );
            error.status = 400;
            throw error;
        }

        try {
            await db.query(
                `
                INSERT INTO perfilesusuarios (
                    idPais,
                    idPerfil,
                    descripcion,
                    activo
                )
                VALUES (?, ?, ?, 1)
                `,
                [idPais, idPerfil, descripcion]
            );

        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
                error.status = 409;
                error.message =
                    "Ya existe un perfil con ese identificador.";
            }
            throw error;
        }

        return {
            idPais,
            idPerfil,
            descripcion,
            activo: 1
        };
    }

    static async cambiarEstado(
        idPais,
        idPerfil,
        activo
    ) {
        if (Number(idPerfil) === 1) {
            const error = new Error(
                "No se puede desactivar " +
                "el perfil Administrador."
            );
            error.status = 400;
            throw error;
        }

        if (![0, 1].includes(Number(activo))) {
            const error = new Error(
                "El estado debe ser 0 o 1."
            );
            error.status = 400;
            throw error;
        }

        const [resultado] = await db.query(
            `
            UPDATE perfilesusuarios
            SET activo = ?
            WHERE idPais = ?
              AND idPerfil = ?
            `,
            [
                Number(activo),
                idPais,
                idPerfil
            ]
        );

        if (resultado.affectedRows !== 1) {
            const error = new Error(
                "El perfil no existe."
            );
            error.status = 404;
            throw error;
        }

        return {
            idPerfil: Number(idPerfil),
            activo: Number(activo)
        };
    }

    static async guardarPermisos(
        idPais,
        idPerfil,
        codigos
    ) {
        const perfilId = Number(idPerfil);

        if (
            !Number.isInteger(perfilId) ||
            perfilId < 1 ||
            perfilId > 255
        ) {
            const error = new Error(
                "Identificador de perfil inválido."
            );
            error.status = 400;
            throw error;
        }

        if (
            !Array.isArray(codigos) ||
            codigos.some(
                (codigo) => typeof codigo !== "string"
            )
        ) {
            const error = new Error(
                "Debes enviar un arreglo de permisos."
            );
            error.status = 400;
            throw error;
        }

        const permisos = [
            ...new Set(codigos)
        ];

        // Proteger los permisos esenciales del
        // perfil Administrador para evitar bloquear
        // la administración del sistema.
        if (perfilId === 1) {
            const obligatorios = [
                "perfiles.administrar",
                "usuarios.administrar",
                "usuarios.ver"
            ];

            if (
                obligatorios.some(
                    (codigo) => !permisos.includes(codigo)
                )
            ) {
                const error = new Error(
                    "El Administrador debe conservar " +
                    "los permisos esenciales del sistema."
                );
                error.status = 400;
                throw error;
            }
        }

        const conexion = await db.getConnection();

        try {
            await conexion.beginTransaction();

            const [perfiles] = await conexion.query(
                `
                SELECT idPerfil
                FROM perfilesusuarios
                WHERE idPais = ?
                  AND idPerfil = ?
                FOR UPDATE
                `,
                [idPais, perfilId]
            );

            if (perfiles.length === 0) {
                const error = new Error(
                    "El perfil no existe."
                );
                error.status = 404;
                throw error;
            }

            if (permisos.length > 0) {
                const marcadores =
                    permisos.map(() => "?").join(",");

                const [validos] = await conexion.query(
                    `
                    SELECT codigo
                    FROM permisos
                    WHERE idPais = ?
                      AND activo = 1
                      AND codigo IN (${marcadores})
                    `,
                    [idPais, ...permisos]
                );

                if (validos.length !== permisos.length) {
                    const error = new Error(
                        "Uno o más permisos no existen " +
                        "o están inactivos."
                    );
                    error.status = 400;
                    throw error;
                }
            }

            await conexion.query(
                `
                DELETE FROM permisosperfil
                WHERE idPais = ?
                  AND idPerfil = ?
                `,
                [idPais, perfilId]
            );

            if (permisos.length > 0) {
                const valores = permisos.map(
                    () => "(?, ?, ?)"
                ).join(",");

                const parametros = permisos.flatMap(
                    (codigo) => [
                        idPais,
                        perfilId,
                        codigo
                    ]
                );

                await conexion.query(
                    `
                    INSERT INTO permisosperfil (
                        idPais,
                        idPerfil,
                        codigo
                    )
                    VALUES ${valores}
                    `,
                    parametros
                );
            }

            await conexion.commit();

            return {
                idPerfil: perfilId,
                permisos
            };

        } catch (error) {
            await conexion.rollback();
            throw error;

        } finally {
            conexion.release();
        }
    }
}

module.exports = PerfilPermisoModel;
