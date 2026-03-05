

if (typeof require !== 'undefined') {
  var _2D = require('./2d');
  //var colision = require('./colision');
  // var functions = require('../../js/generate');
}

(function (exports) {

  //	function LocalFunction() {
  //	moduleName2.fun();
  //		return;
  //	}

  const _default = {
    id: "",
    name: "unset",
    speed: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    dimension: { x: 0, y: 0 }
  };


  function assignDefault(o) {
    return assign(_default, o);
  }

  function assign(o1, o2) {
    return Object.assign({}, o1, o2);
  }


  exports.component = class component {//} extends colision.colision{
    constructor(prm) {
      //super();

      prm = assignDefault(prm);

      this.id = prm.id; // functions.id(8); ////// důležité pro objekty, které chci posílat po serveru a nějak synchronizovat
      this.name = prm.name;

      // kam jsem dojel.. ? 
      this.checkpoint = 0;

      // this.speed = new _2D._2D(prm.speed); // jelikož je to spíš 4d objekt, tak toto nepotřebuju
      this.position = new _2D._2D(prm.position);
      this.dimension = new _2D._2D(prm.dimension);

      this.image = 'car';
      // this.animation = new animation();
    }

    // update všemožných věcí
    update() {
      this.move();
    }

    move() {
      this.position.x += (this.position.v * (-1 * Math.round(Math.sin(this.position.a * to_RAD) * 1000) / 1000));
      this.position.y += (this.position.v * (1 * Math.round(Math.cos(this.position.a * to_RAD) * 1000) / 1000));
    }


    set4d(type, data) {
      if (type == "position")
        this.position.set4d(data);

      if (type == "dimension")
        this.dimension.set4d(data);
    }

    // // rychlost
    // setSpeed(x, y) {
    //   this.speed.set(x, y);
    // }
    // setSpeed2d(prm) {
    //   this.speed.set2d(prm);
    // }
    // getSpeed2d() {
    //   this.speed.get2d();
    // }

    // pozice
    setPosition(x, y) {
      this.position.set(x, y);
    }
    setPosition2d(prm) {
      this.position.set2d(prm);
    }
    getPosition2d() {
      this.position.get2d();
    }

    // rozměr
    setDimension(x, y) {
      this.dimension.set(x, y);
    }
    setDimension2d(prm) {
      this.dimension.set2d(prm);
    }
    getDimension2d() {
      this.dimension.get2d();
    }



    animate(num) {
      // musel bych tomu posalt list vrestev

      console.log('todo');
      return;

    }

    // todo :: možná bych to časem mohl dělat číslama ??
    packet(full) {
      if (full) {

        return {
          id: this.id,
          name: this.name,
          //  speed: this.speed.get2d(),
          position: this.position.get2d(),
          dimension: this.dimension.get2d()

          // animation : this.animation.animation // v tomhle je vložená třída, tak se to trochu jebne !
          // "tag" : this.tag,
          // "active" : this.active,
          //dimension : {"x": this.dimension.x, "y":this.dimension.y},
          //sound + další ?
        };
      }
      else {
        return {
          id: this.id,
          // tag : this.tag,
          // active : this.active,
          // speed: this.speed.get2d(),
          position: this.position.get2d(),
          dimension: this.dimension.get2d()
        };
      }
    }

    toString() {
      return this.name
        + " | " + this.speed.toString()
        + " | " + this.position.toString();

    }
  }


})(typeof exports === 'undefined' ? this['component'] = {} : exports);




/*
Position.prototype.Approximation = function (position) {
  this.x = this.Approximate(this.x, position.x, ApproximationAccuracy);
  this.y = this.Approximate(this.y, position.y, ApproximationAccuracy);
}
Position.prototype.Approximate = function (sourcePositon, targetPosition, accuracy) {
  if (sourcePositon != targetPosition) {
    return (Math.abs(sourcePositon - targetPosition) < accuracy ? targetPosition : ((sourcePositon + targetPosition) / 2));
  }
  return targetPosition;
}
component.prototype.InitAnimation = function (data) {
  this.animation = new Animation(data);
  // tuten init je pro playera, může být cokoli jiného !
  this.animation.MultiSelect(["walk", "idle"]);
}
component.prototype.Animate = function () {
  if(this.animation != null)
    this.img = this.animation.Animate();
}



*/




