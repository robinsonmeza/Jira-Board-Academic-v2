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

## 2. Tutor Académico Virtual con IA (ScrumBot) y Motor de Calidad de Software (v3.3.0)

### 2.1 Propósito Pedagógico
En talleres universitarios y cursos de Ingeniería de Software, los estudiantes suelen presentar dudas recurrentes respecto a cómo estructurar historias de usuario, cómo estimar Story Points o cuáles son las responsabilidades según su rol asignado en el proyecto. 

Para **disminuir la carga del docente y empoderar al estudiante**, se incorporó un tutor pedagógico en tiempo real con IA accesible mediante un botón flotante permanente y contextualizado por proyecto:

1. **Guía para Documentar Historias de Usuario (HU)**:
   - Enseñanza del estándar canónico:
     > *"Como [rol], quiero [funcionalidad] para [beneficio]"*.
   - Redacción de Criterios de Aceptación con enfoque **BDD / Given-When-Then** (*Dado que... Cuando... Entonces...*).
   - Principios de calidad **INVEST** (Independiente, Negociable, Valiosa, Estimable, Small, Testeable).
2. **Definiciones y Roles del Equipo**:
   - Explicación de responsabilidades de **Product Owner**, **Frontend**, **Backend** y **Project Manager**.
   - Definición de Sprint, Product Backlog, Definition of Done (DoD) y Story Points (serie Fibonacci 1, 2, 3, 5, 8).
3. **Consciencia del Contexto del Proyecto**:
   - El bot recibe el nombre del proyecto activo, su clave (`key`), descripción, sprint activo y flujo de columnas del tablero, adaptando sus respuestas a la realidad de cada equipo.
4. **Inserción Rápida de Plantillas**:
   - En el modal de creación y edición de tareas, se incluyó el botón **"Insertar Plantilla HU"** para poblar al instante la estructura requerida.
5. **Chips de Preguntas Frecuentes**:
   - Acceso en un clic a guías preparadas (BDD, roles, estimación en Fibonacci y contexto del proyecto).

### 2.2 Blindaje Académico (Guardrails Estrictos)
Para proteger el propósito educativo de la plataforma y evitar desvíos o costos imprevistos:
- **Blindaje Anti-Desvío de Tema (Strict Guardrails)**:
  - Instrucción de sistema estricta en el servidor que rechaza automáticamente cualquier solicitud que no pertenezca a Metodologías Ágiles (Scrum/Kanban) o Ingeniería de Software (ej. redacción de poemas, tareas de otras materias, juegos, etc.).
  - Respuesta estandarizada y cortés: *"Como tutor pedagógico de Scrum y Jira para tu proyecto académico, solo puedo orientarte en temas de metodologías ágiles, historias de usuario, roles de equipo y tareas de este tablero. ¿En qué funcionalidad o historia de tu Sprint podemos avanzar hoy?"*
- **Protección Anti-Jailbreak / Prompt Injection**: Ignora intentos de "modo DAN", olvido de instrucciones o suplantación de identidad.
- **Enfoque Pedagógico**: Orienta con contratos de API, escenarios BDD y criterios técnicos, sin hacerle la tarea completa de codificación al estudiante para preservar el aprendizaje.

### 2.3 Arquitectura Multi-Proveedor y Conmutación por Falla (Multi-Tier Resilient Engine)
El backend orquesta las peticiones a través de 4 niveles jerárquicos para garantizar una disponibilidad continua y libre de interrupciones:

1. **Tier 1 (PROVEEDOR PRINCIPAL): Amazon Bedrock (Converse API)**
   - **Autenticación**: Bedrock API Key con autorización vía Bearer Token (`ABSK...`).
   - **Modelos integrados**: `amazon.nova-lite-v1:0` (ultra-rápido, ~850 ms a 1.6 s), con balanceo interno hacia `amazon.nova-micro-v1:0` y `meta.llama3-70b-instruct-v1:0`.
   - **Características**: Latencia mínima, alta tasa de tokens por segundo y disponibilidad garantizada en la región `us-east-1`.
2. **Tier 2 (PROVEEDOR SECUNDARIO): NVIDIA NIM (Inference Microservices)**
   - **Autenticación**: Clave de API de NVIDIA Cloud (`nvapi-...`).
   - **Modelo integrado**: `meta/llama-3.2-11b-vision-instruct` (~900 ms de respuesta).
   - **Características**: Conmutación automática instantánea ante cualquier eventualidad o latencia elevada en el proveedor primario.
