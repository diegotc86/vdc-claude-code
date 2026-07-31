# El harness de Ticketflow

Cómo está organizado el harness de IA de este repo, para quien vaya a cambiarlo.
La prueba de este documento: ¿podría alguien que nunca usó Claude Code hacer un
cambio seguro al harness mañana leyendo solo esta página?

## Las capas

| Artefacto | Para qué | ¿Forzado? |
|---|---|---|
| `CLAUDE.md`, `web/CLAUDE.md` | Conocimiento del proyecto, cargado siempre: comandos, convenciones, trampas | consejo |
| `.claude/skills/new-endpoint/` | El procedimiento de endpoints, cargado por demanda | consejo |
| `.claude/commands/` | `/fix-issue <T#>`, `/review-migration <archivo>` | invocación manual |
| `.claude/settings.json` → `permissions` | Reglas allow / ask / deny | **duro** |
| `.claude/settings.json` → `hooks` + `.claude/hooks/*.sh` | typecheck+lint tras cada edición (PostToolUse), rutas congeladas e inmutabilidad de migraciones (PreToolUse), compuerta de finalización con el suite completo (Stop) | **duro** |
| `.claude/agents/` | `code-reviewer`, `db-migration-reviewer` — revisión con contexto independiente | consejo |
| `.mcp.json` + `mcp/ticketflow-db/` | Acceso de lectura a la DB (`list_tables` / `describe_table` / `query`) | solo lectura **por construcción** |
| `.github/workflows/nightly-triage.yml` + `.claude/prompts/` | Agentes como etapa de CI | acotado + merge humano |

Regla para elegir capa: lo que debe valer **siempre** → `CLAUDE.md`. Cómo se hace
**un tipo de tarea** → skill. Un flujo que **yo** invoco → comando. Lo que debe
cumplirse el **100%** de las veces → hook o regla de permisos. Una **capacidad**
que el agente no tiene → MCP. **Independencia de juicio** → subagente.

## Cómo cambiar el harness

1. Motívalo con una entrada del failure journal: qué falló, de qué clase, qué capa.
2. Haz el cambio en el artefacto de esa capa.
3. Re-corre la tarea que falló originalmente, para probar que quedó arreglada.
4. PR como cualquier otro cambio. **Los cambios de harness se revisan como
   código, porque son código.**

Y el paso que casi nadie hace: **borra**. Cada fallo agrega una regla y nadie
quita ninguna; CLAUDE.md llega a 400 líneas, la atención se diluye y empiezan a
aparecer fallos *nuevos* causados por el harness mismo. Cualquier línea que nunca
cambió el comportamiento de forma demostrable es candidata a irse.

## Evals — la red que hace seguro borrar

No puedes mejorar lo que no puedes volver a medir, y no puedes borrar reglas sin
red. `harness-eval/` (pendiente en este repo):

- `cases/*.md` — 6 a 10 prompts de regresión destilados del failure journal:
  cada uno es una tarea que **antes fallaba**. El golden set de un harness de
  código no son "problemas difíciles"; son *tus* problemas.
- `checks/<caso>.sh` — un script determinista de pass/fail por caso, sobre el
  worktree resultante. Propiedades grepeables, no impresiones: nada de SQL crudo
  nuevo en `routes/`, `zod` importado en rutas nuevas, tests en verde, ninguna
  edición bajo `src/legacy/`, numeración de migraciones intacta.
- `run.sh` — por cada caso: worktree fresco,
  `claude -p "$(cat caso)" --dangerously-skip-permissions --max-turns 40 --output-format json`,
  corre el check, registra pass/fail + costo + turnos en `results/<fecha>.json`.

Cuándo correrlo: (a) después de cambios de harness con peso, (b) **antes de
borrar cualquier cosa**, (c) cuando sale una versión nueva del modelo.

Dos advertencias de honestidad: los agentes no son deterministas, así que un solo
caso que cambia de estado es ruido — busca cambios de nivel, o corre los casos
inestables 3 veces. Y no optimices el harness *hacia* el set de evals: es una red
de regresión, no un benchmark que escalar.

## Huecos conocidos

- El workspace `web/` no tiene verificación en `PostToolUse` (el typegen es
  lento; revisar).
- `query` limita filas pero no costo: un join patológico sigue siendo lento.
- El red-teaming de inyección de prompts solo cubre datos sembrados.
- No existe `harness-eval/` todavía: el harness no tiene red de regresión, así
  que hoy no se puede borrar nada con confianza.
