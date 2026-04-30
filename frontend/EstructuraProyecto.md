# Estructura del Proyecto – Frontend + Backend + Base de Datos

Este proyecto está dividido en tres partes principales:

* frontend/ → aplicación mobile (React Native + Expo)
* backend/ → API y lógica del servidor
* database/ → estructura y control de la base de datos

---

# Estructura General

```
TPMINDGUILD/
├── frontend/
├── backend/
├── database/
├── docs/
└── figma/
```

---

# FRONTEND (React Native + Expo)

Ubicación:

```
frontend/
```

## Estructura

```
frontend/
 ├── App.tsx
 ├── index.js
 ├── package.json
 │
 └── src/
      ├── features/
      ├── components/
      ├── navigation/
      ├── theme/
      ├── hooks/
      ├── store/
      └── utils/
```

---

## Arquitectura: Feature-Based

Cada funcionalidad está aislada:

```
features/
 ├── home/
 ├── auth/
 ├── rooms/
 ├── study/
 ├── village/
 ├── profile/
 └── friends/
```

### Dentro de una feature:

```
home/
 ├── screens/
 │    └── HomeScreen.tsx
 └── components/
      ├── StreakCard.tsx
      └── MissionCard.tsx
```

---

## components/ui/

Componentes globales reutilizables:

```
Card.tsx
Button.tsx
Badge.tsx
ProgressBar.tsx
```

---

## navigation/

Define navegación:

```
AppNavigator.tsx
TabNavigator.tsx
```

---

## theme/

Sistema de diseño:

```
colors.ts
spacing.ts
radius.ts
```

---

## Reglas Frontend

* No usar código de Figma directamente
* No mezclar lógica entre features
* Componentes reutilizables → components/ui
* Componentes específicos → dentro de su feature
* Usar siempre el theme (evitar valores hardcodeados)

---

# BACKEND (API)

Ubicación:

```
backend/
```

## Estructura

```
backend/
 └── src/
      ├── modules/
      │   ├── auth/
      │   ├── users/
      │   ├── rooms/
      │   ├── study/
      │   └── village/
      │
      ├── common/
      │   ├── middleware/
      │   ├── utils/
      │   └── config/
      │
      ├── app.ts
      └── server.ts
```

---

## Concepto

El backend se organiza por módulos (similar a features):

* cada módulo maneja su lógica
* cada módulo puede incluir:

  * controllers
  * services
  * routes

---

## Flujo backend

```
Request → Controller → Service → Database
```

---

# DATABASE

Ubicación:

```
database/
```

## Estructura

```
database/
 ├── schema/
 │    └── schema.sql
 │
 ├── migrations/
 │    └── 001_init.sql
 │
 └── seeds/
      └── seed.sql
```

---

## Qué contiene

* schema/ → definición de tablas
* migrations/ → cambios versionados
* seeds/ → datos iniciales

---

## Relación con backend

El backend:

* consulta la base de datos
* valida lógica
* devuelve datos al frontend

---

# Flujo completo

```
Frontend (React Native)
        ↓
Backend (API)
        ↓
Database (PostgreSQL)
```

---

# DOCS

Ubicación:

```
docs/
```

Contiene:

* reglas de frontend
* definición del producto
* design system

---

# FIGMA

Ubicación:

```
figma/
```

Importante:

* solo referencia visual
* no se usa directamente en código

---

# Objetivo de esta estructura

* Separar responsabilidades
* Facilitar trabajo en equipo
* Escalar sin romper código
* Mantener consistencia
* Integrar herramientas de IA de forma eficiente

---
