function Topbar() {

    return (
        <header className="topbar">

            <div className="topbar-breadcrumb">

                <span className="topbar-system">
                    CrediControl
                </span>

                <i className="bi bi-chevron-right"></i>

                <span className="topbar-page">
                    Administración de Socios
                </span>

            </div>


            <div className="topbar-actions">

                <div className="topbar-search">

                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        placeholder="Buscar..."
                    />

                </div>


                <button
                    type="button"
                    className="topbar-icon-button"
                    title="Notificaciones"
                >
                    <i className="bi bi-bell"></i>

                    <span className="notification-indicator">
                    </span>
                </button>


                <div className="topbar-date">
                    {new Date().toLocaleDateString(
                        "es-GT",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    )}
                </div>

            </div>

        </header>
    );
}

export default Topbar;