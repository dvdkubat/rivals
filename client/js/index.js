/**
 * Nějaký základní připojování a odpojování do hry
 * kominikace client <> server
 * 
 */


const _lsvar = "warpath-user-lobby-id";


var socket = null;
var gameid;  // nastvuje se při označení řádku
var keyboard = {};
var localPlayers = [];
const storage = "localSettings"

function startComunication() {

  // 1. žádost o navázání socet komunikace
  socket = io();  // io('http://localhost:2000');

  // 3. na serveru se něco událo - kontrola idček a tak // existuje ještě moje lobby?
  socket.emit('Connect', localStorage.getItem(_lsvar));

  // 4. navážu spojení a od serveru dostanu id - případně jiný povely?
  //  socket.on('OnConnect', function (data) { client.connect(data) });


  // odpověď na tlačítko "Play"
  socket.on('OnShowGameList', function (data) { OnShowGameList(data); });

  // odpověď na tlačítko připojit
  socket.on('OnJoinGame', function (data) { OnJoinGame(data); });

  //  socket.on('OnUpdate', function (data) { client.netUpdate(data); }); // nebo tak nějak, něco co nastaví data na začátku tahu


  socket.on('OnCreateLobby', function (data) { OnCreateLobby(data); });
  socket.on('OnDisconnect', function (data) { client.onDisconnect(data); });
  //  socket.on('NetUpdate', function (data) { client.netUpdate(data); }); //

  socket.on('TotalPlayers', function (data) { console.log('update plyer count'); $("#total-player-count").text(data); });
  socket.on('OnLobbyMessage', function (data) { client.OnLobbyMessage(data) });

  socket.on('GameStarts', function (data) { GameStarts(data) });


}


// 

/*

přepínání obrazovek udělat nějak lépe
> assign by na to šel, kde by default bylo hidden...

kliknutí na tlačítko zpracovat podle id tlačítka -> switch
> bude pěkně pohromadě


menu ovládá základní tlačítka, až dám [Připojit], tak skočím na jinou obrazovku (přesměroat na URL ? časem) a tam už jedu přes jiné .js
-- mapa, hrad, ...


drag and drop nahlížení po mapě
-- přetáhnout z testu ! ===  Draggable canvas :: map move

*/

$(function () {
  client = new clientClass();
  startComunication();

// console.log(loadedVariables.INITIAL_PARAMETERS);
// console.log(loadedVariables.BUILDING_DEFINITIONS);
// console.log(loadedVariables.UNIT_DEFINITIONS);

  Testing(1);
});



// obecné ovládání Lobby funkcí
function ShowGameList() {
  console.log("loading screen?");
  socket.emit('ShowGameList', {});
}

// Volá se z menu.js po kliknutí na [Connect]
function JoinGame() {
  if ($('#btn-join').prop('disabled'))
    return;

  var playerName = $("#player-name").val();

  console.log("asi zbytečný... ", playerName, client.id)
  socket.emit('JoinGame', { id: client.id, name: playerName, "connect": gameid, "pass": $("#inp-password").val() });
}

function CreateLobby(lobbyData) {
  socket.emit('CreateLobby', lobbyData);
}

function ReadyStateChange(prm) {
  socket.emit("LobbyMessage", { fce: "ReadyStateChange", data: prm });
}

function EmitLeave() {
  socket.emit('Leave', client.id);
}

function GameStarts(data) {
  ShowScene(client.begin(data));
}


// todo :: kontrola, zda hra jede a pokud ano, tak druhou obrazovku
function OnJoinGame(data) {
  ShowScene(client.join(data));
}

function TogglePauseMenu(start) {
  //$("#menu-pause").addClass('hidden');
  $("#menu-pause").toggleClass('hidden');
}

/**
 * Highlit selected Lobby.
 * @param e Selected row: this
 */
function SelectRow(e) {
  var remove = $(".rowselected");
  remove.removeClass('rowselected');
  /// $(".rowselected").removeClass('rowselected'); ?
  var item = $($(e)[0]);
  item.addClass('rowselected');
  gameid = item.attr('gameid');

  console.log('todo :: lepší kontrola na button join')
  $('#btn-join').prop('disabled', false);
}



// obecná funkce pro vykreslení divu - jako většina tady by mohlo do třídy, třeba display? 
function ShowScene(name, type = "scene") {
  $('[group="' + type + '"]').addClass('hidden')
  $('[group="' + type + '"][name="' + name + '"]').removeClass('hidden');
}



/**
 * Generate and show table with Lobbies
 * @param {*} data Array of table rows
 */
function OnShowGameList(data) {
  DisplayListTable(data);
  $("#btnLeave").removeClass('hidden');
  ShowScene("servers");

  Testing(2); // po vykreslení hnedka join na první server... test
}


