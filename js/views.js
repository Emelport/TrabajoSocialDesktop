"use strict";

window.Views = (() => {
    const {
        $,
        categories,
        priorities,
        statuses,
        escapeHTML,
        formatDate,
        isOverdue
    } = window.AppUtils;

    /* ---------------- Listado en tabla ---------------- */

    function renderTable(requests, options = {}) {
        const body = $(options.body || "#solicitudesTableBody");
        const empty = $(options.empty || "#solicitudesEmpty");

        if (!body) return;

        body.replaceChildren();

        if (empty) {
            empty.hidden = requests.length > 0;
        }

        requests.forEach(request => {
            const row = document.createElement("tr");
            const overdue = isOverdue(request.dueDate, request.status);
            const closed = Boolean(request.closed);

            const stateChip = closed
                ? `<span class="status-chip status-chip--cerrada">Cerrada</span>`
                : `<span class="status-chip status-chip--${escapeHTML(request.status)}">
                        ${escapeHTML(statuses[request.status] || request.status)}
                   </span>`;

            const toggleButton = closed
                ? `<button type="button" class="button button--secondary button--sm"
                        data-reopen-id="${escapeHTML(request.id)}">
                        Reabrir
                   </button>`
                : `<button type="button" class="button button--secondary button--sm"
                        data-close-id="${escapeHTML(request.id)}">
                        Cerrar
                   </button>`;

            row.innerHTML = `
                <td>
                    <span class="request-card__folio">
                        ${escapeHTML(request.folio)}
                    </span>
                </td>
                <td>
                    <strong>${escapeHTML(request.studentName)}</strong>
                    <span class="data-table__sub">
                        ${escapeHTML(request.studentEnrollment || "Sin matrícula")}
                    </span>
                </td>
                <td>${escapeHTML(categories[request.category] || "Otro trámite")}</td>
                <td>
                    <span class="priority-badge priority-badge--${escapeHTML(request.priority)}">
                        ${escapeHTML(priorities[request.priority] || "Normal")}
                    </span>
                </td>
                <td>${stateChip}</td>
                <td>${escapeHTML(request.assignee || "Sin responsable")}</td>
                <td class="${overdue && !closed ? "data-table__overdue" : ""}">
                    ${escapeHTML(formatDate(request.dueDate))}
                </td>
                <td>
                    <div class="data-table__actions">
                        <button type="button" class="button button--secondary button--sm"
                            data-edit-id="${escapeHTML(request.id)}">
                            Editar
                        </button>
                        ${toggleButton}
                    </div>
                </td>
            `;

            row.querySelector("[data-edit-id]").addEventListener("click", () => {
                window.App.openEditModal(request.id);
            });

            const closeBtn = row.querySelector("[data-close-id]");
            const reopenBtn = row.querySelector("[data-reopen-id]");

            if (closeBtn) {
                closeBtn.addEventListener("click", () => {
                    window.App.closeRequest(request.id);
                });
            }

            if (reopenBtn) {
                reopenBtn.addEventListener("click", () => {
                    window.App.reopenRequest(request.id);
                });
            }

            body.appendChild(row);
        });
    }

    /* ---------------- Catálogo de trámites ---------------- */

    function renderCatalog() {
        const grid = $("#catalogGrid");

        if (!grid) return;

        const requests = window.Solicitudes.getAll();

        grid.replaceChildren();

        Object.entries(categories).forEach(([key, label]) => {
            const count = requests.filter(
                request => request.category === key
            ).length;

            const card = document.createElement("article");
            card.className = "catalog-card";

            card.innerHTML = `
                <span class="catalog-card__icon">◫</span>
                <h3>${escapeHTML(label)}</h3>
                <strong>${count}</strong>
                <span>solicitudes registradas</span>
                <button type="button" class="button button--secondary button--sm"
                    data-category="${escapeHTML(key)}">
                    Ver en tablero
                </button>
            `;

            card.querySelector("[data-category]").addEventListener("click", () => {
                $("#filterCategory").value = key;
                window.App.navigate("tablero");
                window.App.refresh();
            });

            grid.appendChild(card);
        });
    }

    /* ---------------- Reportes ---------------- */

    function renderReports() {
        const grid = $("#reportGrid");

        if (!grid) return;

        const requests = window.Solicitudes.getAll();
        const total = requests.length || 1;

        const byStatus = Object.keys(statuses).map(key => ({
            key,
            label: statuses[key],
            count: requests.filter(item => item.status === key).length
        }));

        const byPriority = Object.keys(priorities).map(key => ({
            key,
            label: priorities[key],
            count: requests.filter(item => item.priority === key).length
        }));

        const byCategory = Object.entries(categories).map(([key, label]) => ({
            key,
            label,
            count: requests.filter(item => item.category === key).length
        }));

        grid.replaceChildren();

        grid.appendChild(
            buildBarChart("Solicitudes por estado", byStatus, total, "status")
        );
        grid.appendChild(
            buildBarChart("Solicitudes por prioridad", byPriority, total, "priority")
        );
        grid.appendChild(
            buildBarChart("Solicitudes por trámite", byCategory, total, "category")
        );
    }

    function buildBarChart(title, items, total, type) {
        const card = document.createElement("article");
        card.className = "report-card";

        const rows = items.map(item => {
            const percent = Math.round((item.count / total) * 100);

            return `
                <div class="bar-row">
                    <div class="bar-row__label">
                        <span>${escapeHTML(item.label)}</span>
                        <strong>${item.count}</strong>
                    </div>
                    <div class="bar">
                        <div class="bar__fill bar__fill--${type}-${escapeHTML(item.key)}"
                            style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
        }).join("");

        card.innerHTML = `
            <h3>${escapeHTML(title)}</h3>
            ${rows}
        `;

        return card;
    }

    return {
        renderTable,
        renderCatalog,
        renderReports
    };
})();
