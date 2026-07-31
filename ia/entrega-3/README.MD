# Índice de Temas Consultados — Entrega 3 (IA) — Final

## Integrantes del Equipo
- **Rodrigo Castaño** (Asistente de IA principal: Gemini) — E1, E2, E3
- **Esteban Trillo** (Asistente de IA principal: Codex) — E1, E2, E3

---

## Estructura de la Entrega (`/ia/entrega-3/`)
- `acumuladoGemini.cm`: Archivo acumulado final con TODAS las conversaciones con Gemini de E1 + E2 + E3.
- `acumuladoCodex.cm`: Archivo acumulado final con TODAS las conversaciones con Codex de E1 + E2 + E3.
- `README.MD`: Índice de temas y listado consolidado de skills (E1 + E2 + E3).

---

## Listado Consolidado de Habilidades y Temas de IA Utilizados (Skills)

A continuación se presenta el listado completo y consolidado de competencias y problemas técnicos resueltos mediante el uso estratégico de asistentes de Inteligencia Artificial durante las 3 entregas del proyecto:

---

### ENTREGA 1 (E1) — Fundamentos y Arquitectura Inicial

#### 1. Software Architecture & Initial Setup
- **Estructuración de Repositorios:** Configuración y modularización de un monorepo dividiendo el alcance en `/backend` (Node.js + Express + TypeScript) y `/frontend` (React Native + Expo Go).
- **Gestión de Dependencias:** Selección y resolución de paqueterías clave en `package.json`, asegurando la compatibilidad de módulos nativos dentro del ecosistema de Expo sin romper el bundler.

#### 2. UI/UX & Mobile Navigation Architecture
- **Flujos de Navegación:** Modelado de la transición de estados de pantallas mediante el uso combinado de Tab Navigation para el menú principal, Stack Navigation (con estrategias de Reset para flujos de cierre de sesión) y componentes Modales.
- **Optimización de Contenedores en React Native:** Reingeniería de componentes visuales dentro de un ScrollView para solucionar problemas de desbordamiento de elementos dinámicos y fijación de botones de acción según el diseño de Figma.

#### 3. Backend Development & Service Integration
- **Aislamiento de Lógica Sensible:** Implementación de reglas de negocio en el servidor (validaciones, rankings y recompensas de gamificación) bajo la premisa de no confiar en el cliente móvil.
- **Integración con Proveedores de BaaS:** Configuración e inicialización del cliente de Supabase (PostgreSQL) y manejo de la persistencia de datos.

#### 4. Technical Debugging & Troubleshooting
- **Tipado Estricto con TypeScript:** Corrección de fallas de compilación en el tipado de estados globales manejados con Zustand y la propagación de propiedades (props) personalizadas en componentes modulares.
- **Diagnóstico de Entornos Colgados:** Identificación y limpieza de cachés corruptos en Metro Bundler mediante banderas de ejecución forzada (-c) y resolución de dependencias fantasma (expo-device).

