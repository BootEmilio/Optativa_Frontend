# Diagnóstico técnico — Módulo Coordinador de Soporte (UTM Desk)

Documento para el equipo de frontend y para el compañero de backend (MongoDB Atlas).  
Alcance: módulo Next.js en `opt_front/`. No incluye el login HTML de la raíz del repositorio (`index.html` / `script.js`).

**Fecha del análisis:** 24 de octubre de 2026.  
**Estado del código analizado:** datos 100 % simulados en memoria.  
**Fase 2:** las correcciones de bugs visibles y de preparación de API se documentan al final (sección 8).

---

## 1. Estructura actual

Árbol relevante (una línea por archivo):

```
opt_front/
├── app/
│   ├── layout.tsx                          # Layout raíz (fuentes Geist, metadata genérica de create-next-app).
│   ├── page.tsx                            # Home de Next.js; NO es el módulo coordinador.
│   ├── globals.css                         # Tailwind 4 + tokens de color institucionales.
│   └── coordinador/
│       ├── layout.tsx                      # Shell del módulo: Sidebar + Header + área de contenido.
│       ├── page.tsx                        # Dashboard: métricas, casos prioritarios, actividad reciente.
│       └── incidencias/
│           ├── page.tsx                    # Catálogo de incidencias (tabla/tablero + filtros).
│           └── [id]/page.tsx               # Detalle: prioridad, técnico, tags, timeline, auditoría.
├── components/coordinador/
│   ├── Sidebar.tsx                         # Navegación del módulo (panel, listado, pendientes, auditar).
│   ├── Header.tsx                          # Barra superior con campus y usuario coordinador.
│   ├── Icons.tsx                           # Iconos SVG locales (sin librería de iconos).
│   ├── IncidentTable.tsx                   # Filtros, búsqueda, vista tabla/tablero y acciones rápidas.
│   ├── TicketCard.tsx                      # Tarjeta de ticket para la vista tablero.
│   ├── AssignTecnicoModal.tsx              # Modal de asignar/reasignar técnico.
│   ├── CloseTicketModal.tsx                # Modal de cerrar o reabrir ticket.
│   ├── TagManager.tsx                      # Alta/baja de etiquetas técnicas.
│   └── Timeline.tsx                        # Historial de seguimiento cronológico.
├── services/
│   └── coordinadorService.ts               # “API” falsa: estado en memoria + latencia simulada.
├── data/
│   └── mockCoordinadorData.ts              # Semilla: coordinador, técnicos e incidencias.
├── types/
│   ├── incidencia.ts                       # Dominio de tickets (estado, prioridad, historial, filtros).
│   └── usuario.ts                          # Usuario, roles, permisos y técnico disponible.
├── package.json                            # Next 16.4.2, React 19.3, Tailwind 4, TypeScript 5.
└── next.config.ts                          # Configuración Next (cacheComponents, turbopack CSS).
```

Rutas de usuario:

| Ruta | Pantalla |
|---|---|
| `/` | Plantilla de Next.js (fuera del módulo). |
| `/coordinador` | Panel de supervisión. |
| `/coordinador/incidencias` | Catálogo. Query `?estado=` prefiltra. |
| `/coordinador/incidencias/[id]` | Detalle (acepta `_id` o `codigo` vía el servicio mock). |

No hay `middleware.ts`, ni rutas `app/api/**`, ni autenticación en Next.

---

## 2. Qué tan listo está para recibir backend

### Lo que está bien

- El dominio está tipado (`Incidencia`, `Usuario`, `TecnicoDisponible`, filtros, acciones de historial).
- Hay una única fachada de datos (`coordinadorService`) con métodos async. Las pantallas no leen el array mock directo (salvo el Header).
- Las mutaciones ya tienen forma de “intención + comentario”: asignar, prioridad, cerrar, reabrir, tags.
- Los `_id` del mock parecen ObjectId de Mongo (24 hex), útiles como contrato de identificador.
- Las páginas del módulo son Client Components, lo que simplifica sustituir el servicio por `fetch` sin reescribir layouts.

### Lo que impide (o retrasa) la conexión

