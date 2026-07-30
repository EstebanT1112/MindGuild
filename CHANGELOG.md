# Changelog - MindGuild

Historial consolidado de cambios del proyecto, organizado por entrega.

## Entrega 1 - Base funcional del producto

### Agregado

- Registro de usuario con Auth0 y persistencia del perfil en backend.
- Inicio y cierre de sesion con carga de perfil dentro de la app.
- Gestion basica de perfil con visualizacion y edicion de datos.
- Creacion de salas privadas con codigo de invitacion unico.
- Union a salas mediante codigo.
- Visualizacion de sala con datos principales e integrantes activos.
- Salida de sala mediante baja logica de membresia.
- Sistema de tiempo con temporizador de estudio.
- Registro de sesiones de estudio.
- Ranking base semanal por tiempo.
- Misiones base para incentivar actividad.
- Logros base desbloqueables por eventos.
- Persistencia de datos en Supabase/PostgreSQL mediante backend propio.

### Resultado

La primera entrega dejo funcionando el flujo principal del MVP: registrarse, iniciar sesion, crear o unirse a una sala, estudiar con temporizador, ver integrantes, abandonar salas y consultar progreso competitivo basico.

## Entrega 2 - Expansion social, competitiva y de recompensas

### Agregado

- Login con Google.
- Recuperacion de contrasena.
- Vinculacion de cuentas por email verificado.
- Modo claro local.
- Perfil publico para amigos.
- Progreso semanal en perfil.
- Sistema de amigos con solicitudes, aceptacion y rechazo.
- Invitaciones de amigos a salas.
- Participacion en multiples salas.
- Salas favoritas.
- Creacion y configuracion de salas Battle Royale.
- Cuestionario semanal con configuracion recurrente.
- Carga de preguntas multiple choice y de desarrollo.
- Respuesta de preguntas de otros usuarios.
- Validacion grupal de preguntas y respuestas.
- Resultado de quiz separado por preguntas propuestas y respondidas.
- Cuestionario atemporal de practica por sala.
- Evidencia y descripcion al finalizar sesiones validas.
- Validacion de sesiones por companeros.
- Timer con inicio inmediato, pausa, reanudacion y modo enfoque.
- Ranking de tiempo, Q&A, academico y jefe semanal.
- Misiones diarias y semanales con vencimiento y recompensas.
- Logros y medallas por niveles bronce, plata y oro.
- Wallet interna con saldo, movimientos y recompensas.
- Tienda de cosmeticos funcionales con escudos de racha.
- Chat interno por sala con polling.
- Optimizacion de consultas con cache en Zustand, TTL, invalidaciones por eventos y pull-to-refresh.
- Gestion administrativa de sala para owner.
- Roles/apodos temporales asignados por jefe semanal.

### Cambiado

- Se refino la salida de sala para bloquear acciones durante sesion activa.
- Se mejoro la actualizacion de salas favoritas y listados.
- Se ajusto el sistema de racha para contemplar estado activo, pendiente, inactivo y protegido.
- Se reemplazo el flujo viejo de sesiones por una logica unificada de estudio y validacion.
- Se mejoro el comportamiento del timer para evitar lentitud y permitir foco.

### Resultado

La segunda entrega amplio MindGuild hacia una app social y competitiva mas completa: amigos, invitaciones, Battle Royale, quiz semanal, validacion por pares, ranking academico, recompensas, wallet, chat y mejor rendimiento de navegacion.

## Entrega 3 - Analitica, colaboracion avanzada y pulido final

### Agregado

- Dashboard inteligente global del usuario.
- Dashboard por sala para Supervivencia.
- Dashboard por sala para Battle Royale.
- Barras de estudio por dia en el resumen semanal.
- Heatmaps de dificultad por tema.
- Clasificacion academica por temas/categorias.
- The Vault como repositorio de materiales por sala.
- Carga, busqueda y descarga de materiales de estudio.
- Prevencion de temas duplicados dentro de The Vault.
- Modo cooperativo por equipos.
- Creacion, eliminacion y gestion de equipos por owner.
- Union de usuarios a equipos.
- Rankings grupales por equipo.
- Visualizacion de equipo en ranking individual.
- Identificacion visual de equipos por color.
- Notificaciones inteligentes dentro de la app.
- Bandeja de notificaciones en perfil.
- Jobs internos para generar notificaciones periodicas.
- Limpieza y marcado rapido de notificaciones.
- Indicadores visuales de invitaciones, mensajes, validaciones y quiz configurado.
- Ranking global y ranking de amigos.
- Mejoras visuales en login, perfil, home, salas, wallet y ranking.
- Alertas personalizadas para reemplazar mensajes genericos.
- Mejoras de navegacion y accesos entre pantallas.

### Cambiado

- Se quitaron referencias visuales a aldea evolutiva del perfil y del alcance final.
- Se ajusto el Home para priorizar salas favoritas, resumen semanal y progreso.
- Se mejoraron los estados visuales de racha con iconos consistentes.
- Se reordeno la interfaz de salas para separar acciones principales, ranking, validaciones, invitaciones y abandono.
- Se unifico informacion y configuracion de sala dentro del modal de datos.
- Se ajusto Battle Royale para reutilizar timer, validaciones de sesiones e invitaciones.
- Se simplifico el estado del quiz semanal.
- Se corrigio el texto final del quiz para cerrar respuestas sin enviar directo a validacion.
- Se corrigio la busqueda global para usar la tabla real de materiales.
- Se ajusto Wallet para precios actualizados de escudos y mejor visualizacion.

### Eliminado o postergado

- Sistema de habilidades desbloqueables eliminado por riesgo de desbalancear la competencia.
- Aldea evolutiva eliminada del alcance final.
- Personaje/mascota 3D eliminado del alcance final por limitaciones de hardware para trabajar con Blender.
- Cosmeticos de avatar postergados.
- Push notifications remotas postergadas hasta contar con deploy/development build.

### Resultado

La tercera entrega consolido MindGuild como producto final: sumo analiticas, heatmaps, materiales compartidos, equipos, notificaciones internas, mejoras visuales y pulido de experiencia, manteniendo el foco en estudio colaborativo, competencia sana y aprendizaje medible.

