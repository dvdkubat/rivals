/**
 * MapController — ovládání mapy
 * 
 * Zodpovídá za:
 *  - kliknutí na canvas → výběr armády / cílový hex
 *  - A* pathfinding (přesunuto ze standalone funkcí)
 *  - highlight dosažitelných hexů (BFS)
 *  - animovaný pohyb hrdiny
 *  - předání výsledku do GameManager
 * 
 * Závislosti: grid (Point[][]), Terrain[], Army, GameManager
 */

(function (exports) {

    // Barvy pro overlay
    const COLOR = {
        REACHABLE:  'rgba(100, 200, 100, 0.35)',
        PATH:       'rgba(255, 220, 50, 0.7)',
        BLOCKED:    'rgba(200, 60, 60, 0.35)',
        SELECTED:   'rgba(80, 150, 255, 0.5)',
        HOVER:      'rgba(255, 255, 255, 0.2)',
    };

    exports.MapController = class MapController {

        /**
         * @param {Object} prm
         * @param {HTMLCanvasElement} prm.canvas
         * @param {Point[][]}         prm.grid
         * @param {number}            prm.hexSize
         * @param {string}            prm.direction  "flat" | "pointy"
         * @param {GameManager}       prm.gameManager
         * @param {Function}          prm.onRedraw   - callback pro překreslení celé mapy
         * @param {Function}          prm.onArmySelect - callback(army | null) pro UI sidebar
         * @param {Function}          prm.onHexAction  - callback(hex, army) pro loot, hrad, ...
         */
        constructor(prm) {
            this.canvas      = prm.canvas;
            this.ctx         = this.canvas.getContext('2d');
            this.grid        = prm.grid;
            this.hexSize     = prm.hexSize || 16;
            this.direction   = prm.direction || 'flat';
            this.gm          = prm.gameManager;
            this.onRedraw    = prm.onRedraw    || (() => {});
            this.onArmySelect= prm.onArmySelect|| (() => {});
            this.onHexAction = prm.onHexAction || (() => {});

            // Stav výběru
            this.selectedArmy   = null;   // aktuálně vybraná armáda
            this.reachableHexes = new Map(); // hex → cost (BFS výsledek)
            this.currentPath    = [];     // A* cesta k hoveru/cíli
            this.hoveredHex     = null;
            this.animating      = false;

            this._bindEvents();
        }

        // ─── EVENTS ──────────────────────────────────────────────

        _bindEvents() {
            this.canvas.addEventListener('click',     (e) => this._onClick(e));
            this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        }

        _getCanvasPos(event) {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }

        _onClick(event) {
            if (this.animating) return;

            const pos = this._getCanvasPos(event);
            const hex = this._closestHex(pos.x, pos.y);
            if (!hex) return;

            // 1. Klik na vlastní armádu → vyber ji
            const clickedArmy = this._armyOnHex(hex);
            if (clickedArmy && clickedArmy.ownerId === this.gm.currentPlayer.id) {
                this._selectArmy(clickedArmy);
                return;
            }

            // 2. Máme vybranou armádu → pohyb
            if (this.selectedArmy) {
                if (this.reachableHexes.has(hex)) {
                    this._executeMove(hex);
                } else {
                    // Cílový hex je mimo dosah — zruš výběr
                    this._deselectArmy();
                }
                return;
            }

            // 3. Nic nevybráno, klik na neprůchodný nebo prázdný hex → ignore
        }

        _onMouseMove(event) {
            if (this.animating || !this.selectedArmy) return;

            const pos = this._getCanvasPos(event);
            const hex = this._closestHex(pos.x, pos.y);

            if (hex === this.hoveredHex) return;
            this.hoveredHex = hex;

            if (hex && this.reachableHexes.has(hex)) {
                // Spočítej A* cestu k hoveru pro vizualizaci
                this.currentPath = this._findPath(this.selectedArmy.hex, hex);
            } else {
                this.currentPath = [];
            }

            this._drawOverlay();
        }

        // ─── VÝBĚR ARMÁDY ────────────────────────────────────────

        _selectArmy(army) {
            this.selectedArmy = army;
            army.isSelected = true;

            this.reachableHexes = army.getReachableHexes(this.grid);
            this.currentPath = [];

            this.onArmySelect(army);
            this._drawOverlay();
            console.log(`[MAP] Vybrána armáda: ${army.name} (${army.movementPoints} bodů)`);
        }

        _deselectArmy() {
            if (this.selectedArmy) this.selectedArmy.isSelected = false;
            this.selectedArmy   = null;
            this.reachableHexes = new Map();
            this.currentPath    = [];
            this.hoveredHex     = null;

            this.onArmySelect(null);
            this._drawOverlay();
        }

        // ─── POHYB ───────────────────────────────────────────────

        _executeMove(targetHex) {
            const path = this._findPath(this.selectedArmy.hex, targetHex);
            if (path.length === 0) return;

            const army = this.selectedArmy;

            // Pohyb v GameManageru (odečte body)
            const result = this.gm.moveArmy(army, path);

            if (result.moved) {
                // Animace pohybu
                this._animateMove(army, path.slice(0, result.steps), () => {
                    // Akce na cílovém hexu (loot, hrad, nepřítel)
                    this.onHexAction(army.hex, army);

                    // Obnov dosah (zbývající body)
                    if (army.movementPoints > 0) {
                        this._selectArmy(army); // přesel armádu na nové pozici
                    } else {
                        this._deselectArmy(); // vyčerpána
                    }
                });
            }
        }

        // ─── ANIMACE ─────────────────────────────────────────────

        /**
         * Plynulá animace po hexech — posouvá sprite hex po hexu
         */
        _animateMove(army, steps, onComplete) {
            if (steps.length === 0) { onComplete(); return; }

            this.animating = true;
            let stepIndex = 0;
            const STEP_MS = 180; // ms na jeden hex

            const tick = () => {
                if (stepIndex >= steps.length) {
                    this.animating = false;
                    onComplete();
                    return;
                }

                army.hex = steps[stepIndex]; // okamžitě přeskoč na hex (snap)
                stepIndex++;

                this.onRedraw();          // překresli mapu (podklad)
                this._drawOverlay();      // překresli overlay

                setTimeout(tick, STEP_MS);
            };

            tick();
        }

        // ─── A* PATHFINDING ──────────────────────────────────────

        /**
         * A* od startHex do endHex
         * @returns {Point[]} cesta BEZ startovního hexu
         */
        _findPath(startHex, endHex) {
            const grid = this.grid;

            // Reset A* dat
            for (const row of grid) {
                for (const point of row) {
                    point.parent = null;
                    point.g = Infinity;
                    point.h = 0;
                    point.f = 0;
                }
            }

            startHex.g = 0;
            startHex.f = this._heuristic(startHex, endHex);

            let openSet   = [startHex];
            const closedSet = new Set();

            while (openSet.length > 0) {
                // Vyber hex s nejnižším f
                let current = openSet.reduce((a, b) => a.f < b.f ? a : b);

                if (current === endHex) {
                    return this._reconstructPath(current);
                }

                openSet = openSet.filter(p => p !== current);
                closedSet.add(current);

                for (const neighbor of this._getNeighbors(current)) {
                    if (closedSet.has(neighbor)) continue;

                    const terrainCost = this._terrainCost(neighbor);
                    if (terrainCost === 0) continue; // neprůchodný

                    const tempG = current.g + terrainCost;

                    if (tempG < neighbor.g) {
                        neighbor.parent = current;
                        neighbor.g = tempG;
                        neighbor.h = this._heuristic(neighbor, endHex);
                        neighbor.f = neighbor.g + neighbor.h;

                        if (!openSet.includes(neighbor)) openSet.push(neighbor);
                    }
                }
            }

            return []; // cesta nenalezena
        }

        _reconstructPath(current) {
            const path = [];
            while (current.parent) {
                path.push(current);
                current = current.parent;
            }
            return path.reverse();
        }

        _heuristic(a, b) {
            return Math.abs(a.q - b.q) + Math.abs(a.r - b.r);
        }

        _terrainCost(hex) {
            if (typeof Terrain === 'undefined') return 1;
            return Terrain[hex.terrain]?.cost ?? 1;
        }

        _getNeighbors(point) {
            const dirsEven = [[+1, 0], [0, -1], [-1, -1], [-1, 0], [-1, +1], [0, +1]];
            const dirsOdd  = [[+1, 0], [+1, -1], [0, -1], [-1, 0], [0, +1], [+1, +1]];
            const directions = point.r % 2 === 0 ? dirsEven : dirsOdd;
            const neighbors = [];

            for (const [dq, dr] of directions) {
                const q = point.q + dq;
                const r = point.r + dr;
                if (this.grid[r] && this.grid[r][q]) neighbors.push(this.grid[r][q]);
            }
            return neighbors;
        }

        // ─── KRESLENÍ OVERLAY ────────────────────────────────────

        /**
         * Kreslí barevné overlay přes hex gridu:
         *  - zelená = dosažitelné hexy
         *  - žlutá  = aktuální naplánovaná cesta (A*)
         *  - modrá  = vybraná armáda
         */
        _drawOverlay() {
            // Nemazat celý canvas — pouze překreslit hex overlay
            // Volíme přístup: podklad kreslí onRedraw(), my kreslíme jen průhledné hexagony

            const ctx = this.ctx;

            // Dosažitelné hexy
            for (const [hex] of this.reachableHexes) {
                this._fillHex(ctx, hex, COLOR.REACHABLE);
            }

            // A* cesta
            for (const hex of this.currentPath) {
                this._fillHex(ctx, hex, COLOR.PATH);
            }

            // Hex vybrané armády
            if (this.selectedArmy) {
                this._fillHex(ctx, this.selectedArmy.hex, COLOR.SELECTED);
                this._drawArmyIcon(ctx, this.selectedArmy);
            }

            // Všechny ostatní armády hráče
            if (this.gm) {
                for (const player of this.gm.players) {
                    for (const army of player.armies) {
                        if (army !== this.selectedArmy) {
                            this._drawArmyIcon(ctx, army);
                        }
                    }
                }
            }
        }

        _fillHex(ctx, hex, color) {
            const size  = this.hexSize;
            const angle = this.direction === 'flat' ? Math.PI / 6 : 0;

            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = angle + (Math.PI / 3) * i;
                const px = hex.x + size * Math.cos(a);
                const py = hex.y + size * Math.sin(a);
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }

        _drawArmyIcon(ctx, army) {
            const hex = army.hex;
            if (!hex) return;

            // Kroužek s barvou rasy
            const RACE_COLOR = { human: '#4488ff', undead: '#aa44aa', robot: '#44aaaa', orc: '#44aa44' };
            const col = RACE_COLOR[army.race] || '#888';

            ctx.beginPath();
            ctx.arc(hex.x, hex.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = col;
            ctx.fill();
            ctx.strokeStyle = army.isSelected ? 'gold' : 'white';
            ctx.lineWidth = army.isSelected ? 3 : 1.5;
            ctx.stroke();

            // Iniciála jména
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(army.name[0].toUpperCase(), hex.x, hex.y);

            // Pohybové body (malý indikátor)
            const mpPct = army.movementPoints / army.speed;
            ctx.fillStyle = mpPct > 0.5 ? 'lime' : mpPct > 0.2 ? 'orange' : 'red';
            ctx.fillRect(hex.x - 8, hex.y + 12, 16 * mpPct, 3);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(hex.x - 8, hex.y + 12, 16, 3);
        }

        // ─── HELPERS ─────────────────────────────────────────────

        _closestHex(x, y, maxDist = this.hexSize * 1.5) {
            let best = null;
            let minD = Infinity;

            for (const row of this.grid) {
                for (const point of row) {
                    const dx = x - point.x;
                    const dy = y - point.y;
                    const d  = Math.sqrt(dx * dx + dy * dy);
                    if (d < minD && d < maxDist) {
                        minD = d;
                        best = point;
                    }
                }
            }
            return best;
        }

        _armyOnHex(hex) {
            if (!this.gm) return null;
            for (const player of this.gm.players) {
                for (const army of player.armies) {
                    if (army.hex === hex) return army;
                }
            }
            return null;
        }

        // ─── PUBLIC API ──────────────────────────────────────────

        /** Plné překreslení overlay (volej po každém onRedraw) */
        redrawOverlay() {
            this._drawOverlay();
        }

        /** Nastav nový grid (po načtení mapy ze serveru) */
        setGrid(grid) {
            this.grid = grid;
            this._deselectArmy();
        }
    };

})(typeof exports === 'undefined' ? this['MapController'] = {} : exports);