1. **No hay URL, cliente HTTP ni flag de mocks.** El servicio importa `data/mockCoordinadorData.ts` y muta arrays de módulo.
2. **El cliente fabrica lo que debería fabricar el servidor:** estado nuevo, entrada de historial, `autor`, `usuario_id`, `fecha`, `fecha_cierre`.
3. **El Header lee `mockCoordinadorActual` directo.** La sesión no pasa por el servicio.
4. **No hay autenticación.** No hay token, cookie, `Authorization` ni “usuario actual”. Los permisos existen solo como tipos/comentarios.
5. **Listados completos en un round-trip.** Sin paginación ni query params reales (el listado pide todo y filtra en el navegador).
6. **Estado de mutaciones no sobrevive un refresh** (memoria de módulo). Eso es esperado en mock, pero el backend debe devolver el documento actualizado completo para que la UI siga funcionando igual (`onAssigned` / `setIncidencia(actualizada)`).
7. **`incidencias_activas` de técnicos no se recalcula** al asignar. Si el backend lo calcula, el frontend debe leer el valor del servidor, no mantenerlo.

Conclusión: la UI está acoplada a **firmas de servicio**, no a Mongo. Eso es recuperable. Lo que falta es contrato HTTP + dejar de escribir historial en el cliente.

---

## 3. Inventario de acciones del coordinador

Fuente: `opt_front/services/coordinadorService.ts`.  
Los permisos citados son los del tipo `PermisoCoordinador` en `types/usuario.ts`. **Hoy no se validan en UI ni en el mock.**

### 3.1 `getIncidencias(filtros?)`

| | |
|---|---|
| **Quién lo usa** | Dashboard (`page.tsx`) sin filtros, para armar “casos prioritarios”. Listado (`incidencias/page.tsx`) sin filtros; `IncidentTable` vuelve a filtrar en cliente. |
| **Envía** | Opcional: `estado`, `prioridad`, `categoria`, `busqueda`. El listado **no** pasa filtros al servicio. |
| **Devuelve** | `Incidencia[]` ordenada por `fecha_creacion` descendente. |
| **Lógica que hoy hace el cliente y debería hacer el servidor** | Filtro, búsqueda y orden. El mock ya los implementa, pero la pantalla no los usa. |
| **Permiso** | `incidencias:ver_area` |

### 3.2 `getIncidenciaById(idOrCodigo)`

| | |
|---|---|
| **Quién lo usa** | Detalle `[id]/page.tsx`. |
| **Envía** | Segmento de ruta (hoy `_id` en los links). El mock también acepta `codigo`. |
| **Devuelve** | `Incidencia` o `null`. |
| **Lógica de servidor** | Lookup por `_id` (y, si se acuerda, por código). |
| **Permiso** | `incidencias:ver_area` |

### 3.3 `getTecnicosDisponibles()`

| | |
|---|---|
| **Quién lo usa** | `AssignTecnicoModal` al abrir. |
| **Envía** | Nada. |
| **Devuelve** | `TecnicoDisponible[]` (`_id`, nombre, especialidad, `incidencias_activas`, etc.). |
| **Lógica de servidor** | Listar técnicos activos y contar incidencias abiertas/en proceso/reabiertas. |
| **Permiso** | Implícito con `incidencias:asignar_tecnico` / `reasignar_tecnico`. |

### 3.4 `asignarTecnico(incidenciaId, tecnicoId, comentarioPersonalizado?)`

| | |
|---|---|
| **Quién lo usa** | `AssignTecnicoModal` (desde detalle, tabla y tablero). |
| **Envía (intención)** | IDs de incidencia y técnico + comentario opcional. |
| **Devuelve** | `Incidencia` actualizada. |
| **Lógica que el mock hace en cliente y debe hacer el servidor** | Resolver técnico; decidir si es asignación o reasignación; si estado era `abierta` → `en_proceso` (otros estados se conservan); pushear historial (`asignacion` / `reasignacion`) con autor = coordinador autenticado y `fecha` ISO; setear `tecnico_asignado`. |
| **Permiso** | `incidencias:asignar_tecnico` o `incidencias:reasignar_tecnico` |

### 3.5 `establecerPrioridad(incidenciaId, nuevaPrioridad, motivo?)`

