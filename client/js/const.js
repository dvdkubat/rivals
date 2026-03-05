
// tohle asi budu muset rozdělit do různých kategorií??
// spoustu těch věcí budu potřebovat na serveru i clientovi ... asi by bylo lepší z toho udělat nějakou třídu?



const Actions = [
    "#999", // none
    "red", // fight
    "white", // castle
    "#637cff", // loot
    "blue" // loot2 >> jakože kvalitnější ?!
];


const CASTLEs = [
    new Castle("human", "human", "human-catle"),
    new Castle("undead", "undead"),
    new Castle("robot", "robot")

];

const POIs = [
    new POI("loot", "cart", { "wood": 50, "gold": 10, "soul": 3 }, "cart"),
    new POI("loot", "chest", { "wood": 50, "gold": 10, "soul": 3 }, "chest"),
    new POI("loot", "skeleton", { "wood": 50, "gold": 10, "soul": 3 }, "skeleton"),
    new POI("loot", "battlefield", { "wood": 50, "gold": 10, "soul": 3 }, "battlefield"),
    new POI("loot", "trader", { "wood": 50, "gold": 10, "soul": 3 }, "trader")
    //cave, ruins, ... ?
];


const Terrain = [
    new TerrainType("none", "#b22222", 0),
    new TerrainType("water", "#4682b4", 0.7),
    new TerrainType("grass", "#7cfc00", 1),
    new TerrainType("forest", "#228b22", 1.25)
];

const IMGS = {
    "chest": returnImage("img/poi/chest.png"),
    "skeleton": returnImage("img/poi/skeleton.png"),
    "cart": returnImage("img/poi/cart.png"),
    "battlefield": returnImage("img/poi/battlefield.png"),
    "trader": returnImage("img/poi/trader.png"),

    "human": returnImage("img/human.png"),
    "undead": returnImage("img/undead.png"),
    "robot": returnImage("img/robot.png"),

    "hero": returnImage("img/hero.png"),
    "zelda": returnImage("img/bg.png")
};



const INITIAL_PARAMETERS = {
    human: {
        resources: { wood: 100, stone: 100, gold: 100, population: 7 },
        units: { spearman: 5, archer: 2 },
        buildings: { saw_mill: 2, bakery: 0 }
    },
    undead: {
        resources: { wood: 120, stone: 80, gold: 50, soul: 10 },
        units: {},
        buildings: {}
    },
    robot: {
        resources: { energy: 200, metal: 100, data: 20 },
        units: {},
        buildings: {}
    }
};

const CASTLE_PARAMETERS = {
    "human": {
        passive: { population: 2 },
        resources: ["population", "food", "wood", "stone", "iron", "gold"],
        units: ["peasant", "spearman", "archer", "monk", "crossbowman", "knight", "cavalry"],
        buildings: ["saw_mill", "stone_mine", "iron_mine", "gold_mine", "settlement", "bakery", "hunter", "cathedral", "hospital", "workshop", "university", "barracks", "warehouse"],
        background: "human.png",
        transport: "market"
    },
    "undead": {
        resources: ["soul", "wood", "iron", "bone", "rotten_meat", "gold"],
        units: ["soul", "ghost", "skeleton", "zombie", "skeleton_archer", "ghoul", "vampire"],
        buildings: ["graveyard", "well_of_souls", "iron_mine", "lumberjack", "shrine", "hunter", "workshop", "lair"],
        background: "undead.webp",
        transport: "portal"
    },

    "robot": {
        resources: ["data", "electricity", "iron", "circuit", "steel", "gold"],
        units: ["data", "t800", "buzz", "drone", "ax14", "hal_9000", "atat"],
        buildings: ["tesla_coil", "reactor", "iron_mine", "gold_mine", "factory", "data_center", "industrial_line", "foundry", "workshop", "probe", "research_center", "power_station"],
        background: "robot.png",
        transport: "teleport"
    }
};


const RESOURCES = {
    "population": "Populace",
    "food": "Jídlo",
    "wood": "Dřevo",
    "stone": "Kámen",
    "iron": "Železo",
    "gold": "Zlato",

    "saw_mill": "Pila",
    "human": "Lidé",
    "human-catle": "Praha",
    "none": "",
    /*
    "soul",
    "data",


    "bone",
    "rotten_meat",
    "electricity",
    "circuit",
    "steel",
    "gold"
    */
};



