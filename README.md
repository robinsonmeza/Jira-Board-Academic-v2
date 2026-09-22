# Board Academico USB-FI-IS-IS2-V3 - Documentación Técnica y Funcional

> **Subtítulo Oficial**: BOARD DE SIMULACION DE PROYECTOS DE DESARROLLO Y APLICACION DE METODOLGIAS AGILES.  
> **Versión**: 3.5.0  
> **Estado**: Producción / Desplegado en Vercel & Firebase Cloud Firestore  
> **Autor Principal / Project Manager**: Robinson Meza (`RobinsonAmeza@gmail.com`)  
> **Estilo de Diseño**: Brutalismo Industrial (Industrial Brutalist UI System)  
> **Arquitectura**: Full-Stack (React 18 + Vite + Tailwind CSS + Node.js/Express + Amazon Bedrock + NVIDIA NIM + Google GenAI + Cloud Firestore)

---

## 1. Visión General del Proyecto

**Jira Board Clone** es una plataforma web colaborativa y de alto rendimiento diseñada para la gestión ágil de proyectos de software en entornos académicos universitarios y profesionales. Integra tableros Kanban interactivos, planificación y control de Sprints, gestión del Backlog del Producto, métricas ágiles (Burndown Charts, velocidad y distribución), asignación múltiple de desarrolladores, y un modelo estricto de control de acceso basado en roles (**RBAC**).

A partir de la versión **v3.4.0**, la plataforma estrena un sistema de diseño visual completo de **Brutalismo Industrial**, maximizando el enfoque técnico, el contraste operativo y la ergonomía visual mediante tipografía monoespaciada, bordes mecánicos sólidos, sombras duras y retroalimentación táctil de alta fidelidad.

Adicionalmente, incorpora un **Tutor Pedagógico Virtual (ScrumBot)** y un **Motor de Calidad de Software (QA)** orquestado en una arquitectura de Inteligencia Artificial resiliente en cuatro niveles (**Amazon Bedrock**, **NVIDIA NIM**, **Google Gemini** y **Motor Local de Cero Caídas**).

---

## 2. Sistema de Diseño: Brutalismo Industrial (v3.4.0)

El nuevo lenguaje visual abandona gradientes decorativos y sombras difusas genéricas en favor de una interfaz de inspiración fabril, técnica y legible:

### 2.1 Principios de Diseño
1. **Alto Contraste y Claridad Estructural**:
   - Bordes sólidos negros de 2px y 4px (`border-2 border-black`, `border-4 border-black`) que definen con precisión cada bloque, modal y contenedor.
   - Sombras mecánicas rectangulares sin desenfoque (`box-shadow: 2px 2px 0px #000`, `4px 4px 0px #000`, `6px 6px 0px #000`).
2. **Tipografía Técnica Monoespaciada**:
   - Integración global de fuentes monoespaciadas (`font-mono`: JetBrains Mono, Fira Code, Menlo, Courier) para identificadores de tareas (`PRJ-101`), claves, puntos de historia, timestamps y rótulos de estado.
   - Textos técnicos y etiquetas en mayúsculas de alto impacto visual (`uppercase font-black`).
3. **Ergonomía Táctil y Micro-interacciones**:
   - Clase utilitaria `.brutal-btn` con efecto de pulsación mecánica física (`active:translate-x-[2px] active:translate-y-[2px]`).
   - `.brutal-card` con elevación y transición rígida ante hover.
4. **Paleta Cromática Funcional**:
   - **Fondo de Taller / Retícula Técnica**: Patrón `brutal-grid` con fondo claro neutral (`#f8fafc`).
   - **Amarillo Industrial (`#facc15`)**: Encabezados de módulos, alertas técnicas y fondos de cabecera.
   - **Naranja de Acción (`#f97316`)**: Botones primarios de guardado, creación y llamadas a la acción críticas.
   - **Negro Puro (`#000000`)**: Bordes estructurales, texto principal y contrastes clave.
   - **Esmeralda / Menta (`#10b981` / `#34d399`)**: Estados completados (*Done*), aprobaciones QA y badges de Sprint Activo.
   - **Cian / Eléctrico (`#38bdf8`)**: Métricas de avance y filtros activos.

---

