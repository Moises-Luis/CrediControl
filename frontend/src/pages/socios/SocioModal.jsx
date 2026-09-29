import { useEffect, useState } from "react";
import socioService from "../../services/socioService";
import "./SocioModal.css";

const formularioInicial = {
    idSocio: "",
    primerNombre: "",
    segundoNombre: "",
    tercerNombre: "",
    primerApellido: "",
    segundoApellido: "",
    apellidoCasada: "",
    idDocumento: 1,
    noDocumento: "",
    fecha_nacimiento: "",
    direccion: "",
    telefono: "",
    telefonoCasa: "",
    fotografia: null,
    reciboDeLuz: null,
    dpiFrontal: null,
    dpiPosterior: null,
    idUsuario: 1,
    retiene_isr: false
};

function SocioModal({
    mostrar,
    socioEditar,
    onCerrar,
    onGuardado
}) {

    const [formulario, setFormulario] =
        useState(formularioInicial);

    const [guardando, setGuardando] =
        useState(false);

    const [error, setError] =
        useState("");

    const esEdicion = Boolean(socioEditar);


    // ========================================
    // CARGAR DATOS PARA EDICIÓN
    // ========================================

    useEffect(() => {

        if (!mostrar) {
            return;
        }

        setError("");

        if (socioEditar) {

            setFormulario({
                idSocio: socioEditar.idSocio || "",
                primerNombre: socioEditar.primerNombre || "",
                segundoNombre: socioEditar.segundoNombre || "",
                tercerNombre: socioEditar.tercerNombre || "",
                primerApellido: socioEditar.primerApellido || "",
                segundoApellido: socioEditar.segundoApellido || "",
                apellidoCasada: socioEditar.apellidoCasada || "",
                idDocumento: socioEditar.idDocumento || 1,
                noDocumento: socioEditar.noDocumento || "",

                fecha_nacimiento:
                    socioEditar.fecha_nacimiento
                        ? String(
                            socioEditar.fecha_nacimiento
                        ).substring(0, 10)
                        : "",

                direccion: socioEditar.direccion || "",
                telefono: socioEditar.telefono || "",
                telefonoCasa: socioEditar.telefonoCasa || "",
                fotografia: socioEditar.fotografia || null,
                reciboDeLuz: socioEditar.reciboDeLuz || null,
                dpiFrontal: socioEditar.dpiFrontal || null,
                dpiPosterior: socioEditar.dpiPosterior || null,
                idUsuario: socioEditar.idUsuario || 1,
                retiene_isr: Boolean(socioEditar.retiene_isr)
            });

        } else {

            setFormulario(formularioInicial);
        }

    }, [mostrar, socioEditar]);


    // ========================================
    // CAMBIO DE CAMPOS
    // ========================================

    const manejarCambio = (event) => {

        const {
            name,
            value,
            type,
            checked
        } = event.target;

        setFormulario((anterior) => ({
            ...anterior,

            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));
    };


    // ========================================
    // CERRAR
    // ========================================

    const cerrarModal = () => {

        if (guardando) {
            return;
        }

        setFormulario(formularioInicial);
        setError("");

        onCerrar();
    };


    // ========================================
    // VALIDACIÓN
    // ========================================

    const validarFormulario = () => {

        if (!formulario.idSocio.trim()) {
            return "El código del socio es obligatorio.";
        }

        if (!formulario.primerNombre.trim()) {
            return "El primer nombre es obligatorio.";
        }

        if (!formulario.primerApellido.trim()) {
            return "El primer apellido es obligatorio.";
        }

        if (!formulario.noDocumento.trim()) {
            return "El número de documento es obligatorio.";
        }

        return "";
    };


    // ========================================
    // GUARDAR
    // ========================================

    const guardarSocio = async (event) => {

        event.preventDefault();

        const mensajeValidacion =
            validarFormulario();

        if (mensajeValidacion) {
            setError(mensajeValidacion);
            return;
        }

        try {

            setGuardando(true);
            setError("");

            const socio = {
                ...formulario,
                idDocumento:
                    Number(formulario.idDocumento),
                idUsuario:
                    Number(formulario.idUsuario)
            };

            if (esEdicion) {

                await socioService.actualizar(
                    formulario.idSocio,
                    socio
                );

            } else {

                await socioService.crear(socio);
            }

            onGuardado(
                esEdicion
                    ? "Socio actualizado correctamente."
                    : "Socio registrado correctamente."
            );

        } catch (error) {

            console.error(
                "Error al guardar socio:",
                error
            );

            setError(
                error.response?.data?.mensaje ||
                "No fue posible guardar el socio."
            );

        } finally {

            setGuardando(false);
        }
    };


    if (!mostrar) {
        return null;
    }


    return (
        <div className="socio-modal-overlay">

            <div className="socio-modal">

                <div className="socio-modal-header">

                    <div>
                        <h2>
                            {esEdicion
                                ? "Editar Socio"
                                : "Registrar Socio"
                            }
                        </h2>

                        <p>
                            {esEdicion
                                ? "Actualiza la información del socio."
                                : "Ingresa la información del nuevo socio."
                            }
                        </p>
                    </div>

                    <button
                        type="button"
                        className="socio-modal-close"
                        onClick={cerrarModal}
                        disabled={guardando}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>

                </div>


                <form
                    onSubmit={guardarSocio}
                    className="socio-modal-form"
                >

                    <div className="socio-modal-body">

                        {error && (
                            <div className="alert alert-danger">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}


                        {/* IDENTIFICACIÓN */}

                        <div className="form-section">

                            <div className="form-section-title">

                                <i className="bi bi-person-vcard"></i>

                                <div>
                                    <h3>Identificación</h3>
                                    <p>
                                        Código y documento del socio.
                                    </p>
                                </div>

                            </div>


                            <div className="row g-3">

                                <div className="col-md-4">

                                    <label className="form-label">
                                        Código de socio *
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        name="idSocio"
                                        value={formulario.idSocio}
                                        onChange={manejarCambio}
                                        disabled={esEdicion}
                                        maxLength="20"
                                        placeholder="Ej. 0002"
                                    />

                                </div>


                                <div className="col-md-4">

                                    <label className="form-label">
                                        Tipo de documento *
                                    </label>

                                    <select
                                        className="form-select"
                                        name="idDocumento"
                                        value={formulario.idDocumento}
                                        onChange={manejarCambio}
                                    >
                                        <option value="1">
                                            DPI
                                        </option>

                                        <option value="2">
                                            Pasaporte
                                        </option>
                                    </select>

                                </div>


                                <div className="col-md-4">

                                    <label className="form-label">
                                        Número de documento *
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        name="noDocumento"
                                        value={formulario.noDocumento}
                                        onChange={manejarCambio}
                                    />

                                </div>

                            </div>

                        </div>


                        {/* DATOS PERSONALES */}

                        <div className="form-section">

                            <div className="form-section-title">

                                <i className="bi bi-person"></i>

                                <div>
                                    <h3>Datos personales</h3>
                                    <p>
                                        Información general del socio.
                                    </p>
                                </div>

                            </div>


                            <div className="row g-3">

                                <div className="col-md-4">
                                    <label className="form-label">
                                        Primer nombre *
                                    </label>

                                    <input
                                        className="form-control"
                                        name="primerNombre"
                                        value={formulario.primerNombre}
                                        onChange={manejarCambio}
                                    />
                                </div>


                                <div className="col-md-4">
                                    <label className="form-label">
                                        Segundo nombre
                                    </label>

                                    <input
                                        className="form-control"
                                        name="segundoNombre"
                                        value={formulario.segundoNombre}
                                        onChange={manejarCambio}
                                    />
                                </div>


                                <div className="col-md-4">
                                    <label className="form-label">
                                        Tercer nombre
                                    </label>

                                    <input
                                        className="form-control"
                                        name="tercerNombre"
                                        value={formulario.tercerNombre}
                                        onChange={manejarCambio}
                                    />
                                </div>


                                <div className="col-md-4">
                                    <label className="form-label">
                                        Primer apellido *
                                    </label>

                                    <input
                                        className="form-control"
                                        name="primerApellido"
                                        value={formulario.primerApellido}
                                        onChange={manejarCambio}
                                    />
                                </div>


                                <div className="col-md-4">
                                    <label className="form-label">
                                        Segundo apellido
                                    </label>

                                    <input
                                        className="form-control"
                                        name="segundoApellido"
                                        value={formulario.segundoApellido}
                                        onChange={manejarCambio}
                                    />
                                </div>


                                <div className="col-md-4">
                                    <label className="form-label">
                                        Apellido de casada
                                    </label>

                                    <input
                                        className="form-control"
                                        name="apellidoCasada"
                                        value={formulario.apellidoCasada}
                                        onChange={manejarCambio}
                                    />
                                </div>


                                <div className="col-md-4">

                                    <label className="form-label">
                                        Fecha de nacimiento
                                    </label>

                                    <input
                                        type="date"
                                        className="form-control"
                                        name="fecha_nacimiento"
                                        value={formulario.fecha_nacimiento}
                                        onChange={manejarCambio}
                                    />

                                </div>

                            </div>

                        </div>


                        {/* CONTACTO */}

                        <div className="form-section">

                            <div className="form-section-title">

                                <i className="bi bi-telephone"></i>

                                <div>
                                    <h3>
                                        Información de contacto
                                    </h3>

                                    <p>
                                        Teléfonos y dirección del socio.
                                    </p>
                                </div>

                            </div>


                            <div className="row g-3">

                                <div className="col-md-4">

                                    <label className="form-label">
                                        Teléfono
                                    </label>

                                    <input
                                        className="form-control"
                                        name="telefono"
                                        value={formulario.telefono}
                                        onChange={manejarCambio}
                                    />

                                </div>


                                <div className="col-md-4">

                                    <label className="form-label">
                                        Teléfono de casa
                                    </label>

                                    <input
                                        className="form-control"
                                        name="telefonoCasa"
                                        value={formulario.telefonoCasa}
                                        onChange={manejarCambio}
                                    />

                                </div>


                                <div className="col-md-12">

                                    <label className="form-label">
                                        Dirección
                                    </label>

                                    <textarea
                                        className="form-control"
                                        name="direccion"
                                        value={formulario.direccion}
                                        onChange={manejarCambio}
                                        rows="3"
                                    />

                                </div>

                            </div>

                        </div>


                        {/* ADICIONAL */}

                        <div className="form-section">

                            <div className="form-section-title">

                                <i className="bi bi-info-circle"></i>

                                <div>
                                    <h3>
                                        Información adicional
                                    </h3>

                                    <p>
                                        Configuración adicional del socio.
                                    </p>
                                </div>

                            </div>


                            <div className="form-check">

                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="retiene_isr"
                                    name="retiene_isr"
                                    checked={formulario.retiene_isr}
                                    onChange={manejarCambio}
                                />

                                <label
                                    className="form-check-label"
                                    htmlFor="retiene_isr"
                                >
                                    El socio retiene ISR
                                </label>

                            </div>

                        </div>

                    </div>


                    <div className="socio-modal-footer">

                        <button
                            type="button"
                            className="btn-modal-cancel"
                            onClick={cerrarModal}
                            disabled={guardando}
                        >
                            Cancelar
                        </button>


                        <button
                            type="submit"
                            className="btn-modal-save"
                            disabled={guardando}
                        >

                            {guardando ? (
                                <>
                                    <span className="spinner-border spinner-border-sm"></span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-circle"></i>

                                    {esEdicion
                                        ? "Guardar Cambios"
                                        : "Registrar Socio"
                                    }
                                </>
                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default SocioModal;