
const db = require("../config/database");

class UsuarioModel {

    // ==========================================
    // LISTAR USUARIOS CON DESCRIPCIÓN DEL PERFIL
    // ==========================================

    static async listar(idPais, buscar = "") {
        const termino = `%${buscar}%`;

        const [filas] = await db.query(`
            SELECT
                u.idPais,
                u.idUsuario,
                u.idPerfil,
                p.descripcion AS descripcionPerfil,
                u.usuario,
                u.nombre,
                u.estado,
                DATE_FORMAT(
                    u.fecha,
                    '%Y-%m-%d %H:%i:%s'
                ) AS fecha
            FROM usuarios u

            INNER JOIN perfilesusuarios p
                ON p.idPais = u.idPais
                AND p.idPerfil = u.idPerfil

            WHERE u.idPais = ?
              AND (
                  u.usuario LIKE ?
                  OR u.nombre LIKE ?
                  OR CAST(u.idUsuario AS CHAR) LIKE ?
              )

            ORDER BY u.idUsuario DESC
        `, [
            idPais,
            termino,
            termino,
            termino
        ]);

        return filas;
    }

    // ==========================================
    // OBTENER USUARIO POR ID
    // ==========================================

    static async obtenerPorId(idPais, idUsuario) {
        const [filas] = await db.query(`
            SELECT
                u.idPais,
                u.idUsuario,
                u.idPerfil,
                p.descripcion AS descripcionPerfil,
                u.usuario,
                u.nombre,
                u.estado,
                DATE_FORMAT(
                    u.fecha,
                    '%Y-%m-%d %H:%i:%s'
                ) AS fecha

            FROM usuarios u

            INNER JOIN perfilesusuarios p
                ON p.idPais = u.idPais
                AND p.idPerfil = u.idPerfil

            WHERE u.idPais = ?
              AND u.idUsuario = ?

            LIMIT 1
        `, [idPais, idUsuario]);

        return filas[0] || null;
    }

    // ==========================================
    // BUSCAR POR NOMBRE DE USUARIO
    // ==========================================

    static async obtenerPorNombreUsuario(
        idPais,
        usuario
    ) {
        const [filas] = await db.query(`
            SELECT
                idUsuario
            FROM usuarios
            WHERE idPais = ?
              AND usuario = ?
            LIMIT 1
        `, [idPais, usuario]);

        return filas[0] || null;
    }

    // ==========================================
    // OBTENER PERFILES CON DESCRIPCIÓN REAL
    // ==========================================

    static async obtenerPerfiles(idPais) {
        const [filas] = await db.query(`
            SELECT
                idPais,
                idPerfil,
                descripcion,
                activo
            FROM perfilesusuarios
            WHERE idPais = ?
            ORDER BY descripcion ASC
        `, [idPais]);

        return filas;
    }

    // ==========================================
    // COMPROBAR PERFIL ACTIVO
    // ==========================================

    static async perfilExiste(idPais, idPerfil) {
        const [filas] = await db.query(`
            SELECT
                idPerfil
            FROM perfilesusuarios
            WHERE idPais = ?
              AND idPerfil = ?
              AND activo = 1
            LIMIT 1
        `, [idPais, idPerfil]);

        return filas.length > 0;
    }

    // ==========================================
    // CREAR USUARIO
    // ==========================================

    static async crear(datos) {
        // Se conserva la asignación actual del ID.
        // La llave primaria evita duplicados, aunque
        // las inserciones concurrentes pueden requerir
        // un reintento en caso de conflicto.

        const [resultado] = await db.query(`
            INSERT INTO usuarios (
                idPais,
                idUsuario,
                idPerfil,
                usuario,
                password,
                nombre,
                estado
            )
            SELECT
                ?,
                COALESCE(MAX(idUsuario), 0) + 1,
                ?,
                ?,
                ?,
                ?,
                1
            FROM usuarios
            WHERE idPais = ?
        `, [
            datos.idPais,
            datos.idPerfil,
            datos.usuario,
            datos.passwordHash,
            datos.nombre,
            datos.idPais
        ]);

        return resultado.affectedRows === 1;
    }

    // ==========================================
    // ACTUALIZAR USUARIO
    // ==========================================

    static async actualizar(datos) {
        const [resultado] = await db.query(`
            UPDATE usuarios
            SET
                idPerfil = ?,
                usuario = ?,
                nombre = ?
            WHERE idPais = ?
              AND idUsuario = ?
        `, [
            datos.idPerfil,
            datos.usuario,
            datos.nombre,
            datos.idPais,
            datos.idUsuario
        ]);

        return resultado.affectedRows > 0;
    }

    // ==========================================
    // ACTIVAR O DESACTIVAR USUARIO
    // ==========================================

    static async actualizarEstado(
        idPais,
        idUsuario,
        estado
    ) {
        const [resultado] = await db.query(`
            UPDATE usuarios
            SET estado = ?
            WHERE idPais = ?
              AND idUsuario = ?
        `, [
            estado,
            idPais,
            idUsuario
        ]);

        return resultado.affectedRows > 0;
    }

    // ==========================================
    // ACTUALIZAR CONTRASEÑA
    // ==========================================

    static async actualizarPassword(
        idPais,
        idUsuario,
        passwordHash
    ) {
        const [resultado] = await db.query(`
            UPDATE usuarios
            SET password = ?
            WHERE idPais = ?
              AND idUsuario = ?
        `, [
            passwordHash,
            idPais,
            idUsuario
        ]);

        return resultado.affectedRows > 0;
    }
}

module.exports = UsuarioModel;