3. **Tier 3 (CONTINGENCIA CLOUD): Google Gemini Cascade**
   - **Modelos**: `gemini-3.6-flash` y variantes con límite de espera estricto por intento.
4. **Tier 4 (MOTOR LOCAL DE CERO CAÍDAS): Generador Pedagógico Contextual**
   - Si se presentase una interrupción externa global simultánea en los proveedores de nube, el servidor genera de manera autónoma dictámenes de auditoría QA, plantillas BDD e instrucciones de Scrum contextualizadas al proyecto actual, asegurando un **tiempo de actividad del 100%**.

### 2.4 Endpoints de IA Operativos

| Endpoint | Método | Propósito | Proveedor Prioritario |
| :--- | :--- | :--- | :--- |
| `/api/ai/chat` | `POST` | Tutor Scrum y asistente de redacción multi-turno | **Amazon Bedrock** (Primario) / **NVIDIA NIM** (Secundario) |
| `/api/ai/audit-task` | `POST` | Auditoría técnica QA, validación INVEST y formato BDD | **Amazon Bedrock** (Primario) / **NVIDIA NIM** (Secundario) |
| `/api/ai/generate-story` | `POST` | Conversión automática de requerimiento en Historia de Usuario | **Amazon Bedrock** (Primario) / **NVIDIA NIM** (Secundario) |

### 2.5 Resultados de la Batería de Pruebas de Verificación (100% Superadas)

Se ejecutó una suite automatizada de pruebas exhaustivas en vivo validando la interoperabilidad:

```text
=== TEST 1: Amazon Bedrock (PRIMARIA) ===
Status HTTP: 200 OK | Latencia: 1613 ms
Resultado: Respuesta pedagógica completa sobre pilares de Scrum (Transparencia, Inspección, Adaptación).

=== TEST 2: NVIDIA NIM (SECUNDARIA) ===
Status HTTP: 200 OK | Latencia: 1038 ms
Resultado: Conmutación exitosa y respuesta estructurada sobre principios ágiles.

=== TEST 3: Endpoint Servidor /api/ai/chat (En vivo) ===
Status HTTP: 200 OK | Latencia: 2922 ms
Resultado: Explicación interactiva del principio INVEST contextualizada a 'Portal Docente'.

=== TEST 4: Endpoint Servidor /api/ai/audit-task (En vivo) ===
Status HTTP: 200 OK | Latencia: 5421 ms
Resultado: Dictamen de calidad técnica y criterios BDD emitidos para la tarea de OAuth 2.0.

=== TEST 5: Endpoint Servidor /api/ai/generate-story (En vivo) ===
Status HTTP: 200 OK | Latencia: 2621 ms
Resultado: Generación canónica estructurada con narrativa, BDD, rol y Story Points sugeridos.

>>> ¡TODAS LAS PRUEBAS (1 AL 5) SUPERADAS CON ÉXITO! <<<
```

---

## 3. Novedades y Arquitectura de Concurrencia v3.0.0 (Solución de Concurrencia Multi-Estudiante)

### 2.1 Diagnóstico de la Problemática Anterior (v2.5.0)
En versiones previas, todo el estado de la aplicación se guardaba en un único documento monolítico (`app_state/main`). Cuando dos o más estudiantes trabajaban en el mismo proyecto al mismo tiempo (por ejemplo, el Estudiante A movía una tarea mientras el Estudiante B creaba o editaba otra), la operación `setDoc` de uno sobreescribía todo el documento, borrando los cambios del compañero (condición de carrera o *last-write-wins*).

### 2.2 Arquitectura Granular de Colecciones (Opción A Implementada)
Para resolver de forma definitiva este problema y permitir alta concurrencia:

1. **Colecciones Granulares en Firestore**:
   - Cada entidad ahora reside en su propia colección independiente:
     - `tasks/{taskId}`: Cada tarea se crea, actualiza o mueve como un documento atómico.
     - `projects/{projectId}`: Proyectos de trabajo.
     - `members/{memberId}`: Membresías y roles por proyecto.
     - `columns/{columnId}`: Columnas del tablero Kanban/Scrum.
     - `sprints/{sprintId}`: Sprints planificados, activos y completados.
     - `comments/{commentId}`: Comentarios individuales en tareas.
     - `activity_logs/{logId}`: Registro de auditoría y movimientos.
     - `users/{userId}`: Cuentas y credenciales de usuario.
     - `attachments/{attachmentId}`: Archivos adjuntos en tareas.

