# Workflow de Git

Este documento define cómo trabajar en equipo utilizando Git, con un flujo basado en ramas que permite desarrollo paralelo, controlado y sin conflictos.

---

# Estructura de ramas

Se utilizan tres tipos de ramas:

```id="treebranches"
main → rama estable (producción)
dev → rama de integración
feature/* → desarrollo individual
```

---

## Jerarquía

```id="branchflow"
main
 └── dev
      ├── feature/home-screen
      ├── feature/navigation-tabs
      ├── feature/backend-auth
      └── feature/schema-users
```

---

# Rol de la rama `dev`

La rama `dev` es una rama intermedia entre el desarrollo individual y la versión estable.

```id="devflow"
feature → dev → main
```

---

## Para qué sirve

* Integrar el trabajo de múltiples desarrolladores
* Probar que todas las partes funcionen juntas
* Detectar errores antes de llegar a producción
* Evitar romper la rama `main`

---

## Ejemplo de uso

Supongamos tres desarrolladores trabajando en paralelo:

```id="exampledev"
feature/home-screen
feature/backend-auth
feature/schema-users
```

Cada uno desarrolla su tarea en su propia rama.

Luego, todas las ramas se integran en `dev`:

```id="devresult"
dev = home + backend + database
```

---

## Por qué no usar `main` directamente

Trabajar directamente sobre `main` genera problemas:

* riesgo de romper la aplicación
* conflictos constantes
* falta de control sobre la estabilidad

Por eso `main` debe mantenerse siempre estable.

---

## Concepto clave

```id="devconcept"
main = estable
dev = integración
feature = trabajo individual
```

---

## Cuándo pasar de `dev` a `main`

La rama `dev` se mergea a `main` únicamente cuando:

* todas las features funcionan correctamente
* no hay errores críticos
* el sistema es estable

---

# Regla principal

Las ramas deben representar una tarea concreta, no una tecnología.

---

## Ejemplos correctos

Frontend:

```id="examples1"
feature/home-screen
feature/navigation-tabs
feature/design-system
feature/auth-ui
```

Backend:

```id="examples2"
feature/auth-endpoints
feature/rooms-api
feature/users-module
```

Database:

```id="examples3"
feature/schema-init
feature/users-table
feature/migrations-setup
```

---

## Ejemplos incorrectos

```id="badexamples"
feature/frontend
feature/backend
feature/database
```

Motivo:

* son demasiado generales
* generan conflictos
* no permiten trabajar en paralelo correctamente

---

# Flujo de trabajo

## 1. Actualizar base

```id="step1"
git checkout dev
git pull
```

---

## 2. Crear rama de trabajo

```id="step2"
git checkout -b feature/nombre-de-la-tarea
```

---

## 3. Trabajar y guardar cambios

```id="step3"
git add .
git commit -m "feat: descripcion clara"
git push
```

---

## 4. Integración

El flujo de integración es:

```id="integration"
feature → dev → main
```

---

# Reglas importantes

* No trabajar directamente en `main`
* No trabajar directamente en `dev`
* Siempre usar ramas `feature/*`
* Cada rama debe tener un objetivo claro y acotado
* Evitar ramas grandes o con múltiples responsabilidades

---

# Convención de nombres

Formato:

```id="naming"
feature/<descripcion-corta-en-kebab-case>
```

Ejemplos:

```id="namingexamples"
feature/home-screen
feature/backend-auth
feature/schema-users
```

---

# Convención de commits

Formato:

```id="commits"
tipo: descripcion
```

Tipos recomendados:

```id="types"
feat: nueva funcionalidad  
fix: corrección de error  
refactor: cambio estructural  
```

---

# Primer commit del proyecto

Para inicializar la estructura:

```id="firstcommit"
git checkout -b feature/project-structure
git add .
git commit -m "feat: initial project structure"
git push
```

---

# Objetivo del workflow

* Permitir trabajo en paralelo
* Evitar conflictos entre desarrolladores
* Mantener el código organizado
* Facilitar revisiones (pull requests)
* Asegurar estabilidad en `main`

---
