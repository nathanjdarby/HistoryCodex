-- Modular card layout platform: element registry, layout v2, per-card overrides,
-- renderer capability tracking. Run once in Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- card_data_fields — registry of card-facing data (maps to characters columns)
-- ---------------------------------------------------------------------------
create table if not exists card_data_fields (
  id text primary key,
  label text not null,
  column_name text not null unique,
  data_type text not null check (data_type in ('number', 'text', 'boolean', 'enum', 'computed')),
  enum_options text[],
  applies_to_card_types text[],
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into card_data_fields (id, label, column_name, data_type, enum_options, sort_order) values
  ('name', 'Name', 'name', 'text', null, 10),
  ('rarity', 'Rarity', 'rarity', 'enum', array['common','uncommon','rare','epic','legendary','mythic'], 20),
  ('card_type', 'Card type', 'card_type', 'enum', array['character','unit','location','event'], 30),
  ('cost', 'Cost (PWR)', 'cost', 'number', null, 40),
  ('attack', 'Attack', 'attack', 'number', null, 50),
  ('defense', 'Defense', 'defense', 'number', null, 60),
  ('archetype', 'Archetype', 'archetype', 'text', null, 70),
  ('ability_name', 'Ability name', 'ability_name', 'text', null, 80),
  ('ability_effect', 'Ability effect', 'ability_effect', 'enum', null, 90),
  ('ability_value', 'Ability value', 'ability_value', 'number', null, 100),
  ('ability_trigger', 'Ability trigger', 'ability_trigger', 'enum', null, 110),
  ('flavor_text', 'Flavor text', 'flavor_text', 'text', null, 120),
  ('image_url', 'Image URL', 'image_url', 'text', null, 130),
  ('holographic', 'Holographic', 'holographic', 'boolean', null, 140),
  ('era_name', 'Era name', 'era_name', 'computed', null, 150),
  ('dex_label', 'Dex label', 'dex_label', 'computed', null, 160)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- card_element_types — pluggable card chrome (badges, chips, text slots, etc.)
-- ---------------------------------------------------------------------------
create table if not exists card_element_types (
  id text primary key,
  label text not null,
  render_kind text not null check (render_kind in (
    'stat_badge', 'chip', 'text', 'image', 'stars', 'rarity_pill', 'computed'
  )),
  data_field_id text references card_data_fields(id) on delete set null,
  config jsonb not null default '{}',
  visibility_rule jsonb,
  applies_to_card_types text[],
  introduced_in_version int not null default 1,
  deprecated boolean not null default false,
  created_at timestamptz not null default now()
);

insert into card_element_types (id, label, render_kind, data_field_id, config, visibility_rule) values
  ('name', 'Name', 'text', 'name', '{"formatter":"name","slotClass":"cd-name-slot","textClass":"cd-el-name"}', null),
  ('rarityPill', 'Rarity pill', 'rarity_pill', 'rarity', '{}', null),
  ('stars', 'Stars', 'stars', 'rarity', '{}', null),
  ('artFrame', 'Art frame', 'image', 'image_url', '{}', null),
  ('badgePwr', 'PWR badge', 'stat_badge', 'cost', '{"label":"PWR","valueFormat":"number"}', '{"op":"gt","field":"cost","value":0}'),
  ('badgeArchetype', 'Archetype badge', 'stat_badge', 'archetype', '{"icon":"archetype","iconSize":"lg"}', '{"op":"truthy","field":"archetype"}'),
  ('badgeAtk', 'Attack badge', 'stat_badge', 'attack', '{"label":"ATK","icon":"swords","iconWithValue":true}', '{"op":"neq","field":"cardType","value":"location"}'),
  ('badgeDef', 'Defense badge', 'stat_badge', 'defense', '{"label":"DEF","icon":"shield","iconWithValue":true}', '{"op":"neq","field":"cardType","value":"location"}'),
  ('chipType', 'Type chip', 'chip', 'card_type', '{"variant":"type"}', null),
  ('chipAbility', 'Ability chip', 'chip', 'ability_name', '{"variant":"ability"}', '{"op":"truthy","field":"abilityName"}'),
  ('abilityLabel', 'Ability label', 'text', null, '{"formatter":"ability_label","slotClass":"cd-ability-label-slot","textClass":"cd-ability-label"}', '{"op":"has_ability_body"}'),
  ('abilityBody', 'Ability body', 'text', null, '{"formatter":"ability_body","slotClass":"cd-ability-body-slot","textClass":"cd-ability-body"}', '{"op":"has_ability_body"}'),
  ('eraName', 'Era name', 'text', 'era_name', '{"formatter":"era_name","slotClass":"cd-era-name-slot","textClass":"cd-era-name-text","wrapClass":"cd-era-box"}', null),
  ('eraDex', 'Era footer dex', 'text', 'dex_label', '{"formatter":"dex","slotClass":"cd-era-dex-slot","textClass":"cd-era-dex-text","wrapClass":"cd-era-box cd-era-box-end"}', null),
  ('flavorText', 'Flavor text', 'text', 'flavor_text', '{"formatter":"flavor","slotClass":"cd-flavor-text-slot","textClass":"cd-flavor-text","quote":true}', '{"op":"truthy","field":"flavorText"}'),
  ('cornerDex', 'Corner dex', 'text', 'dex_label', '{"formatter":"dex","slotClass":"cd-corner-dex-slot","textClass":"cd-corner-dex"}', null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- card_layouts.schema_version + migrate Default layout to v2
-- ---------------------------------------------------------------------------
alter table card_layouts
  add column if not exists schema_version int not null default 1;

-- Convert existing v1 layout objects to v2 { schema_version, elements[] }
update card_layouts
set
  schema_version = 2,
  layout = jsonb_build_object(
    'schema_version', 2,
    'elements', (
      select jsonb_agg(
        jsonb_build_object(
          'instance_id', key,
          'element_type_id', key,
          'x', (value->>'x')::numeric,
          'y', (value->>'y')::numeric,
          'w', (value->>'w')::numeric,
          'h', (value->>'h')::numeric,
          'visible', coalesce((value->>'visible')::boolean, true),
          'z', coalesce((value->>'z')::int, 0)
        )
        order by coalesce((value->>'z')::int, 0)
      )
      from jsonb_each(layout) as t(key, value)
      where layout ? key
        and key in (
          'name','rarityPill','stars','artFrame','badgePwr','badgeArchetype',
          'badgeAtk','badgeDef','chipType','chipAbility','abilityLabel',
          'abilityBody','eraName','eraDex','flavorText','cornerDex'
        )
    )
  ),
  updated_at = now()
where schema_version = 1
  and not (layout ? 'schema_version');

-- ---------------------------------------------------------------------------
-- Per-card layout override
-- ---------------------------------------------------------------------------
alter table characters
  add column if not exists layout_id bigint references card_layouts(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Renderer capability tracking (async manager ↔ main app)
-- ---------------------------------------------------------------------------
create table if not exists card_renderer_releases (
  app text primary key check (app in ('manager', 'main')),
  package_version text not null,
  supported_render_kinds text[] not null,
  updated_at timestamptz not null default now()
);

insert into card_renderer_releases (app, package_version, supported_render_kinds) values
  (
    'manager',
    '0.1.0',
    array['stat_badge','chip','text','image','stars','rarity_pill','computed']
  ),
  (
    'main',
    '0.0.0',
    array['stat_badge','chip','text','image','stars','rarity_pill','computed']
  )
on conflict (app) do update set
  package_version = excluded.package_version,
  supported_render_kinds = excluded.supported_render_kinds,
  updated_at = now();