## 3. Módulos y Funcionalidades Principales

### 3.1 Tablero Kanban Interactivo (`BoardView.tsx` & `TaskCard.tsx`)
- **Visualización por Columnas**: Soporte para *To Do*, *In Progress*, *In Review*, *Done* y columnas personalizadas.
- **Tarjetas de Tarea Brutalistas**:
  - Código único (`KEY-ID`), tipo de tarea (Historia, Bug, Tarea, Mejora).
  - Badge de Story Points en cuadrado industrial de color naranja.
  - Indicador de Prioridad (Crítica, Alta, Media, Baja).
  - Soporte para **múltiples usuarios asignados simultáneamente** con avatares en mosaico de alto contraste.
  - Checklist rápido de criterios de aceptación completados (`x/total`).
  - Botones de transición rápida entre columnas para agilizar el flujo de trabajo.

### 3.2 Backlog del Producto y Asignación de Sprints (`BacklogView.tsx`)
- Tabla técnica completa de tareas pendientes con ordenamiento por prioridad y clave.
- Mapeo directo y selector rápido de asignación de tareas del Backlog hacia Sprints planificados o activos en un clic.
- Vista de Story Points totales acumulados en el Backlog.

### 3.3 Barra y Gestión de Sprints (`SprintBar.tsx` & `SprintModal.tsx`)
- Selector desplegable de Sprints con estado en vivo (*Planned*, *Active*, *Completed*).
- Barra de progreso brutalista que computa porcentaje de puntos completados vs. totales.
- Fechas de inicio, fin y Objetivo del Sprint (*Sprint Goal*).
- Controles de inicio de Sprint, cierre (*Complete Sprint*) y creación rápida.

### 3.4 Dashboard Ejecutivo de Proyectos (`ProjectDashboardView.tsx`)
- **Panel Maestro-Detalle**: Selector interactivo de proyectos en la columna izquierda y métricas detalladas en la columna principal.
- **KPIs Globales**: Proyectos activos, Sprints en curso, Tareas completadas y Porcentaje global de avance.
- **Desglose de Carga de Trabajo**: Distribución de tareas por responsable dentro del equipo, historial de actividad reciente y detalle de cada Sprint.

### 3.5 Métricas de Proyecto y Productividad de Desarrolladores (`MetricsView.tsx`)
- **Gráfico de Avance por Sprint (Recharts)**:
  - Comparación gráfica directa de **Tareas Completadas vs Total de Tareas por Sprint** con barras agrupadas y línea de porcentaje de avance (`% de Tasa de Avance`).
- **Filtro Integral por Desarrollador**:
  - Selector individual de desarrolladores con tarjetas de perfil, roles ([Frontend], [Backend]), avatar y buscador dinámico.
  - Al seleccionar un desarrollador, **todas las estadísticas medibles del proyecto se recalculan dinámicamente** para reflejar exclusivamente la productividad, entregas y tareas de dicho dev.
- **Gráfico de Puntos de Historia (Velocidad)**:
  - Story Points comprometidos vs entregados por cada iteración.
- **Distribución de Carga de Trabajo del Equipo**:
  - Comparativa de tareas completadas, en progreso y pendientes entre todos los integrantes.
- **Métricas Multidimensionales del Proyecto**:
  - Distribución por Estado del Pipeline (Donut Recharts).
  - Distribución por Tipo de Incidencia (Historias de Usuario, Tareas Dev, Bugs/QA, Epics).
  - Distribución por Nivel de Prioridad y Cumplimiento de Criterios BDD.
- **Tabla Técnica de Tareas Asignadas**:
  - Desglose con claves, estados, puntos y botón de inspección directa.

### 3.6 Modal Integral de Tarea (`TaskModal.tsx`)
- **Pestañas Técnicas**:
  1. **Detalles**: Título, descripción técnica con soporte para plantillas canónicas de Historias de Usuario, tipo, prioridad, Story Points, fecha límite y selección multi-asignado.
  2. **Criterios de Aceptación (BDD)**: Checklist interactivo de escenarios *Given-When-Then* con estados de cumplimiento.
  3. **Comentarios**: Hilo de discusión en tiempo real con marcas de tiempo relativas y autor.
  4. **Historial de Actividad**: Auditoría de transiciones de estado, reasignaciones y cambios en la tarea.
  5. **Archivos Adjuntos**: Soporte para subida y descarga de adjuntos vinculados.
