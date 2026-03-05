


// if(typeof require !== 'undefined'){
//     var moduleName2 = require('./vector?');
// }

(function (exports) {

  const _default = {
    radius: 75
  };

  function assignDefault(o) {
    return assign(_default, o);
  }

  function assign(o1, o2) {
    return Object.assign({}, o1, o2);
  }

  exports.colision = class colision {
    constructor(prm) {
      prm = Object.assign({}, _default, prm);
      this.list = [];
      this.radius = prm.radius;
      this.radiusSqr = prm.radius * prm.radius;

    }

    test() {
      console.log('inheritance !! ');
    }


    check(car, cp) {
      return (this.radiusSqr > (Math.pow(car.x - cp.x, 2) + Math.pow(car.y - cp.y, 2)))
    }

  }
})(typeof exports === 'undefined' ? this['colision'] = {} : exports);


/*
// this asi můžu použít, když to podědím...
// dědím to pro komponent, ale počítám s tím, že se dva componenty potkali, tak nevím nevím... 
        checkCollision(item, list){
            this.list = list;
            // this.remove = [];
            for(var i in this.list){
              var item = this.list[i];
          
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
          
          
          
          
          ////// šílenost na určení srážky čtverců - potkaj se dva componenty.. ?
          proccesCollision(a, b){
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