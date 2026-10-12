
import api from "./api";

const pagoService = {
    async obtenerCreditos() {
        const response = await api.get("/pagos/creditos");
        return response.data;
    },

    async simular(datos) {
        const response = await api.post(
            "/pagos/simular",
            datos
        );

        return response.data;
    },

    async registrar(datos) {
        const response = await api.post(
            "/pagos",
            datos
        );

        return response.data;
    },

    async obtenerHistorial(
        idSocio,
        idTipoServicio,
        idCredito,
        idPais = 320
    ) {
        const response = await api.get(
            `/pagos/historial/${encodeURIComponent(idSocio)}/${idTipoServicio}/${idCredito}`,
            {
                params: { idPais }
            }
        );

        return response.data;
    },

    async obtenerDetalle(idPago) {
        const response = await api.get(
            `/pagos/${idPago}/detalle`
        );

        return response.data;
    }
};

export default pagoService;
