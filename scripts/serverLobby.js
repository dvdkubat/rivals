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
        race:  null,
        ready: false
      });
      this.players++;

      console.log(`[Lobby ${this.id}] Připojen: ${prm.playerName} (${socket.id}) — ${this.players}/${this.max}`);

      return {
        name:   this.name,
        lobbyId: this.id,
        map:    this.map,
        mode:   this.mode,
        active: this.active,
        items:  this.packet(true),
      };
    }

    disconnect(socketId) {
      if (!this.socketMap.has(socketId)) return;

      const player = this.playerData.get(socketId);
      this.socketMap.delete(socketId);
      this.playerData.delete(socketId);
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
      this.send('GameStarts', {
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
          // TODO - metoda která aktualizuje pozici armády na serveru
          break;

        case 'ReadyStateChange':
          this.playerReady(socketId, data.data);
          break;

        case 'EndTurn':
          // TODO - metoda která zpracuje konec tahu a přepne na dalšího hráče
          break;

        case 'SetRace':
          if (this.playerData.has(socketId))
            this.playerData.get(socketId).race = data.data?.race;
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
      };
    }

    getReadyText() {
      return `${this.readyCount}/${this.players}`;
    }
  };

})(typeof exports === 'undefined' ? this['lobby'] = {} : exports);