const UNIT_DEFINITIONS = {
    "peasant": {
        level: 1,
        image: "human/t1.png",
        resources: { wood: 2, population: 1 },
        stats: { attack: 5, defense: 2, speed: 4, type: "defensive", hp: 10, capacity: 3 },
        abilities: ["cover"]
    },
    "spearman": {
        level: 1,
        image: "human/t2.png",
        resources: { wood: 2, population: 1 },
        stats: { attack: 6, defense: 1, speed: 5, type: "ranged", hp: 8, capacity: 2 },
        abilities: ["scout"]
    },
    "archer": {
        level: 2,
        image: "human/t3.png",
        resources: { gold: 5, population: 1 },
        stats: { attack: 4, defense: 3, speed: 4, type: "support", hp: 12, capacity: 2 },
        abilities: ["healer", "inspire", "covard"]
    },
    "monk": {
        level: 2,
        image: "human/t4.png",
        resources: { wood: 4, iron: 2, population: 1 },
        stats: { attack: 8, defense: 2, speed: 4, type: "ranged", hp: 9, capacity: 3 },
        abilities: ["pierce_resistance"]
    },
    "crossbowman": {
        level: 3,
        image: "human/t5.png",
        resources: { iron: 6, gold: 4, population: 2 },
        stats: { attack: 10, defense: 6, speed: 5, type: "melee", hp: 16, capacity: 4 },
        abilities: ["first_strike", "inspire"]
    },
    "knight": {
        level: 3,
        image: "human/t6.png",
        resources: { wood: 10, stone: 10, population: 1 },
        stats: { attack: 14, defense: 1, speed: 2, type: "siege", hp: 12, capacity: 6 },
        abilities: ["aoe_attack"]
    },
    "cavalry": {
        level: 3,
        image: "human/t7.png",
        resources: { population: 2, horse: 1, gold: 5 },
        stats: { attack: 9, defense: 4, speed: 8, type: "fast", hp: 14, capacity: 3 },
        abilities: ["first_strike", "scout"]
    },
    "t800": {
        level: 1,
        resources: { data: 2, iron: 2 },
        stats: { attack: 6, defense: 4, speed: 4, type: "melee", hp: 12, capacity: 3 },
        abilities: ["self_repair"]
    },
    "buzz": {
        level: 1,
        resources: { data: 2, iron: 1 },
        stats: { attack: 5, defense: 1, speed: 6, type: "scout", hp: 8, capacity: 2 },
        abilities: ["scout"]
    },
    "drone": {
        level: 2,
        resources: { data: 3, energy: 2 },
        stats: { attack: 4, defense: 2, speed: 7, type: "support", hp: 10, capacity: 2 },
        abilities: ["jammer", "scout"]
    },
    "ax-14b": {
        level: 3,
        resources: { data: 4, iron: 5, circuits: 2 },
        stats: { attack: 12, defense: 5, speed: 5, type: "assault", hp: 18, capacity: 5 },
        abilities: ["overdrive", "armor_break"]
    },
    "hal_9000": {
        level: 3,
        resources: { data: 6, energy: 4 },
        stats: { attack: 0, defense: 3, speed: 3, type: "support", hp: 10, capacity: 1 },
        abilities: ["disruptor", "emp_shield"]
    },
    "atat": {
        level: 4,
        resources: { data: 10, iron: 10, energy: 6 },
        stats: { attack: 16, defense: 10, speed: 3, type: "siege", hp: 24, capacity: 8 },
        abilities: ["aoe_attack", "self_repair", "pierce_resistance"]
    },
    "ghost": {
        level: 1,
        resources: { soul: 1 },
        stats: { attack: 4, defense: 1, speed: 6, type: "phantom", hp: 8, capacity: 1 },
        abilities: ["arrow_immunity", "fear_aura", "soulbound"]
    },
    "skeleton": {
        level: 1,
        resources: { soul: 1 },
        stats: { attack: 5, defense: 2, speed: 4, type: "melee", hp: 10, capacity: 3 },
        abilities: ["arrow_immunity"]
    },
    "zombie": {
        level: 1,
        resources: { soul: 1 },
        stats: { attack: 6, defense: 3, speed: 2, type: "melee", hp: 14, capacity: 3 },
        abilities: ["poison_attack"]
    },
    "skeleton_archer": {
        level: 2,
        resources: { soul: 2 },
        stats: { attack: 7, defense: 2, speed: 4, type: "ranged", hp: 9, capacity: 2 },
        abilities: ["arrow_immunity"]
    },
    "ghoul": {
        level: 2,
        resources: { soul: 3 },
        stats: { attack: 8, defense: 4, speed: 4, type: "melee", hp: 16, capacity: 4 },
        abilities: ["poison_attack", "necrotic_rebirth"]
    },
    "vampire": {
        level: 3,
        resources: { soul: 5, blood: 5, gold: 5 },
        stats: { attack: 10, defense: 6, speed: 5, type: "elite", hp: 16, capacity: 6 },
        abilities: ["lifesteal", "fear_aura", "first_strike"]
    }
};


