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
            ORDER BY primerNombre, primerApellido
        `);

        return rows;
    }
}

module.exports = SocioModel;