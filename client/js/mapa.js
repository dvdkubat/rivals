
const isDebugger = false;

const canvas = document.getElementById("hexCanvas");
const ctx = canvas.getContext("2d");
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

const IMGS = {
    "chest": returnImage("img/poi/chest.png"),
    "skeleton": returnImage("img/poi/skeleton.png"),
    "cart": returnImage("img/poi/cart.png"),
    "battlefield": returnImage("img/poi/battlefield.png"),
    "trader": returnImage("img/poi/trader.png"),

    "human": returnImage("img/human.png"),
    "undead": returnImage("img/undead.png"),
    "robot": returnImage("img/robot.png"),

    "hero": returnImage("img/hero.png"),
    "zelda": returnImage("img/bg.png")
};







function returnImage(name) {
    let bgImage = new Image();
    bgImage.src = name;
    return bgImage;
}

const actionHandlers = {
    fight: (id) => startBattleById(id),
    loot: (id) => collectLootById(id),
    enterCastle: (id) => openCastleScreen(id),
};

function triggerAction(tile) {
    if (!tile.action) return;
    const { type, id } = tile.action;
    const handler = actionHandlers[type];
    if (handler) handler(id);
}

// Příklad hráče s jednoduchým inventářem


const player = new Player();
document.getElementById("player-castle-name").innerText = "Praha";


///// chce to načíst z pcg.json
// class MapData {
//     constructor(grid) {
//         this.cells = grid.flat().map(p => p.toString());
//     }

//     toJSON() {
//         return JSON.stringify(this);
//     }

//     static fromJSON(json) {
//         const obj = JSON.parse(json);
//         const rows = [];
//         for (let str of obj.cells) {
//             const p = Point.fromString(str);
//             while (!rows[p.r]) rows[p.r] = [];
//             rows[p.r][p.q] = p;
//         }
//         return rows;
//     }
// }

function rngI(max) {
    return Math.floor(Math.random() * max);
}

// Generování mřížky hexů
function generateGrid(hexSize, direction = "flat") {
    const hexWidth = direction === "flat" ? Math.sqrt(3) * hexSize : 2 * hexSize;
    const hexHeight = direction === "flat" ? 2 * hexSize : Math.sqrt(3) * hexSize;
    const cols = Math.ceil(canvas.width / hexWidth);
    const rows = Math.ceil(canvas.height / (hexHeight * 0.75));

    grid = [];
    //gridData;
    var action = {};

    if (gridData.length > 0) {
        for (let row = 0; row < gridData.length; row++) {
            let rowData = [];
            for (let col = 0; col < gridData[row].length; col++) {
                var gd = gridData[row][col];

                action = null;

                // fight - POI
                // if (gd.activity == 1) {
                //     action = {"fight" : rngI(POIs.length)}
                // }
                // loot - POI

                // tohle by měl dělat server, když se vygeneruje "mapa" !!
                if (gd.activity == 3) {
                    action = { "loot": rngI(POIs.length) }
                }
                // Hrad - bude lepší to vždy natáhnout na sousedy - pomcí matice
                if (gd.activity == 20 || gd.activity == 20) {
                    action = { "castle": rngI(CASTLEs.length) }
                }
                let point = new Point(gd.x, gd.y, action, gd.activity, gd.terrain, col, row);
                rowData.push(point);
            }
            grid.push(rowData);
        }

        // nebude to tolik jako start hex, ale spíš jako army[], a vyhresluju všechny. pak místo starHex použít activeArmy?
        startHex = grid[11][22];

        return;
    }


    for (let row = 0; row < rows; row++) {
        let rowData = [];
        for (let col = 0; col < cols; col++) {
            let x, y;
            if (direction === "flat") {
                x = col * hexWidth + (row % 2 ? hexWidth / 2 : 0);
                y = row * hexHeight * 0.75;
            } else {
                x = col * hexWidth * 0.75;
                y = row * hexHeight + (col % 2 ? hexHeight / 2 : 0);
            }

            let point = new Point(x, y, null, 0, 2, col, row);
            rowData.push(point);
        }
        grid.push(rowData);
    }
}

let maxCapX = 2000;
let maxCapY = 2000;

let bgImage = new Image();
debugger
bgImage.src = "../img/bg.png"; // IMGS["zelda"]
bgImage.onload = () => {
    canvas.width = bgImage.width;
    canvas.height = bgImage.height;

    maxCapX = bgImage.width - window.innerWidth + (2 + 320 + 2) // border + left + border;
    maxCapY = bgImage.height - window.innerHeight + (2 + 2); // border

    generateGrid(hexSize, direction);
    drawHexGrid();
    drawStartEnd();
};

function drawHexGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    for (let row of grid) {
        for (let point of row) {
            point.draw();
        }
    }
}

