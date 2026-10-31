"use strict";

window.Solicitudes = (() => {
    const { priorities, statuses } = window.AppUtils;

    function validate(data) {
        if (!data.studentName.trim()) {
            return "Escribe el nombre del alumno.";
        }

        if (!data.category || !window.Tipos.has(data.category)) {
            return "Selecciona un tipo de trámite válido.";
        }

        if (!data.description.trim()) {
            return "Escribe la descripción de la solicitud.";
        }

        if (!priorities[data.priority]) {
            return "Selecciona una prioridad válida.";
        }

        if (!statuses[data.status]) {
            return "Selecciona un estado válido.";
        }

        if (
            data.dueDate &&
            !/^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)
        ) {
            return "La fecha límite no es válida.";
        }

        return "";
    }

    function normalizeFormData(data) {
        return {
            studentName: String(data.studentName ?? ""),
            studentEnrollment: String(data.studentEnrollment ?? ""),
            category: String(data.category ?? ""),
            description: String(data.description ?? ""),
            assignee: String(data.assignee ?? ""),
            priority: String(data.priority ?? "normal"),
            dueDate: String(data.dueDate ?? ""),
            status: String(data.status ?? "pendiente"),
            notes: String(data.notes ?? "")
        };
    }

    function getAll() {
        return window.AppStorage.getAll();
    }

    function getById(id) {
        return window.AppStorage.findById(id);
    }

    function create(data) {
        const normalized = normalizeFormData(data);
        const error = validate(normalized);

        if (error) {
            window.AppUtils.toast(error, "error");
            return null;
        }

        return window.AppStorage.create(normalized);
    }

    function update(id, data) {
        const normalized = normalizeFormData(data);
        const error = validate(normalized);

        if (error) {
            window.AppUtils.toast(error, "error");
            return null;
        }

        const existing = getById(id);

        if (!existing) {
            window.AppUtils.toast(
                "La solicitud ya no existe.",
                "error"
            );
            return null;
        }

        return window.AppStorage.update(id, normalized);
    }

    function remove(id) {
        return window.AppStorage.remove(id);
    }

    function changeStatus(id, status) {
        if (!window.AppUtils.statuses[status]) {
            return false;
        }

        const request = getById(id);

        if (!request) return false;

        const updated = window.AppStorage.update(id, {
            ...request,
            status
        });

        return Boolean(updated);
    }

    function close(id) {
        const request = getById(id);

        if (!request) return null;

        return window.AppStorage.update(id, {
            ...request,
            status: "resuelto",
            closed: true,
            closedAt: new Date().toISOString()
        });
    }

    function reopen(id) {
        const request = getById(id);

        if (!request) return null;

        return window.AppStorage.update(id, {
            ...request,
            closed: false,
            closedAt: ""
        });
    }

    function search(filters = {}) {
        const requests = getAll();

        const query = String(filters.query ?? "")
            .trim()
            .toLocaleLowerCase("es-MX");

        const category = filters.category ?? "";
        const priority = filters.priority ?? "";
        const status = filters.status ?? "";

        return requests.filter(request => {
            const matchesQuery = !query || [
                request.studentName,
                request.studentEnrollment,
                request.folio
            ].some(value =>
                String(value ?? "")
                    .toLocaleLowerCase("es-MX")
                    .includes(query)
            );

            const matchesCategory =
                !category || request.category === category;

            const matchesPriority =
                !priority || request.priority === priority;

            const matchesStatus =
                !status || request.status === status;

            return matchesQuery &&
                matchesCategory &&
                matchesPriority &&
                matchesStatus;
        });
    }

    function getStats(requests = getAll()) {
        return {
            total: requests.length,
            pending: requests.filter(
                item => item.status === "pendiente"
            ).length,
            progress: requests.filter(
                item => item.status === "proceso"
            ).length,
            waiting: requests.filter(
                item => item.status === "espera"
            ).length,
            resolved: requests.filter(
                item => item.status === "resuelto"
            ).length
        };
    }

    return {
        getAll,
        getById,
        create,
        update,
        remove,
        changeStatus,
        close,
        reopen,
        search,
        getStats
    };
})();
