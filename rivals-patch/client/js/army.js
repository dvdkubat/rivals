/**
 * Army — armáda na mapě
 * Pohybuje se po hexech, má pohybové body, nese jednotky a zásoby
 * 
 * Závislosti: GameManager.DEFAULT_MOVEMENT_POINTS
 */

(function (exports) {

    const DEFAULT_MOVEMENT_POINTS = 20;

    let _armyIdCounter = 0;

    exports.Army = class Army {

        /**
         * @param {Object} prm
         * @param {string} prm.ownerId     - id hráče
         * @param {string} prm.name        - jméno generála
         * @param {string} prm.race        - rasa (human/undead/robot)
         * @param {Point}  prm.hex         - startovní hex (Point objekt z gridu)
         * @param {Object} prm.units       - { unitType: count }
         * @param {number} [prm.speed]     - základní pohybové body/den (default 20)
         */
        constructor(prm) {
            this.id       = `army_${++_armyIdCounter}`;
            this.ownerId  = prm.ownerId;
            this.name     = prm.name || "Armáda";
            this.race     = prm.race || "human";
            this.hex      = prm.hex;         // aktuální hex (Point)
            this.units    = prm.units || {}; // { spearman: 10, archer: 5 }
            this.inventory= {};              // suroviny nesené armádou
            this.speed    = prm.speed || DEFAULT_MOVEMENT_POINTS;

            this.movementPoints = this.speed; // body k dispozici tento tah
            this.path     = [];              // naplánovaná cesta (pro vizualizaci)
            this.isSelected = false;
        }

        // ------- POHYB -------

        resetMovement() {
            this.movementPoints = this.speed;
            this.path = [];
        }

        /**
         * Pohyb po cestě vrácené A*
         * @param {Point[]} path - seznam hexů (BEZ startovního)
         * @returns {{ moved: boolean, steps: number, remaining: number, stoppedAt: Point }}
         */
        moveAlongPath(path) {
            if (!path || path.length === 0) return { moved: false, steps: 0, remaining: this.movementPoints };

            let steps = 0;

            for (const hex of path) {
                const cost = this._terrainCost(hex);

                if (cost === 0) break;            // impassable
                if (this.movementPoints < cost) break; // nestačí body

                this.movementPoints -= cost;
                this.hex = hex;
                steps++;
            }

            this.path = steps < path.length ? path.slice(steps) : []; // zbývající naplánovaná cesta

            return {
                moved: steps > 0,
                steps,
                remaining: this.movementPoints,
                stoppedAt: this.hex
            };
        }

        /**
         * Kolik stojí vstup na hex (záleží na terénu)
         * Terrain[idx].cost — přebíráme z const.js
         */
        _terrainCost(hex) {
            if (typeof Terrain === 'undefined') return 1;
            return Terrain[hex.terrain]?.cost ?? 1;
        }

        // ------- DOSAH -------

        /**
         * BFS — vrátí množinu hexů dosažitelných za zbývající pohybové body
         * @param {Point[][]} grid - celý hex grid
         * @returns {Set<Point>}
         */
        getReachableHexes(grid) {
            const reachable = new Map(); // hex → cost
            const queue = [{ hex: this.hex, cost: 0 }];
            reachable.set(this.hex, 0);

            while (queue.length > 0) {
                const { hex, cost } = queue.shift();
                const neighbors = this._getNeighbors(hex, grid);

                for (const neighbor of neighbors) {
                    const moveCost = this._terrainCost(neighbor);
                    if (moveCost === 0) continue; // neprůchodný

                    const newCost = cost + moveCost;
                    if (newCost <= this.movementPoints && (!reachable.has(neighbor) || reachable.get(neighbor) > newCost)) {
                        reachable.set(neighbor, newCost);
                        queue.push({ hex: neighbor, cost: newCost });
                    }
                }
            }

            reachable.delete(this.hex); // samotný hex armády nevyznačujeme
            return reachable;
        }

        _getNeighbors(point, grid) {
            const dirsEven = [[+1, 0], [0, -1], [-1, -1], [-1, 0], [-1, +1], [0, +1]];
            const dirsOdd  = [[+1, 0], [+1, -1], [0, -1], [-1, 0], [0, +1], [+1, +1]];
            const directions = point.r % 2 === 0 ? dirsEven : dirsOdd;
            const neighbors = [];

            for (const [dq, dr] of directions) {
                const q = point.q + dq;
                const r = point.r + dr;
                if (grid[r] && grid[r][q]) neighbors.push(grid[r][q]);
            }
            return neighbors;
        }

        // ------- SÍLA -------

        /** Celková útočná síla armády */
        get totalAttack() {
            return this._sumStat('attack');
        }

        get totalDefense() {
            return this._sumStat('defense');
        }

        get totalCapacity() {
            return this._sumStat('capacity');
        }

        _sumStat(stat) {
            let total = 0;
            for (const [unitType, count] of Object.entries(this.units)) {
                const def = (typeof UNIT_DEFINITIONS !== 'undefined') ? UNIT_DEFINITIONS[unitType] : null;
                if (def) total += (def.stats[stat] || 0) * count;
            }
            return total;
        }

        get unitCount() {
            return Object.values(this.units).reduce((a, b) => a + b, 0);
        }

        // ------- SERIALIZACE -------

        packet() {
            return {
                id: this.id,
                ownerId: this.ownerId,
                name: this.name,
                race: this.race,
                q: this.hex.q,
                r: this.hex.r,
                units: { ...this.units },
                movementPoints: this.movementPoints,
                speed: this.speed
            };
        }

        static fromPacket(data, grid) {
            const hex = grid[data.r]?.[data.q];
            return new Army({ ...data, hex });
        }
    };

})(typeof exports === 'undefined' ? this['ArmyModule'] = {} : exports);