- **Herramientas de IA Integradas**:
  - Botón **"Auditar con IA (QA)"**: Ejecuta análisis técnico automático sobre INVEST y BDD.
  - Botón **"Generar HU con IA"**: Convierte un enunciado breve en una Historia de Usuario canónica estructurada.

### 3.7 Planning Poker Colaborativo (`PlanningPokerModal.tsx`)
- **Baraja Fibonacci Completa**: 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100, ?, ☕.
- **Mesa de Votación Oculta**: Votos tapados hasta la revelación sincronizada.
- **Consenso y Alerta de Divergencia**: Cálculo del promedio de Story Points y sugerencia automática de Fibonacci.
- **Asignación en un Clic**: Aplica los puntos acordados directamente a la tarea seleccionada en la base de datos.

### 3.8 Tablero de Retrospectiva de Sprint (`RetrospectiveView.tsx`)
- **3 Columnas Canónicas de Inspección y Adaptación**:
  - *¿Qué funcionó bien?* (Green)
  - *¿Qué podemos mejorar?* (Amber)
  - *Acciones de mejora del próximo Sprint* (Cyan)
- **Control de Acceso Basado en Roles (RBAC Estricto)**:
  - **Product Owner y Project Manager (Modo Edición)**: Permisos exclusivos para redactar nuevas reflexiones, eliminar tarjetas y comprometer acciones convirtiéndolas directamente en tareas de Backlog en Firestore.
  - **Frontend, Backend y QA (Modo Consulta y Votación)**: Pueden inspeccionar todo el tablero y participar democráticamente votando `[+1]` por las reflexiones más críticas para priorizar acuerdos de equipo sin alterar el contenido editorial.
- **Sin Datos Ficticios**: Inicia en estado completamente limpio y listo para registrar las reflexiones reales de los estudiantes e instructores.
- **Conversión Directa a Tarea de Backlog**: Convierte cualquier acción de mejora comprometida en una tarea real en el Backlog del proyecto con un solo clic.
- **Acta Exportable**: Copia el resumen formateado del acta de la retrospectiva al portapapeles.

### 3.9 Facilitador de Daily Scrum Standup (`DailyScrumModal.tsx`)
- **Sincronización Estilo DailyToast.io**: Ronda de oradores con temporizador dinámico (60s - 180s) y barra de progreso.
- **Filtro Estricto de Integrantes**: Carga automática de los miembros asignados al proyecto; permite marcar ausentes.
- **Efectos Sonoros Mecánicos**: Tictac y campanilla sintetizados mediante Web Audio API.
- **3 Preguntas Canónicas**: ¿Qué hice ayer?, ¿Qué haré hoy?, ¿Tengo bloqueos?
- **Resumen Copiable**: Resumen de tiempos y bloqueos listo para exportar.

### 3.10 Administración de Usuarios e Importación CSV (`ManageUsersModal.tsx` & `CsvImportModal.tsx`)
- Módulo reservado para el **Project Manager (Admin)**.
- Creación y edición individual de usuarios con asignación de roles y contraseña.
- **Importación Masiva vía CSV**:
  - Descarga de plantilla CSV estandarizada.
  - Carga masiva de estudiantes y docentes asignándoles rol y **vinculación automática a sus respectivos Grupos/Proyectos**.
  - Validación de campos requeridos y reporte de errores fila por fila antes de procesar.

---

## 4. Tutor Pedagógico Virtual (ScrumBot) y Motor de Calidad de Software

### 4.1 Propósito Pedagógico
En cursos universitarios y talleres de desarrollo de software, los estudiantes requieren acompañamiento continuo sobre cómo redactar Historias de Usuario de calidad, estimar tareas con Planning Poker / Fibonacci y entender sus responsabilidades de equipo.

El tutor virtual está disponible de manera permanente mediante un disparador flotante de estilo industrial:
- **Estructura Canónica de Historias de Usuario**:
  > *"Como [rol], quiero [funcionalidad] para [beneficio]"*.
