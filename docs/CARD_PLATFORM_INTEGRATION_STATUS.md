# Card platform — main app integration status

Snapshot against [CARD_PLATFORM_CONTRACT.md](./CARD_PLATFORM_CONTRACT.md).

## Done in this repo

| Contract piece | Status |
|----------------|--------|
| `@history-codex/card-renderer` | Vendored at `vendor/card-renderer` (see `package.json`) |
| Boot fetch (expanded) | `GET /api/card-layouts` returns presets, assignments, registry, renderer release |
| `normalizeLayout` / `resolveCardLayout` | Used in `lib/card-platform-bridge.ts` + server bundle |
| `characters.layout_id` | Drizzle schema + per-card resolution in `useCardLayout` / `useCardLayoutDocument` |
| Registry tables | Drizzle schema for `card_data_fields`, `card_element_types`, `card_renderer_releases` |
| `card.css` import | `@history-codex/card-renderer/card.css` in `app/layout.tsx` |
| **CardRenderer swap** | `CharacterCardPreview` → `PlatformCharacterCardRenderer` → shared `CardRenderer` |
| **CharacterArt bridge** | `renderArtFrame` slot renders `CharacterArt` (uploads + `PixelSprite` fallback) |
| Ownership / flavor UI | `renderSlot` + `shouldShowElement` hooks preserve dex badges, copy count, footer |

## Still to do

| Item | Notes |
|------|-------|
| Run `db/sql/004_card_platform.sql` | On shared Supabase (same migration as Manager) |
| `npm install` | After pulling — links local card-renderer package |
| Dedupe `globals.css` | Remove slot rules duplicated in `card.css` once visual parity verified |
| Bump `card_renderer_releases` | After each `@history-codex/card-renderer` upgrade |

## Recommended order (remaining)

1. Run **`db/sql/004_card_platform.sql`** on Supabase.
2. **`npm install`** in `HistoryCodex/`.
3. Smoke-test cards (sprite fallback, uploaded art, ownership badges, layout overrides).
4. Dedupe CSS; update **`card_renderer_releases`** for `app = 'main'`.

## Key files

- `lib/card-platform-bridge.ts` — package adapters, v2 resolver, legacy v1 bridge
- `lib/map-card-design-data.ts` — preview props → `CardDesignData`
- `lib/server/card-layouts.ts` — expanded platform bundle
- `lib/client/card-layouts.ts` — `useCardLayoutDocument`, `useCardPlatformRegistry`
- `components/platform-character-card-renderer.tsx` — `CharacterArt` + ownership bridge
- `components/character-card-preview.tsx` — outer shell + holographic overlay
- `db/schema.ts` — platform tables + `characters.layoutId`
