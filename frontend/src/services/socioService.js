import api from "./api";

const obtenerTodos = async () => {
    const response = await api.get("/socios");
    return response.data;
};

const obtenerPorId = async (idSocio) => {
    const response = await api.get(`/socios/${idSocio}`);
    return response.data;
};

const obtenerInactivos = async () => {
    const response = await api.get("/socios/inactivos");
    return response.data;
};

const crear = async (socio) => {
    const response = await api.post("/socios", socio);
    return response.data;
};

const actualizar = async (idSocio, socio) => {
    const response = await api.put(
        `/socios/${idSocio}`,
        socio
    );

    return response.data;
};

const eliminar = async (idSocio) => {
    const response = await api.delete(
        `/socios/${idSocio}`
    );

    return response.data;
};

const reactivar = async (idSocio) => {
    const response = await api.patch(
        `/socios/${idSocio}/reactivar`
    );

    return response.data;
};

const socioService = {
    obtenerTodos,
    obtenerPorId,
    obtenerInactivos,
    crear,
    actualizar,
    eliminar,
    reactivar
};

export default socioService;