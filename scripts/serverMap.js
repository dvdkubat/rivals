/**
 * serverMap.js  —  SERVER-SIDE
 * 
 * Načítá komprimované mapy ze souborů, cachuje je,
 * posílá klientům při připojení do lobby.
 * 
 * Integrace do serverLobby.js:
 *   const ServerMap = require('./serverMap');
 *   const map = new ServerMap.MapManager('./data');
 * 
 *   // Při startu lobby:
 *   const payload = await map.getMap('zelda');
 *   socket.emit('MapData', payload);
 */

const fs   = require('fs');
const path = require('path');

// Načti mapData pro encode/decode
let MapData;
try {
    MapData = require('./mapData');
} catch(e) {
    console.warn('[ServerMap] mapData.js nenalezen, migrace nebude dostupná');
}

(function (exports) {

    exports.MapManager = class MapManager {

        /**
         * @param {string} dataDir - složka kde jsou uloženy map_*.json soubory
         */
        constructor(dataDir = './data') {
            this.dataDir = dataDir;
            this._cache  = new Map(); // mapId → payload (in-memory cache)
        }

        /**
         * Vrátí komprimovaný payload mapy.
         * Načte ze souboru při prvním zavolání, pak servíruje z cache.
         * 
         * @param {string} mapId   - např. 'zelda', 'desert', ...
         * @returns {Object|null}  payload pro socket emit
         */
        getMap(mapId) {
            if (this._cache.has(mapId)) {
                return this._cache.get(mapId);
            }

            const filePath = path.join(this.dataDir, `map_${mapId}.json`);

            if (!fs.existsSync(filePath)) {
                console.warn(`[ServerMap] Mapa '${mapId}' nenalezena: ${filePath}`);
                return null;
            }

            try {
                const raw     = fs.readFileSync(filePath, 'utf8');
                const payload = JSON.parse(raw);
                this._cache.set(mapId, payload);
                console.log(`[ServerMap] Mapa '${mapId}' načtena (${Math.round(raw.length / 1024)} KB)`);
                return payload;
            } catch (err) {
                console.error(`[ServerMap] Chyba načítání mapy '${mapId}':`, err.message);
                return null;
            }
        }

        /**
         * Konvertuje starý grid.js na nový formát a uloží ho.
         * Spusť jednorázově z Node.js konzole nebo jako skript.
         * 
         * @param {string} legacyGridPath  - cesta k starému grid.js
         * @param {string} mapId           - výsledný soubor: map_{mapId}.json
         * @param {Object} meta            - { hexSize, direction, bgImage }
         */
        convertAndSave(legacyGridPath, mapId, meta = {}) {
            if (!MapData) {
                console.error('[ServerMap] mapData.js je potřeba pro konverzi');
                return;
            }

            // Načti starý grid.js — extrahuj gridData proměnnou
            const content = fs.readFileSync(legacyGridPath, 'utf8');

            // Odstraň "let gridData =" prefix a parsuj
            const jsonStart = content.indexOf('[');
            if (jsonStart === -1) {
                console.error('[ServerMap] Nelze najít gridData v souboru');
                return;
            }

            const jsonStr    = content.slice(jsonStart);
            let legacyGrid;
            try {
                legacyGrid = JSON.parse(jsonStr);
            } catch (e) {
                console.error('[ServerMap] JSON parse error:', e.message);
                return;
            }

            const finalMeta = {
                hexSize:   meta.hexSize   || 16,
                direction: meta.direction || 'flat',
                bgImage:   meta.bgImage   || mapId
            };

            const payload   = MapData.convertLegacyGrid(legacyGrid, finalMeta);
            const outPath   = path.join(this.dataDir, `map_${mapId}.json`);
            const json      = JSON.stringify(payload); // minified pro produkci

            fs.writeFileSync(outPath, json, 'utf8');

            const origSize = Buffer.byteLength(content, 'utf8');
            const newSize  = Buffer.byteLength(json,    'utf8');
            const ratio    = Math.round((1 - newSize / origSize) * 100);

            console.log(`[ServerMap] Mapa '${mapId}' uložena: ${outPath}`);
            console.log(`[ServerMap] Velikost: ${Math.round(origSize/1024)} KB → ${Math.round(newSize/1024)} KB (úspora ${ratio}%)`);

            this._cache.set(mapId, payload);
            return payload;
        }

        /** Odstraní mapu z cache (pro hot-reload při vývoji) */
        invalidate(mapId) {
            this._cache.delete(mapId);
        }

        /** Seznam dostupných map */
        listMaps() {
            return fs.readdirSync(this.dataDir)
                .filter(f => f.startsWith('map_') && f.endsWith('.json'))
                .map(f => f.replace('map_', '').replace('.json', ''));
        }
    };

})(typeof exports === 'undefined' ? this['ServerMap'] = {} : exports);

/**
 * ──────────────────────────────────────────────────────────────
 * INTEGRACE DO app.js / serverLobby.js
 * ──────────────────────────────────────────────────────────────
 * 
 * V app.js přidej:
 * 
 *   const { MapManager } = require('./scripts/serverMap');
 *   const mapManager = new MapManager('./data');
 * 
 *   // JEDNORÁZOVÁ MIGRACE (spusť jednou, pak odkomentuj):
 *   // mapManager.convertAndSave('./client/js/grid.js', 'zelda', { hexSize: 16, direction: 'flat' });
 * 
 * V serverLobby.js při startu hry (startGame nebo playerReady):
 * 
 *   startGame(mapId) {
 *       const payload = mapManager.getMap(mapId || 'zelda');
 *       if (payload) {
 *           this.send('MapData', payload);
 *       }
 *       this.send('GameStarted', this.packet(true));
 *   }
 * 
 * V clientLobby.js (socket listener):
 * 
 *   socket.on('MapData', (payload) => {
 *       MapLoader.load(payload, {
 *           onReady: (grid) => {
 *               console.log('[Client] Mapa načtena:', grid.length, 'řádků');
 *               client.lobby._initMapController();
 *               drawHexGrid();
 *           }
 *       });
 *   });
 */
