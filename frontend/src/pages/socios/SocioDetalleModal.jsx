import "./SocioDetalleModal.css";

function SocioDetalleModal({
    socio,
    onCerrar
}) {

    if (!socio) {
        return null;
    }


    const nombreCompleto = [
        socio.primerNombre,
        socio.segundoNombre,
        socio.tercerNombre,
        socio.primerApellido,
        socio.segundoApellido,
        socio.apellidoCasada
    ]
        .filter(Boolean)
        .join(" ");


    const mostrarValor = (valor) => {
        return valor || "No registrado";
    };


    const fechaNacimiento =
        socio.fecha_nacimiento
            ? new Date(
                socio.fecha_nacimiento
            ).toLocaleDateString("es-GT")
            : "No registrada";


    const fechaRegistro =
        socio.fecha
            ? new Date(
                socio.fecha
            ).toLocaleDateString("es-GT")
            : "No registrada";


    return (

        <div className="detail-overlay">

            <div className="detail-modal">

                <div className="detail-header">

                    <div className="detail-person">

                        <div className="detail-avatar">

                            {socio.primerNombre
                                ?.charAt(0)
                                .toUpperCase()
                            }

                            {socio.primerApellido
                                ?.charAt(0)
                                .toUpperCase()
                            }

                        </div>


                        <div>

                            <h2>
                                {nombreCompleto}
                            </h2>

                            <p>
                                Socio #{socio.idSocio}
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="detail-close"
                        onClick={onCerrar}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>

                </div>


                <div className="detail-body">

                    <div className="detail-status-row">

                        <span
                            className={
                                socio.activo
                                    ? "detail-status active"
                                    : "detail-status inactive"
                            }
                        >

                            <span></span>

                            {socio.activo
                                ? "Socio activo"
                                : "Socio inactivo"
                            }

                        </span>

                    </div>


                    <div className="detail-section">

                        <h3>
                            <i className="bi bi-person-vcard"></i>
                            Identificación
                        </h3>


                        <div className="detail-grid">

                            <div>
                                <label>Código</label>
                                <strong>
                                    {socio.idSocio}
                                </strong>
                            </div>

                            <div>
                                <label>
                                    Tipo documento
                                </label>

                                <strong>
                                    {socio.idDocumento === 1
                                        ? "DPI"
                                        : "Pasaporte"
                                    }
                                </strong>
                            </div>

                            <div>
                                <label>
                                    Número documento
                                </label>

                                <strong>
                                    {mostrarValor(
                                        socio.noDocumento
                                    )}
                                </strong>
                            </div>

                        </div>

                    </div>


                    <div className="detail-section">

                        <h3>
                            <i className="bi bi-person"></i>
                            Información personal
                        </h3>


                        <div className="detail-grid">

                            <div>
                                <label>
                                    Nombre completo
                                </label>

                                <strong>
                                    {nombreCompleto}
                                </strong>
                            </div>

                            <div>
                                <label>
                                    Fecha nacimiento
                                </label>

                                <strong>
                                    {fechaNacimiento}
                                </strong>
                            </div>

                            <div>
                                <label>
                                    Retiene ISR
                                </label>

                                <strong>
                                    {socio.retiene_isr
                                        ? "Sí"
                                        : "No"
                                    }
                                </strong>
                            </div>

                        </div>

                    </div>


                    <div className="detail-section">

                        <h3>
                            <i className="bi bi-telephone"></i>
                            Contacto
                        </h3>


                        <div className="detail-grid">

                            <div>
                                <label>
                                    Teléfono
                                </label>

                                <strong>
                                    {mostrarValor(
                                        socio.telefono
                                    )}
                                </strong>
                            </div>

                            <div>
                                <label>
                                    Teléfono de casa
                                </label>

                                <strong>
                                    {mostrarValor(
                                        socio.telefonoCasa
                                    )}
                                </strong>
                            </div>

                            <div className="detail-full">
                                <label>
                                    Dirección
                                </label>

                                <strong>
                                    {mostrarValor(
                                        socio.direccion
                                    )}
                                </strong>
                            </div>

                        </div>

                    </div>


                    <div className="detail-section">

                        <h3>
                            <i className="bi bi-clock-history"></i>
                            Registro
                        </h3>


                        <div className="detail-grid">

                            <div>
                                <label>
                                    Fecha de registro
                                </label>

                                <strong>
                                    {fechaRegistro}
                                </strong>
                            </div>

                            <div>
                                <label>
                                    Usuario registro
                                </label>

                                <strong>
                                    #{socio.idUsuario}
                                </strong>
                            </div>

                        </div>

                    </div>

                </div>


                <div className="detail-footer">

                    <button
                        type="button"
                        onClick={onCerrar}
                    >
                        Cerrar
                    </button>

                </div>

            </div>

        </div>
    );
}

export default SocioDetalleModal;