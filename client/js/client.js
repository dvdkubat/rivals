/**
 * Nějaký základní připojování a odpojování do hry
 * kominikace client <> server
 * 
 */


class clientClass {
  constructor() {
    this.gameSpeed = 1000 / 125; // kolik milisekund je na update
    this.id = ""; // co by to mělo být za id? asi ho úplně nepoužívám... možná ani nechci
    // this.player = null; // local play

    this.lobby = null;

    this.interval = null;
    this.mySocket = null; // abych mohl posílat ?

    this.keyDownList = {
      left: false,
      right: false,
      up: false,
      down: false,

      respawn: false, // todo - hlídat i release klávesy ? 
      respawnDown: false, // todo - hlídat i release klávesy ? 
      boost: false
    }


  }
  // onConnect(socketId) {
  //   this.id = socketId;
  // }
  // onDisconnect(playerId) {
  //   this.lobby.disconnect(playerId);
  // }
  connect(id) {
    this.id = id;
  }


  // že by tohle kreslilo mapu - ano, otázka, jestli mám dělat setInterval ?? 
  update() {

    //    this.lobby.update(/*data*/);
    this.lobby.draw();

    // tohle nemusím, vždy pošlu data při konci tahu... případně se to bude posílat při klikání
    // this.lobby.GeneralCommunication(
    //   {
    //     fce: "UpdateClientPosition",
    //     data: this.lobby.getPlayer(this.id).packet(false)
    //   }
    // );
  }

  init(data) {
    //todo :: "zpracoat" data - načíst info o lobby (velikost, mapa, ...) // dost toho je jako nastavení obrazovky
    localStorage.setItem(_lsvar, this.id);

    console.log("zpracovat", data)
    this.lobby = new lobby({ id: this.id, width: 1200, height: 900, background: "mapa" });
  }

  // sem by se hodilo dát to vykreslení mapy... zatím interval, časem třeba něco lepšího...
  start() {
    this.interval = setInterval(() => { client.update() }, this.gameSpeed);
  }

  stop() {
    clearInterval(this.interval);
    client.interval = null;
    this.lobby = null; // budu se připojovat jinam
  }

  join(data) {
    if (data == null) {
      alert('Chyba lobby');
      return;
    }

    if (data.error == "full") {
      alert('Plné lobby');
      return;
    }

    if (data.error == "bad pass") {
      alert('Špatné heslo');
      return;
    }

    console.log('po připojení server říká: ', data);
    this.active = data.active;
    var sceen = (this.active ? "ingame" : "lobby");
    //sceen = "ingame"; // testing !!;

    this.init(data);
    this.start();
    return sceen;
  }


  begin(data) {
    this.lobby.begin(data);
    return "ingame";
  }

  leave() {
    // pokud není, tak emit na pročištění proměnných
    this.stop();
  }

  keyWatch() {

  }


  /** obecný ovládání -- 
  pathFinding
  nextPlayer
  ....
  battle ?
  */

  onDisconnect(data) {
    if (this.lobby != null)
      this.lobby.onDisconnect(data);
  }

  OnLobbyMessage(data) {
    if (this.lobby != null)
      this.lobby.OnLobbyMessage(data);
  }

  log(text) {
    $("#log").append('<div>' + text + '</div>');
  }
}


