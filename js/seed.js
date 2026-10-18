"use strict";

/*
 * Datos de prueba (demo) para Control Escolar.
 * Se cargan SOLO si no existe ninguna solicitud guardada.
 * Para quitarlos: ejecuta AppSeed.clear() en la consola (F12) y recarga.
 */

window.AppSeed = (() => {
    const { STORAGE_KEY } = window.AppUtils;

    const demoRequests = [
        {
            id: "demo-001",
            folio: "CE-104582-A7K2P",
            studentName: "María Fernanda López Rubio",
            studentEnrollment: "21A0456",
            category: "cartas",
            description: "Solicitud de carta de constancia de estudios para trámite de beca.",
            assignee: "Lic. Ana María Valdez",
            priority: "normal",
            dueDate: "2026-10-25",
            status: "pendiente",
            notes: "Pendiente recoger firma del director.",
            createdAt: "2026-10-12T15:30:00.000Z",
            updatedAt: "2026-10-12T15:30:00.000Z"
        },
        {
            id: "demo-002",
            folio: "CE-104613-B3M9X",
            studentName: "Juan Carlos Ochoa Sandoval",
            studentEnrollment: "22A1189",
            category: "correcciones",
            description: "Corrección de apellido en el acta de nacimiento registrada en el sistema.",
            assignee: "Lic. Roberto Estrada",
            priority: "alta",
            dueDate: "2026-10-20",
            status: "pendiente",
            notes: "Solicitar acta corregida al registro civil.",
            createdAt: "2026-10-13T17:05:00.000Z",
            updatedAt: "2026-10-13T17:05:00.000Z"
        },
        {
            id: "demo-003",
            folio: "CE-104655-K8T4R",
            studentName: "Andrea Elizabeth Medina Ruiz",
            studentEnrollment: "20A7732",
            category: "desfase",
            description: "Revisión de desfase académico por materias de servicio social no acreditadas.",
            assignee: "Lic. Ana María Valdez",
            priority: "urgente",
            dueDate: "2026-10-14",
            status: "pendiente",
            notes: "Estatus vencido, priorizar con jefatura de departamento.",
            createdAt: "2026-10-05T13:20:00.000Z",
            updatedAt: "2026-10-05T13:20:00.000Z"
        },
        {
            id: "demo-004",
            folio: "CE-104690-C5N2W",
            studentName: "Luis Ángel Castro Villanueva",
            studentEnrollment: "23A0098",
            category: "recibos",
            description: "Reimpresión de comprobante de pago de inscripción del periodo agosto-diciembre.",
            assignee: "Lic. Patricia Gómez",
            priority: "baja",
            dueDate: "2026-10-28",
            status: "proceso",
            notes: "Validando pago en tesorería.",
            createdAt: "2026-10-10T16:45:00.000Z",
            updatedAt: "2026-10-15T11:10:00.000Z"
        },
        {
            id: "demo-005",
            folio: "CE-104701-F2Q8J",
            studentName: "Brenda Nayeli Espinoza Ayala",
            studentEnrollment: "21A3344",
            category: "especial",
            description: "Caso especial: solicitud de aplazamiento de examen final por enfermedad.",
            assignee: "Lic. Roberto Estrada",
            priority: "urgente",
            dueDate: "2026-10-18",
            status: "proceso",
            notes: "Recibido justificante médico, en espera de dictamen.",
            createdAt: "2026-10-14T14:00:00.000Z",
            updatedAt: "2026-10-16T09:25:00.000Z"
        },
        {
            id: "demo-006",
            folio: "CE-104733-H9V6D",
            studentName: "Diego Armando Valenzuela Loera",
            studentEnrollment: "22A5567",
            category: "cartas",
            description: "Carta de liberación de servicio social para empresa externa.",
            assignee: "Lic. Patricia Gómez",
            priority: "normal",
            dueDate: "2026-11-02",
            status: "espera",
            notes: "Esperando carta del supervisor de la empresa.",
            createdAt: "2026-10-08T12:15:00.000Z",
            updatedAt: "2026-10-14T10:40:00.000Z"
        },
        {
            id: "demo-007",
            folio: "CE-104748-L4Z1S",
            studentName: "Karla Sofía Ramos Beltrán",
            studentEnrollment: "20A2211",
            category: "otro",
            description: "Solicitud de constancia de promedio general para concurso de oposición.",
            assignee: "Lic. Ana María Valdez",
            priority: "normal",
            dueDate: "2026-10-30",
            status: "espera",
            notes: "Alumno solicita entrega en ventanilla única.",
            createdAt: "2026-10-11T09:35:00.000Z",
            updatedAt: "2026-10-13T16:20:00.000Z"
        },
        {
            id: "demo-008",
            folio: "CE-104772-M7P3G",
            studentName: "José Emiliano Aguirre Navarro",
            studentEnrollment: "19A9900",
            category: "correcciones",
            description: "Corrección de matrícula duplicada en el registro escolar.",
            assignee: "Lic. Roberto Estrada",
            priority: "alta",
            dueDate: "2026-10-10",
            status: "resuelto",
            notes: "Matrícula unificada con sistemas, caso cerrado.",
            createdAt: "2026-09-28T15:10:00.000Z",
            updatedAt: "2026-10-09T12:00:00.000Z"
        },
        {
            id: "demo-009",
            folio: "CE-104790-N1R5B",
            studentName: "Ana Lucía Mercado Zavala",
            studentEnrollment: "23A4412",
            category: "recibos",
            description: "Descuento por pago duplicado de colegiatura revisado y aplicado.",
            assignee: "Lic. Patricia Gómez",
            priority: "normal",
            dueDate: "2026-10-08",
            status: "resuelto",
            notes: "Reembolso aplicado en tesorería.",
            closed: true,
            closedAt: "2026-10-07T17:30:00.000Z",
            createdAt: "2026-09-30T11:25:00.000Z",
            updatedAt: "2026-10-07T17:30:00.000Z"
        },
        {
            id: "demo-010",
            folio: "CE-104815-Q6W9F",
            studentName: "Ricardo Andrés Soto Ibarra",
            studentEnrollment: "21A8877",
            category: "desfase",
            description: "Acreditación de materias por cambio de plan de estudios.",
            assignee: "Lic. Ana María Valdez",
            priority: "baja",
            dueDate: "2026-09-30",
            status: "resuelto",
            notes: "Equivalencias cargadas en el sistema.",
            createdAt: "2026-09-20T10:05:00.000Z",
            updatedAt: "2026-09-29T13:15:00.000Z"
        }
    ];

    function seed() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const existing = raw ? JSON.parse(raw) : [];

            if (Array.isArray(existing) && existing.length > 0) {
                return; // Ya hay datos reales: no se cargan los de prueba.
            }

            const payload = demoRequests.map(item => ({
                ...item,
                closed: Boolean(item.closed),
                closedAt: item.closedAt || ""
            }));

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(payload)
            );
        } catch (error) {
            console.error("Error al cargar datos de prueba:", error);
        }
    }

    function clear() {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    }

    return { seed, clear, demoRequests };
})();

window.AppSeed.seed();
