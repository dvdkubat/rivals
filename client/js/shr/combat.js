/**
 * combat.js  —  BATTLE SIMULÁTOR (prototyp)
 * 
 * Vícedenní bitva — každý "den" se odehraje 1 kolo útoku.
 * Podporuje 2-3 armády (FFA nebo 1v1v1 nebo 2v1 s aliancemi).
 * 
 * Filozofie:
 *  - Žádné kostky nakonec — výsledek je deterministic + trochu RNG
 *  - Každá armáda útočí na nejslabší nepřítele (volitelně: na náhodného)
 *  - Boj trvá dokud nezůstane 1 armáda nebo nedojde k "utěkání"
 *  - Každý den GM zavolá Combat.tick() — výsledek se posílá přes socket
 * 
 * Použití:
 *   const battle = new Combat.Battle([armyA, armyB, armyC], options);
 *   battle.start();
 * 
 *   // každý den:
 *   const result = battle.tick();
 *   if (result.over) { ... }
 */

(function (exports) {

    // ─── KONSTANTY ────────────────────────────────────────────────

    const MORALE_BASE     = 100;
    const MORALE_LOW      = 30;   // pod touto hranicí hrozí útěk
    const FLEE_CHANCE     = 0.35; // 35% šance útěku při low morale
    const DEFENSE_FACTOR  = 0.6;  // obrana snižuje útok o 60 % efektivitu
    const TERRAIN_BONUS   = {
        grass:  1.0,
        forest: 0.85,  // les zpomalí útočníka
        water:  0.0,
        none:   0.0
    };

    // ─── BATTLE ───────────────────────────────────────────────────

    exports.Battle = class Battle {

        /**
         * @param {Army[]} armies    - 2 nebo 3 Army instance
         * @param {Object} options
         * @param {string} options.hex            - terrain type na místě boje
         * @param {Function} options.onRoundEnd   - callback(roundLog) po každém kole
         * @param {Function} options.onBattleEnd  - callback(result) po konci bitvy
         */
        constructor(armies, options = {}) {
            if (armies.length < 2 || armies.length > 3) {
                throw new Error('[Combat] Battle podporuje 2-3 armády.');
            }

            this.armies      = armies.map(a => this._wrapArmy(a));
            this.terrain     = options.terrain || 'grass';
            this.day         = 0;
            this.over        = false;
            this.winner      = null;
            this.log         = [];   // celý log bitvy

            this.onRoundEnd  = options.onRoundEnd  || (() => {});
            this.onBattleEnd = options.onBattleEnd || (() => {});
        }

        /** Inicializace — nastav startovní hp a morale */
        start() {
            for (const a of this.armies) {
                a.hp     = a.totalHp;
                a.morale = MORALE_BASE;
                a.alive  = true;
                a.fled   = false;
            }

            this.log.push({
                day: 0,
                event: 'start',
                armies: this.armies.map(a => this._snapshot(a))
            });

            console.log(`[Combat] Bitva začíná! ${this.armies.map(a => a.name).join(' vs ')}`);
        }

        /**
         * Odehraj 1 kolo (= 1 den v herním čase).
         * Volej z GameManager._endDay() nebo manuálně.
         * 
         * @returns {{ over: boolean, winner: Army|null, roundLog: Object }}
         */
        tick() {
            if (this.over) return { over: true, winner: this.winner };

            this.day++;
            const roundLog = {
                day:    this.day,
                events: [],
                armies: []
            };

            const alive = this.armies.filter(a => a.alive && !a.fled);

            // ── 1. Každá armáda zaútočí na cíl ──────────────────
            for (const attacker of alive) {
                const targets = alive.filter(a => a !== attacker);
                if (targets.length === 0) break;

                const target = this._pickTarget(attacker, targets);
                const damage = this._calcDamage(attacker, target);
                target.hp   -= damage;

                roundLog.events.push({
                    type:    'attack',
                    from:    attacker.name,
                    to:      target.name,
                    damage,
                    targetHp: Math.max(0, target.hp)
                });
            }

            // ── 2. Zkontroluj HP — smrt / útěk ──────────────────
            for (const army of alive) {
                if (army.hp <= 0) {
                    army.alive  = false;
                    army.hp     = 0;
                    this._applyLosses(army, 1.0); // 100% ztráty
                    roundLog.events.push({ type: 'defeated', army: army.name });
                    this._spreadMoraleHit(army, alive);
                } else {
                    // Morale dle poměru HP
                    const hpRatio = army.hp / army.totalHp;
                    army.morale   = Math.round(MORALE_BASE * hpRatio);

                    // Útěk?
                    if (army.morale < MORALE_LOW && Math.random() < FLEE_CHANCE) {
                        army.fled = true;
                        this._applyLosses(army, 0.3); // 30% ztráty při útěku
                        roundLog.events.push({ type: 'fled', army: army.name });
                    } else {
                        // Aplikuj denní ztráty (proporčně k damage přijatému)
                        this._applyLosses(army, 1 - hpRatio);
                    }
                }
            }

            // ── 3. Zkontroluj konec bitvy ────────────────────────
            const stillFighting = this.armies.filter(a => a.alive && !a.fled);

            if (stillFighting.length <= 1) {
                this.over   = true;
                this.winner = stillFighting[0] || null;
                roundLog.winner = this.winner?.name || 'nikdo';

                // Vítěz dostane 50% HP zpět
                if (this.winner) this.winner.hp = Math.round(this.winner.totalHp * 0.5);

                this.onBattleEnd({
                    winner:  this.winner,
                    day:     this.day,
                    armies:  this.armies.map(a => this._snapshot(a)),
                    log:     this.log
                });
            }

            // ── 4. Snapshoty pro log ─────────────────────────────
            roundLog.armies = this.armies.map(a => this._snapshot(a));
            this.log.push(roundLog);
            this.onRoundEnd(roundLog);

            return { over: this.over, winner: this.winner, roundLog };
        }

        // ─── VÝPOČTY ─────────────────────────────────────────────

        /**
         * Vybere cíl — útočí na nejslabší živou armádu (HP%).
         * Lze změnit na random, nejbližší, atd.
         */
        _pickTarget(attacker, targets) {
            return targets.reduce((weakest, t) =>
                (t.hp / t.totalHp) < (weakest.hp / weakest.totalHp) ? t : weakest
            );
        }

        /**
         * Výpočet škody:
         *   base = útočník.attack − (obránce.defense × DEFENSE_FACTOR)
         *   ± 20% náhodnost
         *   × terrain modifier
         */
        _calcDamage(attacker, defender) {
            const baseAtk     = attacker.totalAttack;
            const baseDef     = defender.totalDefense * DEFENSE_FACTOR;
            const terrainMod  = TERRAIN_BONUS[this.terrain] ?? 1.0;
            const rng         = 0.8 + Math.random() * 0.4; // 0.8–1.2

            const raw = Math.max(1, (baseAtk - baseDef) * terrainMod * rng);
            return Math.round(raw);
        }

        /**
         * Přepočítá jednotky armády po ztrátách.
         * lossRatio = 0.0–1.0
         */
        _applyLosses(army, lossRatio) {
            for (const unitType of Object.keys(army.units)) {
                const count = army.units[unitType];
                const lost  = Math.ceil(count * lossRatio * 0.3); // max 30% per kolo
                army.units[unitType] = Math.max(0, count - lost);
            }
            // Přepočítej stats po ztrátách
            army._recalcStats();
        }

        /** Šok z porážky souseda snižuje morale ostatním */
        _spreadMoraleHit(defeated, survivors) {
            for (const s of survivors) {
                s.morale = Math.max(10, s.morale - 15);
            }
        }

        // ─── WRAP + STATS ─────────────────────────────────────────

        /**
         * Obalí Army instanci, přidá combat-only vlastnosti.
         */
        _wrapArmy(army) {
            const wrapped = Object.create(army);
            wrapped.totalHp     = this._calcTotalHp(army);
            wrapped.hp          = wrapped.totalHp;
            wrapped.morale      = MORALE_BASE;
            wrapped.alive       = true;
            wrapped.fled        = false;

            // Přidej metodu pro přepočet po ztrátách
            wrapped._recalcStats = () => {
                wrapped.totalHp      = this._calcTotalHp(wrapped);
                wrapped.totalAttack  = this._calcStat(wrapped, 'attack');
                wrapped.totalDefense = this._calcStat(wrapped, 'defense');
            };

            return wrapped;
        }

        _calcTotalHp(army) {
            let total = 0;
            for (const [unitType, count] of Object.entries(army.units)) {
                const def = (typeof UNIT_DEFINITIONS !== 'undefined') ? UNIT_DEFINITIONS[unitType] : null;
                total += (def?.stats?.hp || 10) * count;
            }
            return Math.max(1, total);
        }

        _calcStat(army, stat) {
            let total = 0;
            for (const [unitType, count] of Object.entries(army.units)) {
                const def = (typeof UNIT_DEFINITIONS !== 'undefined') ? UNIT_DEFINITIONS[unitType] : null;
                total += (def?.stats?.[stat] || 1) * count;
            }
            return total;
        }

        _snapshot(army) {
            return {
                name:    army.name,
                ownerId: army.ownerId,
                hp:      army.hp,
                totalHp: army.totalHp,
                morale:  army.morale,
                alive:   army.alive,
                fled:    army.fled,
                units:   { ...army.units },
                attack:  army.totalAttack,
                defense: army.totalDefense,
            };
        }

        // ─── SIMULACE (CELÁ BITVA NAJEDNOU) ──────────────────────

        /**
         * Odsimuluje celou bitvu najednou (pro AI nebo unit testy).
         * @param {number} maxDays - ochrana před nekonečnou smyčkou
         * @returns {Object} výsledek
         */
        simulate(maxDays = 30) {
            this.start();
            let result;
            for (let d = 0; d < maxDays; d++) {
                result = this.tick();
                if (result.over) break;
            }
            return { winner: this.winner, days: this.day, log: this.log };
        }
    };

    // ─── HELPER: Spuštění bitvy z GameManageru ────────────────────

    /**
     * Napojení do herního cyklu:
     *
     * V GameManager._endDay() přidej:
     *   for (const battle of this.activeBattles) {
     *       const result = battle.tick();
     *       if (result.over) this._resolveBattle(battle);
     *   }
     *
     * Při střetu armád na stejném hexu:
     *   const battle = new Combat.Battle([armyA, armyB], {
     *       terrain: Terrain[hex.terrain]?.type || 'grass',
     *       onRoundEnd: (log) => socket.emit('BattleUpdate', log),
     *       onBattleEnd: (res) => socket.emit('BattleEnd', res)
     *   });
     *   battle.start();
     *   this.activeBattles.push(battle);
     */
    exports.startBattle = function startBattle(armies, hex, callbacks = {}) {
        const terrainName = (typeof Terrain !== 'undefined')
            ? Terrain[hex?.terrain]?.type || 'grass'
            : 'grass';

        const battle = new exports.Battle(armies, {
            terrain:      terrainName,
            onRoundEnd:   callbacks.onRoundEnd   || (() => {}),
            onBattleEnd:  callbacks.onBattleEnd  || (() => {})
        });

        battle.start();
        return battle;
    };

})(typeof exports === 'undefined' ? this['Combat'] = {} : exports);
