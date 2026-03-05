
if (typeof require !== 'undefined') {
  ; // var component = require("./component"); - pokud chci přidat nějaký .js
}

/// ##  Terrain
(function (exports) {
  const _default = {}

  exports.TerrainType = class TerrainType {

    constructor(name, color, cost) {
      //prm = Object.assign({}, _default, prm);
      this.name = name;
      this.color = color;
      this.cost = cost;
    }

  }
})(typeof exports === 'undefined' ? this['TerrainType'] = {} : exports);


// Třída pro Point of Interest (POI)
(function (exports) {
  const _default = {}

  exports.POI = class POI {
    constructor(type, name, resources = {}, img) {
      //prm = Object.assign({}, _default, prm);
      this.type = type; // např. "caravan", "cave", "ruins"
      this.name = name; // např. { x: 5, y: 10 }
      this.resources = resources; // např. { wood: 100, gold: 50 }
      this.img = img; // např. { wood: 100, gold: 50 }
    }

    collect() {
      // Přidej zdroje hráči - pokud tu položku může sebrat !
      for (let [resource, amount] of Object.entries(this.resources)) {
        player.addResource(resource, amount);
      }

      console.log('Inventář:', player.inventory);
      console.log(`POI ${this.type} byl sebrán!`);
    }
  }
})(typeof exports === 'undefined' ? this['POI'] = {} : exports);

/// ##  Player
(function (exports) {
  const _default = {}

  exports.Player = class Player {
    constructor() {
      this.inventory = {};
    }

    addResource(resource, amount) {
      if (!this.inventory[resource]) {
        this.inventory[resource] = 0;
      }
      this.inventory[resource] += amount;
      console.log(`Získáno ${amount} ${resource}.`);
    }
  }
})(typeof exports === 'undefined' ? this['Player'] = {} : exports);




// Třída reprezentující bod v matici hexů
(function (exports) {
  const _default = {}

  exports.Point = class Point {
    constructor(x, y, action, activity = 0, terrain = 0, q = 0, r = 0) {
      this.x = x;
      this.y = y;
      this.activity = activity;
      this.action = action;
      this.terrain = terrain;

      // na co ? path finding
      this.parent = null;
      this.q = q;
      this.r = r;
      this.g = 0;
      this.h = 0;
      this.f = 0;
    }

    // Metoda pro změnu stavu bodu po kliknutí
    cycleState() {
      if (setActionCheckbox.checked) {
        this.activity++;
        if (this.activity >= Actions.length)
          this.activity = 0;
      }
      else {
        this.terrain++;
        if (this.terrain >= Terrain.length)
          this.terrain = 0;
      }
    }

    setTerrain(type) {
      const terrainValue = parseFloat(type);
      if (!isNaN(terrainValue)) {
        if (setActionCheckbox.checked)
          this.activity = terrainValue;
        else
          this.terrain = terrainValue;
      }
    }

    draw() {
      if (isDebugger) {
        this.drawHex(hexSize)
        this.drawDot()
      }
      if (this.action !== null) {
        var dy = 0;
        if (this.action.hasOwnProperty('loot'))
          var data = IMGS[POIs[this.action.loot].img];

        if (this.action.hasOwnProperty('castle')) {
          var data = IMGS[CASTLEs[this.action.castle].img];
          dy = 15;
        }
        ctx.drawImage(data, this.x - data.width / 2, this.y - data.height / 2 - dy, data.width, data.height);
      }
    }

    drawDot() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, dotRadius, 0, 2 * Math.PI);
      ctx.fillStyle = Terrain[this.terrain].color;
      ctx.fill();
    }

    drawHex(size) {
      const angleOffset = direction === "flat" ? Math.PI / 6 : 0;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = angleOffset + (Math.PI / 3) * i;
        const px = this.x + size * Math.cos(angle);
        const py = this.y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = Actions[this.activity]; //"#999";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
})(typeof exports === 'undefined' ? this['Player'] = {} : exports);




// chci tady něco dělat?
(function (exports) {
  const _default = {
    id: "",
    name: ""
  }

  exports.world = class world {

    constructor(prm) {
      prm = Object.assign({}, _default, prm);

      this.idx = 0; // prm.idx
      this.checkpoints = prm; //  prm.track;
      this.finish = prm.length - 1;//  prm.track;
    }

    get(idx) {
      return this.checkpoints[idx];
    }


  }
})(typeof exports === 'undefined' ? this['world'] = {} : exports);