/*


component.prototype.GetPacket = function (){
  return (this.active?{
    "id" : this.id,
    "tag" : this.tag,
    "active" : this.active,
    "speed" : {"x": this.speed.x, "y":this.speed.y},
    "position" : {"x": this.position.x, "y":this.position.y},
    "dimension" : {"x": this.dimension.x, "y":this.dimension.y}
  }:{});
}
component.prototype.GetInitPacket = function (){

  return (this.active?
  }:{});
}



////////////// asi spíš pro lobby

GameObjects.prototype.checkCollisions = function(){
  // this.remove = [];
  for(var i in this.list){
    var item = this.list[i]; // item bude nej�ast�ji tag == 'bulet'

    if((item.speedX != 0 || item.speedY != 0) && item.alive){ // hejbu se a ziju - ma cenu to kontrolovat
      if(item.x < -30 || item.y < -30 || item.x > arenaWidth + 10 || item.y > arenaHeight + 10){ // opustil jsem zemeplochu ! - prepadl jsem pres okraj a zemrel
        if(item.tag == 'player'){
          this.updateScore(null, item.name, null);
          this.registerSpawn(item.id, 3000, "spawnPoints");

          if(item.id == game.flagFollow){ // hrac vlezl s vlajkou
            this.dropFlag();
            this.registerSpawn(this.flag, (2000 + Math.random() * 3000), "flagSpawns");
            this.scoreCTF[(item.type == "blue"?"black":"blue")]++;
          }
        }
        else{ // prevazne strela
          item.alive = false;
          item.active = false;
          game.remove.push(item.id);
        }
      }

      for(var j in this.list){ // nemusim kontrolovat vsechny ! muzu v poli pokracovat ! optimalizace na pozdějc
        var check = this.list[j];
        if(!item.alive || !check.alive || item.name == check.name) // pokud neco umrelo || kontoluju sebe -> nepokracuju
          continue;

        if(item.collision(check))
          this.proccesCollision(item, check);
      }
    }
  }

  for(var i in this.remove){
    game.removeById(this.remove[i]);
  }
  this.remove = [];
}




////// šílenost na určení srážky čtverců
GameObjects.prototype.proccesCollision = function(a, b){
/*** co všechno se muze potkat ?
* a - player || bullet
* b - vše -> player || bullet || wall || flag || base
* /

// zasah zdi
  if(a.tag == 'bullet' && b.tag == 'wall'){
    a.alive = false;
    a.active = false;
    game.remove.push(a.id);
    return; //// upg - tady bych mohl udelat zablest nebo neco ...
  }

  // zasaht hrace
  if(a.tag == 'bullet' && b.tag == 'player' || b.tag == 'bullet' && a.tag == 'player' ){
    var bullet = (a.tag=='bullet'?a:b);
    var player = (a.tag=='player'?a:b);

    a.alive = false;
    bullet.alive = false;
    game.remove.push(bullet.id);

    player.setSpeed(0,0); // kdyby mě střelili za běhu, nechci třeba jen ubrat ?
    player.index = 0; //reset animace
    this.registerSpawn(player.id, 3000, "spawnPoints");
    player.loadAnimation("death" + Math.floor(Math.random() * deathAnimations).toString() , false);
    player.finish = function(){
      var c = new component(true, true, true, 'blood', this.x-5, this.y+10, 30, 30, 0);
      var i = Math.floor(Math.random() * misc["blood"].length);
      c.img = "client/animation/" + misc["blood"][i] + ".png";
      c.fixed = true;
      game.add(c);
    };

    if(player.id == game.flagFollow) // drzim vlajku -> padne
      game.dropFlag();


    if(bullet.type == player.type) // team kill
      game.updateScore(null, player.name, bullet.name);
    else
      game.updateScore(bullet.name, player.name, null);

    game.spawnPlayers++;
    return;
  }
*/




