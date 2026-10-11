import api from "./api";

const creditoService = {

    async obtenerTodos() {
        const response = await api.get("/creditos");
        return response.data;
    },

    async obtenerCatalogos() {
        const response = await api.get("/creditos/catalogos");
        return response.data;
    },

    async obtenerPorId(idSocio, idTipoServicio, idCredito) {
        const response = await api.get(
            `/creditos/${encodeURIComponent(idSocio)}/${idTipoServicio}/${idCredito}`
        );

        return response.data;
    },

    async obtenerCuotas(idSocio, idTipoServicio, idCredito) {
        const response = await api.get(
            `/creditos/${encodeURIComponent(idSocio)}/${idTipoServicio}/${idCredito}/cuotas`
        );

        return response.data;
    },

    async simular(datos) {
        const response = await api.post(
            "/creditos/simular",
            datos
        );

        return response.data;
    },

    async crear(datos) {
        const response = await api.post(
            "/creditos",
            datos
        );

        return response.data;
    }

};

export default creditoService;