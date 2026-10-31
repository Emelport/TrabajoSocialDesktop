"use strict";

/*
 * Catálogo de tipos de trámite.
 * Se guarda en localStorage y alimenta los filtros, el modal de
 * solicitudes, el kanban, los reportes y la exportación.
 * Cada tipo puede requerir documentos y llevar su propia lista.
 */

window.Tipos = (() => {
    const {
        $,
        escapeHTML,
        toast,
        categories: defaultCategories
    } = window.AppUtils;

    const STORAGE_KEY = "controlEscolarTiposTramite";

    // Metadatos de los 6 trámites de fábrica.
    const DEFAULT_META = {
        cartas: {
            description: "Cartas, constancias y oficios escolares",
            requiresDocuments: false,
            documents: []
        },
        correcciones: {
            description: "Corrección de datos personales del alumno",
            requiresDocuments: true,
            documents: [
                "Acta de nacimiento original",
                "Identificación oficial del alumno"
            ]
        },
        desfase: {
            description: "Revisión de desfase académico",
            requiresDocuments: true,
            documents: [
                "Kardex impreso",
                "Comprobante de inscripción"
            ]
        },
        recibos: {
            description: "Recibos, pagos y comprobantes",
            requiresDocuments: false,
            documents: []
        },
        especial: {
            description: "Casos que requieren revisión especial",
            requiresDocuments: true,
            documents: [
                "Documentación del caso",
                "Informe del área solicitante"
            ]
        },
        otro: {
            description: "Otros trámites no clasificados",
            requiresDocuments: false,
            documents: []
        }
    };

    /* Normaliza una lista de documentos: quita vacíos y duplicados. */
    function normalizeDocs(list) {
        if (!Array.isArray(list)) {
            return [];
        }

        const seen = new Set();
        const result = [];

        list.forEach(item => {
            const text = String(item ?? "").trim();
            const lower = text.toLocaleLowerCase("es-MX");

            if (text && !seen.has(lower)) {
                seen.add(lower);
                result.push(text);
            }
        });

        return result;
    }

    function buildDefaults() {
        const createdAt = new Date().toISOString();

        return Object.entries(defaultCategories).map(([key, name]) => ({
            key,
            name,
            description: DEFAULT_META[key]?.description ?? "",
            requiresDocuments: Boolean(
                DEFAULT_META[key]?.requiresDocuments
            ),
            documents: [...(DEFAULT_META[key]?.documents ?? [])],
            createdAt
        }));
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (raw) {
                const data = JSON.parse(raw);

                if (Array.isArray(data) && data.length > 0) {
                    return data
                        .filter(item =>
                            item &&
                            typeof item === "object" &&
                            typeof item.key === "string" &&
                            typeof item.name === "string"
                        )
                        .map(item => ({
                            ...item,
                            requiresDocuments: Boolean(
                                item.requiresDocuments
                            ),
                            documents: normalizeDocs(item.documents)
                        }));
                }
            }
        } catch (error) {
            console.error("Error al leer el catálogo de trámites:", error);
        }

        const defaults = buildDefaults();

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        } catch (error) {
            console.error("Error al sembrar el catálogo de trámites:", error);
        }

        return defaults;
    }

    let tipos = load();

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tipos));
            return true;
        } catch (error) {
            console.error("Error al guardar el catálogo:", error);
            toast(
                "No se pudo guardar el catálogo de trámites.",
                "error"
            );
            return false;
        }
    }

    /* ---------------- Consultas ---------------- */

    function getAll() {
        return [...tipos];
    }

    function getMap() {
        return Object.fromEntries(
            tipos.map(tipo => [tipo.key, tipo.name])
        );
    }

    function nameOf(key) {
        return tipos.find(tipo => tipo.key === key)?.name
            || "Otro trámite";
    }

    function has(key) {
        return tipos.some(tipo => tipo.key === key);
    }

    function getDefaultKey() {
        return tipos[0]?.key || "";
    }

    /* Lista de documentos que el alumno debe entregar para un tipo. */
    function documentsOf(key) {
        const tipo = tipos.find(item => item.key === key);

        if (!tipo || !tipo.requiresDocuments) {
            return [];
        }

        return [...tipo.documents];
    }

    function usedCount(key) {
        return window.Solicitudes.getAll().filter(
            request => request.category === key
        ).length;
    }

    /* ---------------- Alta y edición ---------------- */

    function slugify(name) {
        return String(name)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40) || "tramite";
    }

    function uniqueKey(base) {
        let key = base;
        let suffix = 2;

        while (has(key)) {
            key = `${base}-${suffix}`;
            suffix += 1;
        }

        return key;
    }

    function validateName(name, ignoreKey = "") {
        const trimmed = String(name ?? "").trim();

        if (!trimmed) {
            return { error: "Escribe el nombre del trámite." };
        }

        const duplicated = tipos.some(tipo =>
            tipo.key !== ignoreKey &&
            tipo.name.toLocaleLowerCase("es-MX") ===
                trimmed.toLocaleLowerCase("es-MX")
        );

        if (duplicated) {
            return {
                error: "Ya existe un tipo de trámite con ese nombre."
            };
        }

        return { name: trimmed };
    }

    function buildFields(data) {
        const requiresDocuments = Boolean(data.requiresDocuments);

        return {
            description: String(data.description ?? "").trim(),
            requiresDocuments,
            documents: requiresDocuments
                ? normalizeDocs(data.documents)
                : []
        };
    }

    function create(data) {
        const checked = validateName(data.name);

        if (checked.error) {
            return { ok: false, error: checked.error };
        }

        const tipo = {
            key: uniqueKey(slugify(checked.name)),
            name: checked.name,
            ...buildFields(data),
            createdAt: new Date().toISOString()
        };

        tipos.push(tipo);

        if (!save()) {
            tipos.pop();
            return { ok: false, error: "No se pudo guardar el tipo." };
        }

        return { ok: true, tipo };
    }

    function update(key, data) {
        const index = tipos.findIndex(tipo => tipo.key === key);

        if (index === -1) {
            return { ok: false, error: "El tipo de trámite no existe." };
        }

        const checked = validateName(data.name, key);

        if (checked.error) {
            return { ok: false, error: checked.error };
        }

        tipos[index] = {
            ...tipos[index],
            name: checked.name,
            ...buildFields(data)
        };

        if (!save()) {
            return { ok: false, error: "No se pudo guardar el tipo." };
        }

        return { ok: true, tipo: tipos[index] };
    }

    function remove(key) {
        const used = usedCount(key);

        if (used > 0) {
            return {
                ok: false,
                used,
                error: `No se puede eliminar: ${used} solicitud(es) usan este tipo.`
            };
        }

        const index = tipos.findIndex(tipo => tipo.key === key);

        if (index === -1) {
            return { ok: false, error: "El tipo de trámite no existe." };
        }

        const [removed] = tipos.splice(index, 1);

        if (!save()) {
            tipos.splice(index, 0, removed);
            return { ok: false, error: "No se pudo guardar el cambio." };
        }

        return { ok: true, tipo: removed };
    }

    /* ---------------- Sincronía con los selects ---------------- */

    function fillOptions(select, types, includeEmpty) {
        const current = select.value;
        const emptyOption = includeEmpty
            ? `<option value="">Todos los trámites</option>`
            : "";

        select.innerHTML = emptyOption + types.map(tipo =>
            `<option value="${escapeHTML(tipo.key)}">${escapeHTML(tipo.name)}</option>`
        ).join("");

        if (types.some(tipo => tipo.key === current)) {
            select.value = current;
        }
    }

    function syncSelects() {
        const all = getAll();

        const filters = [
            $("#filterCategory"),
            $("#solFilterCategory")
        ].filter(Boolean);

        filters.forEach(select => fillOptions(select, all, true));

        const modalSelect = $("#requestCategory");

        if (modalSelect) {
            fillOptions(modalSelect, all, false);
        }
    }

    /* ---------------- Tabla del catálogo ---------------- */

    function docsCell(tipo) {
        const chip = `
            <span class="docs-chip ${tipo.requiresDocuments ? "docs-chip--yes" : "docs-chip--no"}">
                ${tipo.requiresDocuments ? "Requiere documentos" : "No requiere"}
            </span>
        `;

        if (!tipo.requiresDocuments) {
            return chip;
        }

        const docs = tipo.documents.length > 0
            ? tipo.documents
            : ["Sin documentos definidos"];

        return chip + `
            <ul class="docs-cell">
                ${docs.map(doc => `<li>${escapeHTML(doc)}</li>`).join("")}
            </ul>
        `;
    }

    function renderTable() {
        const body = $("#tiposTableBody");

        if (!body) return;

        const empty = $("#tiposEmpty");
        const requests = window.Solicitudes.getAll();

        body.replaceChildren();

        if (empty) {
            empty.hidden = tipos.length > 0;
        }

        tipos.forEach(tipo => {
            const used = requests.filter(
                request => request.category === tipo.key
            ).length;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <strong>${escapeHTML(tipo.name)}</strong>
                    <span class="data-table__sub">${escapeHTML(tipo.key)}</span>
                </td>
                <td>${escapeHTML(tipo.description || "Sin descripción")}</td>
                <td>${docsCell(tipo)}</td>
                <td>${used}</td>
                <td>
                    <div class="data-table__actions">
                        <button type="button" class="button button--secondary button--sm"
                            data-edit-tipo="${escapeHTML(tipo.key)}">
                            Editar
                        </button>
                        <button type="button" class="button button--danger button--sm"
                            data-delete-tipo="${escapeHTML(tipo.key)}">
                            Eliminar
                        </button>
                    </div>
                </td>
            `;

            row.querySelector("[data-edit-tipo]").addEventListener(
                "click",
                () => openEdit(tipo.key)
            );

            row.querySelector("[data-delete-tipo]").addEventListener(
                "click",
                () => handleDelete(tipo.key)
            );

            body.appendChild(row);
        });
    }

    /* ---------------- Lista de documentos (borrador en el modal) ---------------- */

    let draftDocs = [];

    function toggleDocsSection() {
        const section = $("#tipoDocsSection");

        if (section) {
            section.hidden = !$("#tipoRequiresDocs").checked;
        }
    }

    function renderDocsList() {
        const list = $("#tipoDocsList");

        if (!list) return;

        list.replaceChildren();

        if (draftDocs.length === 0) {
            const message = document.createElement("p");
            message.className = "docs-list__empty";
            message.textContent = "Aún no hay documentos en la lista.";
            list.appendChild(message);
            return;
        }

        draftDocs.forEach((doc, index) => {
            const item = document.createElement("div");
            item.className = "docs-item";

            const text = document.createElement("span");
            text.textContent = doc;

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "docs-item__remove";
            removeBtn.setAttribute("aria-label", `Quitar ${doc}`);
            removeBtn.textContent = "×";
            removeBtn.addEventListener("click", () => {
                draftDocs.splice(index, 1);
                renderDocsList();
            });

            item.append(text, removeBtn);
            list.appendChild(item);
        });
    }

    function addDraftDoc() {
        const input = $("#tipoDocInput");
        const text = String(input?.value ?? "").trim();
        const lower = text.toLocaleLowerCase("es-MX");

        if (!text) return;

        if (draftDocs.some(doc => doc.toLocaleLowerCase("es-MX") === lower)) {
            toast("Ese documento ya está en la lista.", "error");
            return;
        }

        draftDocs.push(text);

        if (input) {
            input.value = "";
            input.focus();
        }

        renderDocsList();
    }

    /* ---------------- Modal ---------------- */

    function openModal(tipo = null) {
        $("#tipoKey").value = tipo?.key || "";
        $("#tipoName").value = tipo?.name || "";
        $("#tipoDescription").value = tipo?.description || "";
        $("#tipoRequiresDocs").checked = Boolean(tipo?.requiresDocuments);

        draftDocs = tipo ? [...tipo.documents] : [];

        toggleDocsSection();
        renderDocsList();

        $("#tipoModalTitle").textContent = tipo
            ? "Editar tipo de trámite"
            : "Nuevo tipo de trámite";

        $("#tipoModal").showModal();

        $("#tipoName").focus();
    }

    function openEdit(key) {
        const tipo = tipos.find(item => item.key === key);

        if (!tipo) return;

        openModal(tipo);
    }

    function closeModal() {
        const modal = $("#tipoModal");

        if (modal?.open) {
            modal.close();
        }
    }

    function handleSubmit(event) {
        event.preventDefault();

        const key = $("#tipoKey").value;

        const data = {
            name: $("#tipoName").value,
            description: $("#tipoDescription").value,
            requiresDocuments: $("#tipoRequiresDocs").checked,
            documents: [...draftDocs]
        };

        const result = key
            ? update(key, data)
            : create(data);

        if (!result.ok) {
            toast(result.error, "error");
            return;
        }

        closeModal();

        toast(
            key
                ? "Tipo de trámite actualizado."
                : "Tipo de trámite agregado al catálogo."
        );

        refreshAll();
    }

    function handleDelete(key) {
        const tipo = tipos.find(item => item.key === key);

        if (!tipo) return;

        const confirmed = window.confirm(
            `¿Eliminar el tipo de trámite "${tipo.name}"? Esta acción no se puede deshacer.`
        );

        if (!confirmed) return;

        const result = remove(key);

        if (!result.ok) {
            toast(result.error, "error");
            return;
        }

        toast("Tipo de trámite eliminado del catálogo.");

        refreshAll();
    }

    function refreshAll() {
        renderTable();
        syncSelects();
        window.App?.refresh();
    }

    /* ---------------- Inicialización ---------------- */

    function initUI() {
        renderTable();
        syncSelects();

        $("#newTipoBtn")?.addEventListener(
            "click",
            () => openModal()
        );

        $("#tipoForm")?.addEventListener("submit", handleSubmit);

        $("#cancelTipoBtn")?.addEventListener("click", closeModal);
        $("#closeTipoModalBtn")?.addEventListener("click", closeModal);

        $("#tipoModal")?.addEventListener("click", event => {
            if (event.target === $("#tipoModal")) {
                closeModal();
            }
        });

        $("#tipoRequiresDocs")?.addEventListener("change", () => {
            toggleDocsSection();

            if ($("#tipoRequiresDocs").checked) {
                renderDocsList();
                $("#tipoDocInput")?.focus();
            }
        });

        $("#addTipoDocBtn")?.addEventListener("click", addDraftDoc);

        $("#tipoDocInput")?.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                addDraftDoc();
            }
        });
    }

    document.addEventListener("DOMContentLoaded", initUI);

    return {
        getAll,
        getMap,
        nameOf,
        has,
        getDefaultKey,
        documentsOf,
        usedCount,
        create,
        update,
        remove,
        renderTable,
        syncSelects
    };
})();
