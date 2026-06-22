/**
 * scripts/serverLobby.js
 * Per-game lobby — správa hráčů, socketů, herního stavu.
 *
 * Opravy oproti originálu:
 *  - socketList je nyní Map { socketId → socket } místo pole
 *    → O(1) lookup při disconnect místo O(n) smyčky
 *  - disconnect() správně odstraňuje podle socketId
 *  - connect() vrací konzistentní strukturu
 *  - startGame() připraveno (bylo prázdné)
 *  - info() vrací správné pořadí sloupců pro DisplayListTable
 */

if (typeof require !== 'undefined') {
  var base = require('../client/js/shr/lobby');
}

(function (exports) {

  const _default = {
    id:     '',
    pass:   '',
    name:   'Hra',
    mode:   'Standard',
    max:    4,
    map:    'zelda',
    limit:  0,
  };

  exports.lobby = class lobby extends base.lobbyBase {

    constructor(prm) {
      super(prm);
      this.isServer = true;

      this.pass   = prm.pass   ?? '';
      this.mode   = prm.mode   ?? 'Standard';
      this.max    = prm.max    ?? 4;
      this.map    = prm.map    ?? 'zelda';
      this.limit  = prm.limit  ?? 0;

      // Map místo pole — klíč = socket.id, hodnota = socket objekt
      this.socketMap  = new Map();
      this.playerData = new Map(); // socketId → { name, race, ready }

      this.players   = 0;
      this.readyCount = 0;
      this.active    = false;   // true = hra běží

      this.weather = null;
      this.stateVersion = 0;
      this.gameState = { players: {}, version: this.stateVersion };
    }

    // ─── HESLO ───────────────────────────────────────────────

    checkPassword(pass) {
      return this.pass === '' || this.pass === pass;
    }

    // ─── PŘIPOJENÍ ───────────────────────────────────────────

    connect(socket, prm) {
      if (this.players >= this.max)
        return { error: 'full' };

      this.socketMap.set(socket.id, socket);
      this.playerData.set(socket.id, {
        name:  prm.playerName || 'Hráč',
        race:  'human',
        ready: false
      });
      this.players++;
      this.ensurePlayerState(socket.id, prm.playerName || 'Hráč');

      console.log(`[Lobby ${this.id}] Připojen: ${prm.playerName} (${socket.id}) — ${this.players}/${this.max}`);

      return {
        name:   this.name,
        lobbyId: this.id,
        map:    this.map,
        mode:   this.mode,
        active: this.active,
        playerId: socket.id,
        state:  this.gameState,
        items:  this.packet(true),
      };
    }

    disconnect(socketId) {
      if (!this.socketMap.has(socketId)) return;

      const player = this.playerData.get(socketId);
      this.socketMap.delete(socketId);
      this.playerData.delete(socketId);
      delete this.gameState.players[socketId];
      this.players = Math.max(0, this.players - 1);

      // Notifikuj ostatní hráče v lobby
      this.send('OnDisconnect', { socketId, name: player?.name });

      console.log(`[Lobby ${this.id}] Odpojen: ${player?.name || socketId} — zbývá ${this.players}/${this.max}`);
    }

    // ─── READY / START ───────────────────────────────────────

    playerReady(socketId, data) {
      const player = this.playerData.get(socketId);
      if (!player) return;

      player.ready = data?.ready ?? true;
      this.readyCount = [...this.playerData.values()].filter(p => p.ready).length;

      console.log(`[Lobby ${this.id}] Ready: ${this.readyCount}/${this.players}`);
      this.send('PlayerReady', { socketId, ready: player.ready, count: this.readyCount });

      // Auto-start pokud jsou všichni připraveni (min. 2 hráči)
      if (this.readyCount >= this.players && this.players >= 2) {
        this.startGame();
      }
    }

    startGame() {
      if (this.active) return;
      this.active = true;

      console.log(`[Lobby ${this.id}] Hra začíná!`);
      this.broadcastGameState();
      this.send('GameStarts', {
        state: this.gameState,
        players: [...this.playerData.entries()].map(([id, p]) => ({
          socketId: id,
          name: p.name,
          race: p.race
        }))
      });
    }

    // ─── KOMUNIKACE ──────────────────────────────────────────

    /** Pošle událost všem hráčům v lobby */
    send(emit, data) {
      for (const socket of this.socketMap.values()) {
        socket.emit(emit, data);
      }
    }

    /** Obecné zprávy z klienta (pohyb, konec tahu, ...) */
    LobbyMessage(socketId, data) {
      if (!data?.fce) return;

      switch (data.fce) {
        case 'UpdateClientPosition':
        case 'ArmyMoved':
          this.updateArmy(socketId, data.data);
          break;

        case 'BuildCastle':
        case 'RecruitArmy':
          this.updateEconomy(socketId, data.data);
          break;

        case 'ReadyStateChange':
          this.playerReady(socketId, data.data);
          break;

        case 'EndTurn':
          // TODO - metoda která zpracuje konec tahu a přepne na dalšího hráče
          break;

        case 'SetRace':
          if (this.playerData.has(socketId)) {
            this.playerData.get(socketId).race = data.data?.race;
            this.ensurePlayerState(socketId, this.playerData.get(socketId).name);
            this.gameState.players[socketId].race = data.data?.race || 'human';
            this.broadcastGameState();
          }
          break;

        default:
          console.warn(`[Lobby ${this.id}] Neznámá LobbyMessage: ${data.fce}`);
      }
    }

    // ─── INFO / PACKET ───────────────────────────────────────

    /** Vrátí řádek pro tabulku serverů v klientu */
    info() {
      return [
        this.id,
        this.name,
        this.map,
        this.mode,
        `${this.players}/${this.max}`,
        this.pass !== ''   // true = zamčeno
      ];
    }

    updateClients(connectedPlayers) {
      this.send('TotalPlayers', connectedPlayers);
    }

    packet(full) {
      return {
        id:      this.id,
        name:    this.name,
        players: this.players,
        max:     this.max,
        active:  this.active,
        state:   full ? this.gameState : undefined,
      };
    }

    ensurePlayerState(socketId, name) {
      if (this.gameState.players[socketId]) return;
      this.gameState.players[socketId] = {
        id: socketId,
        name,
        race: 'human',
        castle: {
          race: 'human',
          resources: { wood: 100, stone: 100, gold: 100, population: 7, food: 0, iron: 0 },
          buildings: { saw_mill: 2, bakery: 0 }
        },
        armies: [{
          id: `army_${socketId}`,
          ownerId: socketId,
          name: 'Natan',
          race: 'human',
          q: 22,
          r: 11,
          units: { spearman: 5, archer: 2 },
          movementPoints: 20,
          speed: 20
        }]
      };
      this.bumpState();
    }

    updateArmy(socketId, data = {}) {
      this.ensurePlayerState(socketId, this.playerData.get(socketId)?.name || 'Hráč');
      const player = this.gameState.players[socketId];
      const army = data.army;
      if (army) {
        const existingIndex = player.armies.findIndex(item => item.id === army.id);
        if (existingIndex === -1) player.armies.push(army);
        else player.armies[existingIndex] = army;
      }
      if (data.castle) player.castle = data.castle;
      this.bumpState();
      this.broadcastGameState();
    }

    updateEconomy(socketId, data = {}) {
      this.ensurePlayerState(socketId, this.playerData.get(socketId)?.name || 'Hráč');
      const player = this.gameState.players[socketId];
      if (data.castle) player.castle = data.castle;
      if (data.army) {
        const existingIndex = player.armies.findIndex(item => item.id === data.army.id);
        if (existingIndex === -1) player.armies.push(data.army);
        else player.armies[existingIndex] = data.army;
      }
      this.bumpState();
      this.broadcastGameState();
    }

    bumpState() {
      this.stateVersion++;
      this.gameState.version = this.stateVersion;
    }

    broadcastGameState() {
      this.send('OnLobbyMessage', { fce: 'GameState', data: this.gameState });
    }

    getReadyText() {
      return `${this.readyCount}/${this.players}`;
    }
  };

})(typeof exports === 'undefined' ? this['lobby'] = {} : exports);
