"use strict";

window.Kanban = (() => {
    const {
        $,
        priorities,
        statuses,
        escapeHTML,
        formatDate,
        isOverdue
    } = window.AppUtils;

    const columns = {
        pendiente: "#columnPending",
        proceso: "#columnProgress",
        espera: "#columnWaiting",
        resuelto: "#columnResolved"
    };

    const counters = {
        pendiente: "#countPending",
        proceso: "#countProgress",
        espera: "#countWaiting",
        resuelto: "#countResolved"
    };

    let currentRequests = [];

    function createCard(request) {
        const card = document.createElement("article");

        card.className = "request-card";
        card.dataset.id = request.id;
        card.dataset.status = request.status;
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute(
            "aria-label",
            `Editar solicitud ${request.folio}, ${request.studentName}`
        );

        const overdue = isOverdue(request.dueDate, request.status);

        // Solo se muestra la fecha cuando el caso ya venció.
        // El detalle completo (descripción, responsable y fechas)
        // queda en el tooltip y en el modal de edición.
        const dueDate = overdue
            ? `<span class="request-card__due request-card__due--overdue">
                    ⚠ Vencida: ${escapeHTML(formatDate(request.dueDate))}
               </span>`
            : "";

        card.title = [
            request.description,
            request.assignee
                ? `Responsable: ${request.assignee}`
                : "",
            request.dueDate
                ? `Fecha límite: ${formatDate(request.dueDate)}`
                : "",
            request.createdAt
                ? `Creada: ${formatDate(String(request.createdAt).slice(0, 10))}`
                : ""
        ].filter(Boolean).join("\n");

        card.innerHTML = `
            <div class="request-card__top">
                <span class="request-card__folio">
                    ${escapeHTML(request.folio)}
                </span>
                <span class="priority-badge priority-badge--${escapeHTML(request.priority)}">
                    ${escapeHTML(priorities[request.priority] || "Normal")}
                </span>
            </div>

            <h4 class="request-card__student">
                ${escapeHTML(request.studentName)}
            </h4>

            <span class="request-card__category">
                ${escapeHTML(window.Tipos.nameOf(request.category))}
            </span>

            ${dueDate}
        `;

        card.addEventListener("click", () => {
            window.App.openEditModal(request.id);
        });

        card.addEventListener("keydown", event => {
            if (
                event.target === card &&
                (event.key === "Enter" || event.key === " ")
            ) {
                event.preventDefault();
                window.App.openEditModal(request.id);
            }
        });

        card.draggable = true;

        card.addEventListener("dragstart", event => {
            event.dataTransfer.setData("text/plain", request.id);
            event.dataTransfer.effectAllowed = "move";
            card.classList.add("dragging");
        });

        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");

            document.querySelectorAll(".drag-over").forEach(element => {
                element.classList.remove("drag-over");
            });
        });

        return card;
    }

    function render(requests) {
        currentRequests = requests;

        Object.values(columns).forEach(selector => {
            const container = $(selector);
            if (container) container.replaceChildren();
        });

        const grouped = {
            pendiente: [],
            proceso: [],
            espera: [],
            resuelto: []
        };

        requests.forEach(request => {
            if (grouped[request.status]) {
                grouped[request.status].push(request);
            }
        });

        Object.keys(columns).forEach(status => {
            const container = $(columns[status]);
            const counter = $(counters[status]);

            if (counter) {
                counter.textContent = grouped[status].length;
            }

            if (!container) return;

            if (grouped[status].length === 0) {
                const empty = document.createElement("div");
                empty.className = "kanban-empty";

                const paragraph = document.createElement("p");
                paragraph.textContent = `No hay solicitudes ${statuses[status].toLowerCase()}s`;

                empty.appendChild(paragraph);
                container.appendChild(empty);
                return;
            }

            grouped[status].forEach(request => {
                container.appendChild(createCard(request));
            });
        });

        return grouped;
    }

    function initDragAndDrop() {
        document.querySelectorAll(".kanban-column").forEach(column => {
            const body = column.querySelector(".kanban-column__body");

            if (!body || body.dataset.dragInitialized === "true") {
                return;
            }

            body.dataset.dragInitialized = "true";

            body.addEventListener("dragover", event => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                body.classList.add("drag-over");
            });

            body.addEventListener("dragleave", event => {
                if (!body.contains(event.relatedTarget)) {
                    body.classList.remove("drag-over");
                }
            });

            body.addEventListener("drop", event => {
                event.preventDefault();
                body.classList.remove("drag-over");

                const id = event.dataTransfer.getData("text/plain");
                const status = column.dataset.status;

                if (!id || !statuses[status]) return;

                const request = window.Solicitudes.getById(id);

                if (!request || request.status === status) return;

                const updated = window.Solicitudes.changeStatus(id, status);

                if (!updated) {
                    window.AppUtils.toast(
                        "No se pudo cambiar el estado.",
                        "error"
                    );
                    return;
                }

                window.AppUtils.toast(
                    `Solicitud movida a ${statuses[status].toLowerCase()}.`
                );

                window.App.refresh();
            });
        });
    }

    function getCurrentRequests() {
        return currentRequests;
    }

    return {
        render,
        initDragAndDrop,
        getCurrentRequests
    };
})();
