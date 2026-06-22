/** Client-side game lobby: map loading, UI rendering and socket sync. */
class lobby extends lobbyBase.lobbyBase {
  constructor(prm) {
    super(prm);
    this.isServer = false;
    this.camera = { x: 0, y: 0 };
    this.world = {};
    this.mapId = prm.map || 'zelda';
    this.display = new display('world-game-canvas', prm.width, prm.height, this.mapId);
    this.ready = false;
    this.connected = 0;
    this.sound = null;
    this.animation = null;
    this.mapController = null;
    this.gameManager = null;
    this.isMapReady = false;

    this.player = {
      id: prm.id || 'local',
      name: prm.name || 'Player',
      race: 'human',
      castle: new castle.castle('human'),
      armies: []
    };

    this.state = prm.state || {
      players: {},
      version: 0
    };
    if (!this.state.players[this.player.id]) this.state.players[this.player.id] = this.serializePlayer();

    this.loadMap();
    this.updateSidebar();
  }

  loadMap() {
    const status = document.getElementById('map-load-status');
    if (status) status.textContent = 'Loading compact map…';

    MapLoader.loadFromUrl(`/api/maps/${this.mapId}`, {
      display: this.display,
      onReady: () => {
        this.isMapReady = true;
        this.applyServerState(this.state);
        this.ensureStarterArmy();
        this.initGameControls();
        this.updateSidebar();
        if (status) status.textContent = 'Map ready — click Natan, then a green hex.';
      }
    }).catch(err => {
      console.error('[Lobby] Map load failed:', err);
      if (status) status.textContent = 'Map failed to load.';
    });
  }

  ensureStarterArmy(packet) {
    if (!grid.length) return;
    if (this.player.armies.length) return;

    const startHex = packet && grid[packet.r] && grid[packet.r][packet.q]
      ? grid[packet.r][packet.q]
      : (grid[11] && grid[11][22] ? grid[11][22] : grid[0][0]);

    this.player.armies.push(new ArmyModule.Army({
      ownerId: this.player.id,
      name: packet && packet.name ? packet.name : 'Natan',
      race: this.player.race,
      hex: startHex,
      units: packet && packet.units ? packet.units : { spearman: 5, archer: 2 },
      speed: packet && packet.speed ? packet.speed : 20
    }));
  }

  initGameControls() {
    this.gameManager = new GameManager.GameManager([this.player], {
      onArmyMoved: ({ army }) => this.syncArmyMovement(army),
      onTurnStart: () => this.updateSidebar()
    });

    this.mapController = new MapController.MapController({
      canvas: this.display.canvas,
      grid,
      hexSize,
      direction,
      gameManager: this.gameManager,
      onRedraw: () => this.draw(),
      onArmySelect: () => this.updateSidebar()
    });
  }

  draw() {
    this.display.draw(this.camera, this.world);
    if (this.display.isReady && this.mapController) this.mapController.redrawOverlay();
  }

  send(emit, data) {
    socket.emit(emit, data);
  }

  begin(data) {
    this.active = true;
    this.applyServerState(data && data.state);
    if (this.gameManager) this.gameManager.start();
    return 'ingame';
  }

  buildCastle(buildingName = 'saw_mill') {
    this.player.castle.buildBuilding(buildingName);
    this.syncEconomy('BuildCastle', { buildingName, castle: this.serializeCastle() });
    this.updateSidebar();
  }

  recruitArmy(unitName = 'peasant', count = 5) {
    const army = this.player.armies[0];
    if (!army) return;
    army.units[unitName] = (army.units[unitName] || 0) + count;
    this.syncEconomy('RecruitArmy', { unitName, count, army: army.packet(), castle: this.serializeCastle() });
    this.updateSidebar();
  }

  syncArmyMovement(army) {
    this.send('LobbyMessage', {
      fce: 'ArmyMoved',
      data: { army: army.packet(), castle: this.serializeCastle() }
    });
    this.updateSidebar();
  }

  syncEconomy(type, data) {
    this.send('LobbyMessage', { fce: type, data });
  }

