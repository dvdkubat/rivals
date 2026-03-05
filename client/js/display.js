

// todo :: rozměr by se asi mohl nastavit přes funkci
const isDebugger = false;

const logDiv = document.getElementById("log");
// const clickTypeCheckbox = document.getElementById("clicktype");
const setActionCheckbox = document.getElementById("setaction");
const changeTypeInput = document.getElementById("changetype");
let startHex = null;   //  13 row; 23 col
let endHex = null;
let isCtrlDown = false;
let showCenters = true;
let dotRadius = 3;
// nějaký x + y offset pro hrxgrid?
let grid = []
let hexSize = 16; // Velikost hexu

// je to otočený
let direction = "flat";

// drag and drop proměnný
let offsetX = 0, offsetY = 0;
let isDragging = false;
let dragStartX, dragStartY;


/*
const CASTLEs = [
    new Castle("human", "human", "human-catle"),
    new Castle("undead", "undead"),
    new Castle("robot", "robot")

];

const POIs = [
    new POI("loot", "cart", { "wood": 50, "gold": 10, "soul": 3 }, "cart"),
    new POI("loot", "chest", { "wood": 50, "gold": 10, "soul": 3 }, "chest"),
    new POI("loot", "skeleton", { "wood": 50, "gold": 10, "soul": 3 }, "skeleton"),
    new POI("loot", "battlefield", { "wood": 50, "gold": 10, "soul": 3 }, "battlefield"),
    new POI("loot", "trader", { "wood": 50, "gold": 10, "soul": 3 }, "trader")
    //cave, ruins, ... ?
];


const Terrain = [
    new TerrainType("none", "#b22222", 0),
    new TerrainType("water", "#4682b4", 0.7),
    new TerrainType("grass", "#7cfc00", 1),
    new TerrainType("forest", "#228b22", 1.25)
];
*/

// const player = new Player();
//document.getElementById("player-castle-name").innerText = "Praha";

// třídy by měla všechny obrázky v paměti a vykreslovala je... na povel od cLobby ?
class display {
    constructor(canvasId, screenWidth, screenHeight, background) {

        this.isReady = false;
        this.resolution = { x: screenWidth, y: screenHeight }; //new _2D._2D({ x: screenWidth, y: screenHeight });
        this.aspect = screenWidth / screenHeight;

        this.imgCache = {};
        this.getImages(imgList);

        this.bgImg = background; // časem bych měl generovat podle noisu... ale to asi někde do canvasu přirpavím "background" ?

        this.canvas = document.getElementById(canvasId); // document.getElementById("show-canvas");
        this.canvasCtx = this.canvas.getContext("2d");

        // asi v pohodě, nemělo by se to zavolat ? snad... ? případně to nějak ošetřit - asi bych mohl zavolat na konci checkimages ?
        this.canvas.width = this.imgCache[this.bgImg].width;
        this.canvas.height = this.imgCache[this.bgImg].height;

        this.startHex = null;   //  13 row; 23 col
        this.endHex = null;

        //
        this.startHex = grid[11][22];

    }


    // kamera je 2D pozice hráče 
    draw(player, worldInfo) {
        // const grid = worldInfo.grid; // todo !!
        // kontrola, zda mám načtený všechny obrázky
        if (!this.isReady) {
            this.checkImages();
            return;
        }

        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvasCtx.drawImage(this.imgCache[this.bgImg], 0, 0, this.canvas.width, this.canvas.height);


        //drawHexGrid();
        this.drawStartEnd();

        /*
        tady ještě vykreslit truhly, hrady, hráče !
        */



        return;
        var camera = player.position;

        // items.forEach((values, keys) => {
        //     var dim = values.dimension;
        //     var item = values.position; // items[key];

        //     if (dim.x == 0)
        //         dim.x = 48
        //     if (dim.y == 0)
        //         dim.y = 96

        //     if (item.a != 0) {
        //         this.ctx.save();
        //         this.ctx.translate(item.x + dim.x / 2, item.y + dim.y / 2);
        //         this.ctx.rotate(item.a * to_RAD);
        //         this.ctx.drawImage(this.imgCache[values.image], -dim.x / 2, -dim.y / 2, dim.x, dim.y);
        //         this.ctx.restore();
        //     }
        //     else {
        //         this.ctx.drawImage(this.imgCache[values.image], item.x, item.y, dim.x, dim.y);
        //     }
        // });


        // vykreslit checkpoint
        //  road.drawCheckpoint(this.ctx, player.checkpoint);


        // var speedZoom = speedZoomModifier * Math.abs(isNaN(camera.v) ? 0 : camera.v);
        // this.canvas.width = this.resolution.x + 2 * speedZoom * this.aspect;
        // this.canvas.height = this.resolution.y + 2 * speedZoom;

        // pak to potrebuju nejak prenest na DOM
        // var dx = (camera.x - this.resolution.x / 2);
        // var dy = (camera.y - this.resolution.y / 2);
        // this.canvasCtx.drawImage(this.background, dx - speedZoom, dy - speedZoom, this.canvas.width + speedZoom, this.canvas.height + speedZoom, 0, 0, this.canvas.width, this.canvas.height);
    }


