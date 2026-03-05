



if (typeof require !== 'undefined') {
    // const gen = require('../../js/generate');
}


(function (exports) {

    const _default = { prm: { speed: 7 } };

    function assignDefault(o) {
        return assign(_default, o);
    }

    function assign(o1, o2) {
        return Object.assign({}, o1, o2);
    }

    exports.animation = class animation {
        constructor(prm) {
            //assignDefault(prm);

            this.frame = 0;
            this.frames = prm.speed;

            this.visible = prm.visible;
            this.card = (prm.card != -1) ? new card.card(prm.card) : null; // id karty, nebo -1 pro rub / líc?

            this.origin = prm.origin; //{ x: 920, y: 60 };
            this.destination = prm.destination; //{ x: 20, y: 920 };

            this.shiftX = (this.destination.x - this.origin.x) / this.frames;
            this.shiftY = (this.destination.y - this.origin.y) / this.frames;
        }

        // vrátí pozici karty, nebo null - pokud je pohyb dokončen !
        getPosition() {
            var x = this.origin.x + this.shiftX * this.frame;
            var y = this.origin.y + this.shiftY * this.frame;
            this.frame++;

            return { x: x, y: y };
        }
        isFinished() {
            return (this.frame >= this.frames)
        }

    }

})(typeof exports === 'undefined' ? this['animation'] = {} : exports);




