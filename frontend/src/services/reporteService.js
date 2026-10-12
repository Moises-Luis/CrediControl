
import api from "./api";

const reporteService = {
    async obtenerResumen(idPais = 320) {
        const respuesta = await api.get(
            "/reportes/resumen",
            { params: { idPais } }
        );

        return respuesta.data;
    },

    async obtenerCartera(idPais = 320) {
        const respuesta = await api.get(
            "/reportes/cartera",
            { params: { idPais } }
        );

        return respuesta.data;
    },

    async obtenerPagos(
        fechaInicial,
        fechaFinal,
        idPais = 320
    ) {
        const respuesta = await api.get(
            "/reportes/pagos",
            {
                params: {
                    idPais,
                    fechaInicial,
                    fechaFinal
                }
            }
        );

        return respuesta.data;
    }
};

export default reporteService;