    img(name) {
        return this.imgCache[name];
    }

    drawStartEnd() {
        if (startHex) {
            var hero = this.img("hero");
            ctx.drawImage(hero, startHex.x - hero.width / 2, startHex.y - hero.height / 2 - 5, hero.width, hero.height);
        }
        if (endHex) {
            ctx.font = "bold 18px arial";
            ctx.fillText('❎', endHex.x - 10, endHex.y + 5)
            // ctx.fillText('❌', endHex.x+10, endHex.y+10)
            // ctx.fillStyle = "blue";
            // ctx.fillRect(endHex.x - 5, endHex.y - 5, 10, 10);
        }
    }
    drawHexGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        for (let row of grid) {
            for (let point of row) {
                point.draw();
            }
        }
    }

    heuristic(a, b) {
        return Math.abs(a.q - b.q) + Math.abs(a.r - b.r);
    }

    drawDot(x, y, radius = 4, color = "black") {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }

    reconstructPath(current) {
        let steps = 0;
        let cost = 0;
        const path = [];
        while (current.parent) {
            path.push(current);
            cost += Terrain[current.terrain].cost;
            current = current.parent;
            steps++;
        }
        path.reverse(); // reconstruct A* je od konce

        drawHexGrid();
        let limit = 20;
        for (let hex of path) {
            drawDot(hex.x, hex.y, 4, (limit > 0 ? "green" : "red")); // todo : je potřeba podle cost, né podle políček !
            limit -= Terrain[hex.terrain].cost
        }
        drawStartEnd();
        return { steps, cost };
    }

    getNeighbors(point) {
        const dirsEven = [[+1, 0], [0, -1], [-1, -1], [-1, 0], [-1, +1], [0, +1]];
        const dirsOdd = [[+1, 0], [+1, -1], [0, -1], [-1, 0], [0, +1], [+1, +1]];
        const neighbors = [];
        const directions = point.r % 2 === 0 ? dirsEven : dirsOdd;

        for (let [dq, dr] of directions) {
            let q = point.q + dq;
            let r = point.r + dr;

            if (grid[r] && grid[r][q]) {
                neighbors.push(grid[r][q]);
            }
        }
        return neighbors;
    }

    cap(value, max, min = 0) {

        if (value > max) return max;
        if (value < min) return min;

        return value;
    }

    // Focus on unit example
    centerOn(x, y) {
        offsetX = x - container.clientWidth / 2;
        offsetY = y - container.clientHeight / 2;
        canvas.style.left = `-${offsetX}px`;
        canvas.style.top = `-${offsetY}px`;
    }

    // Example: Draw a unit and allow focus
    drawExampleUnit(x, y) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fill();

        canvas.addEventListener('click', e => {
            const rect = canvas.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;
            if (Math.hypot(cx - x, cy - y) < 15) centerOn(x, y);
        });
    }

    getImages(list) {
        for (var item in list) {
            var image = new Image();
            image.src = list[item]; // list[item][1];
            this.imgCache[item] = image;
        }
    }
    checkImages() {
        for (var item in this.imgCache) {
            if (!this.imgCache[item].complete) {
                // console.log(this.imgCache[item]);
                return false;
            }
        }

        // init mapy po načtení všech obrázků
        // this.background.width = this.imgCache[this.bgImg].width;
        // this.background.height = this.imgCache[this.bgImg].height;
        this.isReady = true;

        return true;
    }

}