| | |
|---|---|
| **Quién lo usa** | Detalle, botones baja/media/alta/critica. |
| **Envía** | ID, `PrioridadIncidencia`, motivo opcional. |
| **Devuelve** | `Incidencia` actualizada. |
| **Lógica de servidor** | Actualizar `prioridad`; historial `cambio_prioridad` con autor/fecha; no cambia estado. |
| **Permiso** | `incidencias:establecer_prioridad` |

### 3.6 `cerrarIncidencia(incidenciaId, comentarioAuditoria)`

| | |
|---|---|
| **Quién lo usa** | `CloseTicketModal` (detalle y listado si está `resuelta`). |
| **Envía** | ID + comentario (el mock acepta vacío y pone texto por defecto). |
| **Devuelve** | `Incidencia` con `estado: 'cerrada'` y `fecha_cierre`. |
| **Lógica de servidor** | Validar transición (debe ser `resuelta`); historial `cierre`; `fecha_cierre`; autor de sesión. El mock **no valida** el estado origen. |
| **Permiso** | `incidencias:cerrar` (y en la práctica `incidencias:auditar_resueltas`) |

### 3.7 `reabrirIncidencia(incidenciaId, motivoReapertura)`

| | |
|---|---|
| **Quién lo usa** | `CloseTicketModal`. |
| **Envía** | ID + motivo (obligatorio en UI si modo reabrir). |
| **Devuelve** | `Incidencia` con `estado: 'reabierta'`. |
| **Lógica de servidor** | Validar origen (`cerrada` o, si se acuerda, `resuelta` rechazada); historial `reapertura`; no borra `fecha_cierre` en el mock (confirmar si el servidor la anula). |
| **Permiso** | `incidencias:reabrir` |

### 3.8 `agregarTag(incidenciaId, tag)` / `eliminarTag(incidenciaId, tag)`

| | |
|---|---|
| **Quién lo usa** | `TagManager` en el detalle. |
| **Envía** | ID + string de etiqueta (el mock hace `trim().toLowerCase()`). |
| **Devuelve** | `Incidencia` con `tags` y un evento `cambio_tags` en historial. |
| **Lógica de servidor** | `$addToSet` / `$pull`; normalización; historial; no duplicar. |
| **Permiso** | `etiquetas:gestionar` |

### 3.9 `getMetricasDashboard()`

| | |
|---|---|
| **Quién lo usa** | Dashboard. |
| **Envía** | Nada. |
| **Devuelve** | `{ pendientesAsignar, enProceso, resueltasAuditar, cerradas, total }`. |
| **Lógica de servidor** | Agregaciones. Hoy: pendientes = `abierta` sin técnico; **enProceso = `en_proceso` OR `reabierta`** (incoherente con el filtro de la card; ver hallazgo H3); resueltas = `resuelta`; cerradas = `cerrada`. |
| **Permiso** | `incidencias:ver_area` |

### 3.10 `getActividadReciente(limite = 5)`

| | |
|---|---|
| **Quién lo usa** | Dashboard (límite 5). |
| **Envía** | Límite numérico. |
| **Devuelve** | Eventos aplanados del historial de todas las incidencias, más recientes primero. |
| **Lógica de servidor** | Query a historial o colección de eventos; no aplanar en el cliente. |
| **Permiso** | `incidencias:supervisar_avances` |

---

## 4. Datos simulados: qué se consume y de dónde

Todo nace en `opt_front/data/mockCoordinadorData.ts`:

| Export | Contenido | Consumidores |
|---|---|---|
| `mockIncidenciasIniciales` | 11 incidencias (4 cerradas históricas + 7 activas en varios estados). | Solo el servicio (copia profunda a `incidenciasState`). |
| `mockTecnicosDisponibles` | 4 técnicos. | Solo el servicio (`tecnicosState`). **`incidencias_activas` es estático.** |
| `mockCoordinadorActual` | Laura Perez Castillo, rol `coordinador_soporte`. | Servicio: autor de cada mutación. **Header:** lectura directa de nombre, apellidos e `area`. |

No hay otros consumidores de `data/`.  
`TagManager` tiene una lista local `ETIQUETAS_SUGERIDAS` (no viene del backend).

---

## 5. Hallazgos (verificados en código)

