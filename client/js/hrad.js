

// zůstali funkce pro podpůrné vykreslování

function drawCastleInterface(ctx, panels, castle) {
    //debugger;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (castle.background) {
        const bgImage = new Image();
        bgImage.src = castle.background;
        bgImage.onload = () => {
            ctx.drawImage(bgImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
            panels.forEach(panel => panel.draw(ctx));
        };
    } else {
        panels.forEach(panel => panel.draw(ctx));
    }
}

// GUI
const buildingsContainer = document.getElementById("buildings");
const newDayButton = document.getElementById("newDayButton");
const gameDayDisplay = document.getElementById("gameDay");

const buildingDetail = document.getElementById("click-info-detail");
const buildingDetailContent = document.getElementById("click-info-detail-data");

const unitsContainer = document.getElementById("units");
const resourcesContainer = document.getElementById("resources");

function updateGUI(castle) {
    const production = castle.getProductionSummary();

    // podle proměnný a překlady!!
    // document.getElementById("resources").innerText = Object.values(castle.resources).map(value => `${value}`).join(', ');
    // document.getElementById("units").innerText = objToString(castle.units, ', ');
    // document.getElementById("buildings").innerText = Object.values(castle.buildings).map(value => `${value}`).filter(Boolean).join('\n'); // .filter(value => value !== "") 

    // castle.buildings.forEach((b, i) => {
    Object.entries(castle.buildings).map(([key, b]) => {
        const card = document.createElement("div");
        card.className = "card";
        card.textContent = `${b.display} (úroveň ${b.level})`;
        card.onclick = () => {
            buildingDetail.style.display = "inline";
            buildingDetailContent.innerHTML = `
                    <h3>${b.display}</h3>
                    <p>Úroveň: ${b.level}</p>
                    <p>Produkce: ${b.productionString}</p>
                    <p>Cena vylepšení: ${b.costString}</p>
                    <button onclick="alert()" >Vylepšit</button>
                    `;
        };
        buildingsContainer.appendChild(card);
    });

    buildingDetail.onclick = () => {
        buildingDetail.style.display = "none";
        buildingDetailContent.innerHTML = "";
    };

    Object.values(castle.units).forEach(u => { unitsContainer.appendChild(u.UIElement); });
    Object.values(castle.resources).forEach(r => { resourcesContainer.appendChild(r.UIElement); });

    /*
    Object.entries(obj)
      .sort((a, b) => a[1].order - b[1].order) // Seřadí podle `order`
      .map(([key, value]) => `${key}: ${value.count}`) // Vypíše jako text
      .join(', ');
    */



    //buildingsContainer.innerHTML = "";

    Object.values(castle.buildings).forEach(building => {
        ;
        // const nextLevel = building.level < BUILDING_DEFINITIONS[building.name].levels.length - 1 ? building.level + 1 : building.level;
        // const cost = BUILDING_DEFINITIONS[building.name].levels[nextLevel].cost;
        // const costText = Object.entries(cost).map(([res, val]) => `${res}: ${val}`).join(", ");
        // const buildingElement = document.createElement("div");
        // buildingElement.innerHTML = `${building.name} - Úroveň: ${building.level} <button onclick="upgradeBuilding('${building.name}')">Vylepšit (${costText})</button>`;
        // buildingsContainer.appendChild(buildingElement);
    });
}

function upgradeBuilding(name) {
    castle.buildBuilding(name);
    updateGUI(castle);
    drawCastleInterface(ctx, panels, castle);
}



const castle = new Castle("human"); // undead, robot
updateGUI(castle);


function objToString(obj, delimiter = ", ") {
    return Object.entries(obj)
        .map(([key, value]) => {
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                return `${key}: { ${objToString(value, delimiter)} }`;
            } else {
                return `${key}: ${value}`;
            }
        })
        .join(delimiter);
}