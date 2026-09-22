# Jira Board Clone - Resumen Técnico y Guía Rápida

> **Versión**: 3.4.0  
> **Estado**: Producción / Desplegado en Vercel & Firebase Cloud Firestore  
> **Autor Principal / Project Manager**: Robinson Meza (`RobinsonAmeza@gmail.com`)  
> **Estilo de Diseño**: Brutalismo Industrial (Industrial Brutalist UI)  
> **Arquitectura**: Full-Stack (React 18 + Vite + Tailwind CSS + Node.js/Express + Amazon Bedrock + NVIDIA NIM + Google GenAI + Cloud Firestore)

---

## 1. Novedades de la Versión 3.4.0

1. **Diseño Visual: Brutalismo Industrial Completo**:
   - Transición integral a un estilo visual técnico de alto impacto: bordes mecánicos negros (`border-2` y `border-4`), sombras duras sin desenfoque (`brutal-shadow`), tipografía monoespaciada (`font-mono`), y botones táctiles interactivos (`brutal-btn`).
   - Retícula técnica de fondo (`brutal-grid`), paleta cromática basada en amarillo industrial, naranja de acción, negro puro y esmeralda.

2. **Refactorización de Todas las Vistas y Componentes**:
   - **Tablero Kanban (`BoardView.tsx`, `TaskCard.tsx`)**: Columnas industriales con badges numéricos de conteo, tarjetas de tarea con soporte para asignación múltiple, puntos de historia y avance de criterios de aceptación.
   - **Dashboard Ejecutivo (`ProjectDashboardView.tsx`)**: Vista maestro-detalle de proyectos, métricas consolidadas, carga de trabajo por integrante y estado de Sprints.
   - **Backlog y Sprints (`BacklogView.tsx`, `SprintBar.tsx`, `SprintModal.tsx`)**: Asignación rápida de tareas hacia Sprints activos o planificados en un clic.
   - **Reportes Ágiles (`ReportsView.tsx`)**: Gráficas de Burndown, velocidad de entregas y distribución de incidencias.
   - **Consola de Usuarios y CSV (`ManageUsersModal.tsx`, `CsvImportModal.tsx`)**: Importación masiva con vinculación automática de grupos/proyectos y validación línea por línea.
   - **Tutor Pedagógico Virtual (`AcademicChatbot.tsx`)**: Ventana e icono flotante rediseñados en estética industrial.

3. **Arquitectura de Inteligencia Artificial en 4 Niveles**:
   - **Tier 1**: Amazon Bedrock (`amazon.nova-lite-v1:0`, `nova-micro`, `llama3-70b`).
   - **Tier 2**: NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`).
   - **Tier 3**: Google Gemini (`gemini-3.6-flash`).
   - **Tier 4**: Motor pedagógico local de cero caídas.

4. **Concurrencia Granular en Firestore**:
   - Colecciones individuales por entidad (`tasks`, `projects`, `members`, `columns`, `sprints`, `comments`, `activity_logs`, `users`, `attachments`), garantizando cero pérdidas de datos al trabajar múltiples estudiantes a la vez.

---

## 2. Matriz de Roles y Permisos (RBAC)

| Rol | Identificador | Alcance | Capacidades |
| :--- | :--- | :--- | :--- |
| **Project Manager** | `admin` | Global | Control total: proyectos, usuarios, importación CSV, sprints, configuración de columnas y tareas. |
| **Product Owner** | `po` | Global | Gestión de Sprints, redacción y priorización de backlog/historias, estimación y seguimiento. |
| **Frontend Developer** | `frontend` | Asignado | Crear y mover tareas Frontend, registrar criterios BDD, comentar y adjuntar archivos. |
| **Backend Developer** | `backend` | Asignado | Crear y mover tareas Backend/API/DB, registrar criterios BDD, comentar y adjuntar archivos. |

---

## 3. Endpoints de Servidor

| Endpoint | Método | Función |
| :--- | :--- | :--- |
| `/api/ai/chat` | `POST` | Tutor interactivo de Scrum con blindaje pedagógico estricto |
| `/api/ai/audit-task` | `POST` | Auditoría de calidad técnica, formato INVEST y criterios BDD |
| `/api/ai/generate-story` | `POST` | Generación estructurada de Historias de Usuario |
| `/api/health` | `GET` | Verificación de estado del servidor y conectividad |

---

## 4. Estructura de Componentes Clave (`src/components/`)

- `AcademicChatbot.tsx`: Tutor Scrum flotante con IA y contexto del proyecto activo.
- `BacklogView.tsx`: Lista de tareas del backlog con reasignación ágil a Sprints.
- `BoardView.tsx`: Tablero Kanban interactivo con drag-and-drop y transiciones rápidas.
- `CsvImportModal.tsx`: Importador masivo de estudiantes/docentes por archivo CSV con asociación de grupos.
- `EditUserModal.tsx`: Edición de credenciales, avatares y roles de usuario.
- `FilterBar.tsx`: Búsqueda instantánea y filtros combinables por prioridad, tipo y asignados.
- `LoginView.tsx`: Pantalla de inicio de sesión en estética brutalista industrial.
- `ManageUsersModal.tsx`: Panel administrativo de usuarios para el Project Manager.
- `MemberModals.tsx`: Directorio y gestión del equipo de trabajo por proyecto.
- `Navbar.tsx`: Cabecera técnica de navegación, selector de proyectos y control de sesión.
- `ProjectDashboardView.tsx`: Dashboard ejecutivo maestro-detalle con métricas consolidadas.
- `ProjectModals.tsx`: Formularios de creación y actualización de proyectos.
- `ProjectsView.tsx`: Galería de proyectos disponibles.
- `ReportsView.tsx`: Burndown Chart, métricas de velocidad y gráficos de distribución.
- `SprintBar.tsx`: Barra de control del Sprint activo y métricas de avance de puntos.
- `SprintModal.tsx`: Formulario de planificación y lanzamiento de iteraciones.
- `TaskCard.tsx`: Tarjeta de tarea con insignias de prioridad, puntos y asignación múltiple.
- `TaskModal.tsx`: Modal con pestañas técnicas (Detalles, Criterios BDD, Comentarios, Auditoría IA, Historial y Adjuntos).
