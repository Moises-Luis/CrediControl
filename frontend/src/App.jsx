
import { useEffect, useState } from "react";

import Layout from "./components/layout/Layout";

import Socios from "./pages/socios/Socios";
import Creditos from "./pages/creditos/Creditos";
import Pagos from "./pages/pagos/Pagos";
import Reportes from "./pages/reportes/Reportes";

import "./App.css";

function App() {

    // ==========================================
    // OBTENER RUTA ACTUAL
    // ==========================================

    const obtenerRuta = () => {
        const ruta = window.location.hash.replace("#", "");
        return ruta || "/socios";
    };

    const [rutaActual, setRutaActual] = useState(obtenerRuta);

    // ==========================================
    // DETECTAR CAMBIOS DE RUTA
    // ==========================================

    useEffect(() => {
        const cambiarRuta = () => {
            setRutaActual(obtenerRuta());
        };

        window.addEventListener("hashchange", cambiarRuta);

        return () => {
            window.removeEventListener("hashchange", cambiarRuta);
        };
    }, []);

    // ==========================================
    // RENDERIZAR PÁGINA
    // ==========================================

    const renderizarPagina = () => {
        switch (rutaActual) {

            case "/socios":
                return <Socios />;

            case "/creditos":
                return <Creditos />;

            case "/pagos":
                return <Pagos />;

            case "/reportes":
                return <Reportes />;

            default:
                return <Socios />;
        }
    };

    return (
        <Layout>
            {renderizarPagina()}
        </Layout>
    );
}

export default App;
