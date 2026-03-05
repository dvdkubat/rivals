// 🌍 KOMPLEXNÍ SYSTÉM SIMULACE POČASÍ A ROČNÍCH OBDOBÍ

// --- KONSTANTY ---
const SEASONS = ["spring", "summer", "autumn", "winter"];
const DAYS_IN_WEEK = 7;
const WEEKS_IN_SEASON = 6; // může být 4 až 8, zde 6 = 42 dní
const DAYS_IN_SEASON = DAYS_IN_WEEK * WEEKS_IN_SEASON;
const DAYS_IN_YEAR = DAYS_IN_SEASON * SEASONS.length;

const DAY_CYCLE = (dayNumber) => {
  // Každý týden: 5 dní den, 2 dny noc
  const dayOfWeek = dayNumber % 7;
  if (dayNumber >= 280) return dayOfWeek < 3 ? "day" : "night"; // Zima: 3 dny den, 4 noci
  return dayOfWeek < 5 ? "day" : "night";
};

const WEATHER_DEFINITIONS = {
  clear:    { icon: "☀️", effects: { morale: +1 } },
  cloudy:   { icon: "☁️", effects: {} },
  rain:     { icon: "🌧️", effects: { rangedPenalty: -1 } },
  storm:    { icon: "🌩️", effects: { rangedPenalty: -2, movement: -1 } },
  wind:     { icon: "💨", effects: { flyingPenalty: -2 } },
  snow:     { icon: "❄️", effects: { movement: -2, decay: +1 } },
  fog:      { icon: "🌫️", effects: { visibility: -2 } },
  night:    { icon: "🌙", effects: { undeadBuff: +1 } }
};

// --- STAV HRY ---
const gameState = {
  currentDay: Math.floor(Math.random() * DAYS_IN_YEAR), // náhodný startovní den v roce
  pollution: 0,
  cities: [], // zde budou města a jejich budovy
  previousWeather: null
};

// --- POMOCNÉ FUNKCE ---
function getCurrentSeason(day) {
  const seasonIndex = Math.floor(day / DAYS_IN_SEASON);
  return SEASONS[seasonIndex % SEASONS.length];
}

function countGlobalBuildingType(state, buildingTypes) {
  return state.cities.reduce((sum, city) => sum + city.buildings.filter(b => buildingTypes.includes(b.type)).length, 0);
}

function getTotalProduction(state, resourceType) {
  let sum = 0;
  for (const city of state.cities) {
    for (const building of city.buildings) {
      if (building.production && building.production[resourceType]) {
        sum += building.production[resourceType];
      }
    }
  }
  return sum;
}

// --- GENERÁTOR POČASÍ ---
function generateWeather(state) {
  const season = getCurrentSeason(state.currentDay);
  const dayPhase = DAY_CYCLE(state.currentDay);

  const baseChances = {
    clear: season === "summer" ? 1.4 : 1.0,
    cloudy: 1.0,
    rain: season === "spring" ? 1.3 : 0.8,
    storm: 0.5,
    wind: 0.8,
    snow: season === "winter" ? 1.2 : 0.2,
    fog: state.previousWeather === "rain" ? 1.2 : 0.6,
    night: dayPhase === "night" ? 1.5 : 0.0
  };

  // Vliv těžby dřeva = více větru
  const woodProd = getTotalProduction(state, "wood");
  if (woodProd > 200) {
    baseChances.wind += 0.4;
    baseChances.clear -= 0.2;
  }

  // Znečištění = bouře a mlha
  const industrialBuildings = countGlobalBuildingType(state, ["reactor", "factory", "foundry"]);
  if (industrialBuildings > 10) {
    state.pollution += 0.1 * industrialBuildings;
  }
  if (state.pollution > 20) {
    baseChances.storm += 0.5;
    baseChances.fog += 0.3;
  }

  // Normalizace
  const total = Object.values(baseChances).reduce((a, b) => a + b, 0);
  const normalized = Object.entries(baseChances).map(([k, v]) => [k, v / total]);

  const rand = Math.random();
  let acc = 0;
  for (const [weather, chance] of normalized) {
    acc += chance;
    if (rand < acc) {
      state.previousWeather = weather;
      return { weather, season, dayPhase, day: state.currentDay, icon: WEATHER_DEFINITIONS[weather].icon };
    }
  }
  return { weather: "clear", season, dayPhase, day: state.currentDay, icon: "☀️" };
}

// --- TESTOVÁNÍ ---
function advanceDay(state) {
  state.currentDay = (state.currentDay + 1) % DAYS_IN_YEAR;
  return generateWeather(state);
}

// Např. vypiš 7 dní počasí
for (let i = 0; i < 7; i++) {
  const report = advanceDay(gameState);
  console.log(`Day ${report.day} (${report.season} - ${report.dayPhase}): ${report.icon} ${report.weather}`);
}
