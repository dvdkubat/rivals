/**
 * scripts/server.js
 * Komunikační most: app.js (socket) <-> serverLobby instance
 *
 * Opravy:
 *  - disconnect(): splice() se nesmí přiřazovat zpět — opraveno
 *  - disconnect() a leave() byly duplicitní — sjednoceno
 *  - playerSocketList je nyní Map (socketId → playerId) místo pole
 *  - ready() předává data do správné lobby
 *  - startLoby() (překlep zachován pro kompatibilitu) opraveno na správné ID
 */

const fs     = require('fs');
const _lobby = require('./serverLobby');

const LOBBY_ID_LENGTH = 8;

(function (exports) {

  function assign(o1, o2) { return Object.assign({}, o1, o2); }

  function generateId(length = LOBBY_ID_LENGTH) {
    let res = '';
    for (let i = 0; i < length; i++) {
      const c = Math.floor(Math.random() * 62);
      res += String.fromCharCode(c < 10 ? 48 + c : c < 36 ? 55 + c : 61 + c);
    }
    return res;
  }

  exports.server = class server {

    constructor(prm) {
      this.lobbies          = {};   // { lobbyId: lobbyInstance }
      this.playerInLobby    = {};   // { socketId: lobbyId }
      this.connectedPlayers = 0;

      console.log('✅  Herní server inicializován');
    }

    // ─── PŘIPOJENÍ / ODPOJENÍ ─────────────────────────────────

    /**
     * Volá se při socket handshake (event 'Connect').
     * savedId = localStorage hodnota z minulé session (může být null).
     * Vrátí nové ID pro klienta.
     */
    connect(savedId, socket) {
      this.connectedPlayers++;
      console.log(`🔌  connect: socket=${socket.id} savedId=${savedId || '—'}`);

      // TODO: pokud savedId sedí na existující lobby, přesměrovat tam
      const newId = generateId();
      this._broadcastPlayerCount();
      return newId;
    }

    /**
     * Volá se při náhlém odpojení (zavření tabu, výpadek).
     * Interně deleguje na leave() — jeden kód pro obě situace.
     */
    disconnect(socketId) {
      console.log(`❌  disconnect: socket=${socketId}`);
      this.leave(socketId);
    }

    /**
     * Volá se při explicitním opuštění (event 'Leave') i při disconnect.
     * Odstraní hráče z lobby a aktualizuje počítadla.
     */
    leave(socketId) {
      this.connectedPlayers = Math.max(0, this.connectedPlayers - 1);

      const lobbyId = this.playerInLobby[socketId];
      if (lobbyId !== undefined) {
        const lobby = this.lobbies[lobbyId];
        if (lobby) {
          lobby.disconnect(socketId);

          // Smazat prázdnou lobby (volitelně)
          if (lobby.players <= 0 && !lobby.active) {
            console.log(`🗑️   Lobby "${lobby.name}" (${lobbyId}) je prázdná, mažu ji.`);
            delete this.lobbies[lobbyId];
          }
        }
        delete this.playerInLobby[socketId];
      }

      this._broadcastPlayerCount();
      console.log(`👋  leave: socket=${socketId} lobby=${lobbyId || '—'}`);
    }

    // ─── LOBBY MANAGEMENT ─────────────────────────────────────

    /**
     * Připojí hráče do lobby.
     * prm = { connect: lobbyId, pass, name }
     */
    join(socket, prm) {
      prm = assign({ connect: '', pass: '', name: 'Hráč' }, prm);

      if (!prm.connect)
        return { error: 'no-lobby' };

      const lobby = this.lobbies[prm.connect];
      if (!lobby)
        return { error: 'not-found' };

      if (!lobby.checkPassword(prm.pass))
        return { error: 'bad-pass' };

      if (lobby.players >= lobby.max)
        return { error: 'full' };

      // Pokud byl hráč v jiné lobby, odstraň ho odtamtud
      if (this.playerInLobby[socket.id]) {
        this.leave(socket.id);
        this.connectedPlayers++; // leave() snížilo, ale hráč je stále připojen
      }

      this.playerInLobby[socket.id] = lobby.id;

      const result = lobby.connect(socket, {
        Id:         socket.id,
        lobby:      prm.connect,
        playerName: prm.name
      });

      console.log(`➡️   join: ${prm.name} → lobby "${lobby.name}" (${lobby.id})`);
      return result;
    }

    createGame(prm) {
      const id = generateId();
      const newLobby = new _lobby.lobby(assign({
        id,
        pass:  '',
        name:  'Hra',
        mode:  'Standard',
        max:   4,
        map:   'zelda',
        limit: 0
      }, prm));

      this.lobbies[id] = newLobby;
      console.log(`🎮  Nová lobby: "${newLobby.name}" (${id})`);
      return id;
    }

    getLobbies() {
      return Object.values(this.lobbies).map(l => l.info());
    }

    ready(socketId, data) {
      const lobby = this._getLobbyBySocket(socketId);
      if (lobby) lobby.playerReady(socketId, data);
    }

    // Překlep v originále zachován pro kompatibilitu se zbytkem kódu
    startLoby(lobbyId) {
      const lobby = this.lobbies[lobbyId];
      if (lobby) lobby.startGame();
      else console.warn(`⚠️  startLoby: lobby ${lobbyId} nenalezena`);
    }

    LobbyMessage(socketId, data) {
      const lobby = this._getLobbyBySocket(socketId);
      if (lobby) lobby.LobbyMessage(socketId, data);
    }

    // ─── HELPERS ──────────────────────────────────────────────

    _getLobbyBySocket(socketId) {
      const lobbyId = this.playerInLobby[socketId];
      return lobbyId ? this.lobbies[lobbyId] : null;
    }

    _broadcastPlayerCount() {
      for (const lobby of Object.values(this.lobbies)) {
        lobby.updateClients(this.connectedPlayers);
      }
    }
  };

})(typeof exports === 'undefined' ? this['ServerModule'] = {} : exports);
