"use strict";

window.ExcelExport = (() => {
    const { $, priorities, statuses, toast } = window.AppUtils;

    const COLUMNS = [
        ["Folio", request => request.folio],
        ["Alumno", request => request.studentName],
        ["Matrícula", request => request.studentEnrollment],
        ["Trámite", request => window.Tipos.nameOf(request.category)],
        [
            "Documentos requeridos",
            request => window.Tipos.documentsOf(request.category).join(" | ")
        ],
        ["Descripción", request => request.description],
        ["Prioridad", request => priorities[request.priority] ?? request.priority],
        ["Estado", request => statuses[request.status] ?? request.status],
        ["Responsable", request => request.assignee],
        ["Fecha límite", request => request.dueDate],
        ["Notas", request => request.notes],
        ["Cerrada", request => (request.closed ? "Sí" : "No")],
        ["Fecha de registro", request =>
            request.createdAt ? request.createdAt.slice(0, 10) : ""
        ]
    ];

    function escapeCell(value) {
        const text = String(value ?? "");

        // Las celdas que empiezan con =, +, - o @ se tratan como fórmula
        // por Excel; se antepone comilla simple para que se tomen como texto.
        const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;

        return `"${safe.replace(/"/g, '""')}"`;
    }

    function getVisibleRequests() {
        const requests = window.Solicitudes.search({
            query: $("#solSearchInput")?.value ?? "",
            category: $("#solFilterCategory")?.value ?? "",
            status: $("#solFilterStatus")?.value ?? ""
        });

        // Se exporta lo que se ve: si el filtro "Cerradas" está
        // desactivado, los expedientes cerrados se excluyen.
        const showClosed =
            $("#toggleClosedTable")?.getAttribute("aria-pressed") === "true";

        return showClosed
            ? requests
            : requests.filter(request => !request.closed);
    }

    function buildCsv(requests) {
        const header = COLUMNS
            .map(([title]) => escapeCell(title))
            .join(",");

        const rows = requests.map(request =>
            COLUMNS.map(([, getter]) =>
                escapeCell(getter(request))
            ).join(",")
        );

        // El BOM (\uFEFF) hace que Excel reconozca UTF-8 y acentos.
        return `\uFEFF${[header, ...rows].join("\r\n")}`;
    }

    function download(requests) {
        const csv = buildCsv(requests);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `solicitudes-${window.AppUtils.todayString()}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    function handleExport() {
        const requests = getVisibleRequests();

        if (!requests.length) {
            toast(
                "No hay solicitudes para exportar con los filtros actuales.",
                "error"
            );
            return;
        }

        try {
            download(requests);
            toast(`Se exportaron ${requests.length} solicitud(es).`);
        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            toast("No se pudo generar el archivo.", "error");
        }
    }

    function init() {
        const button = $("#exportExcelBtn");

        if (!button) return;

        button.addEventListener("click", handleExport);
    }

    return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
    window.ExcelExport.init();
});