  OnLobbyMessage(message) {
    if (!message || !message.fce) return;
    if (message.fce === 'GameState') {
      this.applyServerState(message.data);
      this.updateSidebar();
      this.draw();
    }
  }

  applyServerState(state) {
    if (!state || !state.players) return;
    this.state = state;
    const ownState = state.players[this.player.id];

    if (ownState) {
      this.applyCastlePacket(ownState.castle);
      if (this.isMapReady && ownState.armies && ownState.armies[0]) {
        this.player.armies = [];
        this.ensureStarterArmy(ownState.armies[0]);
        this.player.armies[0].movementPoints = ownState.armies[0].movementPoints;
      }
    }

    if (this.isMapReady && this.gameManager) {
      const players = Object.values(state.players).map(packet => {
        if (packet.id === this.player.id) return this.player;
        return {
          id: packet.id,
          name: packet.name,
          race: packet.race || 'human',
          castle: packet.castle,
          armies: (packet.armies || []).map(armyPacket => ArmyModule.Army.fromPacket(armyPacket, grid)).filter(Boolean)
        };
      });
      this.gameManager.players = players;
    }
  }

  applyCastlePacket(packet) {
    if (!packet) return;
    Object.entries(packet.resources || {}).forEach(([name, count]) => {
      if (this.player.castle.resources[name]) this.player.castle.resources[name].count = count;
    });
    Object.entries(packet.buildings || {}).forEach(([name, level]) => {
      if (this.player.castle.buildings[name]) this.player.castle.buildings[name].level = level;
    });
  }

  serializeCastle() {
    const resources = {};
    const buildings = {};
    Object.entries(this.player.castle.resources).forEach(([name, resource]) => { resources[name] = resource.count; });
    Object.entries(this.player.castle.buildings).forEach(([name, building]) => { buildings[name] = building.level; });
    return { race: this.player.race, resources, buildings };
  }

  serializePlayer() {
    return {
      id: this.player.id,
      name: this.player.name,
      race: this.player.race,
      castle: this.serializeCastle(),
      armies: this.player.armies.map(army => army.packet())
    };
  }

  renderCastle() {
    const buildings = document.getElementById('buildings');
    const units = document.getElementById('units');
    const resources = document.getElementById('resources');
    const army = this.player.armies[0];

    if (buildings) {
      buildings.innerHTML = Object.values(this.player.castle.buildings).map(building => (
        `<div class="card"><strong>${building.name}</strong><br>Level: ${building.level}<br>` +
        `<button onclick="client.lobby.buildCastle('${building.name}')">Build/upgrade</button></div>`
      )).join('');
    }

    if (units) {
      const entries = army ? Object.entries(army.units) : [];
      units.innerHTML = entries.map(([name, count]) => (
        `<div class="card"><strong>${name}</strong><br>${count}<br>` +
        `<button onclick="client.lobby.recruitArmy('${name}', 5)">Recruit +5</button></div>`
      )).join('') || '<div class="card">Load the map to create your first army.</div>';
    }

    if (resources) {
      resources.innerHTML = Object.values(this.player.castle.resources)
        .map(resource => `<div class="card">${resource.name}: ${resource.count}</div>`)
        .join('');
    }
  }

  updateSidebar() {
    this.renderCastle();
    const army = this.player.armies[0];
    const name = document.getElementById('player-castle-name');
    if (name) name.textContent = 'Praha';

    const strength = document.getElementById('selected-army-strength');
    if (strength) {
      strength.textContent = army
        ? `${army.totalAttack}⚔️ | ${army.totalDefense}🛡️ | ${army.movementPoints.toFixed(1)}🦵 | ${army.unitCount}💪`
        : 'Map loading…';
    }

    const table = document.getElementById('selected-army-units');
    if (table) {
      table.innerHTML = army
        ? Object.entries(army.units).map(([unit, count]) => `<tr><td>${unit}</td><td>${count}</td></tr>`).join('')
        : '<tr><td colspan="2">Map loading…</td></tr>';
    }
  }
}
