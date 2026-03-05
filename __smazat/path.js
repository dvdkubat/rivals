



(function (exports) {


    const _default = {

    }



    exports.path = class path {

        constructor(prm) {
            // prm = Object.assign({}, _default, prm);

            this.idx = 0; // prm.idx
            this.checkpoints = prm; //  prm.track;
            this.finish = prm.length - 1;//  prm.track;
        }

        get(idx) {
            return this.checkpoints[idx];
        }

        isLast(idx) {
            return (idx >= this.finish);
        }

        getNext(idx) {
            if (this.finish == idx)
                return -1; // poslední značka

            return this.checkpoints[idx + 1];
        }

        toString() {
            return "";
        }

    }
})(typeof exports === 'undefined' ? this['path'] = {} : exports);




