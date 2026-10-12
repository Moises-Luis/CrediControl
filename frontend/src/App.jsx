import { useEffect, useState } from "react";

import Layout from "./components/layout/Layout";

import Socios from "./pages/socios/Socios";
import Creditos from "./pages/creditos/Creditos";
import Pagos from "./pages/pagos/Pagos";
import Cuotas from "./pages/cuotas/Cuotas";
import Reportes from "./pages/reportes/Reportes";
import Usuarios from "./pages/usuarios/Usuarios";

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

            case "/socios":
                return <Socios />;

            case "/creditos":
                return <Creditos />;

            case "/pagos":
                return <Pagos />;

            case "/cuotas":
                return <Cuotas />;

            case "/reportes":
                return <Reportes />;

            case "/usuarios":
                return <Usuarios />;

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

