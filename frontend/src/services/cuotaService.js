
import api from "./api";

const cuotaService = {
    async obtenerTodas(filtros = {}) {
        const respuesta = await api.get("/cuotas", {
            params: {
                idPais: 320,
                ...filtros
            }
        });

        return respuesta.data;
    },

    async obtenerResumen(idPais = 320) {
        const respuesta = await api.get(
            "/cuotas/resumen",
            {
                params: { idPais }
            }
        );

        return respuesta.data;
    },

    async obtenerPorId(
        idSocio,
        idTipoServicio,
        idCredito,
        numeroCuota,
        idPais = 320
    ) {
        const respuesta = await api.get(
            `/cuotas/${encodeURIComponent(idSocio)}/${idTipoServicio}/${idCredito}/${numeroCuota}`,
            {
                params: { idPais }
            }
        );

        return respuesta.data;
    }
};

export default cuotaService;
