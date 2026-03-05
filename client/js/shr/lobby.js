
if (typeof require !== 'undefined') {
  ; // var component = require("./component"); - pokud chci přidat nějaký .js
}

(function (exports) {
  const _default = {
    id: "",
    name: ""
  };

  // function assignDefault(o) {
  //   return assign(_default, o);
  // }

  // function assign(o1, o2) {
  //   return Object.assign({}, o1, o2);
  // }

  exports.lobbyBase = class lobbyBase {
    constructor(prm) {

      this.isServer = (typeof require !== 'undefined');

      prm = Object.assign({}, _default, prm);

      this.id = prm.id;
      this.name = prm.name;
      this.components = new Map(); // nebude lepší normální objekt ?   {};

      // načíst trasu a kolize pro checkpointy
      //this.world = new world.world(worldData); // vars

      // v updatu musím nějak detekovat kolizi - pokud je hráč dost blízko checkpointu, kterej má projet
      //this.colisions = new colision.colision(collisionParmas);
      this.turn = 0;
      this.day = 0;
      this.weather = {}; // new Weather();

      this.active = false; // můžu se hýbyt a tak podobně - game started !! 
    }


    // nevim, asi to je k prdu, časem do toho dám aktualizaci proměnný? a budu to volat na začátku tahu ?
    update() { }

    /// funkce existující po okolí
    send() { }
    connect() { }
    disconnect() { }

    // netUpdate(data){
    // }



    // //// stará funkce, počí počet ready hráčů
    // emitPlayerChange() {
    //   this.readyCount = 0; // je to možná lepší před posláním přepočítat
    //   for (var i = 0; i < this.playerList.length; i++) {
    //     if (this.playerList[i].ready)
    //       this.readyCount++;
    //   }

    //   this.send("PlayerChange", { ready: this.readyCount, players: null });
    //   // this.send("PlayerChange", { ready: this.readyCount, players: this.players });
    // }





    // obecná socket funkce volající "sama sebe"
    // GeneralCommunication(data) {
    //   this.send("OnLobbyMessage", data);
    // }


  }
})(typeof exports === 'undefined' ? this['lobbyBase'] = {} : exports);


