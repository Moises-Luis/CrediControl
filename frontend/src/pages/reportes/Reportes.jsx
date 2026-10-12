
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import ExcelJS from "exceljs/dist/exceljs.min.js";

import reporteService from "../../services/reporteService";

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

const moneda = (valor) =>
    new Intl.NumberFormat("es-GT", {
        style: "currency",
        currency: "GTQ"
    }).format(Number(valor) || 0);

const fechaTexto = (valor) => {
    if (!valor) return "—";

    const texto = String(valor).slice(0, 10);
    const partes = texto.split("-");

    return partes.length === 3
        ? `${partes[2]}/${partes[1]}/${partes[0]}`
        : texto;
};

const fechaISO = (fecha) => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
};

const hoy = () => fechaISO(new Date());

const inicioMes = () => {
    const fecha = new Date();
    fecha.setDate(1);
    return fechaISO(fecha);
};

const estados = {
    1: "Activo",
    2: "Cancelado",
    3: "Pagado",
    4: "Vencido",
    5: "Mora"
};

// Columnas de los dos reportes

const columnasCartera = [
    { campo: "idSocio", titulo: "Socio" },
    { campo: "nombreSocio", titulo: "Nombre" },
    { campo: "idCredito", titulo: "Crédito" },
    { campo: "nombreServicio", titulo: "Servicio" },
    { campo: "monto_original", titulo: "Monto original", dinero: true },
    { campo: "saldo_actual", titulo: "Saldo actual", dinero: true },
    { campo: "tasa", titulo: "Tasa anual %" },
    { campo: "fechaDesembolso", titulo: "Desembolso", fecha: true },
    { campo: "fechaVencimiento", titulo: "Vencimiento", fecha: true },
    { campo: "idEstadoServicio", titulo: "Estado" }
];

const columnasPagos = [
    { campo: "idPago", titulo: "No. Pago" },
    { campo: "fechaPago", titulo: "Fecha" },
    { campo: "idSocio", titulo: "Socio" },
    { campo: "nombreSocio", titulo: "Nombre" },
    { campo: "idCredito", titulo: "Crédito" },
    { campo: "nombreServicio", titulo: "Servicio" },
    { campo: "cantidadCapital", titulo: "Capital", dinero: true },
    { campo: "cantidadInteres", titulo: "Interés", dinero: true },
    { campo: "cantidadMora", titulo: "Mora", dinero: true },
    { campo: "montoTotal", titulo: "Total", dinero: true },
    { campo: "observacion", titulo: "Observación" }
];

const obtenerValor = (fila, columna) => {
    if (columna.campo === "idEstadoServicio") {
        return estados[fila.idEstadoServicio] || "Desconocido";
    }

    const valor = fila[columna.campo];

    if (columna.dinero) return moneda(valor);
    if (columna.fecha) return fechaTexto(valor);

    return valor ?? "—";
};

// ==========================================
// COMPONENTE REPORTES
// ==========================================

