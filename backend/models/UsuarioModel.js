
const db = require("../config/database");

class UsuarioModel {

    static async listar(idPais, buscar = "") {
        const termino = `%${buscar}%`;

        const [filas] = await db.query(`
            SELECT
                idPais,
                idUsuario,
                idPerfil,
                usuario,
                nombre,
                estado,
                DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') AS fecha
            FROM usuarios
            WHERE idPais = ?
              AND (
                  usuario LIKE ?
                  OR nombre LIKE ?
                  OR CAST(idUsuario AS CHAR) LIKE ?
              )
            ORDER BY idUsuario DESC
        `, [idPais, termino, termino, termino]);

        return filas;
    }

    static async obtenerPorId(idPais, idUsuario) {
        const [filas] = await db.query(`
            SELECT
                idPais,
                idUsuario,
                idPerfil,
                usuario,
                nombre,
                estado,
                DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') AS fecha
            FROM usuarios
            WHERE idPais = ?
              AND idUsuario = ?
        `, [idPais, idUsuario]);

        return filas[0] || null;
    }

    static async obtenerPorNombreUsuario(idPais, usuario) {
        const [filas] = await db.query(`
            SELECT idUsuario
            FROM usuarios
            WHERE idPais = ?
              AND usuario = ?
            LIMIT 1
        `, [idPais, usuario]);

        return filas[0] || null;
    }

    static async obtenerPerfiles(idPais) {
        const [filas] = await db.query(`
            SELECT idPerfil
            FROM perfilesusuarios
            WHERE idPais = ?
            ORDER BY idPerfil
        `, [idPais]);

        return filas;
    }

    static async perfilExiste(idPais, idPerfil) {
        const [filas] = await db.query(`
            SELECT idPerfil
            FROM perfilesusuarios
            WHERE idPais = ?
              AND idPerfil = ?
            LIMIT 1
        `, [idPais, idPerfil]);

        return filas.length > 0;
    }

    static async crear(datos) {
        // La tabla no tiene AUTO_INCREMENT.
        // Se calcula el siguiente ID de usuario.
        // En caso de inserciones simultáneas,
        // la llave primaria evita duplicados.

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
        `, [estado, idPais, idUsuario]);

        return resultado.affectedRows > 0;
    }

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
        `, [passwordHash, idPais, idUsuario]);

        return resultado.affectedRows > 0;
    }
}

module.exports = UsuarioModel;