const BUILDING_DEFINITIONS = {
    "market": {
        type: "transport",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 30, stone: 20, gold: 10 }, production: { transport: "caravan" } }
        ]
    },
    "stockpile": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 30, stone: 20, gold: 10 }, production: { gold: 5 } },
            { cost: { wood: 60, stone: 40, gold: 20 }, production: { gold: 10 } },
            { cost: { wood: 90, stone: 60, gold: 30 }, production: { gold: 20 } }
        ]
    },
    "barracks": {
        type: "military",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 50, stone: 30, gold: 20 }, production: { max: 1 } },
            { cost: { wood: 100, stone: 60, gold: 40 }, production: { max: 3 } },
            { cost: { wood: 150, stone: 90, gold: 60 }, production: { max: 10 } }
        ]
    },
    "gold_mine": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 40, stone: 40, gold: 20 }, production: { gold: 2, gem: 0.2 } },
            { cost: { wood: 80, stone: 80, gold: 40 }, production: { gold: 4, gem: 0.4, stone: 5 } },
            { cost: { wood: 120, stone: 120, gold: 60 }, production: { gold: 6, gem: 0.6, stone: 10 } }
        ]
    },
    "stone_mine": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 40, gold: 20 }, production: { stone: 2 } },
            { cost: { wood: 80, stone: 10, gold: 20 }, production: { stone: 4 } },
            { cost: { wood: 120, stone: 20, gold: 20 }, production: { stone: 6, iron: 0.5 } }
        ]
    },
    "saw_mill": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 20, stone: 20 }, production: { wood: 20, water: -12.5 } },
            { cost: { wood: 40, stone: 40 }, production: { wood: 40, water: -25 } },
            { cost: { wood: 60, stone: 60 }, production: { wood: 60, water: -37.5 } }
        ]
    },
    "well_of_souls": {
        type: "economic",
        faction: ["lidé"],
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 20, stone: 10, gold: 5 }, production: { soul: 3 } },
            { cost: { wood: 40, stone: 20, gold: 10 }, production: { soul: 8 } },
            { cost: { wood: 60, stone: 30, gold: 15 }, production: { soul: 15 } },
            { cost: { wood: 200, stone: 300, gold: 500 }, production: { soul: 25 } }
        ]
    },
    "iron_mine": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 40, gold: 20 }, production: { iron: 2 } },
            { cost: { wood: 80, stone: 10, gold: 20 }, production: { iron: 4 } },
            { cost: { wood: 120, stone: 20, gold: 20 }, production: { iron: 6, stone: 1 } }
        ]
    },
    "settlement": {
        type: "population",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 30, stone: 10 }, production: { population_cap: 5 } },
            { cost: { wood: 60, stone: 30 }, production: { population_cap: 10 } },
            { cost: { wood: 90, stone: 60 }, production: { population_cap: 15 } }
        ]
    },
    "bakery": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 40, gold: 20 }, production: { food: 2 } },
            { cost: { wood: 80, stone: 10, gold: 20 }, production: { food: 4 } },
            { cost: { wood: 120, stone: 20, gold: 20 }, production: { food: 6 } }
        ]
    },
    "hunter": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 40, gold: 20 }, production: { food: 2 } },
            { cost: { wood: 80, stone: 10, gold: 20 }, production: { food: 4 } },
            { cost: { wood: 120, stone: 20, gold: 20 }, production: { food: 6, leather: 0.5 } }
        ]
    },
    "cathedral": {
        type: "special",
        description: "Unlocks monk units",
        levels: [
            { cost: { gold: 100, stone: 100 }, production: {} },
            { cost: { gold: 200, stone: 150 }, production: {} }
        ]
    },
    "workshop": {
        type: "special",
        description: "Unlocks advanced units",
        levels: [
            { cost: { wood: 50, gold: 30 }, production: {} },
            { cost: { wood: 100, stone: 50, gold: 60 }, production: {} }
        ]
    },
    "university": {
        type: "special",
        description: "Unlocks global upgrades",
        levels: [
            { cost: { gold: 150, stone: 50 }, production: {} },
            { cost: { gold: 300, stone: 100 }, production: {} }
        ]
    },
    "stables": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 50, gold: 20 }, production: { horses: 1 } },
            { cost: { wood: 100, gold: 40 }, production: { horses: 2 } }
        ]
    },
    "power_station": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 40, gold: 20 }, production: { energy: 2 } },
            { cost: { wood: 80, stone: 10, gold: 20 }, production: { energy: 4 } },
            { cost: { wood: 120, stone: 20, gold: 20 }, production: { energy: 6 } }
        ]
    },
    "tesla_coil": {
        type: "special",
        description: "Defensive structure with electric shock",
        levels: [
            { cost: { energy: 50, metal: 20 }, production: {} }
        ]
    },
    "reactor": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 40, gold: 20 }, production: { energy: 2 } },
            { cost: { wood: 80, stone: 10, gold: 20 }, production: { energy: 4 } },
            { cost: { wood: 120, stone: 20, gold: 20 }, production: { energy: 6, heat: 1 } } // heat == 100, město je zničeno
        ]
    },
    "factory": {
        type: "special",
        description: "Enables robot unit production",
        levels: [
            { cost: { metal: 100, energy: 50 }, production: {} },
            { cost: { metal: 200, energy: 100 }, production: {} }
        ]
    },
    "data_center": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 40, gold: 20 }, production: { core_data: 2 } },
            { cost: { wood: 80, stone: 10, gold: 20 }, production: { core_data: 4 } },
            { cost: { wood: 120, stone: 20, gold: 20 }, production: { core_data: 6 } }
        ]
    },
    "industrial_line": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 40, gold: 20 }, production: { circuitry: 2 } },
            { cost: { wood: 80, stone: 10, gold: 20 }, production: { circuitry: 4 } },
            { cost: { wood: 120, stone: 20, gold: 20 }, production: { circuitry: 6 } }
        ]
    },
    "foundry": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { iron: 10, energy: 10 }, production: { steel: 2 } },
            { cost: { iron: 20, energy: 20 }, production: { steel: 5 } }
        ]
    },
    "probe": {
        type: "special",
        description: "Scout robot",
        levels: [
            { cost: { energy: 10 }, production: {} }
        ]
    },
    "research_center": {
        type: "special",
        description: "Provides upgrades",
        levels: [
            { cost: { gold: 100, core_data: 10 }, production: {} },
            { cost: { gold: 200, core_data: 30 }, production: {} }
        ]
    },
    "graveyard": {
        type: "special",
        description: "Recruits basic undead units",
        levels: [
            { cost: { stone: 50 }, production: {} },
            { cost: { stone: 100 }, production: {} }
        ]
    },
    "lumberjack": {
        type: "economic",
        levels: [
            { cost: {}, production: {} },
            { cost: { wood: 40, gold: 20 }, production: { wood: 2 } },
            { cost: { wood: 80, stone: 10, gold: 20 }, production: { wood: 4 } },
            { cost: { wood: 120, stone: 20, gold: 20 }, production: { wood: 6 } }
        ]
    },
    "shrine": {
        type: "special",
        description: "Provides global buffs",
        levels: [
            { cost: { gold: 80, gem: 1 }, production: {} },
            { cost: { gold: 160, gem: 2 }, production: {} }
        ]
    },
    "lair": {
        type: "special",
        description: "Unlocks vampire units",
        levels: [
            { cost: { stone: 200, blood: 50 }, production: {} }
        ]
    }
    //// doplnit !!

    /*
"walls and towers"
"tavern"
"market"
"warehouse"
    */
};

