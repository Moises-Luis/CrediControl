
const bcrypt = require("bcryptjs");
const UsuarioModel = require("../models/UsuarioModel");

class UsuarioService {

    static error(mensaje, status = 400) {
        const error = new Error(mensaje);
        error.status = status;
        return error;
    }

    static entero(valor, campo) {
        const numero = Number(valor);

        if (!Number.isSafeInteger(numero) || numero <= 0) {
            throw this.error(
                `${campo} debe ser un entero positivo.`
            );
        }

        return numero;
    }

    static validarDatos(datos, incluirPassword = false) {
        const nombre = String(datos.nombre ?? "").trim();
        const usuario = String(datos.usuario ?? "").trim();
        const idPerfil = this.entero(
            datos.idPerfil,
            "El perfil"
        );

        if (nombre.length < 3 || nombre.length > 250) {
            throw this.error(
                "El nombre debe tener entre 3 y 250 caracteres."
            );
        }

        if (
            usuario.length < 3 ||
            usuario.length > 50 ||
            !/^[a-zA-Z0-9._-]+$/.test(usuario)
        ) {
            throw this.error(
                "El usuario debe tener entre 3 y 50 caracteres y usar letras, números, puntos, guiones o guion bajo."
            );
        }

        if (incluirPassword) {
            this.validarPassword(datos.password);
        }

        return { nombre, usuario, idPerfil };
    }

    static validarPassword(password) {
        if (
            typeof password !== "string" ||
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            throw this.error(
                "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes."
            );
        }
    }

    static async listar(idPais, buscar = "") {
        return UsuarioModel.listar(
            this.entero(idPais, "El país"),
            String(buscar).trim()
        );
    }

    static async obtenerPorId(idPais, idUsuario) {
        const usuario = await UsuarioModel.obtenerPorId(
            this.entero(idPais, "El país"),
            this.entero(idUsuario, "El usuario")
        );

        if (!usuario) {
            throw this.error(
                "Usuario no encontrado.",
                404
            );
        }

        return usuario;
    }

    static async obtenerPerfiles(idPais) {
        return UsuarioModel.obtenerPerfiles(
            this.entero(idPais, "El país")
        );
    }

    static async crear(idPais, datos) {
        idPais = this.entero(idPais, "El país");

        const validado = this.validarDatos(datos, true);

        const perfilExiste =
            await UsuarioModel.perfilExiste(
                idPais,
                validado.idPerfil
            );

        if (!perfilExiste) {
            throw this.error(
                "El perfil seleccionado no existe."
            );
        }

        const existente =
            await UsuarioModel.obtenerPorNombreUsuario(
                idPais,
                validado.usuario
            );

        if (existente) {
            throw this.error(
                "El nombre de usuario ya existe.",
                409
            );
        }

        const passwordHash = await bcrypt.hash(
            datos.password,
            12
        );

        try {
            await UsuarioModel.crear({
                idPais,
                ...validado,
                passwordHash
            });
        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
                throw this.error(
                    "Ya existe ese usuario o se produjo un conflicto al asignar el identificador. Intenta nuevamente.",
                    409
                );
            }

            throw error;
        }

        // Obtener el usuario recién creado.
        const usuarios = await UsuarioModel.listar(
            idPais,
            validado.usuario
        );

        return usuarios.find(
            (u) => u.usuario === validado.usuario
        ) || null;
    }

    static async actualizar(idPais, idUsuario, datos) {
        idPais = this.entero(idPais, "El país");
        idUsuario = this.entero(idUsuario, "El usuario");

        await this.obtenerPorId(idPais, idUsuario);

        const validado = this.validarDatos(datos);

        if (
            !await UsuarioModel.perfilExiste(
                idPais,
                validado.idPerfil
            )
        ) {
            throw this.error(
                "El perfil seleccionado no existe."
            );
        }

        const existente =
            await UsuarioModel.obtenerPorNombreUsuario(
                idPais,
                validado.usuario
            );

        if (
            existente &&
            Number(existente.idUsuario) !== idUsuario
        ) {
            throw this.error(
                "El nombre de usuario ya está en uso.",
                409
            );
        }

        try {
            await UsuarioModel.actualizar({
                idPais,
                idUsuario,
                ...validado
            });
        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
                throw this.error(
                    "El nombre de usuario ya está en uso.",
                    409
                );
            }

            throw error;
        }

        return this.obtenerPorId(idPais, idUsuario);
    }

    static async cambiarEstado(
        idPais,
        idUsuario,
        estado
    ) {
        idPais = this.entero(idPais, "El país");
        idUsuario = this.entero(idUsuario, "El usuario");

        if (estado !== 0 && estado !== 1) {
            throw this.error(
                "El estado debe ser 0 o 1."
            );
        }

        const usuario = await this.obtenerPorId(
            idPais,
            idUsuario
        );

        // Protección básica para la demo:
        // impedir desactivar el administrador inicial.
        if (
            idUsuario === 1 &&
            estado === 0
        ) {
            throw this.error(
                "No se puede desactivar el administrador principal."
            );
        }

        if (Number(usuario.estado) === estado) {
            return usuario;
        }

        await UsuarioModel.actualizarEstado(
            idPais,
            idUsuario,
            estado
        );

        return this.obtenerPorId(idPais, idUsuario);
    }

    static async cambiarPassword(
        idPais,
        idUsuario,
        password
    ) {
        idPais = this.entero(idPais, "El país");
        idUsuario = this.entero(idUsuario, "El usuario");

        await this.obtenerPorId(idPais, idUsuario);
        this.validarPassword(password);

        const hash = await bcrypt.hash(password, 12);

        await UsuarioModel.actualizarPassword(
            idPais,
            idUsuario,
            hash
        );

        return {
            mensaje: "Contraseña actualizada correctamente."
        };
    }
}

module.exports = UsuarioService;
