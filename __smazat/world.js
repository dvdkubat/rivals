if (typeof require !== 'undefined') {
    var path = require("./path");
}

(function (exports) {

    const tracks = [
        [8, 9, 0, 1, 11, 17, 2, 3, 16, 15, 14, 5, 6, 13, 12, 7, 8, 9, 10, 11, 17, 2, 1, 0, 8], // tuhle trasu můžu jezdit dokola !
        [5, 6, 13, 14, 15, 17, 11, 1, 0, 9, 8, 0, 1, 2, 17, 11, 10, 12, 13, 14],
        [10, 9, 8, 7, 12, 10, 11, 1, 2, 3, 16, 4, 5, 14, 15, 17, 11, 1, 0],
        [9, 0, 1, 11, 10, 12, 13, 14, 5, 4, 3, 16, 15, 14, 13, 6, 7, 12, 10],
        [2, 3, 16, 4, 5, 14, 15, 14, 2, 1, 11, 10, 9, 0, 8, 7, 12, 13, 6],
        [15, 17, 11, 10, 9, 8, 7, 6, 5, 14, 13, 12, 10, 11, 1, 0, 2, 3, 16],
        [2, 3, 16, 15, 14, 13, 6, 7, 12, 10, 11, 1, 0, 9, 8, 7, 12, 13, 14]
    ]
    /*
        0: { x: 240, y: 1180, edge: [1, 8, 9], next: [0, 180, 270] },
        1: { x: 240, y: 2040, edge: [0, 2, 11], next: [180, 0, 275] },
    */
    const _default = {
        data: [],
        arrowOffset: 0
    }

    const to_RAD = Math.PI / 180;

    exports.world = class world {

        constructor(prm) {
            prm = Object.assign({}, _default, prm);

            this.checkpoints = prm.data; // 7: { x: 2580, y: 206, edge: [6, 8, 12], next: [-90, 90, 0] },
            this.arrowOffset = prm.arrowOffset;

            this.race = new path.path(tracks[0]); // track


            // pouze pokud to není na serveru !!
            if (typeof require === 'undefined') {
                this.image = new Image(); // prm.img ?
                this.image.src = prm.src;
            }
        }

        pass(index) {
            return this.race.isLast(index);
        }

        getAngle(curent, next) {
            try {
                var nodes = this.checkpoints[curent].edge;
                for (var i = 0; i < nodes.length; i -= -1) {
                    if (this.checkpoints[curent].edge[i] == next)
                        return this.checkpoints[curent].next[i];
                }
                return 0;
            }
            catch (e) {
                console.log(curent);
            }
            return 0;
        }

        //jde do toho moc vysoký číslo... (když dojedu závod)
        racePosition(nodeIdx) {
            var node = this.race.get(nodeIdx);
            return { x: this.checkpoints[node].x, y: this.checkpoints[node].y }
        }
        position(node) {
            try {
                // todo :: podmínky? pokud to neexistuje, tak vrátit null
                return { x: this.checkpoints[node].x, y: this.checkpoints[node].y }
            }
            catch (e) {
                console.log(node);
            }
            return 0;
        }

        drawCheckpoint(ctx, checkpoint, override = null) {

            var node = this.race.get(checkpoint);
            var nextNode = this.race.getNext(checkpoint);

            //if(nextNode == -1) // finish

            var offset = this.getAngle(node, nextNode);
            var pos = this.position(node);

            if (override != null)
                offset = override;

            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate((offset + this.arrowOffset) * to_RAD);
            ctx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2, this.image.width, this.image.height);
            ctx.restore();

            ctx.beginPath();
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#ff0000';
            ctx.arc(pos.x, pos.y, 120, 0, 2 * Math.PI);
            ctx.stroke();
        }

        toString() {
            return "[";
        }
    }
})(typeof exports === 'undefined' ? this['world'] = {} : exports);




