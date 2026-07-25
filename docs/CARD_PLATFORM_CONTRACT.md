# Card Platform Contract

This document replaces and extends `HANDOFF_card_layout_system.md` for the modular
card layout platform. Give this to the team building the main History Codex app.

## Overview

Cards are rendered by `@history-codex/card-renderer` (in `packages/card-renderer/`).
Both Manager and the main app should import this package so rendering never drifts.

**Supabase is the data contract.** The package is the render contract.

## Install (main app)

```bash
npm install file:../path/to/packages/card-renderer
# or publish and: npm install @history-codex/card-renderer@0.1.0
```

```tsx
import {
  CardRenderer,
  resolveCardLayout,
  buildRegistry,
  BUILTIN_REGISTRY,
  normalizeLayout,
} from "@history-codex/card-renderer";
import "@history-codex/card-renderer/card.css";
```

## Boot fetch (once, cache)

Load on app start:

| Table | Purpose |
|-------|---------|
| `card_element_types` | Element registry (what can appear on cards) |
| `card_data_fields` | Field registry (column bindings) |
| `card_layout_settings` | Global aspect ratio (`aspect_ratio_w` / `aspect_ratio_h`) |
| `card_layouts` | Layout library |
| `card_layout_assignments` | Default layout per card type |
| `card_renderer_releases` | Optional — which render kinds the main app supports |

```ts
const registry = fieldRows.length
  ? buildRegistry(fieldRows, elementRows)
  : BUILTIN_REGISTRY;
```

## Per-card render

```ts
const layout = resolveCardLayout({
  card: cardDesignData,          // includes optional layoutId
  presets: layoutPresets,        // from card_layouts
  assignments: typeAssignments,  // from card_layout_assignments
  cardLayoutId: row.layout_id,   // characters.layout_id override
});

<CardRenderer
  card={card}
  layout={layout}
  registry={registry}
  aspectRatio={{ w: settings.aspect_ratio_w, h: settings.aspect_ratio_h }}
  resolveImageUrl={yourImageResolver}
  supportedRenderKinds={mainAppSupportedKinds}  // skip unknown kinds gracefully
/>
```

### Layout resolution order

```
characters.layout_id  →  card_layout_assignments[card_type]  →  layout named "Default"
```

SQL:

```sql
select coalesce(c.layout_id, cla.layout_id) as layout_id
from characters c
left join card_layout_assignments cla on cla.card_type = c.card_type
where c.id = $1;
```

## Layout JSON v2

Layouts are stored in `card_layouts.layout` with `schema_version = 2`:

```json
{
  "schema_version": 2,
  "elements": [
    {
      "instance_id": "uuid-or-legacy-key",
      "element_type_id": "badgeAtk",
      "x": 78, "y": 33, "w": 13, "h": 9,
      "visible": true,
      "z": 6
    }
  ]
}
```

Use `normalizeLayout(raw)` to accept legacy v1 fixed-key layouts during migration.

## Element registry

New stats/badges are added via DB rows — no React switch cases if `render_kind`
already exists in the package.

1. `ALTER TABLE characters ADD COLUMN speed integer NOT NULL DEFAULT 0;`
2. Insert `card_data_fields` row
3. Insert `card_element_types` row (`render_kind: stat_badge`, `data_field_id: speed`)
4. Add instance to a layout in Layout Designer

Supported `render_kind` values (v0.1.0):

- `stat_badge`, `chip`, `text`, `image`, `stars`, `rarity_pill`, `computed`

Unknown kinds: skip element, do not crash.

## Renderer release tracking

After upgrading the package in the main app, update:

```sql
update card_renderer_releases
set package_version = '0.1.0',
    supported_render_kinds = array['stat_badge','chip','text','image','stars','rarity_pill','computed'],
    updated_at = now()
where app = 'main';
```

Manager reads this for compatibility warnings in Layout Designer.

## Migration

Run SQL migrations in order:

1. `backend/sql/001_card_layouts.sql`
2. `backend/sql/002_card_aspect_ratio.sql`
3. `backend/sql/003_events_layout_overlay.sql` (if applicable)
4. **`backend/sql/004_card_platform.sql`** — registry tables, v2 migration, `characters.layout_id`

## CSS scaling

Keep using container query units from `card.css`. Badge/chip slots use
`container-type: size` + `cqmin` so resizing layout boxes scales content.

## Verification checklist

- [ ] All four card types render with assigned type-default layouts
- [ ] Per-card `layout_id` override changes one card only
- [ ] v2 layout with custom element instances renders correctly
- [ ] New `stat_badge` element type from registry appears without code changes
- [ ] Thumbnail and detail sizes look proportionally identical
- [ ] Unknown `render_kind` skipped gracefully when `supportedRenderKinds` set
