# harness-lab — Workshop "Harness Engineering"

Repositorio de ejercicios del workshop. **Ticketflow** es una app de mesa de
ayuda deliberadamente imperfecta: Express + PostgreSQL en `server/`, React
Router v8 (framework mode) en `web/`. Validación inconsistente, SQL crudo en
unas rutas y capa de servicios en otras, un módulo legacy congelado, tests
delgados y convenciones que solo viven en la cabeza de la gente.

Eso es el punto. **La regla del workshop: tú no escribes código de aplicación.**
El agente lo escribe; tú construyes el sistema que lo hace confiable. Cuando
falla, arreglas el harness, no el diff.

> Durante la sesión (virtual, 60 min) el facilitador construye el harness en
> vivo — clonar este repo y seguirlo en paralelo es **opcional**. Después de la
> sesión es tu material de tarea: ver [`EJERCICIOS.md`](EJERCICIOS.md).

## Setup

```bash
npm install
docker compose up -d                      # Postgres 16 en el puerto 5433
cp server/.env.example server/.env
npm run db:migrate --workspace server
npm run db:seed --workspace server
npm run typecheck && npm run lint && npm test   # los tres deben pasar antes de empezar
```

Requisitos: Node.js >= 22, Docker, `jq` (lo usan los hooks del ejercicio 2) y
Claude Code instalado (`npm i -g @anthropic-ai/claude-code`).

Los tests son unitarios y **no necesitan la base de datos**. Postgres solo se
necesita para correr la app y para la demo de MCP.

```bash
npm run dev                    # API en :3001
npm run dev --workspace web    # web en :3000 (opcional para casi todo)
```

## Flujo de ramas

`main` es la app **sin harness**: no hay `CLAUDE.md` ni `.claude/`. Cada rama
agrega una capa sobre la anterior, así que el diff de cada una es exactamente
lo que se escribió en vivo en ese bloque del workshop.

```
main ──► ex01-claude-md ──► ex02-hooks ──► ex03-skills ──► demos
 │         CLAUDE.md          hooks +        skill +        MCP + subagentes +
 │         web/CLAUDE.md      permisos       comandos       CI + HARNESS.md
 │
 └──► baseline    T1 hecha por el agente SIN harness (la medición de referencia)
```

| Rama | Qué agrega | Diff útil |
|---|---|---|
| `main` | — (app sin harness) | punto de partida de la tarea |
| `baseline` | El resultado de correr T1 sin harness + `MEDICION-BASE.md` con los fallos clasificados | `git diff main baseline` |
| `ex01-claude-md` | `CLAUDE.md` y `web/CLAUDE.md` | `git diff main ex01-claude-md` |
| `ex02-hooks` | `.claude/settings.json` (hooks + permisos) y `.claude/hooks/*.sh` | `git diff ex01-claude-md ex02-hooks` |
| `ex03-skills` | `.claude/skills/new-endpoint/` y `.claude/commands/*.md` | `git diff ex02-hooks ex03-skills` |
| `demos` | `.mcp.json` + `mcp/ticketflow-db/`, `.claude/agents/`, workflow de CI, `HARNESS.md` | `git diff ex03-skills demos` |

El harness completo construido en vivo:

```bash
git diff main ex03-skills -- CLAUDE.md web/CLAUDE.md .claude/
```

Los artefactos del harness están en inglés, igual que el resto del repo (el
modelo los lee, y así el diff queda comparable con el repo de la currícula).

## Estructura

```
server/
  src/index.ts            bootstrap de Express
  src/db.ts               pool de pg
  src/routes/             tickets.ts, customers.ts, agents.ts
  src/services/           ticketService.ts (el patrón "correcto" — no usado en todas partes)
  src/legacy/             ticketUtils.cjs — congelado, no extender
  migrations/             SQL numerado, aplicado en orden por db:migrate
  test/                   vitest (sin DB)
web/
  app/routes/             rutas de React Router v8 en framework mode
```

Trampas que el repo **no** documenta (y que el harness sí debe documentar):
`agents` = **personal humano de soporte**, no agentes de IA. Postgres está en
**5433**, no en 5432. `ticketService.TRANSITIONS` tiene un bug conocido (permite
`closed → open` directo). Los datos sembrados traen una inconsistencia
deliberada. Ninguna de estas cosas es descubrible leyendo un solo archivo — y
ahí está el trabajo.

## Comandos de verificación

Los que van a correr tus hooks:

```bash
npm run typecheck   # tsc en los workspaces
npm run lint        # eslint (server)
npm test            # vitest, sin DB
```

## El backlog

[`BACKLOG.md`](BACKLOG.md) lista las tareas que se le dan a Claude Code. No las
hagas a mano.
