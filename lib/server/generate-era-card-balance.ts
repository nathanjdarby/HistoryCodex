import type { Archetype, Rarity } from "@/lib/sprite/generateSprite";
import type { CardBalanceDef, StatProfile } from "@/lib/server/card-balance";

type RoleSlot = {
  rarity: Rarity;
  archetype: Archetype;
  statProfile: StatProfile;
  flavor: (eraName: string, cardName: string) => string;
};

const ROLE_SLOTS: RoleSlot[] = [
  {
    rarity: "common",
    archetype: "warrior",
    statProfile: "aggressive",
    flavor: (era, name) =>
      `${name} holds the line when ${era} cannot spare another defeat—the spear goes in first and questions follow later.`,
  },
  {
    rarity: "common",
    archetype: "scholar",
    statProfile: "fortress",
    flavor: (era, name) =>
      `${name} keeps the record straight for ${era}; what is written outlives the raid, the riot, and the reign that tried to forget.`,
  },
  {
    rarity: "common",
    archetype: "monarch",
    statProfile: "defensive",
    flavor: (era, name) =>
      `${name} rules ${era} by patience as much as power—crown on brow, eyes on every faction waiting for weakness.`,
  },
  {
    rarity: "uncommon",
    archetype: "merchant",
    statProfile: "defensive",
    flavor: (era, name) =>
      `${name} moves grain, credit, and gossip through ${era}; armies march on coin long before they march on courage.`,
  },
  {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "offensive",
    flavor: (era, name) =>
      `${name} has broken more than one stalemate for ${era}—discipline in the shield-wall, fury when the order finally comes to charge.`,
  },
  {
    rarity: "rare",
    archetype: "scholar",
    statProfile: "fortress",
    flavor: (era, name) =>
      `${name} speaks for ${era} in councils where steel would fail—law, precedent, and memory turned into weapons of peace.`,
  },
  {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "offensive",
    flavor: (era, name) =>
      `${name} does not merely inherit ${era}—they reshape it, daring rivals to test whether the crown or the challenger breaks first.`,
  },
  {
    rarity: "legendary",
    archetype: "merchant",
    statProfile: "balanced",
    flavor: (era, name) =>
      `${name} holds ${era}'s purse-strings and therefore its fate—fleets sail, armies muster, and treaties bend when the ledger closes.`,
  },
];

const ERA_LOCATION_FLAVOR: Record<string, (eraName: string, locationName: string) => string> = {
  "ancient-egypt-old-kingdom": (_era, name) =>
    `${name} lifts stone toward eternity—pharaohs entered as gods, and the desert still guards their ambition.`,
  "ancient-greece-classical": (_era, name) =>
    `${name} crowns the city that taught the world to argue, compete, and wonder what virtue demands of free men.`,
  "anglo-saxon-england": (_era, name) =>
    `${name} anchored a kingdom still learning to survive—faith, law, and war meeting where Saxon power held firmest.`,
  "georgian-britain": (_era, name) =>
    `${name} gleams with polite stone and restless ambition—the age of salons, empire, and machines waking beneath cobbles.`,
  "medieval-england": (_era, name) =>
    `${name} keeps watch over a realm of stone towers, feudal oaths, and kings who learned that walls outlast crowns.`,
  "modern-britain": (_era, name) =>
    `${name} hides genius behind modest brick—secrets that shortened wars and remade what a nation thought possible.`,
  "mughal-india": (_era, name) =>
    `${name} rises in marble and power—the seat from which emperors claimed heaven's mandate over a subcontinent.`,
  "roman-britain": (_era, name) =>
    `${name} marks the threshold where Britannia entered Rome's order—and never quite forgot the tribes beyond the wall.`,
  "roman-empire": (_era, name) =>
    `${name} still echoes with crowd-roar and imperial pride—the empire's appetite for spectacle made stone.`,
  "stuart-england": (_era, name) =>
    `${name} saw kings and parliaments collide—court intrigue, civil war, and revolution passed through its halls.`,
  "tang-dynasty-china": (_era, name) =>
    `${name} opened onto the Silk Road's golden age—poetry, trade, and dynastic splendour meeting at the world's hinge.`,
  "tudor-england": (_era, name) =>
    `${name} glittered with Tudor ambition—reformation, intrigue, and the dangerous glamour of absolute royal will.`,
  "victorian-britain": (_era, name) =>
    `${name} cast iron and glass over an empire's confidence—progress on display, inequality hidden beneath the polish.`,
};

const GENERIC_UNIT = /^(.+)-([1-8])$/;
const GENERIC_LOCATION = /^(.+)-location-1$/;

export function generateEraCardBalance(params: {
  seed: string;
  name: string;
  eraName: string;
}): CardBalanceDef | null {
  const unitMatch = params.seed.match(GENERIC_UNIT);
  if (unitMatch) {
    const slotIndex = Number(unitMatch[2]) - 1;
    const slot = ROLE_SLOTS[slotIndex];
    if (!slot) return null;

    return {
      rarity: slot.rarity,
      archetype: slot.archetype,
      statProfile: slot.statProfile,
      flavorText: slot.flavor(params.eraName, params.name),
    };
  }

  const locationMatch = params.seed.match(GENERIC_LOCATION);
  if (locationMatch) {
    const prefix = locationMatch[1]!;
    const flavorFn =
      ERA_LOCATION_FLAVOR[prefix] ??
      ((_era, locationName) =>
        `${locationName} anchors ${params.eraName}—those who hold this ground find the past harder to dislodge than any army.`);

    return {
      rarity: "rare",
      statProfile: "defensive",
      locationBuffAdjust: prefix.includes("modern") || prefix.includes("victorian") ? 2 : 0,
      flavorText: flavorFn(params.eraName, params.name),
    };
  }

  return null;
}
