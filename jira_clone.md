# Jira Board Clone - Documentación Técnica y Funcional

> **Versión**: 3.3.0  
> **Estado**: Producción / Desplegado en Vercel & Firebase Cloud Firestore  
> **Autor Principal / Project Manager**: Robinson Meza (`RobinsonAmeza@gmail.com`)  
> **Arquitectura**: Full-stack (React 18 + Vite + Express Backend + Amazon Bedrock + NVIDIA NIM + Google GenAI + Cloud Firestore)

---

## 1. Visión General del Proyecto

**Jira Board Clone** es una plataforma web colaborativa y multiusuario diseñada para la gestión ágil de proyectos de software académico y profesional. Permite planificar Sprints, gestionar Backlogs, administrar tableros Kanban interactivos, registrar métricas y controlar el acceso de usuarios mediante un modelo robusto de control de acceso basado en roles (**RBAC**).

A partir de la versión **v3.3.0**, la plataforma cuenta con una arquitectura de Inteligencia Artificial resiliente de múltiples niveles que integra **Amazon Bedrock** como proveedor primario de alta velocidad, respaldado por **NVIDIA NIM** como proveedor secundario, **Google Gemini** como contingencia y un **Motor Pedagógico Académico Local** de cero caídas.

---

## 2. Novedades y Actualizaciones Recientes (v3.3.0)

1. **Arquitectura de Inteligencia Artificial Resiliente en 4 Niveles**:
   - **Tier 1 (Principal)**: **Amazon Bedrock (Converse API)** utilizando `amazon.nova-lite-v1:0` y balanceo a `amazon.nova-micro-v1:0` y `meta.llama3-70b-instruct-v1:0` (latencia ~1.6 s).
   - **Tier 2 (Secundario)**: **NVIDIA NIM** con `meta/llama-3.2-11b-vision-instruct` (~1.0 s).
   - **Tier 3 (Contingencia)**: Cascada Google Gemini (`gemini-3.6-flash`).
   - **Tier 4 (Motor Local de Cero Caídas)**: Generador pedagógico contextual autónomo ante cortes de red.

2. **Endpoints de Inteligencia Artificial Activos**:
   - `/api/ai/chat`: Tutor pedagógico interactivo de Scrum y Jira.
   - `/api/ai/audit-task`: Auditor técnico QA con verificación INVEST y BDD.
   - `/api/ai/generate-story`: Generador automático de Historias de Usuario estructuradas.

3. **Blindaje Temático y Académico (Strict Guardrails)**:
   - Rechazo estricto de solicitudes ajenas a metodologías ágiles o ingeniería de software.
   - Protección contra inyecciones de prompt y jailbreaks ("modo DAN").
   - Fomento pedagógico activo: no resuelve la tarea llave en mano, orienta con arquitectura y pruebas.

4. **Batería de Pruebas Superadas**:
   - Pruebas directas de API de Amazon Bedrock y NVIDIA NIM aprobadas con HTTP 200.
   - Pruebas en vivo en todos los endpoints del servidor con tiempo de respuesta óptimo.

---

## 3. Seguridad de Credenciales y Variables de Entorno

> 🔒 **Buenas Prácticas de Seguridad**:
> - Las credenciales secretas (`BEDROCK_API_KEY`, `NVIDIA_API_KEY`, `GEMINI_API_KEY`) se administran **exclusivamente del lado del servidor** a través de variables de entorno o el panel de *Secrets* de hosting.
> - **Nunca se exponen claves de API** en el código fuente de frontend, repositorios públicos o bundles cliente.
> - Para detalles completos de arquitectura y configuración, consultar `README.md`.

---

## 3. Matriz de Roles y Permisos (RBAC)

La plataforma cuenta con 4 roles definidos:

