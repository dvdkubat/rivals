
// if(typeof require !== 'undefined'){
//  var moduleName2 = require('./shared2');
// }

(function (exports) {

    //	function LocalFunction() {
    //	moduleName2.fun();
    //		return;
    //	}

    const _default = {
        x: 0, // X coord
        y: 0, // Y coord

        a: 0, // rotation 0 - 360° 
        v: 0  // speed
    }


    function assignDefault(o) {
        return assign(_default, o);
    }

    function assign(o1, o2) {
        return Object.assign({}, o1, o2);
    }

    exports._2D = class _2D {

        constructor(prm) {
            prm = assignDefault(prm);

            // this.originalX = prm.x;
            // this.originalY = prm.y;

            this.x = prm.x;
            this.y = prm.y;

            //rychlost a natočení
            this.a = 0;
            this.v = 0;
        }
        set(x, y) {
            this.x = x;
            this.y = y;
        }
        setX(x) {
            this.x = x;
        }
        setY(y) {
            this.y = y;
        }
        set2d(prm) {
            prm = assignDefault(prm);
            this.x = prm.x;
            this.y = prm.y;
        }
        set4d(prm) {
            prm = assignDefault(prm);

            this.x = prm.x;
            this.y = prm.y;

            this.a = prm.a;
            this.v = prm.v;
        }
        zero() {
            this.x = 0;
            this.y = 0;
        }
        isZero() {
            return (this.x == 0 && this.y == 0);
        }
        // reset() {
        //     this.x = this.originalX;
        //     this.y = this.originalY;
        // }
        inc(x, y) {
            this.x += x;
            this.y += y;
        }
        inc2d(prm) {
            prm = assignDefault(prm);
            this.x += prm.x;
            this.y += prm.y;
        }
        dec(x, y) {
            this.x -= x;
            this.y -= y;
        }
        multiply(value) {
            return { x: this.x * value, y: this.y * value }
        }

        dec2d(prm) {
            prm = assignDefault(prm);
            this.x -= prm.x;
            this.y -= prm.y;
        }


        // setDir() {
        //     vector.x = -1 * Math.round(Math.sin(pos.a * to_RAD) * 1000) / 1000;
        //     vector.y = 1 * Math.round(Math.cos(pos.a * to_RAD) * 1000) / 1000;
        // }


        // get(){
        //     return this;
        // }
        getX() {
            return this.x;
        }
        getY() {
            return this.y;
        }

        get2d() {
            return { x: this.x, y: this.y, a: this.a, v: this.v };
        }
        diagonal() {
            // this.diagonal = null;
            return null;
        }
        toString() {
            return ("[" + (Math.round(this.x * 1000) / 1000) + ";" + (Math.round(this.y * 1000) / 1000) + "]" + Math.round(this.v * 1000) / 1000 + ";" + Math.round(this.a * 1000) / 1000);
        }
    }
})(typeof exports === 'undefined' ? this['_2D'] = {} : exports);




