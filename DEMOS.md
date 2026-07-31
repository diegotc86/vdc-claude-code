# Demos del bloque 5 — "el resto del mapa"

Las tres capas que en el workshop **se ven funcionando pero no se escriben**.
Todo lo que necesitas ya está en esta rama; esto es la chuleta de comandos.

## Preparación (una sola vez, antes de la sesión)

```bash
git checkout demos
npm install                    # instala también el workspace mcp/ticketflow-db
docker compose up -d
npm run db:migrate --workspace server && npm run db:seed --workspace server
npm run typecheck              # debe pasar, incluido el server MCP
```

Verifica el servidor MCP por fuera de Claude Code antes de confiar en él en vivo:

```bash
npm run inspect --workspace @ticketflow/mcp-db     # abre el MCP Inspector
```

Y dentro de Claude Code:

```
claude
> /mcp                         # debe listar ticketflow-db con sus 3 herramientas
```

## Demo 1 — MCP: el bug que vive en los datos (≈4 min)

El punto: el agente tiene archivos y bash, y con eso **no alcanza**. T6 es un
reporte de soporte cuya causa no está en el código.

```
claude
> Ticket #23 shows the wrong assignee in the UI, and a few others look wrong
  too. Nobody knows which others.
```

Lo que se ve: `list_tables` → `describe_table tickets` / `agents` → un `query`
con un join filtrando por `active = false` → **tickets 23, 29 y 35 asignados a
personal inactivo**. El código está bien; los datos son inconsistentes.

Puntos para narrar mientras corre:

- Las descripciones de herramientas dirigen el **flujo de trabajo**, no solo la
  llamada: "use list_tables first if unsure" ahorra round trips fallidos.
- La regla de permisos más limpia que existe: **no hay herramienta de escritura
  que gatear, por construcción**. Compáralo con darle `psql` por bash.
- Si el agente elige el arreglo en silencio, eso es una entrada del journal:
  T6 nunca dijo qué significa "arreglado" (fallo de especificación, clase 1).

Contraste opcional si sobra tiempo: `> usa psql por bash para averiguar lo mismo`
— funciona, y se ve por qué no quieres eso (connection string a mano, sin
affordances de schema, nada que impida un `DELETE`).

## Demo 2 — Subagente: revisión con contexto independiente (≈3 min)

```
claude
> Usa el subagente code-reviewer sobre server/src/routes/tickets.ts tal como está.
```

Debe pescar el SQL crudo en la ruta y la validación manual, **citando la regla**
de CLAUDE.md en cada hallazgo.

La frase que importa: *el contexto principal acaba de escribir el código y está
anclado en su propio razonamiento; la revisión independiente necesita un contexto
independiente.* Eso no se consigue con "ahora revisa tu propio trabajo".

Los dos costos, dichos en voz alta: el subagente arranca en blanco (no conoce lo
que descubriste en esta sesión) y no puedes dirigirlo a mitad de vuelo — el
resultado llega como un resumen que tienes que confiar o verificar.

Nota sobre `tools:` en el frontmatter: es una frontera de permisos. Un revisor
que **no puede** editar no "arregla" cosas a mitad de la revisión.

## Demo 3 — Headless: el mismo harness para humanos y pipelines (≈3 min)

```bash
claude -p "How many raw SQL statements remain in server/src/routes/?" \
  --allowedTools "Read,Grep,Glob" \
  --output-format json | jq '{result, num_turns, total_cost_usd}'
```

Lo que hay que decir: **CLAUDE.md se cargó, los hooks corrieron, las reglas de
permisos aplicaron, el servidor MCP se conectó**. Idéntico a la sesión
interactiva. Ese es el pago de poner el harness en archivos y no en tus hábitos.

Después muestra `.github/workflows/nightly-triage.yml` en pantalla y recorre solo
tres cosas:

1. El prompt vive en un **archivo versionado** (`.claude/prompts/nightly-triage.md`),
   no incrustado en el YAML: se revisa como código.
2. Está **acotado**: `--max-turns 40`, timeout del workflow, herramientas
   restringidas por etapa.
3. El agente **abre un PR, nunca empuja a main**. La revisión pasa de por-acción
   a por-resultado; no desaparece.

Y la conexión con el ejercicio 2: sin el Stop gate, este pipeline abre PRs que no
pasan CI. Un PR de agente que no pasa CI es ruido.

Flags que vale mencionar de pasada: `--output-format stream-json` para logs en
vivo, `--resume <session_id>` para pipelines de varias etapas con contexto
compartido, `--permission-mode plan` para la postura de solo lectura.

## Plan B

Si la API o Docker fallan en vivo: ten una grabación de estas tres demos. La
estructura predicción → grabación → discusión funciona casi igual de bien, y son
los tres bloques del workshop que menos dependen de escribir en el momento.
