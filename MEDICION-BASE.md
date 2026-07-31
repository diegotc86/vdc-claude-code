# Medición base — T1 sin harness

Lo que Claude Code produce cuando se le da **T1** verbatim en `main`, sin
`CLAUDE.md`, sin hooks, sin nada. El diff está en esta rama:

```bash
git diff main baseline -- server/
```

> **Para el facilitador:** este es un baseline de **referencia**, reconstruido a
> partir de los fallos característicos de este repo. En el ensayo previo,
> regenéralo con tu corrida real y commitea *eso* — es más honesto y más
> convincente mostrar tu propio transcript:
>
> ```bash
> git checkout main && git checkout -b baseline
> claude
> > <T1 verbatim>
> # cuando declare listo: git add -A && git commit
> ```
>
> Guarda también el transcript. Los números de abajo (turnos, costo) son los que
> debes reemplazar.

## La tarea, verbatim

> T1 — Add pagination to `GET /api/tickets` (limit/offset, default 20, max 100).
> Include total count in the response.

## Lo que hizo

- Leyó `server/src/routes/tickets.ts` y editó el handler `GET /` directamente.
- No abrió `server/src/services/ticketService.ts`.
- No abrió `server/src/routes/customers.ts`.
- No corrió `typecheck`, `lint` ni `test`.
- No agregó ningún test.
- Declaró la tarea completa, con un resumen correcto de lo que había escrito.

Turnos: ~8. Tiempo: ~90 s.

**Y funciona.** El endpoint pagina. `npm run typecheck && npm run lint && npm test`
pasa en verde. Ese es el punto incómodo: el resultado es *verde y equivocado*.

## Los fallos, clasificados

| # | Qué pasó | Clase | Capa que lo arregla |
|---|---|---|---|
| 1 | SQL de paginación agregado directo en la ruta; no pasó por `ticketService` | conocimiento (2) | `CLAUDE.md` → convención con veredicto |
| 2 | Validó `limit`/`offset` con `parseInt` a mano; `customers.ts` usa zod dos archivos más allá | conocimiento (2) | `CLAUDE.md` → "zod gana; los checks manuales de tickets.ts son el estilo viejo" |
| 3 | Inventó un envelope `{data, total, limit, offset}`. El API devuelve filas crudas — **esto rompe silenciosamente `web/app/api.ts`**, cuyo `fetchTickets` espera un array. Ni tsc ni los tests lo detectan | conocimiento (2) | `CLAUDE.md` → "raw rows today; do not invent envelope formats" |
| 4 | `limit`/`offset` interpolados como string en el SQL en vez de parametrizados | conocimiento (2) | `CLAUDE.md` + subagente revisor |
| 5 | `offset` negativo no se valida → `OFFSET -5` revienta en Postgres | especificación (1) + conocimiento (2) | zod en la skill `new-endpoint` |
| 6 | No corrió typecheck / lint / tests. Nadie se lo pidió | verificación (4) | **hook** `PostToolUse` + Stop gate |
| 7 | No agregó tests para el comportamiento nuevo | verificación (4) | `CLAUDE.md` (definición de "listo") + Stop gate con dientes |
| 8 | Declaró "listo" sin ninguna evidencia de verificación | verificación (4) | hook `Stop` |

Nada de esto es un fallo del modelo. Son ocho cosas que **el sistema no le
dijo** y que ningún ser humano nuevo en el equipo habría sabido tampoco.

## La observación que abre el workshop

Cinco de los ocho fallos son de **conocimiento**: reglas que existen solo en la
cabeza del equipo. Tres son de **verificación**: cosas que el modelo *a veces*
hace y que por lo tanto no se pueden confiar.

Esa proporción no es casualidad: es la razón por la que las dos primeras capas
que se construyen son `CLAUDE.md` (para los de conocimiento) y hooks (para los
de verificación).
