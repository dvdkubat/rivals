/**
 * client/js/index.js  (patch verze)
 * 
 * Změny oproti originálu:
 *  - startComunication(): přidán OnConnect handler + URL auto-join (JoinByUrl)
 *  - OnJoinGame(): nové error kódy, I18n překlady hlášek
 *  - I18n.onChange hook pro dynamický překlad UI
 *  - Zbytek funkce (ShowScene, UserEvent, atd.) beze změny
 */

const _lsvar = 'warpath-user-lobby-id';

var socket = null;
var gameid;
var keyboard  = {};
var localPlayers = [];
const storage = 'localSettings';

// ─── SOCKET KOMUNIKACE ───────────────────────────────────────

function startComunication() {
  socket = io();
  socket.emit('Connect', localStorage.getItem(_lsvar));

  // Server potvrdil připojení, vrátil nové ID
  socket.on('OnConnect', function (newId) {
    client.connect(newId);
    localStorage.setItem(_lsvar, newId);

    // URL auto-join: přistoupil jsem přes /:lobbyId
    const lobbyId = document.body.getAttribute('data-lobby-id');
    if (lobbyId) {
      const playerName = localStorage.getItem('playerName') || 'Hráč';
      socket.emit('JoinByUrl', { lobbyId, pass: '', name: playerName });
    }
  });

  socket.on('OnShowGameList', function (data) { OnShowGameList(data); });
  socket.on('OnJoinGame',     function (data) { OnJoinGame(data); });
  socket.on('OnCreateLobby',  function (data) { OnCreateLobby(data); });
  socket.on('OnDisconnect',   function (data) { client.onDisconnect(data); });
  socket.on('OnLobbyMessage', function (data) { client.OnLobbyMessage(data); });
  socket.on('TotalPlayers',   function (data) { $('#total-player-count').text(data); });
  socket.on('GameStarts',     function (data) { GameStarts(data); });
}

// ─── JOIN ────────────────────────────────────────────────────

function OnJoinGame(data) {
  if (!data) { alert(I18n.t('lobby_not_found')); return; }

  const errors = {
    'full':      I18n.t('lobby_full'),
    'bad-pass':  I18n.t('wrong_password'),
    'not-found': I18n.t('lobby_not_found'),
    'no-lobby':  'Neplatné ID lobby',
  };

  if (data.error) {
    alert(errors[data.error] || `Chyba: ${data.error}`);
    return;
  }

  const scene = client.join(data);
  if (scene) ShowScene(scene);
}

function JoinGame() {
  var row = document.querySelector('#servers tr.selected');
  if (!row) return;
  var lobbyId = row.getAttribute('gameid');
  var pass    = document.getElementById('inp-password')?.value || '';
  var name    = localStorage.getItem('playerName') || 'Hráč';
  socket.emit('JoinGame', { connect: lobbyId, pass, name });
}

function ShowGameList() {
  socket.emit('ShowGameList');
}

function CreateGame() {
  var name = document.getElementById('new-inp-name')?.value || 'Hra';
  var pass = document.getElementById('new-inp-pass')?.value || '';
  var max  = parseInt(document.getElementById('new-inp-max')?.value) || 4;
  socket.emit('CreateLobby', { name, pass, max });
}

function GameStarts(data) {
  var scene = client.begin(data);
  if (scene) ShowScene(scene);
}

function OnShowGameList(data) {
  DisplayListTable(data);
  ShowScene('servers');
}

function OnCreateLobby(data) {
  ShowScene('lobby');
  OnShowGameList(data);
}

function ReadyStateChange(prm) {
  socket.emit('Ready', prm);
}

// ─── SCENE PŘEPÍNÁNÍ ─────────────────────────────────────────

function ShowScene(name) {
  document.querySelectorAll('[group="scene"]').forEach(el => {
    el.classList.toggle('hidden', el.getAttribute('name') !== name);
  });
}

function TogglePauseMenu(show) {
  const el = document.getElementById('menu-pause');
  if (el) el.classList.toggle('hidden', !show);
}

// ─── TABULKA SERVERŮ ─────────────────────────────────────────

function DisplayListTable(data) {
  var table = document.getElementById('server-list');
  if (!table) return;
  table.innerHTML = '';

  for (var key in data) {
    var item = data[key];
    var row  = table.insertRow(key);
    row.setAttribute('gameid', item[0]);
    row.className = item[5] ? 'locked' : 'unlocked';
    row.setAttribute('onclick', 'SelectRow(this)');
    row.insertCell(0).innerHTML = '';
    for (var i = 1; i < item.length - 1; i++) {
      row.insertCell(i).innerHTML = item[i];
    }
  }
}

function SelectRow(row) {
  document.querySelectorAll('#servers tr').forEach(r => r.classList.remove('selected'));
  row.classList.add('selected');
  gameid = row.getAttribute('gameid');
  const joinBtn = document.getElementById('btn-join');
  if (joinBtn) joinBtn.disabled = false;
}

// ─── USER EVENTS ─────────────────────────────────────────────

function UserEvent(type, prm = {}) {
  switch (type) {
    case 'btnPlay':
    case 'btnRefresh':    ShowGameList(); break;
    case 'btnCreateGame': CreateGame();  break;
    case 'btnJoin':       JoinGame();    break;
    case 'menu':          ShowScene('menu'); break;
    case 'btnSettings':   ShowScene('settings'); break;
    case 'btnTutorial':   ShowScene('tutorial'); break;
    case 'back-to-mm':    ShowGameList(); break;
    case 'check-start':   ShowScene('ingame'); break;
    case 'btnPause':      TogglePauseMenu(true);  break;
    case 'btnPauseClose': TogglePauseMenu(false); break;
    case 'change-ready':  ReadyStateChange(prm);  break;
    case 'showCastle':    ShowGameScene('castle'); break;
    case 'showMap':       ShowGameScene('map');    break;
    default:
      console.warn('[UserEvent] Neznámá akce:', type);
  }
}

function ShowGameScene(name) {
  document.querySelectorAll('[group="game"]').forEach(el => {
    el.classList.toggle('hidden', el.getAttribute('name') !== name);
  });
}

// ─── I18N HOOK ───────────────────────────────────────────────

// Při přepnutí jazyka přeloži dynamicky generované prvky
if (typeof I18n !== 'undefined') {
  I18n.onChange(function (lang) {
    const joinBtn = document.getElementById('btn-join');
    if (joinBtn) joinBtn.textContent = I18n.t('connect');
  });
}

// ─── INIT ────────────────────────────────────────────────────

$(function () {
  client = new clientClass();
  startComunication();
});
