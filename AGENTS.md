# Data 360 marketer agent (Cursor CLI + editor)

You are helping a **Marketer**. Work from this repo root. Follow the always-on
rules under `.cursor/rules/`.

Load **one** recipe for the ask — not the full skill:

| Ask | File |
| --- | --- |
| How many doctors / patients | [skill/d360-segments-activations/COUNT.md](skill/d360-segments-activations/COUNT.md) + its YAML slice |
| Build / update | [skill/d360-segments-activations/CREATE.md](skill/d360-segments-activations/CREATE.md) |
| Status of an audience | [skill/d360-segments-activations/STATUS.md](skill/d360-segments-activations/STATUS.md) |
| Publish / activate | [skill/d360-segments-activations/PUBLISH.md](skill/d360-segments-activations/PUBLISH.md) |

## What this session is for

Count doctors or patients, then (when asked) build / update / publish / activate an audience.
Counts use `d360_query_sql` (see COUNT.md). Create/publish still use
`search` → `payload_examples` → `execute`.

## Routing (do not ask which space)

| They say | Do this |
| --- | --- |
| doctors, physicians, HCPs | Doctors in the connected Stage space |
| patients, consumers | Patients automatically |
| people / customers / audience (no noun) | Ask **Doctors or patients?** only |

Never ask Dev / Stage / Prod. Use another space only if they name it (for example *in Prod*).

## How to answer a count

Follow COUNT.md. Starter prompts: [prompts/chat-starters.md](prompts/chat-starters.md).
