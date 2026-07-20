import type { CardBalanceDef } from "@/lib/server/card-balance";

const P = "history-of-norway";

/** History of Norway cards staged in the .to-organise era. */
export const HISTORY_OF_NORWAY_CARD_BALANCE: Record<string, CardBalanceDef> = {
  [`${P}-character-harald-fairhair`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "At Hafrsfjord he broke rival earls and claimed a kingdom—Harald Fairhair turned scattered fjords into Norway and made every chieftain bend or flee.",
  },
  [`${P}-character-harald-hardrade`]: {
    rarity: "legendary",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Varangian, exile, and king—he sold his sword in Constantinople, seized Norway, and died with an axe at Stamford Bridge still dreaming of England.",
  },
  [`${P}-character-hakon-the-good`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "Raised in England, crowned in Trondheim—Håkon brought law, trade, and the cross to Norway without quite breaking the old ways of the hird.",
  },
  [`${P}-character-olav-tryggvason`]: {
    rarity: "epic",
    archetype: "leader",
    statProfile: "aggressive",
    flavorText:
      "Viking raider turned Christian king—he forced baptism with fire and fleet until Svolder sank his ship and left Norway to fight over his faith.",
  },
  [`${P}-character-st-olav`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Olav Haraldsson fell at Stiklestad and rose as Norway's eternal king—saint, lawgiver, and martyr whose shrine bound the realm tighter than any sword.",
  },
  [`${P}-character-sverre-sigurdsson`]: {
    rarity: "epic",
    archetype: "leader",
    statProfile: "skirmisher",
    flavorText:
      "Priest, pretender, and Birkebeiner king—Sverre outmarched, outschemed, and outlasted the Baglers until Norway learned civil war could wear a crown.",
  },
  [`${P}-character-queen-margrete`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "The Lady King of Denmark, Norway, and Sweden—Margrete held the Kalmar Union together with diplomacy where armies would have shattered the North.",
  },
  [`${P}-character-pietro-querini`]: {
    rarity: "rare",
    archetype: "sailor",
    statProfile: "defensive",
    flavorText:
      "A Venetian merchant shipwrecked on Røst in 1432—his winter among Norwegian fishermen became a travelogue that carried the Lofoten cod trade to Italy.",
  },
  [`${P}-character-christian-frederik`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "When Denmark's king chose union with Sweden over Norway, Christian Frederik rode to Eidsvoll and offered a constitution before the great powers closed in.",
  },
  [`${P}-character-edvard-grieg`]: {
    rarity: "rare",
    archetype: "scholar",
    statProfile: "balanced",
    flavorText:
      "From Bergen's rain to Peer Gynt's mountains—Grieg distilled fjord light and folk melody into music that made the world hear Norway as a nation.",
  },

  [`${P}-unit-vikings`]: {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "skirmisher",
    flavorText:
      "Dragon-prowed ships and axe-men who traded as fiercely as they raided—Norway's sons wrote their law on foreign shores before they wrote it at home.",
  },
  [`${P}-unit-birkebeiner`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "skirmisher",
    flavorText:
      "Birch-bark leggings and mountain hardihood—the Birkebeiner carried an infant king through blizzards and broke the Baglers on ice and resolve.",
  },
  [`${P}-unit-norwegian-military-resistance`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText:
      "Milorg, Kompani Linge, and men who refused Quisling's peace—sabotage, radios, and Arctic raids kept Norway's honour alive under occupation.",
  },
  [`${P}-unit-german-occupation-forces-in-norway`]: {
    rarity: "rare",
    eventAbility: {
      abilityName: "Festung Norwegen",
      abilityEffect: "add_influence",
      abilityValue: 2,
    },
    flavorText:
      "From Narvik's ore to the Atlantic wall—Hitler's garrison turned Norway into a fortress that bled Allied convoys and held long after Berlin fell.",
  },

  [`${P}-location-iceland`]: {
    rarity: "uncommon",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "Settled from Norway in the longship age—Althing on the lava plain made Iceland a republic of saga, sea, and stubborn independence.",
  },
  [`${P}-location-greenland`]: {
    rarity: "uncommon",
    statProfile: "fortress",
    locationBuffAdjust: 1,
    flavorText:
      "Eirik the Red's western colony—Norwegian farms clung to ice and fjord until the Little Ice Age and silence swallowed the eastern settlement.",
  },
  [`${P}-location-north-america`]: {
    rarity: "rare",
    statProfile: "offensive",
    locationBuffAdjust: 2,
    flavorText:
      "Vinland's timber and grapes tempted Leif's crews across the Atlantic—Norwegians touched America five centuries before Columbus sailed south.",
  },
  [`${P}-location-stamford-bridge`]: {
    rarity: "rare",
    statProfile: "offensive",
    locationBuffAdjust: 2,
    flavorText:
      "Harald Hardråde's last field—Norwegian axes broke the English vanguard until Harold Godwinson's surprise attack ended the Viking dream of England.",
  },
  [`${P}-location-norway`]: {
    rarity: "epic",
    statProfile: "defensive",
    locationBuffAdjust: 3,
    flavorText:
      "Fjords, mountains, and a coastline longer than continents—Norway's geography made emperors hesitate and made Norwegians masters of the sea-lanes.",
  },
  [`${P}-location-oslo`]: {
    rarity: "uncommon",
    statProfile: "balanced",
    locationBuffAdjust: 2,
    flavorText:
      "From Viking trading post to Christian capital—Oslo's harbour and parliament square have watched every union, constitution, and occupation of modern Norway.",
  },
  [`${P}-location-roros`]: {
    rarity: "uncommon",
    statProfile: "fortress",
    locationBuffAdjust: 1,
    flavorText:
      "Copper mines on the mountain plain—Røros timber church and furnace smoke made a UNESCO town from the wealth dug under Danish-Norwegian rule.",
  },
  [`${P}-location-eidsvoll`]: {
    rarity: "rare",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "In the manor at Eidsvoll, farmers and lawyers signed Norway's constitution—May 1814 turned a province's revolt into a nation's founding document.",
  },
  [`${P}-location-kiel`]: {
    rarity: "uncommon",
    statProfile: "balanced",
    flavorText:
      "The treaty signed here in January 1814 gave Norway to Sweden—Christian Frederik's answer at Eidsvoll was written in direct reply to Kiel's verdict.",
  },
  [`${P}-location-leipzig`]: {
    rarity: "uncommon",
    statProfile: "offensive",
    flavorText:
      "Napoleon's defeat in the Nations' Battle shook thrones across Europe—in Norway it opened the door to 1814 and a constitution no treaty could erase.",
  },
  [`${P}-location-telavag`]: {
    rarity: "rare",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "After SOE agents were betrayed in 1942, the Gestapo burned Telavåg to the ground—every house, every boat, a village erased for refusing occupation.",
  },
};
