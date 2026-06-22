
/**  tohle se musí nějak starat o hru >> o komunikace
*/

// prm.width, prm.height
class lobby extends lobbyBase.lobbyBase {

  constructor(prm) {
    super(prm);
    this.isServer = false;


    // nějaký informace o mapě... body, poy, hrady, pozice hráčů
    this.camera = {x: 0, y: 0} // zaostření na armádu, hrad, free-look, ...
    this.world = {}; // world info

    this.display = new display("world-game-canvas", prm.width, prm.height, "zelda"/*prm.background*/);
    this.selectedCasle = "random";
    this.ready = false;
    this.hero = "not-implemented-yet";
    this.connected = 0; // stáhni ze serveru po připojení !
    this.sound = null;
    this.animation = null;

    this.player = { id: prm.id || 'local', name: 'Player', race: 'human', armies: [] };
    this.player.castle = new castle.castle('human');
    this.player.armies.push(new ArmyModule.Army({
      ownerId: this.player.id,
      name: 'Natan',
      race: 'human',
      hex: grid[11] && grid[11][22] ? grid[11][22] : grid[0][0],
      units: { spearman: 5, archer: 2 },
      speed: 20
    }));

    this.gameManager = new GameManager.GameManager([this.player], {
      onArmyMoved: () => this.updateSidebar(),
      onTurnStart: () => this.updateSidebar()
    });
    this.mapController = new MapController.MapController({
      canvas: this.display.canvas,
      grid,
      hexSize,
      direction,
      gameManager: this.gameManager,
      onRedraw: () => this.draw(),
      onArmySelect: () => this.updateSidebar()
    });
    this.updateSidebar();
  }


  // vykreslit mapu, věci na hexech, hrad a tak...
  draw() {

    // hodit sem podmínku a podle toho buď ready nebo ingame
    this.display.draw(this.camera, this.world);
    if (this.display.isReady && this.mapController) this.mapController.redrawOverlay();
  }


  // send data to server
  send(emit, data) {
    socket.emit(emit, data);
  }


  begin(data) {
    this.active = true;
    console.log("game begin data: ", data);
    if (this.gameManager) this.gameManager.start();

  }

  buildCastle() {
    this.player.castle.buildBuilding('saw_mill');
    this.renderCastle();
    this.updateSidebar();
  }

  recruitArmy() {
    var army = this.player.armies[0];
    army.units.peasant = (army.units.peasant || 0) + 5;
    this.updateSidebar();
  }

  renderCastle() {
    var buildings = document.getElementById('buildings');
    var units = document.getElementById('units');
    var resources = document.getElementById('resources');
    if (buildings) buildings.innerHTML = Object.values(this.player.castle.buildings).map(b => '<div class="card"><strong>' + b.name + '</strong><br>Level: ' + b.level + '<br><button onclick="client.lobby.buildCastle()">Build/upgrade</button></div>').join('');
    if (units) units.innerHTML = Object.entries(this.player.armies[0].units).map(([name, count]) => '<div class="card"><strong>' + name + '</strong><br>' + count + '<br><button onclick="client.lobby.recruitArmy()">Recruit +5</button></div>').join('');
    if (resources) resources.innerHTML = Object.values(this.player.castle.resources).map(r => '<div class="card">' + r.name + ': ' + r.count + '</div>').join('');
  }

  updateSidebar() {
    this.renderCastle();
    var army = this.player.armies[0];
    var name = document.getElementById('player-castle-name');
    if (name) name.textContent = 'Praha';
    var strength = document.getElementById('selected-army-strength');
    if (strength) strength.textContent = army.totalAttack + '⚔️ | ' + army.totalDefense + '🛡️ | ' + army.movementPoints.toFixed(1) + '🦵 | ' + army.unitCount + '💪';
    var table = document.getElementById('selected-army-units');
    if (table) table.innerHTML = Object.entries(army.units).map(([unit, count]) => '<tr><td>' + unit + '</td><td>' + count + '</td></tr>').join('');
  }


  // playSound() {
  //       if(this.playAudio != null){
  //         this.playAudio = null;
  //       }
  //       // random 0 > audio list length
  //       this.playAudio = new Audio( audio[1] );
  //       this.playAudio.play();
  // }
  // setAnimation(data) {
  //   var pIndex = 0;
  //   var visible = (data.card != -1);

  //   for (var i = 0; i < client.lobby.playerList.length; i++) {
  //     var item = client.lobby.playerList[i];
  //     if (item.id == data.player || item.name == data.player) {
  //       pIndex = i;
  //     }
  //   }

  //   var a = {
  //     visible: visible,
  //     speed: animationFrames,
  //     card: data.card,
  //     origin: lizPos,
  //     destination: decPos
  //   }
  //   this.animation = new animation.animation(a);
  // }






}


