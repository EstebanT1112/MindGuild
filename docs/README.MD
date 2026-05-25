# MindGuild - Guia de instalacion y ejecucion

Este documento explica como clonar, configurar y ejecutar el proyecto MindGuild en un entorno local.

## Requisitos previos

Antes de iniciar, instalar:

- Git
- Node.js 20 o superior
- npm
- Expo Go en el celular
- Acceso al proyecto de Supabase
- Acceso a la aplicacion de Auth0 configurada para MindGuild

El proyecto usa:

- Frontend: Expo SDK 54, React Native 0.81.5
- Backend: Node.js, Express y TypeScript
- Base de datos: Supabase/PostgreSQL
- Autenticacion: Auth0

## Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd TPMINDGUILD
```

Reemplazar `<URL_DEL_REPOSITORIO>` por la URL real del repositorio en GitHub.

## Estructura principal

```txt
TPMINDGUILD
|-- backend
|-- frontend
`-- docs
```

- `backend`: API REST del proyecto.
- `frontend`: aplicacion mobile con Expo.
- `docs`: documentacion del proyecto.

## Configurar el backend

Entrar a la carpeta del backend:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Crear el archivo `.env` tomando como base `.env.example`:

```bash
copy .env.example .env
```

En macOS/Linux:

```bash
cp .env.example .env
```

Configurar las variables:

```env
PORT=3000
DATABASE_URL=<URL_DE_CONEXION_POSTGRES_SUPABASE>
SUPABASE_URL=<PROJECT_URL_DE_SUPABASE>
SUPABASE_ANON_KEY=<ANON_PUBLIC_KEY_DE_SUPABASE>
AUTH0_DOMAIN=<DOMINIO_AUTH0>
```

Notas:

- `DATABASE_URL` debe ser la connection string de Supabase/PostgreSQL.
- `SUPABASE_URL` es la Project URL del proyecto en Supabase.
- `SUPABASE_ANON_KEY` es la clave anon/public de Supabase.
- `AUTH0_DOMAIN` debe coincidir con el dominio de Auth0 usado por el frontend.
- No subir el archivo `.env` al repositorio.

Ejecutar el backend en modo desarrollo:

```bash
npm run dev
```

Si todo esta correcto, el backend queda disponible en:

```txt
http://localhost:3000/api
```

Para compilar y ejecutar en modo produccion local:

```bash
npm run build
npm start
```

## Configurar el frontend

Abrir otra terminal desde la raiz del proyecto y entrar a `frontend`:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

El frontend resuelve automaticamente la URL del backend usando el host de Expo y el puerto `3000`.

Cuando se ejecuta con Expo Go en un celular fisico:

- El celular y la PC deben estar conectados a la misma red Wi-Fi.
- El backend debe estar levantado.
- El backend escucha en `0.0.0.0`, por lo que puede recibir conexiones desde el celular.
- En consola se muestra la URL detectada, por ejemplo:

```txt
API_BASE_URL http://192.168.x.x:3000/api
```

Ejecutar Expo:

```bash
npm start
```

Tambien se puede ejecutar directamente:

```bash
npm run android
```

o:

```bash
npm run ios
```

Para usar Expo Go:

1. Abrir Expo Go en el celular.
2. Escanear el QR que muestra la terminal o el navegador de Expo.
3. Verificar que el backend siga levantado en otra terminal.

## Orden recomendado para levantar el proyecto

1. Clonar el repositorio.
2. Instalar dependencias del backend.
3. Configurar `backend/.env`.
4. Ejecutar el backend con `npm run dev`.
5. Instalar dependencias del frontend.
6. Ejecutar el frontend con `npm start`.
7. Abrir la app desde Expo Go.

## Comandos utiles

Backend:

```bash
cd backend
npm run dev
npm run build
npm start
```

Frontend:

```bash
cd frontend
npm start
npm run android
npm run ios
npx tsc --noEmit
```

## Problemas frecuentes

### Expo Go no conecta con el backend

Verificar:

- Que el backend este corriendo.
- Que el celular y la PC esten en la misma red.
- Que la consola del frontend muestre una URL tipo `http://192.168.x.x:3000/api`.
- Que el firewall de Windows no este bloqueando el puerto `3000`.

### Error de conexion a Supabase

Verificar:

- Que `DATABASE_URL` sea correcta.
- Que el proyecto de Supabase no este pausado.
- Que la contrasena de la base de datos este bien escrita y escapada si contiene caracteres especiales.
- Que las tablas del schema usado por el proyecto existan en Supabase.

### Error al iniciar sesion o registrar usuario

Verificar:

- Que Auth0 este configurado.
- Que el dominio y client ID usados por el frontend correspondan a la aplicacion correcta.
- Que el backend pueda validar el token de Auth0.
- Que exista el perfil correspondiente en Supabase.

## Verificacion rapida

Backend:

```bash
cd backend
npm run build
```

Frontend:

```bash
cd frontend
npx tsc --noEmit
```

Si ambos comandos finalizan sin errores, el proyecto compila correctamente.
