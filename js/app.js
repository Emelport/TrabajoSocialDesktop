"use strict";

window.App = (() => {
    const { $ } = window.AppUtils;

    let defaultStatus = "pendiente";

    function getFormData() {
        return {
            studentName: $("#studentName").value,
            studentEnrollment: $("#studentEnrollment").value,
            category: $("#requestCategory").value,
            description: $("#requestDescription").value,
            assignee: $("#requestAssignee").value,
            priority: $("#requestPriority").value,
            dueDate: $("#requestDueDate").value,
            status: $("#requestStatus").value,
            notes: $("#requestNotes").value
        };
    }

    function setFormData(request) {
        const hasRequest = Boolean(request?.id);

        $("#requestId").value = request?.id || "";
        $("#studentName").value = request?.studentName || "";
        $("#studentEnrollment").value =
            request?.studentEnrollment || "";
        $("#requestCategory").value =
            request?.category || "cartas";
        $("#requestDescription").value =
            request?.description || "";
        $("#requestAssignee").value =
            request?.assignee || "";
        $("#requestPriority").value =
            request?.priority || "normal";
        $("#requestDueDate").value =
            request?.dueDate || "";
        $("#requestStatus").value =
            request?.status || defaultStatus;
        $("#requestNotes").value =
            request?.notes || "";

        $("#deleteRequestBtn").hidden = !hasRequest;
        $("#closeRequestBtn").hidden = !hasRequest;

        if (hasRequest) {
            $("#closeRequestBtn").textContent = request.closed
                ? "Reabrir solicitud"
                : "Cerrar solicitud";
        }

        $("#modalTitle").textContent = hasRequest
            ? "Editar solicitud"
            : "Nueva solicitud";
    }

    function closeRequest(id) {
        const saved = window.Solicitudes.close(id);

        if (!saved) {
            window.AppUtils.toast(
                "No se pudo cerrar la solicitud.",
                "error"
            );
            return;
        }

        window.AppUtils.toast(
            "Solicitud cerrada: aparece como resuelta y ya no se muestra en el tablero."
        );

        refresh();
    }

    function reopenRequest(id) {
        const saved = window.Solicitudes.reopen(id);

        if (!saved) {
            window.AppUtils.toast(
                "No se pudo reabrir la solicitud.",
                "error"
            );
            return;
        }

        window.AppUtils.toast("Solicitud reabierta.");

        refresh();
    }

    function openNewModal(status = "pendiente") {
        defaultStatus = status;

        const form = $("#requestForm");
        form.reset();

        setFormData({
            status,
            category: "cartas",
            priority: "normal"
        });

        $("#requestModal").showModal();

        $("#studentName").focus();
    }

    function openEditModal(id) {
        const request = window.Solicitudes.getById(id);

        if (!request) {
            window.AppUtils.toast(
                "No se encontró la solicitud.",
                "error"
            );
            refresh();
            return;
        }

        setFormData(request);
        $("#requestModal").showModal();
    }

    function closeModal() {
        const modal = $("#requestModal");

        if (modal.open) {
            modal.close();
        }
    }

    function renderStats() {
        const stats = window.Solicitudes.getStats();

        $("#statTotal").textContent = stats.total;
        $("#statPending").textContent = stats.pending;
        $("#statProgress").textContent = stats.progress;
        $("#statResolved").textContent = stats.resolved;
        $("#navTotal").textContent = stats.total;
    }

    function getFilters() {
        return {
            query: $("#searchInput").value,
            category: $("#filterCategory").value,
            priority: $("#filterPriority").value
        };
    }

    const priorityOrder = {
        urgente: 0,
        alta: 1,
        normal: 2,
        baja: 3
    };

    function sortRequests(list) {
        const mode = $("#sortOrder").value;
        const sorted = [...list];

        switch (mode) {
            case "old":
                sorted.sort((a, b) =>
                    String(a.createdAt ?? "")
                        .localeCompare(String(b.createdAt ?? ""))
                );
                break;
            case "due":
                sorted.sort((a, b) =>
                    String(a.dueDate || "9999-12-31")
                        .localeCompare(b.dueDate || "9999-12-31")
                );
                break;
            case "priority":
                sorted.sort((a, b) =>
                    (priorityOrder[a.priority] ?? 9) -
                    (priorityOrder[b.priority] ?? 9)
                );
                break;
            case "name":
                sorted.sort((a, b) =>
                    String(a.studentName).localeCompare(
                        String(b.studentName),
                        "es"
                    )
                );
                break;
            default: // "recent": más recientes primero (por fecha de creación)
                sorted.sort((a, b) =>
                    String(b.createdAt ?? "")
                        .localeCompare(String(a.createdAt ?? ""))
                );
        }

        return sorted;
    }

    function refresh() {
        const requests = sortRequests(
            window.Solicitudes.search(getFilters())
        );

        // El tablero kanban NO muestra las solicitudes cerradas.
        const openRequests = requests.filter(
            request => !request.closed
        );

        window.Kanban.render(openRequests);

        window.Views.renderTable(requests, {
            body: "#workspaceTableBody",
            empty: "#workspaceEmpty"
        });

        window.Views.renderTable(
            sortRequests(window.Solicitudes.getAll())
        );

        window.Views.renderCatalog();
        window.Views.renderReports();
        renderStats();
    }

    function clearFilters() {
        $("#searchInput").value = "";
        $("#filterCategory").value = "";
        $("#filterPriority").value = "";

        refresh();
    }

    function handleSubmit(event) {
        event.preventDefault();

        const id = $("#requestId").value;
        const data = getFormData();

        const saved = id
            ? window.Solicitudes.update(id, data)
            : window.Solicitudes.create(data);

        if (!saved) return;

        closeModal();

        window.AppUtils.toast(
            id
                ? "Solicitud actualizada correctamente."
                : "Solicitud creada correctamente."
        );

        refresh();
    }

    function handleDelete() {
        const id = $("#requestId").value;

        if (!id) return;

        const confirmed = window.confirm(
            "¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer."
        );

        if (!confirmed) return;

        const deleted = window.Solicitudes.remove(id);

        if (!deleted) {
            window.AppUtils.toast(
                "No se pudo eliminar la solicitud.",
                "error"
            );
            return;
        }

        closeModal();

        window.AppUtils.toast(
            "Solicitud eliminada correctamente."
        );

        refresh();
    }

    function toggleSidebar() {
        const app = $(".app");
        const button = $("#menuToggle");

        app.classList.toggle("sidebar-collapsed");

        const collapsed = app.classList.contains("sidebar-collapsed");

        button.setAttribute("aria-expanded", String(!collapsed));
    }

    function initDate() {
        $("#currentDate").textContent =
            window.AppUtils.formatCurrentDate();
    }

    const viewMeta = {
        dashboard: "Inicio",
        tablero: "Tablero Kanban",
        solicitudes: "Solicitudes",
        categorias: "Tipos de trámite",
        reportes: "Reportes"
    };

    function currentView() {
        const name = window.location.hash.replace(/^#\/?/, "");
        return viewMeta[name] ? name : "dashboard";
    }

    function showView(name) {
        document.querySelectorAll(".view").forEach(view => {
            view.hidden = view.id !== `view-${name}`;
        });

        document.querySelectorAll(".sidebar__nav .nav-item").forEach(item => {
            item.classList.toggle(
                "nav-item--active",
                item.dataset.view === name
            );
        });

        $("#breadcrumbSection").textContent = viewMeta[name];

        if (window.innerWidth <= 760) {
            $(".app").classList.add("sidebar-collapsed");
            $("#menuToggle").setAttribute("aria-expanded", "false");
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function navigate(view) {
        const target = viewMeta[view] ? view : "dashboard";

        if (currentView() === target) {
            showView(target);
            return;
        }

        window.location.hash = `#/${target}`;
    }

    let boardMode = "kanban";

    function setBoardMode(mode) {
        boardMode = mode === "tabla" ? "tabla" : "kanban";

        $("#kanbanBoard").hidden = boardMode !== "kanban";
        $("#workspaceTable").hidden = boardMode !== "tabla";

        $("#btnKanbanView").classList.toggle(
            "view-toggle__btn--active",
            boardMode === "kanban"
        );
        $("#btnTableView").classList.toggle(
            "view-toggle__btn--active",
            boardMode === "tabla"
        );

        $("#btnKanbanView").setAttribute(
            "aria-pressed",
            String(boardMode === "kanban")
        );
        $("#btnTableView").setAttribute(
            "aria-pressed",
            String(boardMode === "tabla")
        );
    }

    function initNavigation() {
        window.addEventListener("hashchange", () => {
            showView(currentView());
        });

        showView(currentView());
    }

    function initEvents() {
        $("#requestForm").addEventListener(
            "submit",
            handleSubmit
        );

        document.querySelectorAll(".js-new-request").forEach(button => {
            button.addEventListener("click", () => {
                openNewModal();
            });
        });

        $("#closeModalBtn").addEventListener(
            "click",
            closeModal
        );

        $("#cancelModalBtn").addEventListener(
            "click",
            closeModal
        );

        $("#closeRequestBtn").addEventListener("click", () => {
            const id = $("#requestId").value;

            if (!id) return;

            const request = window.Solicitudes.getById(id);

            if (!request) return;

            closeModal();

            if (request.closed) {
                reopenRequest(id);
            } else {
                closeRequest(id);
            }
        });

        $("#deleteRequestBtn").addEventListener(
            "click",
            handleDelete
        );

        $("#menuToggle").addEventListener(
            "click",
            toggleSidebar
        );

        $("#searchInput").addEventListener(
            "input",
            refresh
        );

        $("#filterCategory").addEventListener(
            "change",
            refresh
        );

        $("#filterPriority").addEventListener(
            "change",
            refresh
        );

        $("#clearFiltersBtn").addEventListener(
            "click",
            clearFilters
        );

        $("#sortOrder").addEventListener("change", refresh);

        $("#btnKanbanView").addEventListener("click", () => {
            setBoardMode("kanban");
        });

        $("#btnTableView").addEventListener("click", () => {
            setBoardMode("tabla");
        });

        document.querySelectorAll("[data-new-status]").forEach(button => {
            button.addEventListener("click", () => {
                openNewModal(button.dataset.newStatus);
            });
        });

        // Cerrar al pulsar fuera del contenido del diálogo.
        $("#requestModal").addEventListener("click", event => {
            if (event.target === $("#requestModal")) {
                closeModal();
            }
        });

        initNavigation();
        window.Kanban.initDragAndDrop();
    }

    function init() {
        initDate();
        initEvents();
        refresh();
    }

    return {
        init,
        refresh,
        navigate,
        openNewModal,
        openEditModal,
        closeRequest,
        reopenRequest
    };
})();

document.addEventListener("DOMContentLoaded", () => {
    window.App.init();
});
