import "./Sidebar.css";

function Sidebar() {

    return (
        <aside className="sidebar">

            {/* LOGO */}
            <div className="sidebar-brand">

                <div className="brand-logo">
                    <i className="bi bi-cash-coin"></i>
                </div>

                <div>
                    <div className="brand-name">
                        CrediControl
                    </div>

                    <div className="brand-description">
                        Gestión de créditos
                    </div>
                </div>

            </div>


            {/* ACCIÓN PRINCIPAL */}
            <div className="sidebar-action">

                <button
                    type="button"
                    className="btn-new-credit"
                >
                    <i className="bi bi-plus-circle"></i>

                    <span>
                        Nuevo Crédito
                    </span>
                </button>

            </div>


            {/* MENÚ PRINCIPAL */}
            <nav className="sidebar-navigation">

                <div className="sidebar-section-title">
                    PRINCIPAL
                </div>

                <a
                    href="#"
                    className="sidebar-link"
                >
                    <i className="bi bi-grid"></i>
                    <span>Dashboard</span>
                </a>

                <a
                    href="#"
                    className="sidebar-link active"
                >
                    <i className="bi bi-people"></i>
                    <span>Socios</span>
                </a>

                <a
                    href="#"
                    className="sidebar-link"
                >
                    <i className="bi bi-cash-stack"></i>
                    <span>Créditos</span>
                </a>

                <a
                    href="#"
                    className="sidebar-link"
                >
                    <i className="bi bi-wallet2"></i>
                    <span>Pagos</span>
                </a>

                <a
                    href="#"
                    className="sidebar-link"
                >
                    <i className="bi bi-calendar-check"></i>
                    <span>Cuotas</span>
                </a>


                <div className="sidebar-separator"></div>


                <div className="sidebar-section-title">
                    CONSULTAS
                </div>

                <a
                    href="#"
                    className="sidebar-link"
                >
                    <i className="bi bi-bar-chart"></i>
                    <span>Reportes</span>
                </a>


                <div className="sidebar-separator"></div>


                <div className="sidebar-section-title">
                    SISTEMA
                </div>

                <a
                    href="#"
                    className="sidebar-link"
                >
                    <i className="bi bi-person-gear"></i>
                    <span>Usuarios</span>
                </a>

                <a
                    href="#"
                    className="sidebar-link"
                >
                    <i className="bi bi-gear"></i>
                    <span>Configuración</span>
                </a>

            </nav>


            {/* USUARIO */}
            <div className="sidebar-user">

                <div className="user-avatar">
                    AD
                </div>

                <div className="user-information">

                    <div className="user-name">
                        Administrador
                    </div>

                    <div className="user-role">
                        Administrador
                    </div>

                </div>

                <button
                    type="button"
                    className="user-menu-button"
                >
                    <i className="bi bi-three-dots-vertical"></i>
                </button>

            </div>

        </aside>
    );
}

export default Sidebar;