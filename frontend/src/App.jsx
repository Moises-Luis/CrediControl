import { useEffect, useState } from "react";

import Layout from "./components/layout/Layout";
import Socios from "./pages/socios/Socios";
import Creditos from "./pages/creditos/Creditos";

import "./App.css";

function App() {
    const obtenerRuta = () => {
        const ruta = window.location.hash.replace("#", "");
        return ruta || "/socios";
    };

    const [rutaActual, setRutaActual] = useState(obtenerRuta);

    useEffect(() => {
        const cambiarRuta = () => {
            setRutaActual(obtenerRuta());
        };

        window.addEventListener("hashchange", cambiarRuta);

        return () => {
            window.removeEventListener("hashchange", cambiarRuta);
        };
    }, []);

    const renderizarPagina = () => {
        switch (rutaActual) {
            case "/creditos":
                return <Creditos />;

            case "/socios":
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