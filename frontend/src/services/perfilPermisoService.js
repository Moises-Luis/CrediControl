
import api from "./api";

const listar = async () => {
    const respuesta = await api.get("/perfiles");
    return respuesta.data;
};

const catalogoPermisos = async () => {
    const respuesta = await api.get(
        "/perfiles/catalogo-permisos"
    );
    return respuesta.data;
};

const obtenerPermisos = async (idPerfil) => {
    const respuesta = await api.get(
        `/perfiles/${idPerfil}/permisos`
    );
    return respuesta.data;
};

const crear = async (datos) => {
    const respuesta = await api.post(
        "/perfiles",
        datos
    );
    return respuesta.data;
};

const cambiarEstado = async (idPerfil, activo) => {
    const respuesta = await api.patch(
        `/perfiles/${idPerfil}/estado`,
        { activo }
    );
    return respuesta.data;
};

const guardarPermisos = async (idPerfil, permisos) => {
    const respuesta = await api.put(
        `/perfiles/${idPerfil}/permisos`,
        { permisos }
    );
    return respuesta.data;
};

export default {
    listar,
    catalogoPermisos,
    obtenerPermisos,
    crear,
    cambiarEstado,
    guardarPermisos
};