- **Criterios de Aceptación BDD / Given-When-Then**:
  > *Dado que... Cuando... Entonces...*
- **Principios INVEST**: Independiente, Negociable, Valiosa, Estimable, Small (Pequeña) y Testeable.
- **Consciencia de Contexto**: Lee el proyecto activo, su clave, descripción, sprint en curso y columnas para ofrecer respuestas precisas.

### 4.2 Blindaje Académico (Strict Guardrails)
- **Anti-Desvío de Tema**: Rechazo automático en el servidor de cualquier solicitud ajena a Metodologías Ágiles o Ingeniería de Software.
- **Anti-Jailbreak**: Blindado frente a intentos de omisión de rol o "modo DAN".
- **Enfoque Orientador**: Sugiere arquitecturas, contratos de datos y casos de prueba en lugar de resolver la programación llave en mano.

### 4.3 Arquitectura Multi-Nivel de IA (Resiliencia Total)
El backend (`server.ts`) orquesta las llamadas con conmutación automática (*failover*):

1. **Tier 1 (Principal)**: **Amazon Bedrock (Converse API)**
   - Modelo: `amazon.nova-lite-v1:0` (latencia ~1.2 s a 1.6 s) con balanceo hacia `amazon.nova-micro-v1:0` y `meta.llama3-70b-instruct-v1:0`.
2. **Tier 2 (Secundario)**: **NVIDIA NIM**
   - Modelo: `meta/llama-3.2-11b-vision-instruct` (~900 ms de latencia).
3. **Tier 3 (Contingencia)**: **Google Gemini**
   - Modelo: `gemini-3.6-flash` con tiempo de espera estricto por intento.
4. **Tier 4 (Motor Local de Cero Caídas)**:
   - Generador pedagógico contextual autónomo que garantiza un **100% de disponibilidad** incluso ante interrupciones de conectividad externa.

---

## 5. Arquitectura de Concurrencia y Persistencia (Firestore)

A partir de la versión 3.0.0, el modelo de datos utiliza colecciones independientes en **Firebase Cloud Firestore**, eliminando condiciones de carrera (*last-write-wins*):

| Colección | Identificador de Documento | Propósito |
| :--- | :--- | :--- |
| `tasks` | `taskId` (numérico/string) | Documentos atómicos de tarea (título, estado, sprint, `assignee_ids`). |
| `projects` | `projectId` | Registro de proyectos, clave única (`key`) y descripción. |
| `members` | `memberId` | Vinculación de usuarios a proyectos específicos con rol asignado. |
| `columns` | `columnId` | Columnas del tablero Kanban con orden y límites WIP. |
| `sprints` | `sprintId` | Sprints planificados, activos y cerrados. |
| `comments` | `commentId` | Comentarios individuales con autor y fecha. |
| `activity_logs` | `logId` | Trazabilidad completa de cambios y auditoría. |
| `users` | `userId` | Cuentas, credenciales seguras, avatar y rol global. |
| `attachments` | `attachmentId` | Metadatos de archivos adjuntos. |

---

## 6. Matriz de Roles y Permisos (RBAC)

| Rol | Identificador | Alcance | Capacidades Principales |
| :--- | :--- | :--- | :--- |
| **Project Manager (Admin)** | `admin` | **Global (Todos los proyectos)** | Control total del sistema: Crear/editar proyectos, administrar usuarios, importación masiva CSV, gestión de columnas, sprints y cualquier tarea. |
| **Product Owner (Docente / Evaluador)** | `po` | **Global (Todos los proyectos)** | Supervisión y creación de Sprints, redacción y priorización de historias/tareas, auditoría de estimaciones. |
| **Frontend Developer** | `frontend` | **Proyectos Asignados** | Crear tareas Frontend, mover tarjetas en el tablero, comentar, registrar criterios BDD y adjuntar archivos en tareas asignadas. |
| **Backend Developer** | `backend` | **Proyectos Asignados** | Crear tareas Backend/API/DB, mover tarjetas en el tablero, comentar, registrar criterios BDD y adjuntar archivos en tareas asignadas. |

---

## 7. Estructura de Archivos del Proyecto