Clasificación: **bloqueante para backend** / **bug visible** / **menor**.

### H1. `CloseTicketModal`: `modo` no se resincroniza con `incidencia.estado`

**Confirmado. Bug visible.**  
`modo` inicia en `'cerrar'` y no hay `useEffect` al abrir. Si el detalle abre el modal desde una incidencia `cerrada` (“Reabrir Incidencia”), el usuario ve “Autorizar Cierre Final” seleccionado. Un submit accidental **cerraría de nuevo** (el mock no valida el estado origen). Comentario y error tampoco se resetean al reabrir el modal.

### H2. Botón “Auditar y Cerrar” visible en `en_proceso`

**Confirmado. Bug visible.**  
En `[id]/page.tsx` la condición es `estado === 'resuelta' || estado === 'en_proceso'`.  
En `IncidentTable` y `TicketCard` el botón de auditar **sí** está limitado a `resuelta`. Inconsistencia solo en el detalle.

### H3. Métrica “En Proceso” cuenta `reabierta`, el filtro no

**Confirmado. Bug visible.**  
`getMetricasDashboard` suma `en_proceso || reabierta`. La card enlaza a `/coordinador/incidencias?estado=en_proceso`, y `IncidentTable` compara igualdad estricta. INC-2026-0126 (`reabierta`) infla el número y no aparece al hacer clic.

### H4. “Casos prioritarios” incluye `cerrada` crítica

**Confirmado. Bug visible.**  
Filtro del dashboard:

```ts
i.estado === 'abierta' || i.prioridad === 'critica' || i.estado === 'resuelta'
```

INC-2026-0114 está `cerrada` + `critica` y entra en la lista. Una cerrada no debería pedir “atención prioritaria”.

### H5. Falta `catch` en `cargarDatos` (dashboard y listado)

**Confirmado. Bug visible.**  
Dashboard y listado usan `try/finally` sin `catch` ni estado de error. Si el futuro `fetch` falla, `cargando` se apaga y la UI queda vacía o con ceros, sin “Reintentar”. El detalle sí tiene `catch` (mensaje + volver al catálogo), pero no botón de reintento.

### H6. Filtros/búsqueda en memoria; sin paginación

**Confirmado. Menor** (hoy) / **contrato de backend pendiente.**  
`IncidentTable` filtra el array ya cargado. El servicio *podría* filtrar, pero el listado no le pasa `filtros`. No hay `page`/`limit`. Aceptable con ~11 mocks; no aceptable en Atlas con histórico real.

### H7. `usuario_id` opcional en `HistorialSeguimiento`

**Confirmado. Menor** (contrato).  
En `types/incidencia.ts` es `usuario_id?: string`. Los mocks actuales siempre lo envían. El backend debería exigirlo para trazabilidad; el frontend debería tratarlo como requerido cuando exista sesión.

### H8. Otros hallazgos

| ID | Hallazgo | Clase |
|---|---|---|
| H8.1 | `app/coordinador/page.tsx` importa `ShieldCheckIcon` y no lo usa. | Menor |
| H8.2 | `Header` acoplado a mock de sesión. | **Bloqueante para backend** |
| H8.3 | Servicio único sin HTTP / env / endpoints. | **Bloqueante para backend** |
| H8.4 | Permisos tipados pero nunca comprobados. | Menor (hasta que exista auth) |
| H8.5 | Mock de `cerrar`/`reabrir` no valida estado origen. | Bug visible (agrava H1) |
| H8.6 | `incidencias_activas` no se actualiza al asignar. | Menor |
| H8.7 | Home `/` es la plantilla de Next; `public/next.svg` no existe. Fuera del módulo. | Menor |
| H8.8 | Cambio de prioridad en detalle: error solo a `console.error`, sin mensaje en UI. | Menor |
| H8.9 | `TagManager` no sincroniza si cambia la prop `tags` desde el padre. | Menor |
| H8.10 | No hay tipos `any`. | Descartado |
| H8.11 | Rutas internas `/coordinador/**` coherentes; evidencias apuntan a `storage.example.test` (rotas a propósito). | Menor |
| H8.12 | Paleta mezclada (`#27153D` vs `#1D3557` / `#2d3b4f`). Cosmético. | Menor |

