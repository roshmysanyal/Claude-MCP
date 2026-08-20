---
name: d360-segments-activations
description: >-
  Query and build Salesforce Data 360 doctor (HCP) and patient/consumer
  segments from everyday language. Use when the user asks to count doctors or
  patients, list/read a segment, read its member count, determine whether it is
  published or activated, or build / update / publish / activate a segment for
  any brand. Cursor CLI and the editor both load this pointer; the governed
  recipes live in skill/d360-segments-activations/.
---

# Data 360 segments (project skill pointer)

This folder exists so **Cursor CLI** and the editor auto-discover the skill.
Do **not** copy recipes here.

1. **Count only** (*how many* doctors or patients): read and follow
   [skill/d360-segments-activations/COUNT.md](../../../skill/d360-segments-activations/COUNT.md).
   Load only the YAML **slice** that file names. Do **not** read CREATE / STATUS / PUBLISH / the full skill.
2. **Build / update:** [CREATE.md](../../../skill/d360-segments-activations/CREATE.md)
3. **Status:** [STATUS.md](../../../skill/d360-segments-activations/STATUS.md)
4. **Publish / activate:** [PUBLISH.md](../../../skill/d360-segments-activations/PUBLISH.md)
5. Index / toggles only: [SKILL.md](../../../skill/d360-segments-activations/SKILL.md)
6. Also obey `.cursor/rules/` and the repo-root `AGENTS.md`.

Doctors → connected Stage space (never ask Dev / Stage / Prod). Patients → DTC.
Query Data 360 only. Answer in marketer language, then the Query on Stage.