#### 5. Version Control & Configuration Management (Git)
- **Seguridad en Variables de Entorno:** Configuración correcta del alcance de archivos .env a partir de .env.example para prevenir la fuga de credenciales privadas de Supabase a repositorios públicos de GitHub.
- **Resolución de Conflictos en Git Bash:** Aplicación de comandos de flujo para unificar ramas de características (feature/*) con la rama de desarrollo principal (dev), mitigando colisiones de código y estructurando commits semánticos legibles para las Pull Requests.

---

### ENTREGA 2 (E2) — Expansión de Dominios y Robusteces

#### 6. Advanced Mobile UI, Modals & Componentization
- **Modularización de Componentes Críticos:** Diseño y segmentación de modales interactivos complejos en React Native puro (EvidenceUploadModal y ReviewPeerSessionsModal) para capturar y auditar evidencias de estudio mediante control social directo.
- **Diseño Elástico Adaptativo:** Creación de layouts móviles dinámicos para las vistas de la sala en vivo (LiveRoomScreen), rankings locales, cuestionarios semanales de la modalidad Battle Royale y el dashboard de la billetera virtual (src/features/wallet) sin romper las políticas de diseño web.

#### 7. State Management & Focus Restraints
- **Control e Integridad de Sesiones Activas:** Inyección de variables globales de Zustand para congelar por completo los flujos de navegación del cliente móvil cuando el cronómetro se encuentra activo.
- **Intercepción del Ciclo de Vida Nativo:** Programación y acoplamiento de listeners del sistema operativo (AppState) dentro del hook customizado useStudyTimer.ts para capturar penalizaciones automatizadas, salidas imprevistas a segundo plano y purgado local ante estados inválidos.

#### 8. Backend Domain Expansion & Relational Integrity
- **Arquitectura de Software por Dominios:** Extensión del backend de Express para incorporar de forma aislada las rutas, controladores y servicios de los nuevos módulos sociales y económicos: friends, rooms-invitation, battle-royale, chat y wallet.
- **Esquemas Transaccionales y Triggers en PostgreSQL:** Modelado lógico de tablas en Supabase con llaves foráneas, checks relacionales y triggers síncronos encargados de descartar de forma automática registros inválidos (sesiones de estudio que no superen el umbral mínimo de 30 minutos obligatorios).

#### 9. Authentication, Authorization & Security Middlewares
- **Implementación de Identidad Híbrida Segura:** Configuración del flujo de autenticación móvil PKCE integrando Auth0 con la persistencia local de perfiles, unificando inicios de sesión de terceros bajo el mismo correo electrónico.
- **Matriz de Control de Accesos por Rol (RBAC):** Blindaje de endpoints críticos del backend a través de middlewares interceptores especializados encargados de verificar la propiedad de la sala (verifyRoomAdmin) antes de autorizar expulsiones o configuraciones administrativas.

#### 10. Resilient Networking & Refactoring Decisions
- **Mecanismos de Red Resilientes:** Configuración de interceptores de Axios con políticas de reintento automatizado y retroceso exponencial (exponential backoff) ante microcortes de red en dispositivos móviles, aislando errores lógicos de negocio.
- **Reingeniería de Código Heredado (E1):** Transición técnica de un registro de tiempos meramente declarativo simple hacia un ciclo cerrado de validación y certificación por pares con políticas estrictas de invalidación síncrona de caché de datos.

---

### ENTREGA 3 (E3) — Consolidación, Documentación y Entrega Final

#### 11. AI Documentation Consolidation & Metadata Management
- **Consolidación de Habilidades de IA:** Integración y síntesis de los listados de skills de E1 y E2 en un inventario unificado y completo para la entrega final.
- **Gestión de Registros de Conversación:** Organización y estructuración de los archivos .cm de Gemini y Codex a través de las 3 entregas, asegurando la trazabilidad completa de todas las interacciones con asistentes de IA.

#### 12. Codebase Comprehension & Reverse Engineering
- **Exploración y Mapeo de Arquitectura Existente:** Análisis profundo del monorepo para comprender la estructura de directorios, el stack tecnológico (Expo SDK 54, React Native 0.81.5, Express, Supabase, Auth0), el sistema de diseño y las convenciones de código establecidas.
- **Comprensión del Flujo de Trabajo Git:** Análisis de la estrategia de ramas (feature/* -> dev -> main), el historial de commits semánticos y la organización de Pull Requests para documentar el ciclo de desarrollo completo.

#### 13. Technical Writing & Deliverable Generation
- **Redacción Técnica Estructurada:** Creación de documentación académica formal incluyendo índices de temas, listados de habilidades y referencias cruzadas entre entregas.
- **Generación de Artefactos de Entrega:** Empaquetado de todos los entregables académicos (archivos .cm, acumulados, índices) en la estructura de carpetas requerida por la cátedra (/ia/entrega-3/).

#### 14. Feature Ideation & Technical Specification (Codex — Esteban)
- **Definición de Nuevas Funcionalidades:** Colaboración con Codex para detallar y especificar nuevas ideas de features: modo cooperativo por equipos, mejoras en autenticación, perfil público, sistema de amigos, cuestionarios semanales, misiones, logros y medallas.
- **Documentación de Alcance Técnico:** Generación de documentos de especificación técnica (plan-modificaciones-futuras.md) separando requerimientos, impacto en frontend/backend/BD, decisiones técnicas y dudas abiertas.

---

## Índice de Temas Consultados (E1 + E2 + E3)

### Temas de Frontend (React Native + Expo)
1. Arquitectura de componentes feature-based
2. Navegación con React Navigation (Bottom Tabs, Stack, Modales)
3. Sistema de diseño con tokens (Design System)
4. Manejo de estado global con Zustand
5. Zero-Web Policy y componentes nativos (View, Text, Pressable)
6. Modales interactivos y formularios dinámicos
7. Hook personalizado useStudyTimer y ciclo de vida (AppState)
8. Pantallas de perfil, amigos, salas, rankings, billetera, aldea
9. Layouts adaptativos y ScrollView
10. Tipado estricto con TypeScript en props y stores

### Temas de Backend (Node.js + Express + TypeScript)
11. Arquitectura modular por dominios (controllers/services/repositories)
12. Integración con Supabase (PostgreSQL)
13. Autenticación con Auth0 (flujo PKCE)
14. Middlewares de autorización RBAC (verifyRoomAdmin)
15. Endpoints REST para amigos, salas, chat, wallet, rankings
16. Modelado relacional con llaves foráneas y triggers
17. Estrategias de reintento con exponential backoff (Axios interceptors)
18. Validación de sesiones de estudio (umbral mínimo 30 min)

### Temas de Infraestructura y DevOps
19. Configuración de monorepo (backend + frontend)
20. Gestión de variables de entorno (.env, .env.example)
21. Estrategia Git: ramas feature/*, dev, main y Pull Requests
22. Commits semánticos y resolución de conflictos
23. Limpieza de cachés (Metro Bundler) y dependencias fantasma

### Temas de IA y Documentación
24. Registro de conversaciones con asistentes de IA (formato .cm / JSONL)
25. Listado de habilidades y competencias de IA (Skills)
26. Documentación técnica de decisiones tecnológicas
27. Consolidación de entregables académicos
28. Definición y especificación de nuevas funcionalidades con asistencia de IA

---

## Historial de Conversaciones

| Entrega | Asistente | Integrante | Archivo |
|---------|-----------|------------|---------|
| E1 | Gemini | Rodrigo Castaño | `/ia/entrega-1/chatGemini.cm` |
| E1 | Codex | Esteban Trillo | `/ia/entrega-1/chatCodex.cm` |
| E2 | Gemini | Rodrigo Castaño | `/ia/entrega-2/chatGemini.cm` |
| E2 | Codex | Esteban Trillo | `/ia/entrega-2/chatCodex.cm` |

| E1+E2+E3 | Gemini (Acumulado) | Rodrigo Castaño | `/ia/entrega-3/acumuladoGemini.cm` |
| E1+E2+E3 | Codex (Acumulado) | Esteban Trillo | `/ia/entrega-3/acumuladoCodex.cm` |
