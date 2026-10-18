"use strict";

window.AppUtils = (() => {
    const STORAGE_KEY = "controlEscolarSolicitudes";

    const categories = {
        cartas: "Cartas y constancias",
        correcciones: "Corrección de datos",
        desfase: "Desfase académico",
        recibos: "Recibos y pagos",
        especial: "Casos especiales",
        otro: "Otros trámites"
    };

    const priorities = {
        urgente: "Urgente",
        alta: "Alta",
        normal: "Normal",
        baja: "Baja"
    };

    const statuses = {
        pendiente: "Pendiente",
        proceso: "En proceso",
        espera: "En espera",
        resuelto: "Resuelto"
    };

    function $(selector, parent = document) {
        return parent.querySelector(selector);
    }

    function formatDate(dateString) {
        if (!dateString) return "Sin fecha límite";

        const date = new Date(`${dateString}T12:00:00`);

        if (Number.isNaN(date.getTime())) {
            return "Fecha no válida";
        }

        return new Intl.DateTimeFormat("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(date);
    }

    function todayString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function generateId() {
        if (window.crypto?.randomUUID) {
            return window.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function generateFolio() {
        const random = Math.random().toString(36)
            .slice(2, 7).toUpperCase();

        return `CE-${Date.now().toString().slice(-6)}-${random}`;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    let toastTimer;

    function toast(message, type = "success") {
        const element = $("#toast");

        if (!element) return;

        clearTimeout(toastTimer);

        element.textContent = message;
        element.className = "toast";

        if (type === "success") {
            element.classList.add("toast--success");
        } else if (type === "error") {
            element.classList.add("toast--error");
        }

        element.classList.add("show");

        toastTimer = setTimeout(() => {
            element.classList.remove("show");
        }, 3000);
    }

    function isOverdue(dateString, status) {
        return Boolean(
            dateString &&
            dateString < todayString() &&
            status !== "resuelto"
        );
    }

    function formatCurrentDate() {
        return new Intl.DateTimeFormat("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(new Date());
    }

    return {
        STORAGE_KEY,
        categories,
        priorities,
        statuses,
        $,
        formatDate,
        todayString,
        generateId,
        generateFolio,
        escapeHTML,
        toast,
        isOverdue,
        formatCurrentDate
    };
})();
