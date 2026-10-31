"use strict";

window.App = (() => {
    const { $ } = window.AppUtils;

    // Se registra en la consola (F12) y en el pie del menú lateral
    // para verificar qué versión de los archivos está cargando el
    // navegador.
    const APP_BUILD = "2026-10-31.5";

    /* ---------------- Utilidades defensivas ----------------
     * Si el navegador carga archivos desactualizados (caché) y
     * falta un elemento del HTML, la aplicación avisa en consola
     * pero NUNCA se rompe: el resto sigue funcionando.
     */

    function on(selector, event, handler) {
        const element = $(selector);

        if (!element) {
            console.warn(
                `[Control Escolar] Falta el elemento "${selector}"; se omite el evento "${event}".`
            );
            return;
        }

        element.addEventListener(event, handler);
    }

    function value(selector, fallback = "") {
        return $(selector)?.value ?? fallback;
    }

    function setText(selector, text) {
        const element = $(selector);
        if (element) element.textContent = text;
    }

    function setHidden(selector, hidden) {
        const element = $(selector);
        if (element) element.hidden = hidden;
    }

    function setAttr(selector, name, attrValue) {
        const element = $(selector);
        if (element) element.setAttribute(name, attrValue);
    }

    function renderSafely(name, render) {
        try {
            render();
        } catch (error) {
            console.error(
                `[Control Escolar] Error al actualizar la vista "${name}":`,
                error
            );
        }
    }

    let defaultStatus = "pendiente";

    function getFormData() {
        return {
            studentName: value("#studentName"),
            studentEnrollment: value("#studentEnrollment"),
            category: value("#requestCategory"),
            description: value("#requestDescription"),
            assignee: value("#requestAssignee"),
            priority: value("#requestPriority"),
            dueDate: value("#requestDueDate"),
            status: value("#requestStatus"),
            notes: value("#requestNotes")
        };
    }

    /* Muestra bajo el selector de tipo la lista de documentos que
     * el alumno debe entregar cuando ese trámite los requiere. */
    function updateDocsHint() {
        const hint = $("#requestDocsHint");

        if (!hint) return;

        const docs = window.Tipos.documentsOf(
            $("#requestCategory")?.value
        );

        if (docs.length > 0) {
            hint.innerHTML =
                `📄 Documentos requeridos: <strong>${window.AppUtils.escapeHTML(
                    docs.join(" · ")
                )}</strong>`;
            hint.hidden = false;
        } else {
            hint.hidden = true;
            hint.innerHTML = "";
        }
    }

    function setFormData(request) {
        const hasRequest = Boolean(request?.id);

        $("#requestId").value = request?.id || "";
        $("#studentName").value = request?.studentName || "";
        $("#studentEnrollment").value =
            request?.studentEnrollment || "";
        $("#requestCategory").value =
            request?.category || window.Tipos.getDefaultKey();
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

        updateDocsHint();

        setHidden("#deleteRequestBtn", !hasRequest);
        setHidden("#closeRequestBtn", !hasRequest);

        if (hasRequest) {
            setText(
                "#closeRequestBtn",
                request.closed
                    ? "Reabrir solicitud"
                    : "Cerrar solicitud"
            );
        }

        setText(
            "#modalTitle",
            hasRequest ? "Editar solicitud" : "Nueva solicitud"
        );
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

    function openNewModal(status = "pendiente", category = "") {
        defaultStatus = status;

        const form = $("#requestForm");
        form?.reset();

        setFormData({
            status,
            category: category || window.Tipos.getDefaultKey(),
            priority: "normal"
        });

        $("#requestModal")?.showModal();

        $("#studentName")?.focus();
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
        $("#requestModal")?.showModal();
    }

    function closeModal() {
        const modal = $("#requestModal");

        if (modal?.open) {
            modal.close();
        }
    }

    function renderStats() {
        const stats = window.Solicitudes.getStats();

        setText("#statTotal", stats.total);
        setText("#statPending", stats.pending);
        setText("#statProgress", stats.progress);
        setText("#statResolved", stats.resolved);
        setText("#navTotal", stats.total);
    }

    function getFilters() {
        return {
            query: value("#searchInput"),
            category: value("#filterCategory"),
            priority: value("#filterPriority")
        };
    }

    const priorityOrder = {
        urgente: 0,
        alta: 1,
        normal: 2,
        baja: 3
    };

    function sortRequests(list, mode = value("#sortOrder", "recent")) {
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

    /* ---------------- Vista: Solicitudes ---------------- */

    let solPage = 1;
    const SOL_PAGE_SIZE = 8;

    function getSolRequests() {
        const requests = window.Solicitudes.search({
            query: value("#solSearchInput"),
            category: value("#solFilterCategory"),
            status: value("#solFilterStatus")
        });

        return sortRequests(
            showClosed
                ? requests
                : requests.filter(request => !request.closed),
            value("#solSortOrder", "recent")
        );
    }

    function renderSolicitudes() {
        const requests = getSolRequests();
        const totalPages = Math.max(
            1,
            Math.ceil(requests.length / SOL_PAGE_SIZE)
        );

        if (solPage > totalPages) {
            solPage = totalPages;
        }

        const start = (solPage - 1) * SOL_PAGE_SIZE;
        const pageRows = requests.slice(start, start + SOL_PAGE_SIZE);

        window.Views.renderTable(pageRows, {
            body: "#solicitudesTableBody",
            empty: "#solicitudesEmpty"
        });

        const emptyBox = $("#solicitudesEmpty");
        const hasAny = window.Solicitudes.getAll().length > 0;

        if (emptyBox) {
            const message = emptyBox.querySelector("p");
            const createButton =
                emptyBox.querySelector(".js-new-request");

            if (message) {
                message.textContent = hasAny
                    ? "No hay solicitudes que coincidan con los filtros."
                    : "No hay solicitudes registradas.";
            }

            if (createButton) {
                createButton.hidden = hasAny;
            }
        }

        window.Views.renderPagination({
            container: "#solicitudesPagination",
            page: solPage,
            total: totalPages,
            onChange: page => {
                solPage = page;
                renderSolicitudes();
            }
        });

        const counter = $("#solResultsCount");

        if (counter) {
            counter.hidden = requests.length === 0;
            counter.textContent =
                `Mostrando ${pageRows.length} de ${requests.length} solicitud(es)`;
        }
    }

    function refresh() {
        const requests = sortRequests(
            window.Solicitudes.search(getFilters())
        );

        // El tablero NO muestra las solicitudes cerradas a menos
        // que se active el filtro "Cerradas".
        const boardRequests = showClosedBoard
            ? requests
            : requests.filter(request => !request.closed);

        // Cada vista se actualiza por separado: si una falla,
        // las demás siguen mostrando información.
        renderSafely("tablero", () => {
            window.Kanban.render(boardRequests);

            window.Views.renderTable(boardRequests, {
                body: "#workspaceTableBody",
                empty: "#workspaceEmpty"
            });
        });

        renderSafely("solicitudes", renderSolicitudes);
        renderSafely("catálogo de tipos", () =>
            window.Tipos.renderTable()
        );
        renderSafely("resumen de trámites", () =>
            window.Views.renderCatalog()
        );
        renderSafely("reportes", () =>
            window.Views.renderReports()
        );
        renderSafely("estadísticas", renderStats);
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

        app?.classList.toggle("sidebar-collapsed");

        const collapsed = app?.classList.contains("sidebar-collapsed");

        setAttr("#menuToggle", "aria-expanded", String(!collapsed));
    }

    function initDate() {
        setText(
            "#currentDate",
            window.AppUtils.formatCurrentDate()
        );
    }

    const viewMeta = {
        dashboard: "Inicio",
        tablero: "Tablero Kanban",
        solicitudes: "Solicitudes",
        resumen: "Resumen",
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

        setText("#breadcrumbSection", viewMeta[name]);

        if (window.innerWidth <= 760) {
            $(".app")?.classList.add("sidebar-collapsed");
            setAttr("#menuToggle", "aria-expanded", "false");
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

    function filterByCategory(category) {
        $("#solFilterCategory").value = category;
        solPage = 1;

        navigate("solicitudes");
        renderSolicitudes();
    }

    let boardMode = "kanban";
    let showClosed = false;
    let showClosedBoard = false;

    function setBoardMode(mode) {
        boardMode = mode === "tabla" ? "tabla" : "kanban";

        setHidden("#kanbanBoard", boardMode !== "kanban");
        setHidden("#workspaceTable", boardMode !== "tabla");

        $("#btnKanbanView")?.classList.toggle(
            "view-toggle__btn--active",
            boardMode === "kanban"
        );
        $("#btnTableView")?.classList.toggle(
            "view-toggle__btn--active",
            boardMode === "tabla"
        );

        setAttr("#btnKanbanView", "aria-pressed", String(boardMode === "kanban"));
        setAttr("#btnTableView", "aria-pressed", String(boardMode === "tabla"));
    }

    function initNavigation() {
        window.addEventListener("hashchange", () => {
            showView(currentView());
        });

        showView(currentView());
    }

    function initEvents() {
        on("#requestForm", "submit", handleSubmit);

        document.querySelectorAll(".js-new-request").forEach(button => {
            button.addEventListener("click", () => {
                openNewModal();
            });
        });

        on("#closeModalBtn", "click", closeModal);
        on("#cancelModalBtn", "click", closeModal);
        on("#requestCategory", "change", updateDocsHint);

        on("#closeRequestBtn", "click", () => {
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

        on("#deleteRequestBtn", "click", handleDelete);
        on("#menuToggle", "click", toggleSidebar);

        on("#searchInput", "input", refresh);
        on("#filterCategory", "change", refresh);
        on("#filterPriority", "change", refresh);
        on("#clearFiltersBtn", "click", clearFilters);
        on("#sortOrder", "change", refresh);

        on("#solSearchInput", "input", () => {
            solPage = 1;
            renderSolicitudes();
        });

        on("#solFilterStatus", "change", () => {
            solPage = 1;
            renderSolicitudes();
        });

        on("#solFilterCategory", "change", () => {
            solPage = 1;
            renderSolicitudes();
        });

        on("#solSortOrder", "change", () => {
            solPage = 1;
            renderSolicitudes();
        });

        on("#clearSolFiltersBtn", "click", () => {
            $("#solSearchInput").value = "";
            $("#solFilterStatus").value = "";
            $("#solFilterCategory").value = "";
            $("#solSortOrder").value = "recent";
            solPage = 1;
            renderSolicitudes();
        });

        on("#toggleClosedTable", "click", () => {
            showClosed = !showClosed;
            solPage = 1;

            setAttr("#toggleClosedTable", "aria-pressed", String(showClosed));

            refresh();
        });

        on("#toggleClosedBoard", "click", () => {
            showClosedBoard = !showClosedBoard;

            setAttr("#toggleClosedBoard", "aria-pressed", String(showClosedBoard));

            refresh();
        });

        on("#btnKanbanView", "click", () => {
            setBoardMode("kanban");
        });

        on("#btnTableView", "click", () => {
            setBoardMode("tabla");
        });

        document.querySelectorAll("[data-new-status]").forEach(button => {
            button.addEventListener("click", () => {
                openNewModal(button.dataset.newStatus);
            });
        });

        // Cerrar al pulsar fuera del contenido del diálogo.
        on("#requestModal", "click", event => {
            if (event.target === $("#requestModal")) {
                closeModal();
            }
        });

        initNavigation();
        window.Kanban?.initDragAndDrop();
    }

    /* ---------------- Validación de archivos ---------------- */

    // Si el navegador carga un index.html antiguo (por ejemplo, una
    // copia en otra carpeta o la caché), faltan secciones de las
    // vistas y el contenido sale en blanco. En ese caso se muestra
    // un aviso visible en lugar de dejar la pantalla vacía.
    function validateViews() {
        const missing = Object.keys(viewMeta).filter(
            name => !document.getElementById(`view-${name}`)
        );

        if (!missing.length) return;

        const banner = document.createElement("div");
        banner.className = "app-warning";

        banner.innerHTML = `
            <strong>Index.html desactualizado.</strong>
            <span>
                El navegador abrió una versión antigua de la interfaz
                (faltan las vistas: ${escapeHTMLText(missing.join(", "))}).
                Recarga con <b>Ctrl + F5</b> y revisa que la barra de
                direcciones apunte a la carpeta más reciente del proyecto
                (<code>...\ssocial app\index.html</code>).
            </span>
        `;

        $(".main")?.prepend(banner);

        console.error(
            "[Control Escolar] index.html desactualizado. Faltan las vistas:",
            missing
        );
    }

    function escapeHTMLText(value) {
        return window.AppUtils.escapeHTML(value);
    }

    function init() {
        console.info(
            `[Control Escolar] app.js cargado (build ${APP_BUILD}).`
        );

        setText(
            "#appVersion",
            `Interfaz v${APP_BUILD} · JS operativo`
        );

        validateViews();

        // La aplicación siempre arranca en la pantalla principal,
        // sin importar qué vista traiga la URL.
        if (window.location.hash) {
            try {
                history.replaceState(
                    null,
                    "",
                    window.location.pathname + window.location.search
                );
            } catch (error) {
                window.location.hash = "";
            }
        }

        initDate();
        initEvents();
        refresh();
    }

    return {
        init,
        refresh,
        navigate,
        filterByCategory,
        openNewModal,
        openEditModal,
        closeRequest,
        reopenRequest
    };
})();

document.addEventListener("DOMContentLoaded", () => {
    window.App.init();
});
