/**
 * Třída by měla pracovat jako komunikační most
 * client.js <> app.js a následně přeposílat události na správný Lobby clienta
 */


/** todo's
 * při delší nečinnosti smazat lobby
 * 
 * 
 */


const fs = require('fs');
const _lobby = require("./serverLobby");
// const stats = require("./stats");
// const dbFile = './db/stats.json';
const lobbyStringLength = 8;

(function (exports) {

  const _default = {
  };

  function assignDefault(o) { return assign(_default, o); }
  function assign(o1, o2) { return Object.assign({}, o1, o2); }

  Id = function () {
    return GenerateString(lobbyStringLength);
  }

  GenerateString = function (size) {
    var res = "";
    for (i = 0; i < size; i++) {
      var char = Math.floor(Math.random() * 61);
      res += String.fromCharCode(char + (char < 10 ? 48 : (char <= 35 ? 55 : 61)));
    }
    return res;
  }

  // parametr pro server jsou proměnný z jsonů
  exports.server = class server {
    constructor(prm) {
      prm = assign(_default, prm);

      this.curentGames = 0;
      this.lobbies = {};
      this.playerInLobby = {};

      this.connectedPlayers = 0; // víceméně to je playerSocketList.length
      this.playerSocketList = []; // slovník {id: socket.id} ... nebo obráceně?

      // console.log(prm);      // load variables from json file !!
      console.log('Server started !');
    }
    // run() {
    //   for (var l in this.lobbies) {
    //     var lobby = this.lobbies[l];
    //     lobby.updateClients(this.connectedPlayers);

    //     lobby.netUpdate();
    //   }
    //   // todo - databáze - možnost pravidelně ukládat? == this.stats.save()
    // }

    // parametr je ID lobby v kterým si hráč myslí že má být
    // todo :: pokud po F5 sedí lobby ID, tak bych ho měl využít asi bych to měl posílat jako {"secret" : "asdgsdfg4654ASDG456", id : "aaaaaa" }
    connect(id, socket) {
      console.log('Connected: ', socket.id);

      this.connectedPlayers++;
      this.playerSocketList.push(socket.id);
      var id = Id();
      console.log(id, socket.id, "kontrola, zda je id v nějaké hře, pokud ne tak poslat nové, jinak přesměrovat do hry");
      // mohl bych mu udělat emit :: socket.emit('OnJoinGame', server.join(socket, data)) 
      // ještě se teoreticky budu potřebovat zeptat na heslo ?
      return Id();
    }


    disconnect(id) {
      this.connectedPlayers--;

      // this.leave(id) // musel bych to i nějak říct na clienty !
      const index = this.playerSocketList.indexOf(id);

      if (index > -1)
        this.playerSocketList = this.playerSocketList.splice(index, 1);

      this.updateClients();
      //     this.playerInLobby[id] /// pokud jsem v lobby - tak vyhodit
      console.log('Pokud je hráč v nehrajícím lobby, tak ho musím odpojit lobby.disconect', id);
      console.log("Player disconnected: " + id, index);
    }

    updateClients() {
      for (var l in this.lobbies) {
        var lobby = this.lobbies[l];
        lobby.updateClients(this.connectedPlayers);
      }
    }

    getLobbies() {
      var list = [];
      for (var l in this.lobbies) {
        list.push(this.lobbies[l].info());
      }
      return list;
    }

    join(socket, prm) {
      prm = assign({ connect: "", pass: "", name: "Player" }, prm);

      if (prm.connect == "")
        return { error: "neexistuje" };

      try {
        var lobby = this.lobbies[prm.connect];
        if (lobby === undefined)
          return { error: "naser-si" };

        if (!lobby.checkPassword(prm.pass))
          return { error: "bad-pass" }


        this.playerInLobby[socket.id] = lobby.id;
        return this.lobbies[prm.connect].connect(socket, { Id: prm.id, lobby: prm.connect, playerName: prm.name });

      }
      catch (e) {
        console.log(e)
      }

      return { error: "posralo-se-to" };
    }

    // ready(clientId, data) {
    //   var lobby = this.getPlayerLobby(clientId);
    //   if (lobby != null)
    //     lobby.readyChanged(data);
    // }

    leave(clientId) {
      console.log("Player disconnected: " + clientId);

      if (this.playerInLobby[clientId] !== undefined) { // existuje mapování hráč - lobby
        if (this.lobbies[this.playerInLobby[clientId]] !== undefined) { //  v seznamu her lobby existuje
          this.lobbies[this.playerInLobby[clientId]].disconnect(clientId); // smazat ho v lobby (socektList + component)
        }
        delete this.playerInLobby[clientId];
      }
    }


    createGame(prm) {
      var newLobby;
      //// object.assign ? 
      if ("pass" in prm && "name" in prm) {
        if (prm["name"] != "") {
          prm["id"] = Id();
          prm["stats"] = this.stats; // pointer to global statistic
          newLobby = new _lobby.lobby(prm);
          this.lobbies[newLobby.id] = newLobby;
          this.curentGames++;
        }
      }
      return newLobby;
    }

    // pokud nic nenajdu, tak to musí vrátit null, jinak by to mohlo padnout na nesmysl, a že to na něj padalo.... 
    getPlayerLobby(clientId) {
      try {
        return this.lobbies[this.playerInLobby[clientId]];
      }
      catch {
        return null;
      }
    }

    // OnLobbyMessage(clientId, data) {
    //   var lobby = this.getPlayerLobby(clientId);
    //   if (lobby != null)
    //     lobby.OnLobbyMessage(data);
    // }

    LobbyMessage(clientId, data) {
      var lobby = this.getPlayerLobby(clientId);
      if (lobby != null)
        lobby.LobbyMessage(clientId, data);
    }


  }
})(exports);