function Reportes() {
    const [tipoReporte, setTipoReporte] = useState("cartera");
    const [fechaInicial, setFechaInicial] = useState(inicioMes);
    const [fechaFinal, setFechaFinal] = useState(hoy);

    const [resumen, setResumen] = useState(null);
    const [registros, setRegistros] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [exportando, setExportando] = useState(false);
    const [consultado, setConsultado] = useState(false);
    const [error, setError] = useState("");

    const esCartera = tipoReporte === "cartera";

    const columnas = esCartera
        ? columnasCartera
        : columnasPagos;

    const titulo = esCartera
        ? "Reporte de Cartera de Créditos"
        : "Reporte de Pagos";

    const total = registros.reduce(
        (suma, registro) =>
            suma + Number(
                esCartera
                    ? registro.saldo_actual
                    : registro.montoTotal
            ),
        0
    );

    // ==========================================
    // OBTENER RESUMEN
    // ==========================================

    useEffect(() => {
        const cargarResumen = async () => {
            try {
                const respuesta =
                    await reporteService.obtenerResumen();

                if (respuesta.exito) {
                    setResumen(respuesta.datos);
                }
            } catch (err) {
                console.error("Error cargando resumen:", err);
            }
        };

        cargarResumen();
    }, []);

    // ==========================================
    // CONSULTAR REPORTE
    // ==========================================

    const generarReporte = async () => {
        if (
            !esCartera &&
            (!fechaInicial || !fechaFinal || fechaInicial > fechaFinal)
        ) {
            setError("Selecciona un rango de fechas válido.");
            setRegistros([]);
            setConsultado(false);
            return;
        }

        setCargando(true);
        setError("");
        setRegistros([]);
        setConsultado(false);

        try {
            const respuesta = esCartera
                ? await reporteService.obtenerCartera()
                : await reporteService.obtenerPagos(
                    fechaInicial,
                    fechaFinal
                );

            if (!respuesta.exito) {
                throw new Error(
                    respuesta.mensaje || "Error al consultar el reporte."
                );
            }

            setRegistros(
                Array.isArray(respuesta.datos)
                    ? respuesta.datos
                    : []
            );

            setConsultado(true);
        } catch (err) {
            setError(
                err.response?.data?.mensaje ||
                err.message ||
                "Error al generar el reporte."
            );
        } finally {
            setCargando(false);
        }
    };

    // ==========================================
    // EXPORTAR PDF
    // ==========================================

    const exportarPDF = () => {
        if (!consultado || registros.length === 0) return;

        setExportando(true);
        setError("");

        try {
            const pdf = new jsPDF({
                orientation: "landscape",
                format: "a4"
            });

            pdf.setFontSize(17);
            pdf.setFont("helvetica", "bold");
            pdf.text("CrediControl", 14, 15);

            pdf.setFontSize(12);
            pdf.text(titulo, 14, 24);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);

            pdf.text(
                `Generado: ${new Date().toLocaleString("es-GT")}`,
                14,
                32
            );

            if (!esCartera) {
                pdf.text(
                    `Período: ${fechaTexto(fechaInicial)} al ${fechaTexto(fechaFinal)}`,
                    14,
                    39
                );
            }

            const encabezados = columnas.map(
                (columna) => columna.titulo
            );

            const filas = registros.map((registro) =>
                columnas.map((columna) =>
                    String(obtenerValor(registro, columna))
                )
            );

            autoTable(pdf, {
                startY: esCartera ? 40 : 46,
                head: [encabezados],
                body: filas,
                theme: "grid",
                styles: {
                    fontSize: 7,
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [30, 58, 95]
                },
                margin: {
                    left: 10,
                    right: 10
                }
            });

            const paginaFinal = pdf.lastAutoTable?.finalY || 45;
            const altoPagina = pdf.internal.pageSize.getHeight();

            if (paginaFinal + 15 > altoPagina - 10) {
                pdf.addPage();
                pdf.text(`Total: ${moneda(total)}`, 14, 20);
            } else {
                pdf.text(
                    `Total: ${moneda(total)}`,
                    14,
                    paginaFinal + 10
                );
            }

            pdf.save(
                esCartera
                    ? "Reporte_Cartera.pdf"
                    : "Reporte_Pagos.pdf"
            );
        } catch (err) {
            console.error(err);
            setError("Error al generar el PDF.");
        } finally {
            setExportando(false);
        }
    };

    // ==========================================
    // EXPORTAR EXCEL - VERSIÓN SENCILLA
    // ==========================================

    const exportarExcel = async () => {
        if (!consultado || registros.length === 0) return;

        setExportando(true);
        setError("");

        try {
            // 1. Crear el libro y la hoja
            const libro = new ExcelJS.Workbook();
            const hoja = libro.addWorksheet("Reporte");

            // 2. Agregar el título
            hoja.addRow(["CrediControl"]);
            hoja.addRow([titulo]);
            hoja.addRow([
                `Fecha de generación: ${new Date().toLocaleString("es-GT")}`
            ]);

            if (!esCartera) {
                hoja.addRow([
                    `Período: ${fechaTexto(fechaInicial)} al ${fechaTexto(fechaFinal)}`
                ]);
            }

            hoja.addRow([]);

            // 3. Agregar encabezados
            hoja.addRow(
                columnas.map((columna) => columna.titulo)
            );

            // 4. Agregar datos
            registros.forEach((registro) => {
                const fila = columnas.map((columna) => {
                    const valor = registro[columna.campo];

                    if (columna.campo === "idEstadoServicio") {
                        return estados[valor] || "Desconocido";
                    }

                    if (columna.dinero || columna.campo === "tasa") {
                        return Number(valor) || 0;
                    }

                    // Mantener códigos como "0002".
                    // Evitar que Excel interprete texto
                    // proporcionado por usuarios como fórmulas.
                    const texto = String(valor ?? "");

                    return /^[\s]*[=+\-@\t\r]/.test(texto)
                        ? `'${texto}`
                        : texto;
                });

                hoja.addRow(fila);
            });

            // 5. Agregar total
            hoja.addRow([]);
            hoja.addRow(["TOTAL", total]);

            // 6. Ajustar ancho básico de columnas
            hoja.columns.forEach((columna) => {
                columna.width = 20;
            });

            // 7. Generar y descargar el archivo
            const buffer = await libro.xlsx.writeBuffer();

            const archivo = new Blob([buffer], {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            });

            const url = URL.createObjectURL(archivo);
            const enlace = document.createElement("a");

            enlace.href = url;
            enlace.download = esCartera
                ? "Reporte_Cartera.xlsx"
                : "Reporte_Pagos.xlsx";

            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();

            setTimeout(() => URL.revokeObjectURL(url), 1000);

        } catch (err) {
            console.error(err);
            setError("Error al generar el Excel.");
        } finally {
            setExportando(false);
        }
    };

    // ==========================================
    // INTERFAZ
    // ==========================================

    return (
        <div className="container-fluid py-4">

            <div className="mb-4">
                <h3 className="fw-bold">
                    <i className="bi bi-bar-chart-line me-2 text-primary"></i>
                    Reportes
                </h3>

                <p className="text-muted">
                    Consulta y exportación de reportes financieros.
                </p>
            </div>

            {/* INDICADORES */}

            <div className="row g-3 mb-4">

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <small className="text-muted">
                                Socios activos
                            </small>
                            <h4 className="fw-bold mt-2">
                                {resumen?.socios?.totalSocios ?? 0}
                            </h4>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <small className="text-muted">
                                Créditos registrados
                            </small>
                            <h4 className="fw-bold mt-2">
                                {resumen?.creditos?.totalCreditos ?? 0}
                            </h4>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <small className="text-muted">
                                Cartera actual
                            </small>
                            <h4 className="fw-bold mt-2">
                                {moneda(resumen?.creditos?.carteraActual)}
                            </h4>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <small className="text-muted">
                                Total recaudado
                            </small>
                            <h4 className="fw-bold mt-2">
                                {moneda(resumen?.pagos?.totalRecaudado)}
                            </h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTROS */}

            <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white">
                    <h5 className="mb-0 fw-semibold">
                        Parámetros del reporte
                    </h5>
                </div>

                <div className="card-body">
                    <div className="row g-3 align-items-end">

                        <div className="col-md-4">
                            <label className="form-label">
                                Tipo de reporte
                            </label>

                            <select
                                className="form-select"
                                value={tipoReporte}
                                onChange={(e) => {
                                    setTipoReporte(e.target.value);
                                    setRegistros([]);
                                    setConsultado(false);
                                    setError("");
                                }}
                            >
                                <option value="cartera">
                                    Cartera de créditos
                                </option>
                                <option value="pagos">
                                    Pagos por fechas
                                </option>
                            </select>
                        </div>

                        {!esCartera && (
                            <>
                                <div className="col-md-3">
                                    <label className="form-label">
                                        Fecha inicial
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={fechaInicial}
                                        onChange={(e) => {
                                            setFechaInicial(e.target.value);
                                            setConsultado(false);
                                            setRegistros([]);
                                        }}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">
                                        Fecha final
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={fechaFinal}
                                        onChange={(e) => {
                                            setFechaFinal(e.target.value);
                                            setConsultado(false);
                                            setRegistros([]);
                                        }}
                                    />
                                </div>
                            </>
                        )}

                        <div className="col-md-auto">
                            <button
                                className="btn btn-primary"
                                onClick={generarReporte}
                                disabled={cargando || exportando}
                            >
                                <i className="bi bi-search me-2"></i>
                                {cargando
                                    ? "Consultando..."
                                    : "Generar reporte"}
                            </button>
                        </div>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                        <button
                            className="btn btn-danger"
                            onClick={exportarPDF}
                            disabled={
                                !consultado ||
                                !registros.length ||
                                exportando
                            }
                        >
                            <i className="bi bi-file-earmark-pdf me-2"></i>
                            Exportar PDF
                        </button>

                        <button
                            className="btn btn-success"
                            onClick={exportarExcel}
                            disabled={
                                !consultado ||
                                !registros.length ||
                                exportando
                            }
                        >
                            <i className="bi bi-file-earmark-excel me-2"></i>
                            Exportar Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* RESULTADOS */}

            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                    <h5 className="mb-0">{titulo}</h5>
                </div>

                <div className="card-body">

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    {cargando ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover table-sm align-middle">
                                <thead className="table-light">
                                    <tr>
                                        {columnas.map((columna) => (
                                            <th key={columna.campo}>
                                                {columna.titulo}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {registros.map((registro, indice) => (
                                        <tr key={esCartera
                                            ? `${registro.idSocio}-${registro.idTipoServicio}-${registro.idCredito}`
                                            : registro.idPago
                                        }>
                                            {columnas.map((columna) => (
                                                <td key={columna.campo}>
                                                    {obtenerValor(
                                                        registro,
                                                        columna
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                    {registros.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={columnas.length}
                                                className="text-center text-muted py-4"
                                            >
                                                {consultado
                                                    ? "No hay registros."
                                                    : "Genera el reporte para ver los resultados."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {registros.length > 0 && (
                        <div className="text-end border-top pt-3">
                            <strong>
                                Total: {moneda(total)}
                            </strong>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Reportes;