// function updateGUI(castle) {
//     const buildingsContainer = document.getElementById("buildings");
//     buildingsContainer.innerHTML = "";

//     Object.values(castle.buildings).forEach(building => {
//         const buildingElement = document.createElement("div");
//         let innerHTML = `${building.name} - Úroveň: ${building.level} `;

//         if (building.level < BUILDING_DEFINITIONS[building.name].levels.length - 1) {
//             const nextLevel = building.level + 1;
//             const cost = BUILDING_DEFINITIONS[building.name].levels[nextLevel].cost;
//             const costText = Object.entries(cost).map(([res, val]) => `${res}: ${val}`).join(", ");
//             innerHTML += `<button onclick="upgradeBuilding('${building.name}')">Vylepšit (${costText})</button>`;
//         } else {
//             innerHTML += `(Max úroveň)`;
//         }

//         buildingElement.innerHTML = innerHTML;
//         buildingsContainer.appendChild(buildingElement);
//     });
// } 
const WEATHER_DEFINITIONS = {
    clear: {
        name: "Slunečno ☀️",
        description: "Jasný den. Zvyšuje morálku, ale odhaluje jednotky.",
        effects: {
            morale: +10,
            undeadPenalty: { defense: -10, morale: -15 },
            stealthPenalty: true,
        },
        visual: "bright",
        duration: [1, 2], // trvání v herních dnech
    },
    cloudy: {
        name: "Zataženo ☁️",
        description: "Neutrální počasí bez výrazných vlivů.",
        effects: {},
        visual: "gray",
        duration: [1, 3],
    },
    rain: {
        name: "Déšť 🌧️",
        description: "Ztěžuje pohyb a snižuje přesnost střelby.",
        effects: {
            rangedPenalty: -15,
            movementPenalty: -1,
        },
        visual: "wet",
        duration: [1, 2],
    },
    storm: {
        name: "Bouřka ⛈️",
        description: "Nebezpečné počasí. Šance na náhodné poškození jednotek.",
        effects: {
            randomDamage: { chance: 0.2, amount: 3 },
            energyUnitsPenalty: -20, // roboti ztrácí efektivitu
        },
        visual: "flashes",
        duration: [1],
    },
    wind: {
        name: "Silný vítr 🌬️",
        description: "Zhoršuje pohyb vzdušných jednotek a duchů.",
        effects: {
            flyingPenalty: -20,
            windWeaknessTrigger: true,
        },
        visual: "dusty",
        duration: [1, 3],
    },
    snow: {
        name: "Sníh ❄️",
        description: "Snižuje rychlost pohybu a zakrývá viditelnost.",
        effects: {
            movementPenalty: -2,
            visionPenalty: -2,
        },
        visual: "snowy",
        duration: [2, 4],
    },
    //   heat: {
    //     name: "Sníh ❄️",
    //     description: "Snižuje rychlost pohybu a zakrývá viditelnost.",
    //     effects: {
    //       movementPenalty: -2,
    //       visionPenalty: -2,
    //     },
    //     visual: "snowy",
    //     duration: [2, 4],
    //   },
    fog: {
        name: "Mlha 🌫️",
        description: "Skrývá jednotky a omezuje dosah útoků.",
        effects: {
            visionPenalty: -3,
            stealthBonus: +20,
        },
        visual: "mist",
        duration: [1, 2],
    },
    night: {
        name: "Noc 🌙",
        description: "Zvýhodňuje nemrtvé a snížená viditelnost.",
        effects: {
            undeadBonus: { attack: +10, defense: +10 },
            visionPenalty: -2,
            humanPenalty: { morale: -10 },
        },
        visual: "dark",
        duration: [1],
    }
};