---

## 6. Lo que necesito del backend (checklist)

Para reemplazar mocks hace falta confirmar cada ítem. Las rutas de la columna “propuesta frontend” son las que quedarán en `config/endpoints.ts` hasta que backend envíe las definitivas.

### 6.1 URL base y autenticación

- [ ] URL base de API (dev / prod). El frontend usará `NEXT_PUBLIC_API_URL` (sin slash final).
- [ ] ¿CORS habilitado para el origen de Next (`localhost:3000`)?
- [ ] Formato de auth: ¿`Authorization: Bearer <token>` o cookie httpOnly?
- [ ] Cómo obtiene el frontend el token (login aún no existe en Next).
- [ ] Endpoint de **usuario actual** (sesión): método, ruta, forma de `Usuario`.
- [ ] Qué ocurre con 401/403 (mensaje, refresh, redirect a login).

### 6.2 Rutas propuestas por acción

Hasta confirmación, el frontend asume prefijo `{API_URL}`:

| Acción frontend | Propuesta | Body / query |
|---|---|---|
| Listar incidencias | `GET /coordinador/incidencias` | `estado`, `prioridad`, `categoria`, `busqueda`, `page`, `limit` |
| Detalle | `GET /coordinador/incidencias/:id` | — |
| Asignar/reasignar | `POST /coordinador/incidencias/:id/asignar` | `{ tecnicoId, comentario? }` |
| Prioridad | `PATCH /coordinador/incidencias/:id/prioridad` | `{ prioridad, motivo? }` |
| Cerrar | `POST /coordinador/incidencias/:id/cerrar` | `{ comentario }` |
| Reabrir | `POST /coordinador/incidencias/:id/reabrir` | `{ motivo }` |
| Agregar tag | `POST /coordinador/incidencias/:id/tags` | `{ tag }` |
| Quitar tag | `DELETE /coordinador/incidencias/:id/tags/:tag` | — |
| Técnicos | `GET /coordinador/tecnicos` | — |
| Métricas | `GET /coordinador/metricas` | — |
| Actividad | `GET /coordinador/actividad?limite=5` | — |
| Sesión | `GET /auth/me` | — |

- [ ] Confirmar o reemplazar cada ruta (método + path).
- [ ] Confirmar si el detalle busca solo por `_id` o también por `codigo`.

### 6.3 Forma de respuestas y errores

- [ ] ¿El documento de incidencia se devuelve plano (`Incidencia`) o envuelto (`{ data: Incidencia }`)?
- [ ] Listas: ¿array crudo o `{ items, total, page, limit }`?
- [ ] Error JSON: campos (`message`, `error`, `code`, `details`).
- [ ] Códigos: 400 validación, 401/403 auth, 404 no encontrada, 409 transición ilegal, 500.

El frontend tipará `Incidencia` como en `types/incidencia.ts`. Cualquier nombre distinto (`id` vs `_id`, `createdAt` vs `fecha_creacion`) hay que mapearlo.

### 6.4 Paginación y filtros

- [ ] ¿Las listas vienen paginadas? ¿Query `page` (1-based) y `limit`?
- [ ] ¿El servidor aplica `estado` / `prioridad` / `categoria` / texto?
- [ ] ¿`estado=en_proceso` incluye `reabierta` o son estados distintos? (El frontend, tras Fase 2, los trata **distintos**.)

### 6.5 Transiciones de estado (servidor)

Flujo que el frontend asume después de Fase 2:

```
abierta --asignar--> en_proceso --(técnico resuelve)--> resuelta --cerrar--> cerrada
                \                                          |
                 \                                         +--reabrir--> reabierta
                  \                                                      |
cerrada --reabrir--> reabierta --(trabajo)--> resuelta ...               +--reasignar (estado se conserva)
```

- [ ] ¿Solo se cierra desde `resuelta`? (El frontend dejará de ofrecer cierre en `en_proceso`.)
- [ ] ¿Se puede reabrir desde `resuelta` (auditoría rechazada) además de `cerrada`?
- [ ] ¿Asignar desde `abierta` pasa siempre a `en_proceso`?
- [ ] ¿Reasignar en `reabierta` / `en_proceso` conserva el estado?
- [ ] ¿Quién pasa a `resuelta`? (Módulo técnico; este frontend no lo hace.)

