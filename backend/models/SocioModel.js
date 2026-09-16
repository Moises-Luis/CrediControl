const pool = require("../config/database");

class SocioModel {

    static async obtenerTodos() {

        const [rows] = await pool.query(`
            SELECT
                idPais,
                idSocio,
                primerNombre,
                segundoNombre,
                tercerNombre,
                primerApellido,
                segundoApellido,
                apellidoCasada,
                idDocumento,
                noDocumento,
                fecha_nacimiento,
                direccion,
                telefono,
                telefonoCasa,
                fotografia,
                reciboDeLuz,
                dpiFrontal,
                dpiPosterior,
                idUsuario,
                activo,
                retiene_isr,
                fecha
            FROM Socios
            WHERE activo = TRUE
            ORDER BY primerNombre, primerApellido
        `);

        return rows;
    }
    static async crear(socio) {

    const {
        idPais,
        idSocio,
        primerNombre,
        segundoNombre,
        tercerNombre,
        primerApellido,
        segundoApellido,
        apellidoCasada,
        idDocumento,
        noDocumento,
        fecha_nacimiento,
        direccion,
        telefono,
        telefonoCasa,
        fotografia,
        reciboDeLuz,
        dpiFrontal,
        dpiPosterior,
        idUsuario,
        retiene_isr
    } = socio;

    const [resultado] = await pool.execute(`
        INSERT INTO Socios (
            idPais,
            idSocio,
            primerNombre,
            segundoNombre,
            tercerNombre,
            primerApellido,
            segundoApellido,
            apellidoCasada,
            idDocumento,
            noDocumento,
            fecha_nacimiento,
            direccion,
            telefono,
            telefonoCasa,
            fotografia,
            reciboDeLuz,
            dpiFrontal,
            dpiPosterior,
            idUsuario,
            retiene_isr
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        idPais,
        idSocio,
        primerNombre,
        segundoNombre || null,
        tercerNombre || null,
        primerApellido,
        segundoApellido || null,
        apellidoCasada || null,
        idDocumento,
        noDocumento,
        fecha_nacimiento || null,
        direccion || null,
        telefono || null,
        telefonoCasa || null,
        fotografia || null,
        reciboDeLuz || null,
        dpiFrontal || null,
        dpiPosterior || null,
        idUsuario,
        retiene_isr ?? false
    ]);

    return resultado;
    }

    static async obtenerPorId(idPais, idSocio) {

    const [rows] = await pool.execute(`
        SELECT
            idPais,
            idSocio,
            primerNombre,
            segundoNombre,
            tercerNombre,
            primerApellido,
            segundoApellido,
            apellidoCasada,
            idDocumento,
            noDocumento,
            fecha_nacimiento,
            direccion,
            telefono,
            telefonoCasa,
            fotografia,
            reciboDeLuz,
            dpiFrontal,
            dpiPosterior,
            idUsuario,
            activo,
            retiene_isr,
            fecha
        FROM Socios
        WHERE idPais = ?
          AND idSocio = ?
    `, [
        idPais,
        idSocio
    ]);

    return rows[0] || null;
    }

    static async actualizar(idPais, idSocio, socio) {

    const {
        primerNombre,
        segundoNombre,
        tercerNombre,
        primerApellido,
        segundoApellido,
        apellidoCasada,
        idDocumento,
        noDocumento,
        fecha_nacimiento,
        direccion,
        telefono,
        telefonoCasa,
        fotografia,
        reciboDeLuz,
        dpiFrontal,
        dpiPosterior,
        retiene_isr
    } = socio;

    const [resultado] = await pool.execute(`
        UPDATE Socios
        SET
            primerNombre = ?,
            segundoNombre = ?,
            tercerNombre = ?,
            primerApellido = ?,
            segundoApellido = ?,
            apellidoCasada = ?,
            idDocumento = ?,
            noDocumento = ?,
            fecha_nacimiento = ?,
            direccion = ?,
            telefono = ?,
            telefonoCasa = ?,
            fotografia = ?,
            reciboDeLuz = ?,
            dpiFrontal = ?,
            dpiPosterior = ?,
            retiene_isr = ?
        WHERE idPais = ?
          AND idSocio = ?
    `, [
        primerNombre,
        segundoNombre || null,
        tercerNombre || null,
        primerApellido,
        segundoApellido || null,
        apellidoCasada || null,
        idDocumento,
        noDocumento,
        fecha_nacimiento || null,
        direccion || null,
        telefono || null,
        telefonoCasa || null,
        fotografia || null,
        reciboDeLuz || null,
        dpiFrontal || null,
        dpiPosterior || null,
        retiene_isr ?? false,
        idPais,
        idSocio
    ]);

    return resultado;
    }

    static async desactivar(idPais, idSocio) {

    const [resultado] = await pool.execute(`
        UPDATE Socios
        SET activo = FALSE
        WHERE idPais = ?
          AND idSocio = ?
          AND activo = TRUE
    `, [
        idPais,
        idSocio
    ]);

    return resultado;
    }
    static async obtenerPorDocumento(idPais, idDocumento, noDocumento) {

    const [rows] = await pool.execute(`
        SELECT
            idPais,
            idSocio,
            primerNombre,
            segundoNombre,
            tercerNombre,
            primerApellido,
            segundoApellido,
            idDocumento,
            noDocumento,
            activo
        FROM Socios
        WHERE idPais = ?
          AND idDocumento = ?
          AND noDocumento = ?
        LIMIT 1
    `, [
        idPais,
        idDocumento,
        noDocumento
    ]);

    return rows[0] || null;
    }

    static async reactivar(idPais, idSocio) {

    const [resultado] = await pool.execute(`
        UPDATE Socios
        SET activo = TRUE
        WHERE idPais = ?
          AND idSocio = ?
          AND activo = FALSE
    `, [
        idPais,
        idSocio
    ]);

    return resultado;
    }

    static async obtenerInactivos() {

    const [rows] = await pool.query(`
        SELECT
            idPais,
            idSocio,
            primerNombre,
            segundoNombre,
            tercerNombre,
            primerApellido,
            segundoApellido,
            apellidoCasada,
            idDocumento,
            noDocumento,
            fecha_nacimiento,
            direccion,
            telefono,
            telefonoCasa,
            fotografia,
            reciboDeLuz,
            dpiFrontal,
            dpiPosterior,
            idUsuario,
            activo,
            retiene_isr,
            fecha
        FROM Socios
        WHERE activo = FALSE
        ORDER BY primerNombre, primerApellido
    `);

    return rows;
    }
}

module.exports = SocioModel;




