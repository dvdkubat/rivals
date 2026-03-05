
if (typeof require !== 'undefined') {
  ; // var component = require("./component"); - pokud chci přidat nějaký .js
}


(function (exports) {
  const _default = {
    id: "",
    name: ""
  }

  exports.weather = class weather {

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
})(typeof exports === 'undefined' ? this['weather'] = {} : exports);




