
require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../config/database");

async function configurarAdmin() {
    try {
        const password =
            process.env.ADMIN_INITIAL_PASSWORD;

        if (!password || password.length < 12) {
            throw new Error(
                "La contraseña debe contener " +
                "al menos 12 caracteres."
            );
        }

        const hash = await bcrypt.hash(password, 12);

        const [resultado] = await db.query(
            `
            UPDATE usuarios
            SET password = ?
            WHERE idPais = ?
              AND idUsuario = ?
              AND usuario = ?
              AND estado = 1
            `,
            [hash, 320, 1, "admin"]
        );

        if (resultado.affectedRows !== 1) {
            throw new Error(
                "No se encontró el administrador activo."
            );
        }

        console.log(
            "Contraseña del administrador " +
            "actualizada correctamente."
        );

    } catch (error) {
        console.error(
            "Error:", error.message
        );

        process.exitCode = 1;

    } finally {
        await db.end();
    }
}

configurarAdmin();