// Vykreslení start a end bodu jako čtverce
function drawStartEnd() {
    if (startHex) {
        var hero = IMGS["hero"];
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


window.addEventListener("resize", reportWindowSize);
function reportWindowSize() {
    maxCapX = canvas.width - window.innerWidth + (2 + 320 + 2) // border + left + border;
    maxCapY = canvas.height - window.innerHeight + (2 + 2); // border
}


// Klikací událost pro změnu stavu hexu nebo výběr startu/cíle
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    let clickType = true; // clickTypeCheckbox.checked; // true znamená, že to je pathfinding

    let closestPoint = null;
    let minDist = Infinity;

    // todo :: optimalizace, bylo by dobrý neprohledávat celý seznam... ?
    for (let row of grid) {
        for (let point of row) {
            const dx = clickX - point.x;
            const dy = clickY - point.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                closestPoint = point;
            }
        }
    }

    if (closestPoint) {
        if (clickType) {
            // pokud kliknu na activity == 20, tak jdu na hrad...
            if (closestPoint.terrain) { // || closestPoint.activity == 20
                // chůze, pokud jsem kliknul někam do mapy, tak hledám cestu, pokud jsem kliknul podruhé na endPoint, tak se přesunu...
                if (endHex == closestPoint) {
                    startHex = endHex;

                    if (closestPoint.action != null) {
                        POIs[Object.values(closestPoint.action)[0]].collect()
                        closestPoint.action = null;
                    }
                }
                endHex = closestPoint;


                drawHexGrid();
                drawStartEnd();
                findPath();
            }
        } else {
            closestPoint.cycleState();
        }
        closestPoint.draw();
    }
});


canvas.addEventListener("mousemove", (event) => {
    if (!isCtrlDown || grid.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let closestPoint = null;
    let minDist = Infinity;

    for (let row of grid) {
        for (let point of row) {
            const dx = x - point.x;
            const dy = y - point.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                closestPoint = point;
            }
        }
    }

    if (closestPoint) {
        //closestPoint.setTerrain(changeTypeInput.value);
        closestPoint.draw();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Control") isCtrlDown = true;
});

document.addEventListener("keyup", (e) => {
    if (e.key === "Control") isCtrlDown = false;
});




function findPath() {
    if (!startHex || !endHex) return;
    let openSet = [startHex];
    let closedSet = [];

    for (let row of grid) {
        for (let point of row) {
            point.parent = null;
            point.g = Infinity;
            point.h = 0;
            point.f = 0;
        }
    }
    startHex.g = 0; // začátek?
    startHex.f = heuristic(startHex, endHex); // vzdálenost?

    while (openSet.length > 0) {
        let current = openSet.reduce((a, b) => (a.f < b.f ? a : b));
        if (current === endHex) {
            const { steps, cost } = reconstructPath(current);
            // logDiv.textContent = `${steps} kroků, ${cost.toFixed(2)} terén`;
            logDiv.textContent = `${cost.toFixed(2)} /`;
            return;
        }

        openSet = openSet.filter(point => point !== current);
        closedSet.push(current);

        let neighbors = getNeighbors(current);
        for (let neighbor of neighbors) {
            if (closedSet.includes(neighbor) || Terrain[neighbor.terrain].cost === 0) continue;

            let tempG = current.g + Terrain[neighbor.terrain].cost;
            if (tempG < neighbor.g) {
                neighbor.g = tempG;
                neighbor.h = heuristic(neighbor, endHex);
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = current;
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
}

function heuristic(a, b) {
    return Math.abs(a.q - b.q) + Math.abs(a.r - b.r);
}

function drawDot(x, y, radius = 4, color = "black") {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function reconstructPath(current) {
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

function getNeighbors(point) {
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




// Draggable canvas

const container = document.getElementById('mapContainer');
container.addEventListener('mousedown', e => {
    isDragging = true;
    dragStartX = e.clientX + offsetX;
    dragStartY = e.clientY + offsetY;
    //canvas.style.cursor = 'grabbing';
});

container.addEventListener('mouseup', () => {
    isDragging = false;
    //canvas.style.cursor = 'grab';
});

container.addEventListener('mouseleave', () => isDragging = false);

container.addEventListener('mousemove', e => {
    if (!isDragging) return;
    offsetX = dragStartX - e.clientX;
    offsetY = dragStartY - e.clientY;

    offsetX = cap(offsetX, maxCapX);
    offsetY = cap(offsetY, maxCapY);

    canvas.style.left = `-${offsetX}px`;
    canvas.style.top = `-${offsetY}px`;
});


function cap(value, max, min = 0) {

    if (value > max) return max;
    if (value < min) return min;

    return value;
}

// Focus on unit example
function centerOn(x, y) {
    offsetX = x - container.clientWidth / 2;
    offsetY = y - container.clientHeight / 2;
    canvas.style.left = `-${offsetX}px`;
    canvas.style.top = `-${offsetY}px`;
}

// Example: Draw a unit and allow focus
function drawExampleUnit(x, y) {
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

// drawExampleUnit(800, 600);
