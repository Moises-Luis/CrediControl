
import api from "./api";

const usuarioService = {

    async listar(buscar = "", idPais = 320) {
        const respuesta = await api.get(
            "/usuarios",
            {
                params: { buscar, idPais }
            }
        );

        return respuesta.data;
    },

    async obtenerPorId(idUsuario, idPais = 320) {
        const respuesta = await api.get(
            `/usuarios/${idUsuario}`,
            {
                params: { idPais }
            }
        );

        return respuesta.data;
    },

    async obtenerPerfiles(idPais = 320) {
        const respuesta = await api.get(
            "/usuarios/perfiles",
            {
                params: { idPais }
            }
        );

        return respuesta.data;
    },

    async crear(datos) {
        const respuesta = await api.post(
            "/usuarios",
            {
                ...datos,
                idPais: 320
            }
        );

        return respuesta.data;
    },

    async actualizar(idUsuario, datos) {
        const respuesta = await api.put(
            `/usuarios/${idUsuario}`,
            {
                ...datos,
                idPais: 320
            }
        );

        return respuesta.data;
    },

    async cambiarEstado(idUsuario, estado) {
        const respuesta = await api.patch(
            `/usuarios/${idUsuario}/estado`,
            {
                idPais: 320,
                estado
            }
        );

        return respuesta.data;
    },

    async cambiarPassword(idUsuario, password) {
        const respuesta = await api.patch(
            `/usuarios/${idUsuario}/password`,
            {
                idPais: 320,
                password
            }
        );

        return respuesta.data;
    }
};

export default usuarioService;
