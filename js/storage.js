"use strict";

window.AppStorage = (() => {
    const { STORAGE_KEY, generateId, generateFolio } = window.AppUtils;

    function getAll() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (!raw) return [];

            const data = JSON.parse(raw);

            if (!Array.isArray(data)) return [];

            return data.filter(item =>
                item &&
                typeof item === "object" &&
                typeof item.id === "string"
            );
        } catch (error) {
            console.error("Error al leer las solicitudes:", error);
            return [];
        }
    }

    function saveAll(requests) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
            return true;
        } catch (error) {
            console.error("Error al guardar las solicitudes:", error);
            window.AppUtils.toast(
                "No se pudieron guardar los datos. Revisa el almacenamiento del navegador.",
                "error"
            );
            return false;
        }
    }

    function create(data) {
        const requests = getAll();

        const request = {
            id: generateId(),
            folio: generateFolio(),
            studentName: data.studentName.trim(),
            studentEnrollment: data.studentEnrollment.trim(),
            category: data.category,
            description: data.description.trim(),
            assignee: data.assignee.trim(),
            priority: data.priority,
            dueDate: data.dueDate,
            status: data.status,
            notes: data.notes.trim(),
            closed: false,
            closedAt: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        requests.unshift(request);

        return saveAll(requests) ? request : null;
    }

    function update(id, data) {
        const requests = getAll();
        const index = requests.findIndex(item => item.id === id);

        if (index === -1) return null;

        requests[index] = {
            ...requests[index],
            studentName: data.studentName.trim(),
            studentEnrollment: data.studentEnrollment.trim(),
            category: data.category,
            description: data.description.trim(),
            assignee: data.assignee.trim(),
            priority: data.priority,
            dueDate: data.dueDate,
            status: data.status,
            notes: data.notes.trim(),
            closed: Boolean(
                data.closed ?? requests[index].closed
            ),
            closedAt: String(
                data.closedAt ?? requests[index].closedAt ?? ""
            ),
            updatedAt: new Date().toISOString()
        };

        return saveAll(requests) ? requests[index] : null;
    }

    function remove(id) {
        const requests = getAll();
        const filtered = requests.filter(item => item.id !== id);

        if (filtered.length === requests.length) {
            return false;
        }

        return saveAll(filtered);
    }

    function findById(id) {
        return getAll().find(item => item.id === id) || null;
    }

    return {
        getAll,
        saveAll,
        create,
        update,
        remove,
        findById
    };
})();
