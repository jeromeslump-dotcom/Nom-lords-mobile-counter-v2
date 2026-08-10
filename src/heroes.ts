export type HeroType = "Infantry" | "Cavalry" | "Ranged" | "Siege Engine";
export type HeroClass = "STR" | "AGI" | "INT";

export interface HeroStats {
  hp: number;
  atk: number;
  matk: number;
  def: number;
  mdef: number;
}

export interface Hero {
  id: string;
  name: string;
  alias: string;
  type: HeroType;
  cls: HeroClass;
  img: string;
  stats: HeroStats;
}

export const HEROES: Hero[] = [
  { id: "boommeister", name: "Boommeister", alias: "Manfred Brandt", type: "Ranged", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/b/b8/Boommeister_medal.png/revision/latest/scale-to-width-down/200?cb=20200103200943", stats: { hp: 28000, atk: 1300, matk: 0, def: 440, mdef: 220 } },
  { id: "black_crow", name: "Black Crow", alias: "Chadra", type: "Ranged", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/0/02/Black_Crow_medal.png/revision/latest/scale-to-width-down/200?cb=20200103214958", stats: { hp: 16100, atk: 2480, matk: 0, def: 175, mdef: 310 } },
  { id: "bombin_goblin", name: "Bombin' Goblin", alias: "Tinkus", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/c/c6/Bombin%27_Goblin_medal.png/revision/latest/scale-to-width-down/200?cb=20200103211523", stats: { hp: 14800, atk: 0, matk: 2510, def: 150, mdef: 420 } },
  { id: "child_of_light", name: "Child of Light", alias: "Sparky", type: "Cavalry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/a/ad/Child_of_Light_medal.png/revision/latest/scale-to-width-down/200?cb=20200103215005", stats: { hp: 28140, atk: 1310, matk: 0, def: 442, mdef: 224 } },
  { id: "death_archer", name: "Death Archer", alias: "Cathiss", type: "Ranged", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/1/12/Death_Archer_medal.png/revision/latest/scale-to-width-down/200?cb=20200103215012", stats: { hp: 15850, atk: 2510, matk: 0, def: 168, mdef: 298 } },
  { id: "death_knight", name: "Death Knight", alias: "Shane", type: "Cavalry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/d/de/Death_Knight_medal.png/revision/latest/scale-to-width-down/200?cb=20200103215020", stats: { hp: 29650, atk: 1254, matk: 0, def: 464, mdef: 185 } },
  { id: "demon_slayer", name: "Demon Slayer", alias: "Shroud", type: "Infantry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/b/b0/Demon_Slayer_medal.png/revision/latest/scale-to-width-down/200?cb=20200103211531", stats: { hp: 18510, atk: 2452, matk: 0, def: 224, mdef: 382 } },
  { id: "night_raven", name: "Night Raven", alias: "Icarus", type: "Cavalry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/a/a5/Night_Raven_medal.png/revision/latest/scale-to-width-down/200?cb=20200103211546", stats: { hp: 17000, atk: 2500, matk: 0, def: 190, mdef: 330 } },
  { id: "oath_keeper", name: "Oath Keeper", alias: "Wesley", type: "Infantry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/a/af/Oath_Keeper_medal.png/revision/latest/scale-to-width-down/200?cb=20200103215038", stats: { hp: 31245, atk: 1120, matk: 0, def: 494, mdef: 555 } },
  { id: "rose_knight", name: "Rose Knight", alias: "Joan", type: "Cavalry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/1/10/Rose_Knight_medal.png/revision/latest/scale-to-width-down/200?cb=20200103201949", stats: { hp: 26580, atk: 1156, matk: 752, def: 412, mdef: 294 } },
  { id: "scarlet_bolt", name: "Scarlet Bolt", alias: "Greta", type: "Infantry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/d/d0/Scarlet_Bolt_medal.png/revision/latest/scale-to-width-down/200?cb=20200103211553", stats: { hp: 15520, atk: 2704, matk: 0, def: 162, mdef: 292 } },
  { id: "sage_of_storms", name: "Sage of Storms", alias: "Anderson", type: "Cavalry", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/e/e3/Sage_of_Storms_medal.png/revision/latest/scale-to-width-down/200?cb=20200103214941", stats: { hp: 13900, atk: 0, matk: 2480, def: 138, mdef: 440 } },
  { id: "sea_squire", name: "Sea Squire", alias: "Lochfin", type: "Infantry", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/1/10/Sea_Squire_medal.png/revision/latest/scale-to-width-down/200?cb=20200103201959", stats: { hp: 14500, atk: 250, matk: 2350, def: 148, mdef: 410 } },
  { id: "snow_queen", name: "Snow Queen", alias: "Alice", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/c/c9/Snow_Queen_medal.png/revision/latest/scale-to-width-down/200?cb=20200103214925", stats: { hp: 13020, atk: 0, matk: 2754, def: 122, mdef: 464 } },
  { id: "shade", name: "Shade", alias: "Blink", type: "Infantry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/2/29/Shade_medal.png/revision/latest/scale-to-width-down/200?cb=20200103214933", stats: { hp: 17200, atk: 2410, matk: 0, def: 190, mdef: 340 } },
  { id: "soul_forger", name: "Soul Forger", alias: "Drumyr", type: "Infantry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/8/82/Soul_Forger_medal.png/revision/latest/scale-to-width-down/200?cb=20200103202019", stats: { hp: 25430, atk: 1420, matk: 0, def: 390, mdef: 210 } },
  { id: "trickster", name: "Trickster", alias: "Tattler", type: "Ranged", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/8/8a/Trickster_medal.png/revision/latest/scale-to-width-down/200?cb=20200103211603", stats: { hp: 16540, atk: 2558, matk: 0, def: 182, mdef: 334 } },
  { id: "tracker", name: "Tracker", alias: "Boom-Hilda", type: "Ranged", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/3/3a/Tracker_medal.png/revision/latest/scale-to-width-down/200?cb=20200103202009", stats: { hp: 17015, atk: 2612, matk: 0, def: 194, mdef: 312 } },
  { id: "barbarian", name: "Barbarian", alias: "Gothrak", type: "Cavalry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/a/a5/Barbarian_medal.png/revision/latest/scale-to-width-down/200?cb=20200104022019", stats: { hp: 27000, atk: 1200, matk: 0, def: 420, mdef: 200 } },
  { id: "berserker", name: "Berserker", alias: "Ursula", type: "Infantry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/3/33/Berserker_medal.png/revision/latest/scale-to-width-down/200?cb=20200123202211", stats: { hp: 24900, atk: 1510, matk: 0, def: 385, mdef: 230 } },
  { id: "chronicler", name: "Chronicler", alias: "Lisa", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/5/57/Chronicler_medal.png/revision/latest/scale-to-width-down/200?cb=20201008211317", stats: { hp: 14000, atk: 0, matk: 2600, def: 140, mdef: 480 } },
  { id: "cursed_hunter", name: "Cursed Hunter", alias: "Joanna", type: "Infantry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/b/b7/Cursed_Hunter_medal.png/revision/latest/scale-to-width-down/200?cb=20200108024004", stats: { hp: 16900, atk: 2590, matk: 0, def: 188, mdef: 320 } },
  { id: "dark_magister", name: "Dark Magister", alias: "Har'Kon", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/a/a2/Dark_Magister_medal.png/revision/latest/scale-to-width-down/200?cb=20200113183214", stats: { hp: 13500, atk: 0, matk: 2800, def: 130, mdef: 470 } },
  { id: "dream_witch", name: "Dream Witch", alias: "Eloise", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/c/cf/Dream_Witch_medal.png/revision/latest/scale-to-width-down/200?cb=20200108024013", stats: { hp: 14000, atk: 0, matk: 2700, def: 140, mdef: 480 } },
  { id: "don_guapo", name: "Don Guapo", alias: "Alfonso", type: "Cavalry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/2/2a/Don_Guapo_medal.png/revision/latest/scale-to-width-down/200?cb=20200112191920", stats: { hp: 26000, atk: 1250, matk: 0, def: 400, mdef: 250 } },
  { id: "ethereal_guide", name: "Ethereal Guide", alias: "Anaya Bonn", type: "Ranged", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/a/a0/Ethereal_Guide_medal.png/revision/latest/scale-to-width-down/200?cb=20200115195552", stats: { hp: 16000, atk: 2600, matk: 0, def: 180, mdef: 320 } },
  { id: "femme_fatale", name: "Femme Fatale", alias: "Thorn", type: "Infantry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/5/55/Femme_Fatale_medal.png/revision/latest/scale-to-width-down/200?cb=20200112191933", stats: { hp: 16500, atk: 2550, matk: 0, def: 185, mdef: 325 } },
  { id: "grim_wolf", name: "Grim Wolf", alias: "Fenrir", type: "Infantry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/1/17/Grim_Wolf_medal.png/revision/latest/scale-to-width-down/200?cb=20200111025058", stats: { hp: 17000, atk: 2480, matk: 0, def: 190, mdef: 340 } },
  { id: "grove_guardian", name: "Grove Guardian", alias: "Forest", type: "Ranged", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/7/77/Grove_Guardian_medal.png/revision/latest/scale-to-width-down/200?cb=20200111025106", stats: { hp: 25000, atk: 1400, matk: 0, def: 390, mdef: 210 } },
  { id: "holy_sword", name: "Holy Sword", alias: "Reyna", type: "Infantry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/6/65/Holy_Sword_medal.png/revision/latest/scale-to-width-down/200?cb=20250629184405", stats: { hp: 17500, atk: 2500, matk: 0, def: 200, mdef: 350 } },
  { id: "incinerator", name: "Incinerator", alias: "Monica", type: "Siege Engine", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/e/eb/Incinerator_medal.png/revision/latest/scale-to-width-down/50?cb=20200103215030", stats: { hp: 12040, atk: 0, matk: 3104, def: 112, mdef: 452 } },
  { id: "lightweaver", name: "Lightweaver", alias: "Elora", type: "Infantry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/9/95/Lightweaver_medal.png/revision/latest/scale-to-width-down/200?cb=20200115194658", stats: { hp: 16000, atk: 2600, matk: 0, def: 180, mdef: 320 } },
  { id: "lore_weaver", name: "Lore Weaver", alias: "Thaila", type: "Cavalry", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/f/f5/Lore_Weaver_medal.png/revision/latest/scale-to-width-down/200?cb=20200113183222", stats: { hp: 14200, atk: 0, matk: 2650, def: 145, mdef: 530 } },
  { id: "magmaroid", name: "Magmaroid", alias: "Vulcan", type: "Infantry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/2/2e/Magmaroid_medal.png/revision/latest/scale-to-width-down/200?cb=20200604120722", stats: { hp: 26000, atk: 1300, matk: 0, def: 420, mdef: 200 } },
  { id: "mastercook", name: "Mastercook", alias: "Ramsay", type: "Ranged", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/6/6f/Mastercook_medal.png/revision/latest/scale-to-width-down/200?cb=20200111025114", stats: { hp: 16500, atk: 2580, matk: 0, def: 185, mdef: 325 } },
  { id: "necroduke", name: "Necroduke", alias: "Lionel", type: "Cavalry", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/6/6d/Necroduke_medal.png/revision/latest/scale-to-width-down/200?cb=20211101214027", stats: { hp: 14000, atk: 0, matk: 2600, def: 140, mdef: 470 } },
  { id: "oracle", name: "Oracle", alias: "Bellena", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/f/f2/Oracle_medal.png/revision/latest/scale-to-width-down/200?cb=20220627072754", stats: { hp: 13500, atk: 0, matk: 2800, def: 130, mdef: 470 } },
  { id: "petite_devil", name: "Petite Devil", alias: "Beatrix", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/3/38/Petite_Devil_medal.png/revision/latest/scale-to-width-down/200?cb=20200103220542", stats: { hp: 13500, atk: 0, matk: 2800, def: 130, mdef: 470 } },
  { id: "prince_of_thieves", name: "Prince of Thieves", alias: "Kassim", type: "Infantry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/c/c8/Prince_of_Thieves_medal.png/revision/latest/scale-to-width-down/200?cb=20200103220553", stats: { hp: 16000, atk: 2600, matk: 0, def: 180, mdef: 320 } },
  { id: "sand_sage", name: "Sand Sage", alias: "Ilya", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/c/c6/Sand_Sage_medal.png/revision/latest/scale-to-width-down/200?cb=20220311125859", stats: { hp: 13500, atk: 0, matk: 2800, def: 130, mdef: 470 } },
  { id: "shape_shifter", name: "Shape Shifter", alias: "Lilith", type: "Cavalry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/8/8b/Shape_Shifter_medal.png/revision/latest/scale-to-width-down/200?cb=20200115195545", stats: { hp: 28000, atk: 1200, matk: 0, def: 440, mdef: 220 } },
  { id: "shield_maiden", name: "Shield Maiden", alias: "Marcia", type: "Infantry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/c/ce/Shield_Maiden_medal.png/revision/latest/scale-to-width-down/200?cb=20220915162432", stats: { hp: 17500, atk: 2500, matk: 0, def: 200, mdef: 350 } },
  { id: "snail_princess", name: "Snail Princess", alias: "Shelley", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/b/b5/Snail_Princess_medal.png/revision/latest/scale-to-width-down/200?cb=20200111203304", stats: { hp: 14000, atk: 0, matk: 2600, def: 140, mdef: 480 } },
  { id: "songstress_of_the_sea", name: "Songstress of the Sea", alias: "Coral", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/8/89/Songstress_medal.png/revision/latest/scale-to-width-down/200?cb=20200108024023", stats: { hp: 14000, atk: 0, matk: 2700, def: 140, mdef: 480 } },
  { id: "steambot", name: "Steambot", alias: "S.A.M.", type: "Cavalry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/c/c4/Steambot_medal.png/revision/latest/scale-to-width-down/200?cb=20200111025122", stats: { hp: 25500, atk: 1300, matk: 0, def: 400, mdef: 210 } },
  { id: "storm_fox", name: "Storm Fox", alias: "Mizuki", type: "Cavalry", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/4/42/Storm_Fox_medal.png/revision/latest/scale-to-width-down/200?cb=20200113183229", stats: { hp: 14000, atk: 0, matk: 2600, def: 140, mdef: 470 } },
  { id: "the_big_guy", name: "The Big Guy", alias: "One Eye", type: "Infantry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/2/29/The_Big_Guy_medal.png/revision/latest/scale-to-width-down/200?cb=20200103220601", stats: { hp: 27900, atk: 1210, matk: 0, def: 430, mdef: 190 } },
  { id: "twilight_priestess", name: "Twilight Priestess", alias: "Kauket", type: "Infantry", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/d/d6/Twilight_Priestess_medal.png/revision/latest/scale-to-width-down/200?cb=20200204233900", stats: { hp: 14000, atk: 0, matk: 2600, def: 140, mdef: 480 } },
  { id: "vengeful_centaur", name: "Vengeful Centaur", alias: "Tarkus", type: "Cavalry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/a/ac/Vengeful_Centaur_medal.png/revision/latest/scale-to-width-down/200?cb=20230530164437", stats: { hp: 27000, atk: 1250, matk: 0, def: 420, mdef: 200 } },
  { id: "wandering_alchemist", name: "Wandering Alchemist", alias: "Kimiya", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/7/7f/Wandering_Alchemist_medal.png/revision/latest/scale-to-width-down/200?cb=20230621102247", stats: { hp: 13500, atk: 0, matk: 2800, def: 130, mdef: 470 } },
  { id: "wave_crasher", name: "Wave Crasher", alias: "Austin", type: "Cavalry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/8/83/Wave_Crasher_medal.png/revision/latest/scale-to-width-down/200?cb=20230113164511", stats: { hp: 17000, atk: 2550, matk: 0, def: 190, mdef: 335 } },
  { id: "witch_doll", name: "Witch Doll", alias: "Astre", type: "Cavalry", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/8/8f/Witch_Doll_medal.png/revision/latest/scale-to-width-down/200?cb=20200103220609", stats: { hp: 14000, atk: 0, matk: 2600, def: 140, mdef: 480 } },
  { id: "prima_donna", name: "Prima Donna", alias: "Donatienne", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/d/d9/Prima_Donna_medal.png/revision/latest/scale-to-width-down/50?cb=20200103214949", stats: { hp: 14025, atk: 0, matk: 2408, def: 142, mdef: 512 } },
  { id: "watchman", name: "Watchman", alias: "Veilleur", type: "Infantry", cls: "STR", img: "https://static.wikia.nocookie.net/lordsmobile/images/0/0c/Watcher_medal.png/revision/latest/scale-to-width-down/50?cb=20200103204745", stats: { hp: 37172, atk: 930, matk: 0, def: 494, mdef: 555 } },
  { id: "elementalist", name: "Elementalist", alias: "Élémentaliste", type: "Ranged", cls: "INT", img: "https://static.wikia.nocookie.net/lordsmobile/images/5/54/Elementalist_medal.png/revision/latest/scale-to-width-down/50?cb=20200103211538", stats: { hp: 13510, atk: 0, matk: 2912, def: 134, mdef: 482 } },
  { id: "stellina_unicorno", name: "Stellina Unicorno", alias: "Stellina", type: "Cavalry", cls: "AGI", img: "https://static.wikia.nocookie.net/lordsmobile/images/1/16/Energium.png/revision/latest/scale-to-width-down/200?cb=20250111154429", stats: { hp: 17200, atk: 2500, matk: 0, def: 200, mdef: 350 } },
];

export type HeroRole = "Tank" | "Support" | "Damage";

export function heroRole(h: Hero): HeroRole {
  if (h.type === "Infantry" && h.cls === "STR") return "Tank";
  if (h.cls === "INT") return "Support";
  return "Damage";
}

export const ROLE_TEXT: Record<HeroRole, string> = {
  Tank: "text-rose-300",
  Support: "text-sky-300",
  Damage: "text-amber-300",
};

export const TYPES: HeroType[] = ["Infantry", "Cavalry", "Ranged", "Siege Engine"];
export const CLASSES: HeroClass[] = ["STR", "AGI", "INT"];

export const TYPE_BEATS: Record<HeroType, HeroType> = {
  Infantry: "Cavalry",
  Cavalry: "Ranged",
  Ranged: "Infantry",
  "Siege Engine": "Infantry",
};

export const CLASS_BEATS: Record<HeroClass, HeroClass> = {
  AGI: "INT",
  INT: "STR",
  STR: "AGI",
};

export const TYPE_GRADIENT: Record<HeroType, string> = {
  Infantry: "from-red-600 to-rose-500",
  Cavalry: "from-amber-500 to-orange-600",
  Ranged: "from-cyan-500 to-blue-600",
  "Siege Engine": "from-slate-500 to-gray-700",
};

export const TYPE_TEXT: Record<HeroType, string> = {
  Infantry: "text-red-300",
  Cavalry: "text-amber-300",
  Ranged: "text-cyan-300",
  "Siege Engine": "text-slate-300",
};

export const CLASS_TEXT: Record<HeroClass, string> = {
  STR: "text-rose-300",
  AGI: "text-emerald-300",
  INT: "text-sky-300",
};

export function formatStat(n: number): string {
  return n.toLocaleString("fr-FR");
}
