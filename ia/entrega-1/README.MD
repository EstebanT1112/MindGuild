# Índice de Temas Consultados — Entrega 1 (IA)

## 👥 Integrantes del Equipo
- **Rodrigo Castaño** (Asistente de IA principal: Gemini)
- **Esteban Trillo** (Asistente de IA principal: Codex)

---

## 📂 Estructura de la Entrega (`/ia/entrega-1/`)
- `chatGemini.cm`: Registro de interacciones enfocadas en UI/UX móvil, maquetado de vistas, tipado estricto en el frontend y operaciones avanzadas de Git.
- `chatCodex.cm`: Registro de interacciones orientadas a la arquitectura inicial del proyecto, configuración de entornos locales, scripts de dependencias y conexión de servicios.

---

## 🛠️ Listado de Habilidades y Temas de IA Utilizados (Skills)

A continuación se detallan las competencias y problemas técnicos resueltos mediante el uso estratégico de asistentes de Inteligencia Artificial durante el ciclo de desarrollo de la Entrega 1:

### 1. Software Architecture & Initial Setup
- **Estructuración de Repositorios:** Configuración y modularización de un monorepo dividiendo el alcance en `/backend` (Node.js + Express + TypeScript) y `/frontend` (React Native + Expo Go).
- **Gestión de Dependencias:** Selección y resolución de paqueterías clave en `package.json`, asegurando la compatibilidad de módulos nativos dentro del ecosistema de Expo sin romper el bundler.

### 2. UI/UX & Mobile Navigation Architecture
- **Flujos de Navegación:** Modelado de la transición de estados de pantallas mediante el uso combinado de *Tab Navigation* para el menú principal, *Stack Navigation* (con estrategias de `Reset` para flujos de cierre de sesión) y componentes *Modales*.
- **Optimización de Contenedores en React Native:** Reingeniería de componentes visuales dentro de un `ScrollView` para solucionar problemas de desbordamiento de elementos dinámicos y fijación de botones de acción según el diseño de Figma.

### 3. Backend Development & Service Integration
- **Aislamiento de Lógica Sensible:** Implementación de reglas de negocio en el servidor (validaciones, rankings y recompensas de gamificación) bajo la premisa de no confiar en el cliente móvil.
- **Integración con Proveedores de BaaS:** Configuración e inicialización del cliente de Supabase (PostgreSQL) y manejo de la persistencia de datos.

### 4. Technical Debugging & Troubleshooting
- **Tipado Estricto con TypeScript:** Corrección de fallas de compilación en el tipado de estados globales manejados con Zustand y la propagación de propiedades (`props`) personalizadas en componentes modulares.
- **Diagnóstico de Entornos Colgados:** Identificación y limpieza de cachés corruptos en Metro Bundler mediante banderas de ejecución forzada (`-c`) y resolución de dependencias fantasma (`expo-device`).

### 5. Version Control & Configuration Management (Git)
- **Seguridad en Variables de Entorno:** Configuración correcta del alcance de archivos `.env` a partir de `.env.example` para prevenir la fuga de credenciales privadas de Supabase a repositorios públicos de GitHub.
- **Resolución de Conflictos en Git Bash:** Aplicación de comandos de flujo para unificar ramas de características (`feature/*`) con la rama de desarrollo principal (`dev`), mitigando colisiones de código y estructurando commits semánticos legibles para las Pull Requests.