### 6.6 Campos que calcula el servidor (el cliente NO debe enviarlos)

- [ ] `historial_seguimiento[]` (fecha, usuario_id, autor, accion, estado_nuevo, comentario).
- [ ] `fecha_cierre` / `fecha_resolucion`.
- [ ] `estado` resultante de cada acción.
- [ ] `tecnico_asignado` hidratado (nombre, correo) a partir de `tecnicoId`.
- [ ] `incidencias_activas` por técnico.
- [ ] Métricas del dashboard.
- [ ] Autor = usuario del token, no un id mandado por el cliente.

El cliente en modo API solo envía la **intención** (ids, comentario, prioridad, tag).

---

## 7. Resumen ejecutivo para backend

El módulo ya habla un idioma de tickets (estados, prioridades, tres categorías, historial).  
Para conectar Atlas hace falta: **auth + usuario actual**, **rutas REST confirmadas**, **documento `Incidencia` estable**, **paginación**, y que **el servidor escriba historial y transiciones**. El frontend, en Fase 2, deja de inventar esos campos cuando `NEXT_PUBLIC_USE_MOCKS=false`.

---

## 8. Estado de hallazgos tras Fase 2 (frontend)

Correcciones aplicadas el 24 de octubre de 2026. El módulo sigue en **mocks por defecto** (`NEXT_PUBLIC_USE_MOCKS` distinto de `false`).

Nuevo método público: `coordinadorService.getUsuarioActual()` (sesión). En mock devuelve `mockCoordinadorActual`; en API llama `GET /auth/me`.

| ID | Hallazgo | Estado |
|---|---|---|
| H1 | CloseTicketModal modo desfasado | **Resuelto.** Al abrir se resetea comentario/error y el modo: `cerrada` → reabrir; `resuelta` → cerrar. Opciones visibles según estado (`resuelta`: cerrar y reabrir; `cerrada`: solo reabrir). |
| H2 | Auditar y Cerrar en `en_proceso` | **Resuelto.** El detalle solo muestra el botón si `estado === 'resuelta'`. |
| H3 | Métrica En Proceso vs filtro | **Resuelto.** `enProceso` cuenta solo `en_proceso`. `reabierta` se ve con el filtro `?estado=reabierta` o “Todos”. |
| H4 | Prioritarios incluyen `cerrada` | **Resuelto.** Se excluye `estado === 'cerrada'`. |
| H5 | Sin catch / Reintentar | **Resuelto.** Dashboard, listado y detalle muestran `LoadError` + Reintentar. |
| H6 | Filtros en memoria / sin paginación | **Pendiente.** El servicio API ya puede enviar query params, pero el listado sigue pidiendo el conjunto completo. Esperar paginación del backend. |
| H7 | `usuario_id` opcional | **Pendiente.** Confirmar con backend si el historial lo exige. |
| H8.1 | Import sin usar | **Resuelto.** Se quitó `ShieldCheckIcon` del dashboard. |
| H8.2 | Header con mock directo | **Resuelto.** `CoordinadorSessionProvider` + `useSession()`. |
| H8.3 | Sin HTTP / env / endpoints | **Resuelto.** `config/endpoints.ts`, `.env.example`, `lib/httpClient.ts`, fachada dual en `coordinadorService`. |
| H8.4 | Permisos no aplicados | **Pendiente.** Requiere autenticación real. |
| H8.5 | Mock no valida transición | **Resuelto.** Cerrar solo desde `resuelta`; reabrir desde `cerrada` o `resuelta`. |
| H8.6 | `incidencias_activas` estático | **Pendiente.** Lo debe calcular el servidor. |
| H8.7 | Home Next / svg faltante | **Pendiente.** Fuera del alcance del módulo coordinador. |
| H8.8 | Error de prioridad solo en consola | **Resuelto.** Mensaje en la tarjeta de prioridad del detalle. |
| H8.9 | TagManager no sync de props | **Pendiente.** No bloquea la demo. |
| H8.12 | Paleta inconsistente | **Pendiente.** No se cambió el diseño a propósito. |
