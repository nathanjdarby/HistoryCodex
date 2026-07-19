const HUMAN_CHARACTER_ALLOWLIST = new Set([
  "Cleopatra VII",
  "Hatshepsut",
  "Henry VIII",
  "George I",
  "George II",
  "George III",
  "George IV",
  "William IV",
  "Alfred The Great",
  "Athelstan: The First King of England",
  "Boudica",
  "Caratacus",
  "Arthur - Camelot",
  "Merlin - Camelot",
]);

const LONE_EPITHETS = new Set([
  "Regent",
  "Sage",
  "Trader",
  "Chronicler",
  "Swordsman",
  "Claimant",
  "Guildmaster",
  "Druid",
]);

const GENERIC_ROLE_WORDS =
  /\b(Swordsman|Chronicler|Regent|Trader|Shield-Bearer|Sage|Claimant|Guildmaster|Druid|Sailor|Warrior|Philosopher|Guard|Scribe|Magistrate|Negotiator|Usurper|Champion|Drover|Insurgent|Baron|Bandists|Ouate|Hoplon|Gladius|Tabularius|Naviculariorum|Kapelos|Autokrator|Emporarch|Hoplon-Bearer|Gladius-Bearer|War-Bandists|Charriot)\b/i;

const ERA_PREFIX =
  /^(Roman Britain|Anglo-Saxon England|Medieval England|Tudor England|Stuart England|Georgian Britain|Victorian Britain|Modern Britain|Ancient Egypt|Tang Dynasty China|Mughal India|Ancient Greece)/;

const ROLE_PREFIX =
  /^(Celtic|Tribal|Client-King|Cattle|Woad-Stained|Tin Baron|Charriot|Xiphos|Herodotian|Archon|Agora|Spartan|Lyceum|Strategos|Legionary|Imperial|Curule|Forum|Praetorian|Stoic|Provincial|Princeps|Georgian)/i;

/** True when the card name identifies a specific historical person, not a role or unit type. */
export function isHumanIdentifiableName(name: string): boolean {
  const trimmed = name.trim();
  if (HUMAN_CHARACTER_ALLOWLIST.has(trimmed)) return true;

  if (/^[A-Z][a-z]+ (I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)$/.test(trimmed)) return true;

  if (/\bThe Great\b/i.test(trimmed) || /: The First /i.test(trimmed)) return true;

  const dashMatch = trimmed.match(/^([A-Z][a-zA-Z'-]+) - .+$/);
  if (dashMatch && !GENERIC_ROLE_WORDS.test(dashMatch[1])) return true;

  if (/^[A-Z][a-zA-Z'-]{4,}$/.test(trimmed) && !GENERIC_ROLE_WORDS.test(trimmed)) {
    if (!LONE_EPITHETS.has(trimmed)) return true;
  }

  return false;
}

export function defaultCardTypeForName(name: string): "character" | "unit" {
  if (ERA_PREFIX.test(name.trim()) || ROLE_PREFIX.test(name.trim())) return "unit";
  if (GENERIC_ROLE_WORDS.test(name.trim())) return "unit";
  if (LONE_EPITHETS.has(name.trim())) return "unit";
  return isHumanIdentifiableName(name) ? "character" : "unit";
}
