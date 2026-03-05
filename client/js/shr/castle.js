
if (typeof require !== 'undefined') {
  ; // var component = require("./component"); - pokud chci přidat nějaký .js
}





(function (exports) {
  const _default = {}

  exports.unit = class unit {
    constructor(name, count, production = 0) {
      // const b = BUILDING_DEFINITIONS[name];
      // if (b === undefined)
      //     return;
      this.name = name;
      this.canBuy = 1;
      this.canRecruit = 0;
      this.display = UNIT_DEFINITIONS[this.name] ?? this.name;
      this.count = count;
      this.production = production;
      this.img = UNIT_DEFINITIONS[this.name].image ?? "";
    }

    get UIElement() {
      const element = document.createElement("div");
      element.className = "card ";
      element.className += this.canRecruit ? "" : "gray-backgroud"; // pokud nemůžu rekrutovat, tak změnit barvu pozadí / obrázku... něco

      element.innerHTML = `
            <strong>${this.name}</strong><br/>
            <img class="unit-icon" src="${this.img}" /> <br />
            ${this.count} <span class="unit-status">${this.canBuy ? "✅" : "❌"}</span>`;

      return element;
    }

    toString() {
      return `${this.display}: ${this.count} (${this.production})`;
    }

  }
})(typeof exports === 'undefined' ? this['unit'] = {} : exports);




(function (exports) {
  const _default = {}

  exports.resource = class resource {
    constructor(name, count, order = 0, production = 0) {
      // const b = BUILDING_DEFINITIONS[name];
      // if (b === undefined)
      //     return;
      this.name = name;
      this.display = RESOURCES[this.name] ?? this.name;
      this.max = 0; // 0 off, jinak limit?
      this.order = order;
      this.count = count;
      this.production = production;
    }

    get UIElement() {
      const element = document.createElement("div");
      element.className = "card";

      element.textContent = `${this.display}: ${this.count} ${(this.max > 0 ? " / " + this.max : "")} (+${this.production})`; // třeba populace by mohla mít "Populace 6/7 (+5)"

      return element;
    }

    toString() {
      return `${this.display}: ${this.count} (${this.production})`;
    }
  }
})(typeof exports === 'undefined' ? this['resource'] = {} : exports);




(function (exports) {
  const _default = {}

  exports.building = class building {
    constructor(name, level = 0) {
      const b = BUILDING_DEFINITIONS[name];
      if (b === undefined)
        return;

      this.name = name;
      this.display = RESOURCES[this.name] ?? this.name;
      this.type = b.type;
      this.level = level;
      this.unitType = b.unitType || null;
      this.resource = b.resource || null;
    }

    // mám dva náhledy, buď to je cost, abych ten level vzal, takže +1, nebo to brát jako upgradecost a nechat to. Podle toho pak bude definice !! 
    get cost() {
      var data = BUILDING_DEFINITIONS[this.name];
      if (data && data.levels.length > this.level + 1)
        return data.levels[this.level + 1].cost;

      return {};
    }

    get costString() {
      var data = this.cost;
      return Object.entries(data).map(([resource, amount]) => `${resource}: ${amount}`).join(', ');
    }

    get production() {
      if (BUILDING_DEFINITIONS[this.name])
        return BUILDING_DEFINITIONS[this.name].levels[this.level].production;
      else
        return {};
    }

    get productionString() {
      var data = this.production;
      return Object.entries(data).map(([resource, amount]) => `${resource}: ${amount}`).join(', ');
    }

    upgrade() {
      if (this.level < BUILDING_DEFINITIONS[this.name].levels.length - 1) {
        this.level++;
      } else {
        console.log("Budova je na maximální úrovni!");
      }
    }
    toString() {
      if (this.name === undefined)
        return "";
      return `${this.display} (${this.level}) : { ${this.costString} }`; // production !!
    }
  }
})(typeof exports === 'undefined' ? this['building'] = {} : exports);







