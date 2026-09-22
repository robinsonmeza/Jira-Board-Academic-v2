# Board Academico USB-FI-IS-IS2-V3 - Resumen Técnico y Guía Rápida

> **Subtítulo Oficial**: BOARD DE SIMULACION DE PROYECTOS DE DESARROLLO Y APLICACION DE METODOLGIAS AGILES.  
> **Versión**: 3.5.0  
> **Estado**: Producción / Desplegado en Vercel & Firebase Cloud Firestore  
> **Autor Principal / Project Manager**: Robinson Meza (`RobinsonAmeza@gmail.com`)  
> **Estilo de Diseño**: Brutalismo Industrial (Industrial Brutalist UI System)  
> **Arquitectura**: Full-Stack (React 18 + Vite + Tailwind CSS + Node.js/Express + Amazon Bedrock + NVIDIA NIM + Google GenAI + Cloud Firestore)

---

## 1. Novedades de la Versión 3.5.0

1. **Ceremonias Ágiles Integradas en Cada Proyecto**:
   - **Daily Scrum Standup (`DailyScrumModal.tsx`)**:
     - Inspirado en la dinámica ergonómica de *DailyToast.io*.
     - Carga automática de los integrantes vinculados al proyecto actual.
     - Restricción estricta: sólo permite marcar ausentes del proyecto actual (sin usuarios externos).
     - Temporizador por orador (60s a 180s) con barra de tostado progresiva y alertas acústicas mecánicas (Web Audio API).
     - Las 3 preguntas oficiales de Scrum visibles y registro de bloqueos en vivo con resumen copiable al portapapeles.
   - **Planning Poker Fibonacci (`PlanningPokerModal.tsx`)**:
     - Estimación colaborativa en tiempo real con baraja completa Fibonacci (0.5 a 100, ?, ☕).
     - Votos tapados (*face-down*) hasta la revelación sincrónica para evitar sesgos.
     - Cálculo de promedio, sugerencia Fibonacci y alerta automática de divergencia.
     - Asignación directa de Story Points a la tarea en Firestore.
   - **Tablero de Retrospectiva de Sprint con RBAC (`RetrospectiveView.tsx`)**:
     - 3 columnas canónicas de inspección y adaptación: *¿Qué funcionó bien?*, *¿Qué podemos mejorar?*, *Acciones del próximo Sprint*.
     - **Control de Acceso Basado en Roles (RBAC)**:
       - **Product Owner y Project Manager**: Edición completa (crear tarjetas, eliminar y convertir acciones en tareas reales de Backlog).
       - **Frontend, Backend y QA**: Modo de sólo lectura y votación comunitaria (+1) por las reflexiones del equipo.
     - **Tablero Limpio**: Sin datos de ejemplo ni tarjetas ficticias predefinidas.
     - Conversión automática de acciones comprometidas en tareas de Backlog en Firestore.

2. **Panel de Métricas y Productividad Recharts (`MetricsView.tsx`)**:
   - Gráfico de avance por Sprint comparando tareas completadas vs total tareas y curva de avance porcentual.
   - Velocidad de Story Points y distribución de carga de trabajo.
   - Filtro integral por desarrollador que recalcula dinámicamente todos los KPIs y gráficos para el dev seleccionado.

3. **Diseño Visual: Brutalismo Industrial**:
   - Bordes mecánicos negros (`border-2` y `border-4`), sombras duras sin desenfoque (`brutal-shadow`), tipografía monoespaciada (`font-mono`) y botones mecánicos reactivos (`brutal-btn`).
   - Retícula técnica de taller de fondo (`brutal-grid`).

---

## 2. Matriz de Roles y Permisos (RBAC)

| Rol | Identificador | Alcance | Capacidades Principales | Retrospectiva de Sprint |
| :--- | :--- | :--- | :--- | :--- |
| **Project Manager** | `admin` | Global | Control total: proyectos, usuarios, importación CSV, sprints, configuración de columnas y tareas. | **Edición Completa** (Crear, borrar y convertir a Backlog) |
| **Product Owner** | `po` | Global | Gestión de Sprints, redacción y priorización de backlog/historias, estimación y seguimiento. | **Edición Completa** (Crear, borrar y convertir a Backlog) |
| **Frontend Developer** | `frontend` | Asignado | Crear y mover tareas Frontend, registrar criterios BDD, comentar y votar en ceremonias. | **Consulta y Votación** (+1) |
| **Backend Developer** | `backend` | Asignado | Crear y mover tareas Backend/API/DB, registrar criterios BDD, comentar y votar en ceremonias. | **Consulta y Votación** (+1) |
| **QA / Tester** | `qa` | Asignado | Validación de DoD, verificación de criterios BDD, auditoría de incidencias y votación. | **Consulta y Votación** (+1) |

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
- `BoardView.tsx`: Tablero Kanban industrial con navegación de vistas y ceremonias.
- `CsvImportModal.tsx`: Importador masivo de estudiantes/docentes por archivo CSV con asociación de grupos.
- `DailyScrumModal.tsx`: Facilitador de Daily Standup estilo DailyToast con temporizador dinámico y ausencias.
- `EditUserModal.tsx`: Edición de credenciales, avatares y roles de usuario.
- `FilterBar.tsx`: Búsqueda instantánea y filtros combinables por prioridad, tipo y asignados.
- `LoginView.tsx`: Pantalla de inicio de sesión en estética brutalista industrial.
- `ManageUsersModal.tsx`: Panel administrativo de usuarios para el Project Manager.
- `MemberModals.tsx`: Directorio y gestión del equipo de trabajo por proyecto.
- `MetricsView.tsx`: Estadísticas medibles, avance por sprint en Recharts y filtro por dev.
- `Navbar.tsx`: Cabecera técnica de navegación, selector de proyectos y control de sesión.
- `PlanningPokerModal.tsx`: Estimación colaborativa Fibonacci, mesa de votación tapada y consenso.
- `ProjectDashboardView.tsx`: Dashboard ejecutivo maestro-detalle con métricas consolidadas.
- `ProjectModals.tsx`: Formularios de creación y actualización de proyectos.
- `ProjectsView.tsx`: Galería de proyectos disponibles.
- `ReportsView.tsx`: Burndown Chart, métricas de velocidad y gráficos de distribución.
- `RetrospectiveView.tsx`: Tablero ágil de retrospectiva con RBAC estricto (PO/PM edición, Devs votación) y estado limpio.
- `SprintBar.tsx`: Barra de control del Sprint activo y métricas de avance de puntos.
- `SprintModal.tsx`: Formulario de planificación y lanzamiento de iteraciones.
- `TaskCard.tsx`: Tarjeta de tarea con insignias de prioridad, puntos y asignación múltiple.
- `TaskModal.tsx`: Modal con pestañas técnicas (Detalles, Criterios BDD, Comentarios, Auditoría IA, Historial y Adjuntos).
