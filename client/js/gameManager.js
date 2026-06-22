/**
 * GameManager — herní cyklus
 * Správa dnů, tahů hráčů, pohybových bodů armád
 * 
 * Použití:
 *   const gm = new GameManager(players, onDayEnd, onTurnChange);
 *   gm.start();
 */

(function (exports) {

    const DEFAULT_MOVEMENT_POINTS = 20; // základní pohybové body za den
    const BASE_DATE = { day: 1, month: 1, year: 1400 };

    exports.GameManager = class GameManager {

        constructor(players, callbacks = {}) {
            this.players = players;           // pole { id, name, race, armies: [] }
            this.currentPlayerIndex = 0;
            this.dayNumber = 1;
            this.date = { ...BASE_DATE };

            // Callbacky pro UI
            this.onTurnStart   = callbacks.onTurnStart   || (() => {});
            this.onTurnEnd     = callbacks.onTurnEnd     || (() => {});
            this.onDayEnd      = callbacks.onDayEnd      || (() => {});
            this.onArmyMoved   = callbacks.onArmyMoved   || (() => {});
        }

        get currentPlayer() {
            return this.players[this.currentPlayerIndex];
        }

        // ------- START -------

        start() {
            this._startTurn();
        }

        // ------- TURN -------

        _startTurn() {
            const player = this.currentPlayer;

            // Obnov pohybové body všem armádám aktuálního hráče
            for (const army of player.armies) {
                army.resetMovement();
            }

            console.log(`[GM] Tah: ${player.name} | Den ${this.dayNumber}`);
            this.onTurnStart({ player, day: this.dayNumber, date: this._dateString() });
        }

        /** Volá se tlačítkem "Konec tahu" */
        endTurn() {
            const player = this.currentPlayer;
            this.onTurnEnd({ player });

            this.currentPlayerIndex++;

            if (this.currentPlayerIndex >= this.players.length) {
                // Všichni hráči odehráli → nový den
                this.currentPlayerIndex = 0;
                this._endDay();
            }

            this._startTurn();
        }

        // ------- DAY -------

        _endDay() {
            this.dayNumber++;
            this._advanceDate();

            // Každý hráč dostane produkci ze svého hradu
            for (const player of this.players) {
                if (player.castle) {
                    player.castle.collectProduction();
                }
            }

            console.log(`[GM] Nový den: ${this._dateString()}`);
            this.onDayEnd({ day: this.dayNumber, date: this._dateString() });
        }

        _advanceDate() {
            this.date.day++;
            if (this.date.day > 30) {
                this.date.day = 1;
                this.date.month++;
            }
            if (this.date.month > 12) {
                this.date.month = 1;
                this.date.year++;
            }
        }

        _dateString() {
            return `${this.date.day}.${this.date.month}.${this.date.year}`;
        }

        // ------- POHYB ARMÁDY -------

        /**
         * Pokus o pohyb armády po cestě (výsledek A*)
         * @param {Army} army 
         * @param {Point[]} path  - pole hexů od A* (bez startovního hexu)
         * @returns {{ moved: boolean, remaining: number, stoppedAt: Point }}
         */
        moveArmy(army, path) {
            if (army.ownerId !== this.currentPlayer.id) {
                console.warn("[GM] Nejsi na tahu!");
                return { moved: false };
            }

            const result = army.moveAlongPath(path);
            this.onArmyMoved({ army, result });
            return result;
        }

        /** Vrátí seznam armád aktuálního hráče, které ještě mají pohybové body */
        getActiveArmies() {
            return this.currentPlayer.armies.filter(a => a.movementPoints > 0);
        }

        /** Serializace stavu pro socket */
        packet() {
            return {
                day: this.dayNumber,
                date: this._dateString(),
                currentPlayerId: this.currentPlayer.id,
                players: this.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    race: p.race,
                    armies: p.armies.map(a => a.packet())
                }))
            };
        }
    };

    // ------- POHYBOVÉ BODY PRO CASTLE -------

    /**
     * Přidej metodu collectProduction() do castle třídy —
     * volá se každý nový den automaticky
     */
    exports.patchCastleProduction = function(castleInstance) {
        castleInstance.collectProduction = function() {
            for (const [key, resource] of Object.entries(this.resources)) {
                resource.amount = (resource.amount || 0) + (resource.production || 0);
            }
            console.log(`[Castle] Produkce sebrána pro ${this.faction}`);
        };
    };

    exports.DEFAULT_MOVEMENT_POINTS = DEFAULT_MOVEMENT_POINTS;

})(typeof exports === 'undefined' ? this['GameManager'] = {} : exports);