```text
├── firebase-applet-config.json     # Configuración y credenciales de Cloud Firestore
├── firebase-blueprint.json         # Esquema de entidades granulares
├── firestore.rules                 # Reglas de seguridad y control de acceso
├── index.html                      # Documento HTML principal con fuentes monoespaciadas
├── metadata.json                   # Metadatos del applet y capacidades
├── package.json                    # Dependencias (React 18, Vite, Lucide, Tailwind)
├── server.ts                       # Servidor Express Full-Stack con proxies de IA
├── src/
│   ├── App.tsx                     # Enrutador principal y vistas de la app
│   ├── main.tsx                    # Punto de montaje de React
│   ├── index.css                   # Utilidades de Brutalismo Industrial (.brutal-*)
│   ├── types/
│   │   └── jira.ts                 # Interfaces TypeScript, Roles y Permisos RBAC
│   ├── lib/
│   │   ├── firebase.ts             # Instancia de Firebase Cloud Firestore
│   │   └── firestoreService.ts     # CRUD granular y sincronización en tiempo real
│   ├── data/
│   │   └── seedData.ts             # Semillas iniciales de proyectos y usuarios
│   ├── context/
│   │   └── JiraContext.tsx         # Proveedor de estado global y suscripciones onSnapshot
│   └── components/
│       ├── AcademicChatbot.tsx     # Tutor pedagógico flotante (ScrumBot con IA)
│       ├── BacklogView.tsx         # Gestión de Backlog y asignación rápida a Sprints
│       ├── BoardView.tsx           # Tablero Kanban principal con columnas industriales
│       ├── CsvImportModal.tsx      # Modal de importación masiva de usuarios CSV
│       ├── DailyScrumModal.tsx     # Facilitador de Daily Standup estilo DailyToast
│       ├── EditUserModal.tsx       # Edición de credenciales y perfiles de usuario
│       ├── FilterBar.tsx           # Barra de búsqueda y filtros rápidos
│       ├── LoginView.tsx           # Pantalla de autenticación en Brutalismo Industrial
│       ├── ManageUsersModal.tsx    # Consola de administración de usuarios (PM)
│       ├── MemberModals.tsx        # Consulta y gestión de miembros de proyecto
│       ├── MetricsView.tsx         # Métricas de avance Recharts, productividad y filtro por dev
│       ├── Navbar.tsx              # Barra de navegación técnica superior
│       ├── PlanningPokerModal.tsx  # Estimación colaborativa Fibonacci y consenso de puntos
│       ├── ProjectDashboardView.tsx# Dashboard ejecutivo y métricas consolidadas
│       ├── ProjectModals.tsx       # Modales de creación y edición de proyectos
│       ├── ProjectsView.tsx        # Vista general de tarjetas de proyectos
│       ├── ReportsView.tsx         # Gráficas de Burndown, velocidad y distribución
│       ├── RetrospectiveView.tsx   # Tablero ágil de retrospectiva y mejora continua
│       ├── SprintBar.tsx           # Barra de estado y progreso del Sprint activo
│       ├── SprintModal.tsx         # Modal de planificación y lanzamiento de Sprints
│       ├── TaskCard.tsx            # Tarjeta de tarea Kanban de alto contraste
│       └── TaskModal.tsx           # Modal completo de tarea (QA, BDD, comentarios, adjuntos)
```

---

## 8. Variables de Entorno y Seguridad

Las claves de API nunca se exponen en el frontend. Son administradas exclusivamente por `server.ts`:

| Variable | Tipo | Proveedor | Propósito |
| :--- | :--- | :--- | :--- |
| `BEDROCK_API_KEY` | Secreto | **Amazon Bedrock** | Proveedor primario de IA (Bearer Token) |
| `NVIDIA_API_KEY` | Secreto | **NVIDIA NIM** | Proveedor secundario de alta disponibilidad |
| `GEMINI_API_KEY` | Secreto | **Google Cloud** | Proveedor de contingencia para modelos Gemini |
| `PORT` | Configuración | Servidor Local / Cloud | Puerto de ejecución (por defecto `3000`) |

### Comandos de Compilación y Ejecución
```bash
# Instalación de dependencias
npm install

# Servidor de desarrollo con backend integrado
npm run dev

# Verificación de tipos TypeScript
npm run lint

# Compilación de producción
npm run build
```
