/**
 * mapData.js  —  SERVER-SIDE
 * 
 * Komprimovaný formát mapy pro přenos přes socket.
 * 
 * Místo ukládání x, y, g, h, f, parent pro každý hex (zbytečné)
 * ukládáme jen to co je unikátní a nelze dopočítat:
 *   terrain   (uint8, 0-3)
 *   activity  (uint8, 0-255)
 *   action    (null nebo { type, id } — POI, hrad, ...)
 * 
 * x, y se vždy dopočítají z q, r + hexSize + direction.
 * g, h, f, parent jsou runtime A* data — nikdy se neukládají.
 * 
 * Přenosový formát (JSON):
 * {
 *   meta: { cols, rows, hexSize, direction, bgImage },
 *   cells: "AABBCC..."   ← base64 nebo flat Uint8Array (terrain|activity packed)
 *   actions: [ { q, r, type, id }, ... ]   ← jen hexy s akcí (loot, hrad, boj)
 *   castles: [ { q, r, race, ownerId }, ... ]
 * }
 * 
 * Úspora: typická mapa 100×60 = 6000 hexů
 *   Starý formát:  6000 × ~120 bytes JSON = ~720 KB
 *   Nový formát:   6000 × 2 bytes + overhead = ~14 KB  (50× menší!)
 */

(function (exports) {

    /**
     * Zakóduje grid (2D pole Point objektů) do komprimovaného formátu.
     * Volá se na serveru při uložení nebo generování mapy.
     * 
     * @param {Point[][]} grid
     * @param {Object} meta  { hexSize, direction, bgImage }
     * @returns {Object} mapPayload
     */
    exports.encode = function encode(grid, meta = {}) {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;

        // Packed: každý hex = 2 bajty (terrain nibble + activity byte)
        // terrain: 4 bity (0-15), activity: 4 bity (0-15) → 1 byte na hex
        // Pokud chceš activity > 15, použij 2 bytes. Zatím 1 byte stačí.
        const packed = new Uint8Array(rows * cols);
        const actions = [];
        const castles = [];

        for (let r = 0; r < rows; r++) {
            for (let q = 0; q < cols; q++) {
                const point = grid[r][q];
                if (!point) continue;

                // Terrain (0-3) v horních 4 bitech, activity (0-15) v dolních 4 bitech
                const terrain  = (point.terrain  || 0) & 0x0F;
                const activity = (point.activity || 0) & 0x0F;
                packed[r * cols + q] = (terrain << 4) | activity;

                // Akce (jen hexy kde je něco zajímavého)
                if (point.action) {
                    const entry = { q, r, ...point.action };
                    if (point.action.castle !== undefined) {
                        castles.push(entry);
                    } else {
                        actions.push(entry);
                    }
                }
            }
        }

        // Base64 enkódování pro JSON přenos
        const base64 = _uint8ToBase64(packed);

        return {
            meta: {
                cols,
                rows,
                hexSize:   meta.hexSize   || 16,
                direction: meta.direction || 'flat',
                bgImage:   meta.bgImage   || 'zelda'
            },
            cells:   base64,
            actions,
            castles
        };
    };

    /**
     * Dekóduje payload zpět na pole čísel [terrain, activity] — 
     * samotné Point objekty vytvoří klient z mapLoader.js
     */
    exports.decode = function decode(payload) {
        const { meta, cells, actions, castles } = payload;
        const packed = _base64ToUint8(cells);
        const { cols, rows } = meta;

        // Rozbalit do 2D pole jednoduchých objektů
        const rawGrid = [];
        for (let r = 0; r < rows; r++) {
            rawGrid[r] = [];
            for (let q = 0; q < cols; q++) {
                const byte = packed[r * cols + q] || 0;
                rawGrid[r][q] = {
                    terrain:  (byte >> 4) & 0x0F,
                    activity: byte & 0x0F,
                    q, r,
                    action: null
                };
            }
        }

        // Vrátit akce na správná místa
        for (const a of (actions || [])) {
            if (rawGrid[a.r]?.[a.q]) {
                const { q, r, ...actionData } = a;
                rawGrid[a.r][a.q].action = actionData;
            }
        }
        for (const c of (castles || [])) {
            if (rawGrid[c.r]?.[c.q]) {
                const { q, r, ...castleData } = c;
                rawGrid[c.r][c.q].action = { castle: castleData.castle, ownerId: castleData.ownerId };
            }
        }

        return { meta, rawGrid };
    };

    /**
     * Konvertor: převede starý grid.js formát (array s x,y,g,h,f,parent...)
     * na nový komprimovaný payload. Použij jednorázově pro migraci.
     * 
     * Spusť v Node.js:
     *   const md = require('./mapData');
     *   const { gridData } = require('./client/js/grid.js'); // nebo načti soubor
     *   const payload = md.convertLegacyGrid(gridData, { hexSize: 16, direction: 'flat' });
     *   fs.writeFileSync('./data/map_zelda.json', JSON.stringify(payload));
     */
    exports.convertLegacyGrid = function convertLegacyGrid(legacyGrid, meta = {}) {
        // Starý grid má q=0, r=0 všude — musíme odvodit q,r z pozice v poli
        const fakeGrid = legacyGrid.map((row, r) =>
            row.map((cell, q) => ({
                terrain:  cell.terrain  || 0,
                activity: cell.activity || 0,
                action:   cell.action   || null,
                q, r
            }))
        );
        return exports.encode(fakeGrid, meta);
    };

    // ── Base64 helpers (Node.js i browser) ──────────────────────

    function _uint8ToBase64(uint8) {
        if (typeof Buffer !== 'undefined') {
            // Node.js
            return Buffer.from(uint8).toString('base64');
        }
        // Browser
        let binary = '';
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        return btoa(binary);
    }

    function _base64ToUint8(b64) {
        if (typeof Buffer !== 'undefined') {
            // Node.js
            const buf = Buffer.from(b64, 'base64');
            return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
        }
        // Browser
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

})(typeof exports === 'undefined' ? this['MapData'] = {} : exports);
