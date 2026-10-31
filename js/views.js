"use strict";

window.Views = (() => {
    const {
        $,
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
                <td>${escapeHTML(window.Tipos.nameOf(request.category))}</td>
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
        const total = requests.length;

        grid.replaceChildren();

        window.Tipos.getAll().forEach(({ key, name: label }) => {
            const items = requests.filter(
                request => request.category === key
            );
            const count = items.length;
            const percent = total
                ? Math.round((count / total) * 100)
                : 0;

            const byStatus = Object.keys(statuses).map(status => ({
                status,
                count: items.filter(item => item.status === status).length
            }));

            const segments = count
                ? byStatus
                    .filter(entry => entry.count > 0)
                    .map(entry => `
                        <span class="catalog-card__segment catalog-card__segment--${entry.status}"
                            style="width: ${(entry.count / count) * 100}%"></span>
                    `).join("")
                : "";

            const legend = byStatus
                .filter(entry => entry.count > 0)
                .map(entry => `
                    <span>
                        <i class="catalog-card__dot catalog-card__dot--${entry.status}"></i>
                        ${escapeHTML(statuses[entry.status])}: ${entry.count}
                    </span>
                `).join("");

            const card = document.createElement("article");
            card.className = "catalog-card";

            card.innerHTML = `
                <div class="catalog-card__head">
                    <span class="catalog-card__icon">◫</span>
                    <span class="catalog-card__percent">${percent}% del total</span>
                </div>

                <h3>${escapeHTML(label)}</h3>

                <div class="catalog-card__count">
                    <strong>${count}</strong>
                    <span>solicitudes registradas</span>
                </div>

                <div class="catalog-card__bar" aria-hidden="true">${segments}</div>

                <div class="catalog-card__legend">
                    ${legend || "<span>Sin solicitudes registradas</span>"}
                </div>

                <div class="catalog-card__actions">
                    <button type="button" class="button button--secondary button--sm"
                        data-category-view="${escapeHTML(key)}">
                        Ver solicitudes
                    </button>
                    <button type="button" class="button button--primary button--sm"
                        data-category-new="${escapeHTML(key)}">
                        + Nueva
                    </button>
                </div>
            `;

            card.querySelector("[data-category-view]").addEventListener("click", () => {
                window.App.filterByCategory(key);
            });

            card.querySelector("[data-category-new]").addEventListener("click", () => {
                window.App.openNewModal("pendiente", key);
            });

            grid.appendChild(card);
        });
    }

    /* ---------------- Reportes ---------------- */

    function renderReports() {
        const grid = $("#reportGrid");
        const kpis = $("#reportStats");

        if (!grid) return;

        const requests = window.Solicitudes.getAll();
        const total = requests.length;
        const denominator = total || 1;

        const overdue = requests.filter(request =>
            isOverdue(request.dueDate, request.status)
        ).length;

        const closed = requests.filter(request => request.closed).length;

        const closeTimes = requests
            .filter(request => request.closed && request.closedAt && request.createdAt)
            .map(request =>
                (new Date(request.closedAt) - new Date(request.createdAt)) / 86400000
            )
            .filter(days => Number.isFinite(days) && days >= 0);

        const averageDays = closeTimes.length
            ? Math.round(
                closeTimes.reduce((sum, days) => sum + days, 0) / closeTimes.length
            )
            : null;

        if (kpis) {
            kpis.replaceChildren();

            [
                {
                    label: "Total de solicitudes",
                    icon: "▤",
                    value: String(total),
                    description: "Expedientes registrados"
                },
                {
                    label: "Vencidas",
                    icon: "⚠",
                    value: String(overdue),
                    description: "Fuera de su fecha límite"
                },
                {
                    label: "Cerradas",
                    icon: "🗄",
                    value: String(closed),
                    description: "Casos finalizados y cerrados"
                },
                {
                    label: "Cierre promedio",
                    icon: "⏱",
                    value: averageDays === null ? "—" : `${averageDays} d`,
                    description: "Días de creación a cierre"
                }
            ].forEach(item => kpis.appendChild(buildStatCard(item)));
        }

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

        const byCategory = window.Tipos.getAll().map(tipo => ({
            key: tipo.key,
            label: tipo.name,
            count: requests.filter(item => item.category === tipo.key).length
        }));

        const byAssignee = Object.entries(
            requests.reduce((acc, request) => {
                const label = request.assignee?.trim() || "Sin responsable";
                acc[label] = (acc[label] || 0) + 1;
                return acc;
            }, {})
        )
            .map(([label, count]) => ({ key: label, label, count }))
            .sort((a, b) => b.count - a.count);

        grid.replaceChildren();

        grid.appendChild(
            buildBarChart("Solicitudes por estado", byStatus, denominator, "status")
        );
        grid.appendChild(
            buildBarChart("Solicitudes por prioridad", byPriority, denominator, "priority")
        );
        grid.appendChild(
            buildBarChart("Solicitudes por trámite", byCategory, denominator, "category")
        );
        grid.appendChild(
            buildBarChart("Solicitudes por responsable", byAssignee, denominator, null)
        );
    }

    function buildStatCard({ label, icon, value, description }) {
        const card = document.createElement("article");
        card.className = "stat-card";

        card.innerHTML = `
            <div class="stat-card__top">
                <span>${escapeHTML(label)}</span>
                <span>${escapeHTML(icon)}</span>
            </div>
            <strong>${escapeHTML(value)}</strong>
            <span class="stat-card__description">${escapeHTML(description)}</span>
        `;

        return card;
    }

    function buildBarChart(title, items, total, type) {
        const card = document.createElement("article");
        card.className = "report-card";

        const rows = items.map(item => {
            const percent = Math.round((item.count / total) * 100);

            // Sin "type" la barra usa el color primario por defecto
            // (útil para valores libres como nombres de responsables).
            const fillClass = type
                ? `bar__fill bar__fill--${type}-${escapeHTML(item.key)}`
                : "bar__fill";

            return `
                <div class="bar-row">
                    <div class="bar-row__label">
                        <span>${escapeHTML(item.label)}</span>
                        <strong>${item.count} · ${percent}%</strong>
                    </div>
                    <div class="bar">
                        <div class="${fillClass}"
                            style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
        }).join("");

        card.innerHTML = `
            <h3>${escapeHTML(title)}</h3>
            ${rows || `<p class="report-card__empty">Aún no hay datos para mostrar.</p>`}
        `;

        return card;
    }

    /* ---------------- Paginación ---------------- */

    function renderPagination({ container, page, total, onChange }) {
        const element = $(container);

        if (!element) return;

        element.replaceChildren();
        element.hidden = total <= 1;

        if (total <= 1) return;

        const previous = document.createElement("button");
        previous.type = "button";
        previous.className = "table-pagination__btn";
        previous.textContent = "← Anterior";
        previous.disabled = page <= 1;
        previous.addEventListener("click", () => onChange(page - 1));

        const info = document.createElement("span");
        info.className = "table-pagination__info";
        info.textContent = `Página ${page} de ${total}`;

        const next = document.createElement("button");
        next.type = "button";
        next.className = "table-pagination__btn";
        next.textContent = "Siguiente →";
        next.disabled = page >= total;
        next.addEventListener("click", () => onChange(page + 1));

        element.append(previous, info, next);
    }

    return {
        renderTable,
        renderPagination,
        renderCatalog,
        renderReports
    };
})();
