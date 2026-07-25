import type { CardBalanceDef } from "@/lib/server/card-balance";

const P = "a-history-of-japan-to-1334";

/** Sansom — *A History of Japan to 1334*: cards staged in .to-organise. */
export const HISTORY_OF_JAPAN_TO_1334_BALANCE: Record<string, CardBalanceDef> = {
  [`${P}-character-prince-shotoku`]: {
    rarity: "legendary",
    archetype: "scholar",
    statProfile: "balanced",
    flavorText:
      "Regent before his time—he sent missions to Sui China, embraced Buddhism, and drafted the Seventeen-Article Constitution that tried to make virtue the law of Yamato.",
  },
  [`${P}-character-emperor-kanmu`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "He broke Nara's temple power and moved the throne to Heian-kyō—Kanmu's new capital began the long age when court elegance mattered more than the sword.",
  },
  [`${P}-character-fujiwara-no-kamatari`]: {
    rarity: "epic",
    archetype: "leader",
    statProfile: "balanced",
    flavorText:
      "Architect of the Taika reforms—Kamatari helped Nakano no Ōe crush the Soga and rewrite land, tax, and office in the name of a central Yamato monarchy.",
  },
  [`${P}-character-fujiwara-no-michinaga`]: {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "defensive",
    flavorText:
      "This world I think is indeed my world—Michinaga married his daughters to emperors and ruled Heian from behind screens until Fujiwara power seemed eternal.",
  },
  [`${P}-character-emperor-shirakawa`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "He abdicated the throne but kept the strings—Shirakawa's insei turned retired emperors into rivals of Fujiwara regents and made cloistered rule a habit of kingship.",
  },
  [`${P}-character-emperor-go-sanjo`]: {
    rarity: "uncommon",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "For a brief reign he pressed against Fujiwara control—Go-Sanjō died young, but his example showed emperors could resist regents before insei became their weapon.",
  },
  [`${P}-character-emperor-go-shirakawa`]: {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Retired yet never quiet—Go-Shirakawa's cloistered hand steered court and camp alike through the Hōgen and Heiji troubles until warriors decided more than poetry.",
  },
  [`${P}-character-taira-no-kiyomori`]: {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "offensive",
    flavorText:
      "Provincial warrior turned court minister—Kiyomori placed Taira blood on the throne, drowned rivals in politics, and made the sword indispensable in Heian-kyō.",
  },
  [`${P}-character-minamoto-no-yoritomo`]: {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "balanced",
    flavorText:
      "Exile, rebellion, and the title of shōgun—Yoritomo built Kamakura's bakufu after the Genpei War and made warrior government a rival to the throne itself.",
  },
  [`${P}-character-minamoto-no-yoshitsune`]: {
    rarity: "legendary",
    archetype: "warrior",
    statProfile: "skirmisher",
    customAbility: {
      abilityName: "Ichi-no-Tani Descent",
      abilityEffect: "flat_attack",
      abilityValue: 10,
    },
    flavorText:
      "Brother of the shōgun, hero of the Genpei War—Yoshitsune swept down cliffs at Ichi-no-Tani and chased the Taira to the sea before jealousy closed on him.",
  },
  [`${P}-character-hojo-masako`]: {
    rarity: "epic",
    archetype: "leader",
    statProfile: "defensive",
    flavorText:
      "The nun shōgun—widow of Yoritomo, Masako shaved her head and ruled Kamakura's councils until Hōjō regents, not Minamoto heirs, held the real power.",
  },
  [`${P}-character-hojo-yasutoki`]: {
    rarity: "epic",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText:
      "He gave warriors a law of their own—Yasutoki's Goseibai Shikimoku turned Kamakura judgment into precedent and made the bakufu more than a camp of victors.",
  },
  [`${P}-character-hojo-tokimune`]: {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "defensive",
    flavorText:
      "When Khubilai's fleets came twice, Tokimune met the threat with prayer, stone walls, and refusal—victory at Hakata saved Japan but drained Kamakura's purse.",
  },
  [`${P}-character-emperor-go-daigo`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "He dreamed of rule without shōguns—Go-Daigo's Kemmu Restoration broke Kamakura in 1333, then learned that warriors who restore thrones also bargain for them.",
  },
  [`${P}-character-ashikaga-takauji`]: {
    rarity: "epic",
    archetype: "leader",
    statProfile: "aggressive",
    flavorText:
      "He marched for Go-Daigo, then turned against him—Takauji's defection ended the Hōjō and opened a new age of warrior rivalry over who truly speaks for the throne.",
  },

  [`${P}-location-asuka`]: {
    rarity: "uncommon",
    statProfile: "defensive",
    flavorText:
      "Valley of the first reforms—Asuka saw Yamato absorb Buddhism, Chinese law, and the ambition to make a court that could command more than clan custom.",
  },
  [`${P}-location-nara-heijo-kyo`]: {
    rarity: "uncommon",
    statProfile: "defensive",
    locationBuffAdjust: 1,
    flavorText:
      "Heijō-kyō's grid and great temples—Nara made Buddhism a state project until monastic wealth grew too close to the throne for comfort.",
  },
  [`${P}-location-kyoto-heian-kyo`]: {
    rarity: "legendary",
    statProfile: "balanced",
    locationBuffAdjust: 3,
    flavorText:
      "Heian-kyō's planned elegance outlasted emperors—Fujiwara marriage politics, insei, and finally warriors all played out beneath its screened halls and cherry avenues.",
  },
  [`${P}-location-kamakura`]: {
    rarity: "epic",
    statProfile: "fortress",
    locationBuffAdjust: 2,
    flavorText:
      "Yoritomo's eastern capital—Kamakura's bakufu watched Kyoto from afar, judged disputes, and turned provincial warriors into a government that could outlive any single shōgun.",
  },
  [`${P}-location-dazaifu`]: {
    rarity: "uncommon",
    statProfile: "fortress",
    flavorText:
      "Kyūshū's gateway to the continent—Dazaifu guarded trade, received embassies, and reminded Yamato that empire's edge could be as decisive as its center.",
  },
  [`${P}-location-hakata-bay`]: {
    rarity: "rare",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "Twice Mongol fleets anchored here—stone walls, samurai sorties, and kamikaze storms turned Hakata into the place where Japan's fate met the Yuan empire.",
  },
  [`${P}-location-mount-hiei-and-enryaku-ji`]: {
    rarity: "rare",
    statProfile: "fortress",
    locationBuffAdjust: 2,
    flavorText:
      "Monks on the mountain above Kyoto—Enryaku-ji's sōhei marched when temples quarreled with court or bakufu, and their bell could summon more than prayer.",
  },
  [`${P}-location-dan-no-ura`]: {
    rarity: "epic",
    statProfile: "offensive",
    locationBuffAdjust: 2,
    flavorText:
      "At the straits' turning tide the Taira made their last stand—child emperor and clan drowned together, and Minamoto victory wrote the Genpei War into legend.",
  },
  [`${P}-location-ichi-no-tani`]: {
    rarity: "rare",
    statProfile: "offensive",
    locationBuffAdjust: 2,
    flavorText:
      "Cliffs above the Inland Sea—Yoshitsune's sudden descent here broke Taira confidence and proved that one audacious charge could decide a civil war.",
  },
  [`${P}-location-yashima`]: {
    rarity: "uncommon",
    statProfile: "defensive",
    flavorText:
      "Island refuge of the fleeing Taira—Yashima's heights and narrow beaches saw archery duels and desperate gambits before the war moved on to Dan-no-ura.",
  },
  [`${P}-location-uji`]: {
    rarity: "uncommon",
    statProfile: "offensive",
    flavorText:
      "By the Uji River in 1180 Minamoto and Taira first clashed in earnest—bridges burned, monks fought, and the Genpei War spilled out of court intrigue into open war.",
  },
  [`${P}-location-hiraizumi`]: {
    rarity: "rare",
    statProfile: "defensive",
    locationBuffAdjust: 1,
    flavorText:
      "Northern splendour of the Ōshū Fujiwara—Hiraizumi's gold and gardens fell when Yoritomo's armies marched north to destroy a rival power far from Kyoto.",
  },

  [`${P}-unit-yamato-court-warriors`]: {
    rarity: "common",
    archetype: "warrior",
    statProfile: "balanced",
    flavorText:
      "Clan levies and household retainers of the early court—before shōgun or bakufu, Yamato power still depended on who could gather spears when the throne called.",
  },
  [`${P}-unit-ritsuryo-conscript-armies`]: {
    rarity: "common",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText:
      "Drafted by register and rice field—ritsuryō codes tried to make war a matter of law, though estates and local lords soon learned to keep the best men for themselves.",
  },
  [`${P}-unit-emishi-forces`]: {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "skirmisher",
    flavorText:
      "Horsemen and bowmen of the northeast—Emishi resistance slowed Yamato expansion and taught the court that frontier peoples would not vanish because maps said they should.",
  },
  [`${P}-unit-sakimori-frontier-guards`]: {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText:
      "Conscripted watchmen on Kyūshū's coast—sakimori service linked peasant fields to imperial defence long before the Mongol storms tested Japan's shores.",
  },
  [`${P}-unit-sohei-warrior-monks`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "offensive",
    flavorText:
      "Staff, naginata, and temple grievance—sōhei from Mount Hiei and rival monasteries marched on Kyoto when abbots decided politics required more than sutra.",
  },
  [`${P}-unit-taira-clan-forces`]: {
    rarity: "epic",
    archetype: "warrior",
    statProfile: "offensive",
    flavorText:
      "Heike banners on land and sea—Kiyomori's kin turned provincial muscle into court dominance until the Genpei War drowned their power at Dan-no-ura.",
  },
  [`${P}-unit-minamoto-clan-forces`]: {
    rarity: "epic",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Genji horsemen rallied from exile and eastern provinces—Minamoto armies broke Taira rule in five years of battle and made the sword the arbiter of Japan's throne.",
  },
  [`${P}-unit-kamakura-gokenin`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "balanced",
    flavorText:
      "Household warriors bound to the shōgun—gokenin owed service and received judgment from Kamakura, the human foundation on which bakufu power rested.",
  },
  [`${P}-unit-hakata-bay-defenders`]: {
    rarity: "epic",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText:
      "Samurai, stonemasons, and desperate sorties—when Yuan ships closed on Kyūshū, Japan's defenders held the beaches until wind and sea broke the invaders.",
  },
  [`${P}-unit-yuan-goryeo-invasion-forces`]: {
    rarity: "legendary",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Khubilai's fleets carried Chinese siege craft and Korean oarsmen—twice they crossed the sea to claim Japan, and twice the island kingdom refused the khan's summons.",
  },
  [`${P}-unit-go-daigo-loyalist-forces`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Emperor's allies against Kamakura—Go-Daigo's loyalists lit the rebellion that toppled the Hōjō, then discovered restoration and reward are not the same cause.",
  },

  [`${P}-event-introduction-of-buddhism-to-the-yamato-court`]: {
    rarity: "rare",
    eventAbility: {
      abilityName: "Sutra and State",
      abilityEffect: "add_influence",
      abilityValue: 1,
    },
    flavorText:
      "From Paekche came images, monks, and a faith that would reshape law and kingship—Buddhism entered Yamato not as foreign curiosity but as the court's new language of power.",
  },
  [`${P}-event-taika-reform`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Land and Office",
      abilityEffect: "add_influence",
      abilityValue: 1,
    },
    flavorText:
      "In the name of a Chinese-style emperor, Nakano no Ōe and Kamatari seized the Soga and declared all land and people subject to the throne—the Taika reform tried to make Yamato a kingdom of law.",
  },
  [`${P}-event-jinshin-war`]: {
    rarity: "rare",
    eventAbility: {
      abilityName: "Brothers at War",
      abilityEffect: "remove_influence",
      abilityValue: 1,
    },
    flavorText:
      "When Tenmu marched against his nephew, Yamato learned that succession could be settled by armies— the Jinshin War of 672 left one emperor and a precedent for violent inheritance.",
  },
  [`${P}-event-promulgation-of-the-taiho-code`]: {
    rarity: "uncommon",
    eventAbility: {
      abilityName: "Ritsuryō Order",
      abilityEffect: "flat_defense",
      abilityValue: 1,
    },
    flavorText:
      "The Taihō and later Yōrō codes mapped rice fields, offices, and punishments—Japan's first great law books tried to make the court govern by register rather than clan custom.",
  },
  [`${P}-event-transfer-of-the-capital-to-heian-kyo`]: {
    rarity: "rare",
    eventAbility: {
      abilityName: "Heian Founding",
      abilityEffect: "add_influence",
      abilityValue: 1,
    },
    flavorText:
      "Emperor Kanmu left Nara's temples and built Heian-kyō—Kyoto's grid and gardens opened four centuries when court culture, not the camp, set Japan's tone.",
  },
  [`${P}-event-hogen-rebellion`]: {
    rarity: "uncommon",
    eventAbility: {
      abilityName: "Palace Coup",
      abilityEffect: "remove_influence",
      abilityValue: 1,
    },
    flavorText:
      "In 1156 rival clans fought inside the capital over who would rule through the emperor— the Hōgen Disturbance proved that Heian politics could no longer be settled by robes alone.",
  },
  [`${P}-event-heiji-rebellion`]: {
    rarity: "rare",
    eventAbility: {
      abilityName: "Night Attack",
      abilityEffect: "flat_attack",
      abilityValue: 1,
    },
    flavorText:
      "Minamoto and Taira burned rival mansions in a Kyoto winter— the Heiji Rising of 1160 ended in Taira triumph and showed warriors they could seize the court by speed and fire.",
  },
  [`${P}-event-genpei-war`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Heike Falls",
      abilityEffect: "flat_attack",
      abilityValue: 1,
    },
    flavorText:
      "From Uji to Dan-no-ura, Minamoto and Taira tore Japan apart—five years of civil war drowned an emperor's branch and made samurai the arbiters of the throne.",
  },
  [`${P}-event-establishment-of-the-kamakura-military-government`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Bakufu Proclaimed",
      abilityEffect: "add_influence",
      abilityValue: 1,
    },
    flavorText:
      "Yoritomo took the title of shōgun and ruled from Kamakura—warrior government did not replace the emperor, but it made a second centre of power Japan could never again ignore.",
  },
  [`${P}-event-jokyu-war`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Retired Emperor's Gamble",
      abilityEffect: "remove_influence",
      abilityValue: 1,
    },
    flavorText:
      "Go-Toba called the provinces against the Hōjō and lost— the Jōkyū War of 1221 crushed Kyoto's hope of ruling warriors and tightened Kamakura's hand on the court.",
  },
  [`${P}-event-first-mongol-invasion-of-japan`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Kamikaze Rising",
      abilityEffect: "flat_defense",
      abilityValue: 1,
    },
    flavorText:
      "In 1274 Khubilai's ships appeared off Kyūshū—samurai fought in unfamiliar massed warfare until storm wrecked the fleet and gave Japan a name for divine wind.",
  },
  [`${P}-event-second-mongol-invasion-of-japan`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Wall and Storm",
      abilityEffect: "flat_defense",
      abilityValue: 1,
    },
    flavorText:
      "Seven years later the Yuan returned in force—stone walls at Hakata, night raids, and another typhoon broke the invasion and left Kamakura burdened with unpaid warriors.",
  },
  [`${P}-event-fall-of-the-kamakura-shogunate`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Kemmu Thunder",
      abilityEffect: "remove_influence",
      abilityValue: 1,
    },
    flavorText:
      "Go-Daigo's revolt and Ashikaga's betrayal brought down the Hōjō in 1333—Kamakura burned, the bakufu fell, and Japan entered an age when emperors and generals would bargain anew.",
  },
};
