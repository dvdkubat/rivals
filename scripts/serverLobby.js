

if (typeof require !== 'undefined') {
  var base = require("../client/js/shr/lobby");
  // var component = require("../client/js/shr/component");
}
// if(typeof require !== 'undefined'){
//  var moduleName2 = require('./shared2');
// }


(function (exports) {


  const spawn = { x: 220, y: 410 }

  const _default = {
    id: "",
    pass: "",
    name: "Lasagne",
    mode: "Standard",
    max: 64,
    limit: 0,
    stats: null,
    canvasek: "game-canvas"
  };


  exports.lobby = class lobby extends base.lobbyBase {

    // todo :: map by mohlo něco dělat.. ?
    constructor(prm) {
      super(prm);
      this.isServer = true;

      this.pass = prm.pass;
      this.mode = prm.mode;
      this.max = prm.max;
      this.map = prm.map;

      this.playerList = {}; // seznam hráčů - stačí na serveru?
      this.socketList = []; // socket list

      this.inGame = 0;
      this.players = 0;
      this.readyCount = 0;

      //sem ?
      this.weather = null; // aktuální počasí, nějaký to genrováníčko, a zobrzauju to pak "jinak"
      this.heat = null;

    }

    checkPassword(pass) {
      return (this.pass == pass || this.pass == "")
    }
    connect(socket, prm) {
      prm = Object.assign({}, prm);

      if (this.players == this.max)
        return { error: "full" }

      this.players++;
      this.socketList.push(socket);
      // jak budu evidovat hráče, nebude to přeci jen chtít tuhle "component" použít?
      //      this.components.set(prm.Id, new component.component({ id: prm.Id, name: prm.playerName, dimension: { x: 48, y: 96 }, position: spawn }));

      console.log('poslat info o mapě');
      return {
        name: this.name,
        items: this.packet(true),
        lobby: "info", // mapa, její rozměry a tak ... nebo jen název a pak to stáhnout jinde... jinde teprve budu nastavovat !!
        active: this.active
      };
    }

    disconnect(playerId) {
      this.send("OnDisconnect", playerId); // this.components[socket.id]);

      this.players--;
      console.log("odpojit z lobby");

      for (var i = 0; i < this.socketList.length; i++) {
        if (this.socketList[i] == playerId) {
          this.socketList.splice(i, 1);
          break;
        }
      }
    }

    // readyChanged(data) {
    //   // přepnu, stav, udělám nějaký send - buď 5, 4, 3, 2, 1 nebo změnu ikonky
    //   // this.send("", aaa)
    //   console.log("todo - redy changed !")
    // }



    // budu pořád posílat jako seznam cimponentů ? nebo to přepracuju... ?
    packet(full) {
      var items = [];
      for (const value of this.components.values()) {
        items.push(value.packet(full));
      }

      return { components: items }
    }

    ///časem spojit funkce - pokud jsem ve hře, tak dostávám connected + pakety
    updateClients(connectedPlayers) {
      this.send("TotalPlayers", connectedPlayers);
    }


    send(emit, data) {
      for (i = 0; i < this.socketList.length; i++) {
        this.socketList[i].emit(emit, data);
      }
    }


    info() {
      return [
        this.id,
        this.name,
        this.limitString,
        this.mode,
        this.players + '/' + this.max.toString(),
        this.pass != ""
      ];
    }


    clientUpdate(player) {
      try {
        var item = this.components.get(player.id);
        item.set4d("position", player.position);
      }
      catch (e) {
      }
    }

    playerReady(player, state) {
      console.log("playerReady: ", player, state);
      this.active = true;
      this.send("GameStarts", {});
    }

    getReadyText() {
      return this.readyCount + "/" + this.players;
    }






    ////////////////////////////////////////////////


    // startGame() {
    //   this.gameStarted = true;

    //   if (this.play erList[this.currentPlayer].isNPC) // pokud NPC začíná, tak může hned dát kartu
    //     this.playNPC(); // this.play erList[this.currentPlayer]);

    //   // todo - stačí poslat seznam hráčů ve hře?
    //   if (this.isServer) {
    //     this.globalStats.incScoreStart(this.player List);
    //     this.localStats.incScoreStart(this.playe rList);
    //   }

    //   this.send("GameStarted", this.packet(true));
    // }
    // // server only - inheritance ... a pryč s tím
    // endGame(prm) {
    //   this.readyCount = 0;
    //   this.gameStarted = false;

    //   for (var i = 0; i < this.play erList.length; i++) {
    //     this.pl ayerList[i].inGame = false;
    //     this.pl ayerList[i].ready = false;
    //   }

    // this.send("UpdateClients", this.packet(true));
    // this.send("GameEnded", prm);
    // }


    // ready, next day, ... sem bych mohl strkat funkce
    // data = {fce: "UpdateClientPosition", data: {}}
    LobbyMessage(clientId, data) {
      if (data === undefined)
        return;

      var operation = data.fce;
      switch (operation) {
        case "UpdateClientPosition":
          this.clientUpdate(data.data);
          break;

        case "ReadyStateChange":
          this.playerReady(clientId, data.data);
          break;

      }
    }


  }
})(typeof exports === 'undefined' ? this['lobby'] = {} : exports);