2. **Cero Conflictos entre Estudiantes**:
   - Si el Estudiante 1 edita la descripción de la tarea `PRJ-4` y el Estudiante 2 mueve la tarea `PRJ-8` a *In Progress*, Firestore actualiza exclusivamente el documento `tasks/PRJ-4` y `tasks/PRJ-8` respectivamente. **Ningún cambio se pisa ni se elimina**.

3. **Migración Automática e Inicialización Transparente**:
   - El servicio `firestoreService.ts` inspecciona si las nuevas colecciones ya cuentan con datos. Si no, migra automáticamente los datos existentes desde el documento legacy `app_state/main` o desde las semillas iniciales sin perder ningún proyecto o tarea.

4. **Reactividad Inmediata + Sincronización en Tiempo Real**:
   - Los componentes reaccionan instantáneamente gracias al estado local reactivo y suscripciones individuales `onSnapshot` por colección.

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
├── firebase-blueprint.json         # Esquema de entidades granulares de Firestore
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
│   │   ├── firebase.ts             # Inicialización de la instancia Firestore
│   │   └── firestoreService.ts     # CRUD granular, batch operations y migración atómica
│   ├── data/
│   │   └── seedData.ts             # Datos semilla iniciales del sistema
│   ├── context/
│   │   └── JiraContext.tsx         # Estado global y suscripciones en tiempo real
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

## 5. Modelo de Datos Granular (Firestore Collections)

A partir de la versión 3.0.0, Firestore utiliza colecciones independientes:

- `tasks`: Documentos identificados por `taskId` con propiedades (`title`, `status`, `column_id`, `assignee_ids`, etc.).
- `projects`: Documentos identificados por `projectId`.
- `columns`: Documentos identificados por `columnId`.
- `members`: Documentos identificados por `memberId`.
- `sprints`: Documentos identificados por `sprintId`.
- `comments`: Documentos identificados por `commentId`.
- `activity_logs`: Documentos identificados por `logId`.
- `users`: Documentos identificados por `userId`.
- `attachments`: Documentos identificados por `attachmentId`.

---

## 6. Variables de Entorno y Despliegue

### 6.1 Configuración Segura de Variables de Entorno (Secrets)
Por motivos estrictos de seguridad y mejores prácticas, las claves secretas y tokens de autenticación **nunca deben commitearse ni exponerse en el repositorio público**. Deben inyectarse mediante el panel de *Settings / Secrets* de la plataforma de hosting o en un archivo `.env` local excluido por `.gitignore`.

| Variable | Tipo | Proveedor | Propósito | Formato Seguro Esperado |
| :--- | :--- | :--- | :--- | :--- |
| `BEDROCK_API_KEY` | Secreto (Servidor) | **Amazon Bedrock** | Proveedor primario de IA para chat y QA | `ABSK...[TOKEN_BEARER_DE_LARGA_DURACION]` |
| `NVIDIA_API_KEY` | Secreto (Servidor) | **NVIDIA NIM** | Proveedor secundario de alta disponibilidad | `nvapi-...[CLAVE_PERSONAL_NVIDIA_CLOUD]` |
| `GEMINI_API_KEY` | Secreto (Servidor) | **Google Cloud / AI Studio** | Proveedor de contingencia para modelos Gemini | `AIzaSy...[CLAVE_GOOGLE_GENAI]` |
| `APP_URL` | Configuración | Plataforma | URL canónica para CORS y redirecciones | `https://tu-dominio.run.app` |

> 🔒 **Medidas de Seguridad Implementadas**:
> - Todas las llamadas a las APIs de IA ocurren **exclusivamente del lado del servidor (`server.ts`)**. Las claves nunca se envían al navegador ni se inyectan en el bundle de frontend (`dist/`).
> - Las variables de entorno son sanitizadas y cuentan con valores de respaldo controlados sin exponer credenciales en archivos estáticos.

### 6.2 Despliegue en Vercel
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
git commit -m "feat: Arquitectura granular de colecciones Firestore para soporte multiusuario"
git push origin main
```

---

## 7. Próximos Pasos Sugeridos
- [ ] Exportación de reportes de Sprint en formato PDF / Excel.
- [ ] Notificaciones en tiempo real al ser mencionado en comentarios de tareas.
- [ ] Filtros avanzados por etiquetas y múltiples responsables.