/**
 * Fill inputs with player settings
 * @param {*} playersControls Data from memmory
 */
function DisplaySettings(playersControls) {
  //// todo :: optimalizace
  for (var id in playersControls) {
    var key = playersControls[id];
    for (var k in key) {
      $("#" + id).attr(k, key[k]);
    }
  }
}

/**
 * Save curent settings to memmory
 */
// function SaveSettings() {
//     var data = {};
//     var inputs = $("#table-controls input");
//     for (i = 0; i < inputs.length; i++) {
//         var item = inputs[i];Join
//         if ($(item).hasClass('onechar')) {
//             data[item.id] = { "value": item.value, "code": $(item).attr('code') };
//         }
//         else {
//             data[item.id] = { "value": item.value }
//         }
//     }

//     localStorage.setItem(storage, JSON.stringify(data));
// }



function LeaveLobby() {
  client.stop();
  ShowScene("menu");
  EmitLeave();

  $("#won-message").addClass("hidden");
  $("#ready-check").removeClass("hidden");
  $("#player-ready").prop("checked", false);
}

// rekactoring hodnot... asi by mělo stačit heslo.
function CreateGame() {
  var lobby = {
    "pass": $("#new-inp-pass").val(),
    "name": $("#new-inp-name").val(),
    "mode": $("#new-inp-mode").val(),
    "max": $("#new-inp-max").val(),
    "limit": $("#new-inp-npc").val()
  };
  // todo : ještě by to chtělo něco jako validaci vstupů !
  CreateLobby(lobby);
}

function OnCreateLobby(data) {
  ShowScene("lobby");
  OnShowGameList(data);
}




/**
 * Generate table with games
 * @param data List of table rows
 */
function DisplayListTable(data) {

  var table = document.getElementById("server-list");
  table.innerHTML = "";

  // přišel list dat - "id"     "name"    "map"    "mode"    "players"    "pass"
  for (var key in data) {
    var item = data[key];
    var row = table.insertRow(key);
    row.setAttribute("gameid", item[0]);
    row.setAttribute("class", (item[5] ? "locked" : "unlocked"));
    row.setAttribute("onclick", "SelectRow(this)");
    row.insertCell(0).innerHTML = "";
    for (i = 1; i < item.length - 1; i++) {
      row.insertCell(i).innerHTML = item[i];
    }
  }
}


/** hlavní ovládání přes tlačítka ... nechci to i s parametrem ?? */
function UserEvent(type, prm = {}) {
  switch (type) {

    case 'btnPlay': ShowGameList(); break;
    // btnPlay-Refresh // odklíčovat i kde to je ??
    case 'btnRefresh': ShowGameList(); break; // stejný jako play, asi můžu sloučit
    case 'btnCreateGame': CreateGame(); break;
    case 'menu': ShowScene("menu"); break;
    case 'btnJoin': JoinGame(); break;

    case 'btnSettings': ShowScene("settings"); break;
    case 'btnTutorial': ShowScene("tutorial"); break;
    //info
    //Support
    //RoadMap
    //Test


    case 'btnPause': TogglePauseMenu(true); break; // + unpause :: $("#menu-pause").toggleClass('hidden');
    case 'btnPauseClose': TogglePauseMenu(false); break;

    case 'menu': ShowScene("menu"); break;
    case 'back-to-mm': ShowGameList(); break; // ShowScene("menu"); break;
    case 'check-start': ShowScene("ingame"); break;


    case 'change-ready': ReadyStateChange(prm); break;
    /*
'leave-position'
'select-position'
*/

    // vyskakovací "pauza" ve hře
    /*
    select-map
    player-ready
    check-start
    save-settings
    save-settings-close
    */

    //// unused ?
    // case 'stats-close': $("#stats-overlay").addClass('hidden'); break;
    // case 'default': DisplaySettings(); break;
    // case 'save': SaveSettings(); break;


    default: alert('todo :: button function  ' + type + " param: " + prm); break;
  }
}


window.addEventListener("resize", reportWindowSize);
function reportWindowSize() {
  maxCapX = canvas.width - window.innerWidth + (2 + 320 + 2) // border + left + border;
  maxCapY = canvas.height - window.innerHeight + (2 + 2); // border
}

/*
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
*/
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


/*
// Draggable canvas :: map move
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

*/



function Testing(a) {

  if (a == 1) {
    //todo - testování 
    UserEvent('btnPlay');
  }

  if (a == 2) {
    $("#server-list tr")[0].click()
    $("#btn-join")[0].click()
  }

  if (a == 3) {
    UserEvent('check-start');
  }

}