| Rol | Identificador | Alcance de Proyectos | Permisos Principales |
| :--- | :--- | :--- | :--- |
| **Project Manager (Admin)** | `admin` | **Global (Todos los proyectos)** | Control total: Crear/editar/eliminar proyectos, administrar usuarios, importar CSV, gestionar columnas, sprints y cualquier tarea. |
| **Product Owner (Docente / Evaluador)** | `po` | **Global (Todos los proyectos)** | Supervisión y gestión de sprints, creación y priorización de historias/tareas, estimación de puntos de historia. No puede importar CSV de usuarios. |
| **Frontend Developer** | `frontend` | **Solo Proyectos Asignados** | Crear tareas de tipo UI/Frontend, mover tarjetas en el tablero, comentar y adjuntar archivos en sus tareas asignadas. |
| **Backend Developer** | `backend` | **Solo Proyectos Asignados** | Crear tareas de tipo Backend/API/DB, mover tarjetas en el tablero, comentar y adjuntar archivos en sus tareas asignadas. |

---

## 4. Estructura de Archivos del Proyecto

```text
├── firebase-applet-config.json     # Configuración de credenciales de Firebase
├── firebase-blueprint.json         # Esquema de entidades de Firestore
├── firestore.rules                 # Reglas de seguridad de Firestore
├── index.html                      # Punto de entrada HTML
├── package.json                    # Dependencias del proyecto
├── src/
│   ├── App.tsx                     # Enrutador principal y vistas
│   ├── main.tsx                    # Bootstrap de React
│   ├── index.css                   # Estilos globales y utilidades Tailwind
│   ├── types/
│   │   └── jira.ts                 # Interfaces TypeScript, Roles y Permisos
│   ├── lib/
│   │   └── firebase.ts             # Inicialización del cliente Firestore
│   ├── data/
│   │   └── seedData.ts             # Datos semilla iniciales del sistema
│   ├── context/
│   │   └── JiraContext.tsx         # Estado global y sincronización con Firestore
│   └── components/
│       ├── Navbar.tsx              # Barra superior, selector de proyecto y perfil
│       ├── LoginView.tsx           # Pantalla de inicio de sesión segura
│       ├── KanbanBoard.tsx         # Tablero Kanban interactivo con Drag & Drop
│       ├── BacklogView.tsx         # Gestión de Backlog y planificación de Sprints
│       ├── SprintsView.tsx         # Control de Sprints activos y completados
│       ├── MembersView.tsx         # Gestión de miembros por proyecto
│       ├── MetricsView.tsx         # Gráficas de rendimiento y velocidad
│       ├── TaskModal.tsx           # Detalle, edición, comentarios y adjuntos
│       ├── CreateTaskModal.tsx     # Creación de nuevas tareas
│       ├── ManageUsersModal.tsx    # Gestión de usuarios e importación CSV
│       └── CreateProjectModal.tsx  # Creación de nuevos proyectos
```

---

## 5. Modelo de Datos (Firestore Schema)

El documento principal se almacena en la colección `app_state` bajo el identificador `main`:

```typescript
interface AppStateDocument {
  id: "main";
  users: User[];
  projects: Project[];
  members: ProjectMember[];
  columns: BoardColumn[];
  tasks: Task[];
  sprints: Sprint[];
  comments: TaskComment[];
  activityLogs: ActivityLog[];
  attachments: TaskAttachment[];
  updatedAt: string; // ISO Date
  updatedBy: string;
}
```

---

## 6. Variables de Entorno y Despliegue

### Despliegue en Vercel
1. El proyecto cuenta con el archivo `vercel.json` configurado para SPA:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```
2. Comando de compilación: `npm run build`
3. Directorio de salida: `dist`

### Despliegue en GitHub
Para sincronizar las ramas y disparar el despliegue continuo:
```bash
git add .
git commit -m "feat: Sincronización Firestore en tiempo real y Login seguro"
git push origin main
```

---

## 7. Próximos Pasos Sugeridos
- [ ] Exportación de reportes de Sprint en formato PDF / Excel.
- [ ] Notificaciones en tiempo real al ser mencionado en comentarios de tareas.
- [ ] Asignación de múltiples responsables por tarea.
