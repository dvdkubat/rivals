// 🌍 KOMPLEXNÍ SYSTÉM SIMULACE POČASÍ A ROČNÍCH OBDOBÍ - PŘEPSÁNO DO TŘÍDY

const SEASONS = ["spring", "summer", "autumn", "winter"];
const DAYS_IN_WEEK = 7;
const WEEKS_IN_SEASON = 6;
const DAYS_IN_SEASON = DAYS_IN_WEEK * WEEKS_IN_SEASON;
const DAYS_IN_YEAR = DAYS_IN_SEASON * SEASONS.length;

const WEATHER_DEFINITIONS = {
  clear:    { icon: "☀️", effects: { morale: +1, regeneration: +1, buildSpeed: +0.1 } },
  cloudy:   { icon: "☁️", effects: { visibility: -1 } },
  rain:     { icon: "🌧️", effects: { rangedPenalty: -1, movementPenalty: -1, morale: -1, vegetationBoost: +1 } },
  storm:    { icon: "🌩️", effects: { rangedPenalty: -2, movementPenalty: -2, lightningChance: 0.1, buildInterrupt: true } },
  wind:     { icon: "💨", effects: { flyingPenalty: -2, rangedPenalty: -1, waterEvaporation: +1 } },
  snow:     { icon: "❄️", effects: { movementPenalty: -2, fatigue: +1, miningEfficiency: -1, decay: +1 } },
  fog:      { icon: "🌫️", effects: { visibility: -2, towerRange: -1, aiAwareness: -1 } },
  night:    { icon: "🌙", effects: { undeadBuff: +1, humanDebuff: -1, visibility: -2, buildSpeed: -0.1 } }
};

console.log("☀️",  "☁️", "🌧️",  "🌩️", "💨",  "❄️", "🌫️",  "🌙","🌤️", "🌨️", "🌪️", "🌀", "⛈️","🕊️", "🍀","🧟");

class Weather {
  constructor(state) {
    this.state = state;
    this.state.currentDay = this.state.currentDay ?? Math.floor(Math.random() * DAYS_IN_YEAR);
    this.state.pollution = this.state.pollution ?? 0;
    this.state.snowDepth = this.state.snowDepth ?? 0;
    this.state.droughtCounter = this.state.droughtCounter ?? 0;
    this.state.rainfallCounter = this.state.rainfallCounter ?? 0;
    this.state.previousWeather = this.state.previousWeather ?? null;
  }

  getCurrentSeason() {
    const seasonIndex = Math.floor(this.state.currentDay / DAYS_IN_SEASON);
    return SEASONS[seasonIndex % SEASONS.length];
  }

  getDayCycle() {
    const dayOfWeek = this.state.currentDay % 7;
    if (this.state.currentDay >= 280) return dayOfWeek < 3 ? "day" : "night";
    return dayOfWeek < 5 ? "day" : "night";
  }

  countBuildings(buildingTypes) {
    return this.state.cities.reduce((sum, city) => sum + city.buildings.filter(b => buildingTypes.includes(b.type)).length, 0);
  }

  getTotalProduction(resourceType) {
    return this.state.cities.reduce((sum, city) => {
      return sum + city.buildings.reduce((bSum, b) => bSum + (b.production?.[resourceType] ?? 0), 0);
    }, 0);
  }

  getTemperature() {
    const radians = (2 * Math.PI * this.state.currentDay) / DAYS_IN_YEAR;
    const baseTemp = 15 + 10 * Math.sin(radians);
    const variation = Math.floor(Math.random() * 11) - 5;
    return Math.round(baseTemp + variation);
  }

  updateEnvironment(weather, temp) {
    if (weather === "snow") this.state.snowDepth++;
    else if (this.state.snowDepth > 0 && temp > 0) this.state.snowDepth--;

    if (weather === "rain") {
      this.state.rainfallCounter++;
      this.state.droughtCounter = 0;
    } else {
      this.state.droughtCounter++;
      this.state.rainfallCounter = 0;
    }
  }

  generate() {
    const season = this.getCurrentSeason();
    const dayPhase = this.getDayCycle();
    const temperature = this.getTemperature();

    const baseChances = {
      clear: season === "summer" ? 1.4 : 1.0,
      cloudy: 1.0,
      rain: season === "spring" ? 1.3 : 0.8,
      storm: 0.5,
      wind: 0.8,
      snow: season === "winter" || temperature < 0 ? 1.2 : 0.1,
      fog: this.state.previousWeather === "rain" ? 1.2 : 0.6,
      night: dayPhase === "night" ? 1.5 : 0.0
    };

    if (this.getTotalProduction("wood") > 200) {
      baseChances.wind += 0.4;
      baseChances.clear -= 0.2;
    }

    const industrial = this.countBuildings(["reactor", "factory", "foundry"]);
    if (industrial > 10) this.state.pollution += 0.1 * industrial;
    if (this.state.pollution > 20) {
      baseChances.storm += 0.5;
      baseChances.fog += 0.3;
    }

    if (this.state.droughtCounter >= 5) {
      baseChances.clear += 0.5;
      baseChances.rain -= 0.3;
    }
    if (this.state.rainfallCounter >= 4) {
      baseChances.rain += 0.5;
      baseChances.clear -= 0.2;
    }

    const total = Object.values(baseChances).reduce((a, b) => a + b, 0);
    const normalized = Object.entries(baseChances).map(([k, v]) => [k, v / total]);

    const rand = Math.random();
    let acc = 0;
    for (const [weather, chance] of normalized) {
      acc += chance;
      if (rand < acc) {
        this.state.previousWeather = weather;
        this.updateEnvironment(weather, temperature);
        return {
          weather,
          season,
          dayPhase,
          day: this.state.currentDay,
          temperature,
          icon: WEATHER_DEFINITIONS[weather].icon,
          snowDepth: this.state.snowDepth,
          drought: this.state.droughtCounter,
          rainfall: this.state.rainfallCounter,
          effects: WEATHER_DEFINITIONS[weather].effects
        };
      }
    }

    return {
      weather: "clear",
      season,
      dayPhase,
      day: this.state.currentDay,
      temperature,
      icon: "☀️",
      effects: WEATHER_DEFINITIONS.clear.effects
    };
  }

  advanceDay() {
    this.state.currentDay = (this.state.currentDay + 1) % DAYS_IN_YEAR;
    return this.generate();
  }

  toString() {
    const season = this.getCurrentSeason();
    const dayOfWeek = this.state.currentDay % 7;
    const dayPhase = this.getDayCycle();
    return `Den ${this.state.currentDay} (${season}, ${dayPhase}, den v týdnu: ${dayOfWeek})`;
  }
}

// --- POUŽITÍ ---
const gameState = {
  cities: [/* struktura měst zde */]
};

const weatherSystem = new Weather(gameState);

for (let i = 0; i < 7; i++) {
  const report = weatherSystem.advanceDay();
  console.log(`${weatherSystem.toString()}: ${report.icon} ${report.weather}, Temp: ${report.temperature}°C, Snow: ${report.snowDepth}, Drought: ${report.drought}, Rain: ${report.rainfall}`);
}
