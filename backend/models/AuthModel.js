
const db = require("../config/database");

class AuthModel {
    static async buscarPorUsuario(usuario) {
        const [filas] = await db.query(
            `SELECT
                idPais,
                idUsuario,
                idPerfil,
                usuario,
                password,
                nombre,
                estado
             FROM usuarios
             WHERE idPais = ?
               AND usuario = ?
             LIMIT 1`,
            [320, usuario]
        );

        return filas[0] || null;
    }

    static async buscarPorId(idPais, idUsuario) {
        const [filas] = await db.query(
            `SELECT
                idPais,
                idUsuario,
                idPerfil,
                usuario,
                nombre,
                estado
             FROM usuarios
             WHERE idPais = ?
               AND idUsuario = ?
             LIMIT 1`,
            [idPais, idUsuario]
        );

        return filas[0] || null;
    }
}

module.exports = AuthModel;