(function (exports) {
  const _default = {}

  exports.GUIPanel = class GUIPanel {
    constructor(x, y, text, image = null, onClick = null) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.image = image;
        this.onClick = onClick;
        this.width = 64;
        this.height = 80;
    }

    draw(ctx) {
        if (this.image) {
            const img = new Image();
            img.src = this.image;
            img.onload = () => ctx.drawImage(img, this.x, this.y, this.width, this.width);
        }
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(this.text, this.x, this.y + this.height);
    }

    isClicked(x, y) {
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
    }
  }
})(typeof exports === 'undefined' ? this['GUIPanel'] = {} : exports);




(function (exports) {
  const _default = {
    id: "",
    name: ""
  }

  exports.castle = class castle {
    constructor(race) {
      //if (typeof data === "string") {
      this.faction = race;

      const data = CASTLE_PARAMETERS[race];
      const defaults = INITIAL_PARAMETERS[this.faction] || {};

      this.passive = data.passive;

      this.resources = {};
      data.resources.forEach(key => { this.resources[key] = new Resource(key, defaults?.resources[key] ?? 0); });

      this.units = {};
      // data.units.forEach(key => { this.units[key] = defaults?.units[key] ?? 0; });
      data.units.forEach(key => { this.units[key] = new Unit(key, (defaults?.units[key] ?? 0)) });

      this.buildings = {};

      data.buildings.forEach(key => { this.buildings[key] = new Building(key, (defaults?.buildings[key] ?? 0)) });

      this.setProduction();

      this.background = data.background || null;

      this.unitQueue = [];
      this.built = 0; // už jsme v tahu postavil budovu?

      // this.buildings = Object.fromEntries(data.buildings.map(b => [b.name, new Building(b.name)]));
      // Object.values(this.buildings).forEach(b => b.level = data.buildings.find(db => db.name === b.name).level);
    }

    loopAndSet(data) {
      Object.entries(data).forEach(([key, value]) => {
        if (this.resources[key])
          this.resources[key].production += value;
      });
    }

    setProduction() {
      Object.values(this.resources).forEach(r => { r.production = 0 });
      Object.values(this.buildings).forEach(b => { this.loopAndSet(b.production) });
      this.loopAndSet(this.passive);
    }

    buildBuilding(name) {
      const building = this.buildings[name];
      if (!building) {
        console.log("Budova neexistuje!");
        return;
      }

      if (this.canAfford(building.cost)) {
        this.payCost(building.cost);
        building.upgrade();
        console.log(`${building.name} byl vylepšen na úroveň ${building.level}!`);
      } else {
        console.log("Nedostatek surovin!");
      }
    }

    canAfford(cost) {
      return Object.keys(cost).every(resource => this.resources[resource] >= cost[resource]);
    }

    payCost(cost) {
      Object.keys(cost).forEach(resource => this.resources[resource] -= cost[resource]);
    }

    getProductionSummary() {
      const summary = {};
      for (let name in this.buildings) {
        const building = this.buildings[name];
        if (building.production && building.resource) {
          summary[building.resource] = (summary[building.resource] || 0) + building.production;
        }
      }
      return summary;
    }

    newDay() {
      this.dayCount++;
      const production = this.getProductionSummary();
      for (let res in production) {
        this.resources[res] = (this.resources[res] || 0) + production[res];
      }
      this.unitQueue = this.unitQueue.map(unit => {
        unit.time--;
        if (unit.time <= 0) {
          this.units[unit.type] = (this.units[unit.type] || 0) + 1;
          return null;
        }
        return unit;
      }).filter(unit => unit !== null);
    }

    toJSON() {
      return JSON.stringify({
        faction: this.faction,
        resources: this.resources,
        buildings: Object.entries(this.buildings).map(([name, building]) => ({
          name,
          level: building.level
        })),
        unitQueue: this.unitQueue,
        units: this.units,
        background: this.background,
        dayCount: this.dayCount
      });
    }
  }
})(typeof exports === 'undefined' ? this['castle'] = {} : exports);