// (function (exports) {
//   exports.lobby = class lobby {

//   constructor(id, name, tag) {
//     this.id = id; // tohle je server ID, asi to chci nastavit jinde !
//     this.active = true;
//     this.name = name;
//     this.tag = tag;

//     this.type = "";
//     this.color = "black"; // ?
//     this.layer = 1;

//     this.netSend = 10; // asi málo.. ?
//     this.netSendCounter = 0;

//     this.animation = null; //  new Ani mation("");
//     this.dimension = new Dimension(0, 0);
//     this.speed = new Speed(0, 0);
//     this.position = new Position(0, 0);
//     // client approximation
//     this.sererPosition = new Position(0, 0);
//   }
//   UpdatePosition() {
//     // todo - Move pouze pokud můžu, nemám kolizi se zdí, nejsem mimo mapu, ....
//     this.position.Move(this.speed);
//   }
//   UpdatePositionNet() {
//     //  this.position.Move(this.speed);
//     //if(!this.speed.IsZero()){
//     this.serverPosition.Move(this.speed);
//     this.position.Approximation(this.serverPosition);
//     //}
//   }
//   SetSpeed(x, y) {
//     this.speed.SetSpeed(x, y);
//   }
//   SetPosition(x, y) {
//     this.position.SetPosition(x, y);
//   }
//   SetServerPosition(x, y) {
//     this.serverPosition.SetPosition(x, y);
//   }
//   SetDimension(x, y) {
//     this.dimension.SetDimension(x, y);
//   }
//   GetPacket() {
//     return (this.active ? {
//       "id": this.id,
//       "tag": this.tag,
//       "active": this.active,
//       "speed": { "x": this.speed.x, "y": this.speed.y },
//       "position": { "x": this.position.x, "y": this.position.y },
//       "dimension": { "x": this.dimension.x, "y": this.dimension.y }
//     } : {});
//   }
//   GetInitPacket() {

//     return (this.active ? {
//       "id": this.id,
//       "tag": this.tag,
//       "active": this.active,
//       "speed": { "x": this.speed.x, "y": this.speed.y },
//       "position": { "x": this.position.x, "y": this.position.y },
//       "dimension": { "x": this.dimension.x, "y": this.dimension.y },
//       "animation": this.animation.animation // v tomhle je vložená třída, tak se to trochu jebne !
//       //sound + další ?
//     } : {});
//   }
//   InitAnimation(data) {
//     this.animation = new Animation(data);
//     // tuten init je pro playera, může být cokoli jiného !
//     this.animation.MultiSelect(["walk", "idle"]);
//   }
//   Animate() {
//     if (this.animation != null)
//       this.img = this.animation.Animate();
//   }
//   U pd ate() {
//     var color = "balck";
//     this.Animate();
//     this.UpdatePositionNet();

//     ctx = myGameArea.context;
//     // ctx.fillStyle = "black";
//     // ctx.fillRect(this.position.x, this.position.y, this.dimension.x, this.dimension.y);
//     /// obrázek nebo barvu ??
//     if (this.img != "") {
//       var image = new Image;
//       image.src = this.img;

//       ctx = myGameArea.context;
//       ctx.drawImage(image, this.position.x, this.position.y, this.dimension.x, this.dimension.y);
//     }
//     else {
//       ctx.fillStyle = color;
//       ctx.fillRect(this.position.x, this.position.y, this.dimension.x, this.dimension.y);
//     }
//   }
// }
// })(typeof exports === 'undefined' ? this['component'] = {} : exports);


/*
Approximation(position) {
  this.x = this.Approximate(this.x, position.x, this.ApproximationAccuracy);
  this.y = this.Approximate(this.y, position.y, this.ApproximationAccuracy);
}
Approximate(sourcePositon, targetPosition, accuracy) {
  if (sourcePositon != targetPosition) {
    return (Math.abs(sourcePositon - targetPosition) < accuracy ? targetPosition : ((sourcePositon + targetPosition) / 2));
  }
  return targetPosition;
}
*/
