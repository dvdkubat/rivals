


/**
* TODO
*  pokud jsem mimo vysec kruh tak return - touchClick
*  text do vygenerovaných zon
*  dostat to do hry a odladit



use:
cc.draw(ctx);
cc2.draw(ctx);


var inputs = ["U", "UR", "R", "RD", "D", "DL", "L", "LU"];
var inputs2 = ["Shoot", "Reload", "Sprint", "Use"];

var cc = new CircleControl({ x: 480, y: 480 }, 40, 100, inputs, true);
var cc2 = new CircleControl({ x: 130, y: 480 }, 00, 100, inputs2, true);


*/



class CircleControl {
    constructor(S, inner, outer, keys, drawLines) {

        this.at = { x: S.x, y: S.y }; // souřadnice, kde bude vykreslen - potřebuju to souřadnicím pro úhel kliknutí
        this.center = { x: outer, y: outer }; // protože to mám předkreslený na canvas, tak je center jasný
        this.inR = inner;
        this.outR = outer;
        this.circularSection = (this.outR + this.inR) / 2; // kruhova vysec
        this.inputs = keys;

        this.beta = 180 / (this.inputs.length); // uhel jednoho blolu
        this.zones = []; // po směru hodin jsou podle vstupu vytvořeny zony
        this.lines = []; // 


        for (var i = 0; i < this.inputs.length; i++) {
            var z = 2 * i + 1;

            // prevest na radiany ?
            this.zones.push({ b: (z - 2) * this.beta, e: z * this.beta });
        }


        if (drawLines) {
            for (var i = 0; i < this.zones.length; i++) {
                var dir = this.getDir(this.beta + i * (this.beta * 2));
                this.lines.push({
                    from: { x: this.center.x + (dir.x * this.inR), y: this.center.y + (dir.y * this.inR) },
                    to: { x: this.center.x + (dir.x * this.outR), y: this.center.y + (dir.y * this.outR) }
                });
            }
        }

        this.canvas = document.createElement("CANVAS");
        this.canvas.width = this.canvas.height = 2 * this.outR;
        this.ctx = this.canvas.getContext('2d');

        this.load();
    }

    draw(ctx) {
        ctx.drawImage(this.canvas, this.at.x - this.outR, this.at.y - this.outR, this.canvas.width, this.canvas.height);
    }

    load() {
        this.ctx.beginPath();
        this.ctx.arc(this.center.x, this.center.y, this.circularSection, 0, 2 * Math.PI);
        this.ctx.strokeStyle = "silver";
        this.ctx.lineWidth = this.outR - this.inR;
        this.ctx.stroke();

        for (var i = 0; i < this.lines.length; i++) {
            var item = this.lines[i];
            this.ctx.beginPath();
            this.ctx.moveTo(item.from.x, item.from.y);
            this.ctx.lineTo(item.to.x, item.to.y);
            this.ctx.strokeStyle = "gray";
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }

    getDir(v) {
        return {
            x: (-1 * Math.round(Math.sin(v * (Math.PI / 180)) * 1000) / 1000),
            y: (Math.round(Math.cos(v * (Math.PI / 180)) * 1000) / 1000)
        }
    }

    getAlfa(x, y) {
        if (y < 0) {
            return (x < 0 ? 2 * Math.PI : 0) + Math.atan(x / Math.abs(y));
        }
        else {
            return Math.PI - Math.atan(x / Math.abs(y));
        }
    }

    getAlfaDeg(x, y) {
        return Math.round((this.getAlfa(x, y)) * (180 / Math.PI)) //  * 10) / 10;
    }


    touchClick(e) {
        var w = document.getElementById('vizu').width / document.getElementById('vizu').clientWidth;
        var h = document.getElementById('vizu').height / document.getElementById('vizu').clientHeight;

        var realClickX = (e.offsetX * w);
        var realClickY = (e.offsetY * h);


        // todo :: realClickX a realClickY musí být minimálně inR a outR od centerX, Y 

        var alfa = this.getAlfaDeg((realClickX - this.at.x), (realClickY - this.at.y));

        console.log(alfa, "proveď funkci pod tlačítkem:", this.getZone(alfa));
    }

    // pro nultou zonu musim nejak posunout - vsemu dat + beta
    getZone(alfa) {
        var lookup = alfa + this.beta;
        if (lookup > 360)
            lookup -= 360;

        for (var i = 0; i < this.zones.length; i++) {
            if (this.zones[i].b + this.beta <= lookup && this.zones[i].e + this.beta > lookup)
                return i;
        }
    }
}