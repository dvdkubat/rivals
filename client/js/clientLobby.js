
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
  }


  // vykreslit mapu, věci na hexech, hrad a tak... 
  draw() {

    // hodit sem podmínku a podle toho buď ready nebo ingame 
    this.display.draw(this.camera, this.world);
  }


  // send data to server
  send(emit, data) {
    socket.emit(emit, data);
  }


  begin(data) {
    this.active = true;
    console.log("game begin data: ", data);

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


