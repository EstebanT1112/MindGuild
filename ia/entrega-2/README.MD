# Índice de Temas Consultados — Entrega 2 (IA)

## Integrantes del Equipo

* **Rodrigo Castaño** (Asistente de IA principal: Gemini)
* **Esteban Trillo** (Asistente de IA principal: Codex)

---

## Estructura de la Entrega (`/ia/entrega-2/`)

* `doc_tecnica_e2.md`: Documentación técnica consolidada que detalla las decisiones tecnológicas, las arquitecturas modulares del frontend y backend, y las nuevas especificaciones de seguridad e integración del sprint.
* `indice_temas.txt`: Índice referencial de los temas informáticos abordados con asistencia de Inteligencia Artificial para la auditoría técnica de la cátedra.
* `chatGemini.cm`: Registro de interacciones enfocadas en el frontend, la resolución de tipados estrictos en TypeScript, layouts adaptativos en Expo Go, el manejo del hook del temporizador y los componentes reactivos de la billetera y modales.
* `chatCodex.cm`: Registro de interacciones orientadas al backend, la lógica por dominios en Express, el control de repositorios y esquemas relacionales en Supabase para cuestionarios, amigos y transiciones colectivas.

---

## Listado de Habilidades y Temas de IA Utilizados (Skills)

A continuación se detallan las competencias y problemas técnicos resueltos mediante el uso estratégico de asistentes de Inteligencia Artificial durante el ciclo de desarrollo de la Entrega 2:

### 1. Advanced Mobile UI, Modals & Componentization

* **Modularización de Componentes Críticos:** Diseño y segmentación de modales interactivos complejos en React Native puro (`EvidenceUploadModal` y `ReviewPeerSessionsModal`) para capturar y auditar evidencias de estudio mediante control social directo.
* **Diseño Elástico Adaptativo:** Creación de layouts móviles dinámicos para las vistas de la sala en vivo (`LiveRoomScreen`), rankings locales, cuestionarios semanales de la modalidad Battle Royale y el dashboard de la billetera virtual (`src/features/wallet`) sin romper las políticas de diseño web.

### 2. State Management & Focus Restraints

* **Control e Integridad de Sesiones Activas:** Inyección de variables globales de Zustand para congelar por completo los flujos de navegación del cliente móvil cuando el cronómetro se encuentra activo.
* **Intercepción del Ciclo de Vida Nativo:** Programación y acoplamiento de listeners del sistema operativo (`AppState`) dentro del hook customizado `useStudyTimer.ts` para capturar penalizaciones automatizadas, salidas imprevistas a segundo plano y purgado local ante estados inválidos.

### 3. Backend Domain Expansion & Relational Integrity

* **Arquitectura de Software por Dominios:** Extensión del backend de Express para incorporar de forma aislada las rutas, controladores y servicios de los nuevos módulos sociales y económicos: `friends`, `rooms-invitation`, `battle-royale`, `chat` y `wallet`.
* **Esquemas Transaccionales y Triggers en PostgreSQL:** Modelado lógico de tablas en Supabase con llaves foráneas, checks relacionales y triggers síncronos encargados de descartar de forma automática registros inválidos (sesiones de estudio que no superen el umbral mínimo de 30 minutos obligatorios).

### 4. Authentication, Authorization & Security Middlewares

* **Implementación de Identidad Híbrida Segura:** Configuración del flujo de autenticación móvil PKCE integrando Auth0 con la persistencia local de perfiles, unificando inicios de sesión de terceros bajo el mismo correo electrónico.
* **Matriz de Control de Accesos por Rol (RBAC):** Blindaje de endpoints críticos del backend a través de middlewares interceptores especializados encargados de verificar la propiedad de la sala (`verifyRoomAdmin`) antes de autorizar expulsiones o configuraciones administrativas.

### 5. Resilient Networking & Refactoring Decisions

* **Mecanismos de Red Resilientes:** Configuración de interceptores de Axios con políticas de reintento automatizado y retroceso exponencial (*exponential backoff*) ante microcortes de red en dispositivos móviles, aislando errores lógicos de negocio.
* **Reingeniería de Código Heredado (E1):** Transición técnica de un registro de tiempos meramente declarativo simple hacia un ciclo cerrado de validación y certificación por pares con políticas estrictas de invalidación síncrona de caché de datos.
