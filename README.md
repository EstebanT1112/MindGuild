# MindGuild

MindGuild es una aplicacion movil gamificada de estudio colaborativo y competitivo. El proyecto busca ayudar a estudiantes a sostener habitos de estudio, organizar sesiones, competir en salas, validar progreso con companeros y mejorar el aprendizaje mediante preguntas, rankings, misiones, logros, dashboards y materiales compartidos.

## Descripcion

La app combina tres ejes principales:

- Productividad: sesiones de estudio con temporizador, pausas, evidencias, validacion por pares y seguimiento semanal.
- Competencia social: salas de supervivencia y Battle Royale, rankings individuales y por equipos, jefe semanal, misiones, logros y recompensas.
- Aprendizaje real: quizzes semanales, practica atemporal, preguntas colaborativas, heatmaps de dificultad, dashboards y The Vault para compartir materiales.

MindGuild esta pensada como un MVP academico funcional para grupos de estudio. El frontend se ejecuta con Expo Go y el backend expone una API REST propia que centraliza el acceso a Supabase.

## Funcionalidades principales

- Registro, login con Auth0 y login social con Google.
- Recuperacion de contrasena y vinculacion de identidad social.
- Perfil editable, modo claro local, logros, medallas y wallet.
- Home con racha, misiones, salas favoritas y resumen semanal.
- Salas privadas con codigo de invitacion, invitaciones por amistad y multiples membresias.
- Salas de supervivencia con timer, ranking por tiempo, validacion de sesiones y chat.
- Salas Battle Royale con quiz semanal, preguntas colaborativas, validacion grupal, resultados y quiz atemporal.
- Rankings globales, por sala, de amigos, Q&A, academico, tiempo y jefe semanal.
- Modo cooperativo por equipos dentro de sala.
- Dashboard inteligente global y por sala.
- Heatmaps de dificultad por tema.
- The Vault para cargar, buscar y descargar materiales de estudio.
- Notificaciones internas dentro de la app.
- Wallet interna y tienda de escudos de racha.

## Stack tecnico

### Frontend

- Expo SDK 54
- React Native 0.81
- TypeScript
- React Navigation
- Zustand
- Supabase client para subida/descarga de archivos cuando corresponde
- Expo Secure Store
- Expo Auth Session / Web Browser
- Lucide React Native

### Backend

- Node.js
- Express
- TypeScript
- Supabase JS
- PostgreSQL/Supabase
- Autenticacion con Auth0 y app token propio del backend

### Servicios externos

- Auth0 para autenticacion.
- Supabase para base de datos, persistencia y almacenamiento.
- Expo Go para ejecucion local mobile.

## Estructura del proyecto

```text
TPMINDGUILD/
|-- backend/       API REST, modulos de negocio y acceso a Supabase
|-- frontend/      Aplicacion mobile Expo/React Native
|-- docs/          Documentacion funcional, tecnica y SQL de apoyo
|-- ia/            Evidencias y material de uso de IA por entrega
|-- CHANGELOG.md   Historial consolidado de entregas
`-- README.md      Guia principal del proyecto
```

## Requisitos previos

- Git
- Node.js 20 o superior
- npm
- Expo Go instalado en el celular
- Acceso al proyecto de Auth0
- Acceso al proyecto de Supabase
- PC y celular conectados a la misma red Wi-Fi para probar con Expo Go

## Configuracion del backend

```bash
cd backend
npm install
copy .env.example .env
```

En macOS/Linux:

```bash
cp .env.example .env
```

Configurar `backend/.env` con valores reales:

```env
PORT=3000
APP_TOKEN_SECRET=<SECRETO_LARGO_Y_PRIVADO>
DATABASE_URL=<POSTGRES_CONNECTION_STRING_DE_SUPABASE>
SUPABASE_URL=<SUPABASE_PROJECT_URL>
SUPABASE_ANON_KEY=<SUPABASE_ANON_PUBLIC_KEY>
```

Ejecutar backend en desarrollo:

```bash
npm run dev
```

Compilar backend:

```bash
npm run build
```

## Configuracion del frontend

```bash
cd frontend
npm install
copy .env.example .env
```

En macOS/Linux:

```bash
cp .env.example .env
```

Configurar `frontend/.env` con valores reales:

```env
EXPO_PUBLIC_AUTH0_DOMAIN=<AUTH0_DOMAIN>
EXPO_PUBLIC_AUTH0_CLIENT_ID=<AUTH0_CLIENT_ID>
EXPO_PUBLIC_AUTH0_REDIRECT_PATH=auth/callback
EXPO_PUBLIC_AUTH0_REDIRECT_URI=
EXPO_PUBLIC_SUPABASE_URL=<SUPABASE_PROJECT_URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_PUBLIC_KEY>
```

Ejecutar Expo:

```bash
npm start
```

Tambien se puede iniciar con cache limpia:

```bash
npx expo start -c
```

## Orden recomendado de ejecucion local

1. Instalar dependencias del backend.
2. Crear y completar `backend/.env`.
3. Levantar backend con `npm run dev`.
4. Instalar dependencias del frontend.
5. Crear y completar `frontend/.env`.
6. Levantar Expo con `npm start` o `npx expo start -c`.
7. Abrir la app con Expo Go desde el celular.

## Verificacion

Backend:

```bash
cd backend
npm run build
```

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm run lint
```

## Seguridad y datos sensibles

- No subir archivos `.env` reales.
- Los `.env.example` deben contener placeholders, no credenciales privadas.
- El frontend no accede directamente a la base de datos para operaciones de negocio; consume la API del backend.
- El backend valida sesion mediante token propio de la app y centraliza la persistencia.
- Supabase se usa desde backend y para servicios puntuales configurados, manteniendo las claves reales fuera del repositorio.

## Problemas frecuentes

### Expo Go no conecta con backend

- Verificar que backend este corriendo.
- Confirmar que PC y celular esten en la misma red.
- Revisar firewall de Windows para el puerto `3000`.
- Reiniciar Expo con `npx expo start -c`.

### Callback URL mismatch en Auth0

- Revisar `EXPO_PUBLIC_AUTH0_REDIRECT_URI`.
- Agregar el callback exacto en Auth0 Allowed Callback URLs.
- Verificar el scheme `tpmindguild` en `frontend/app.json`.

### Token expirado o sesion invalida

- Cerrar sesion y volver a iniciar.
- Verificar `APP_TOKEN_SECRET` en backend.
- Confirmar que backend y frontend apunten al mismo entorno.

## Creditos

Proyecto desarrollado por el equipo MindGuild para la entrega final de la materia.

Integrantes:

- Esteban Trillo
- Rodrigo

Herramientas utilizadas:

- Codex para apoyo en implementacion, debugging, documentacion y revision.
- Figma para diseno visual, mockups y wireframes.
- Expo Go para pruebas mobile locales.
- Auth0 y Supabase como servicios externos principales.
