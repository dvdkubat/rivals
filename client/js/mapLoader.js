/**
 * mapLoader.js  —  CLIENT-SIDE
 * 
 * Přijme komprimovaný payload ze serveru (nebo z data/map_*.json)
 * a vygeneruje plnohodnotný grid[][] s Point objekty.
 * 
 * Výsledek je kompatibilní s mapa.js — přepíše globální `grid`,
 * nastaví canvas rozměry a volá drawHexGrid().
 * 
 * Závislosti:
 *   - Point třída (z world.js nebo const.js)
 *   - Terrain[] (z const.js)
 *   - canvas, ctx (globální z mapa.js)
 *   - bgImage (globální Image)
 * 
 * Použití:
 *   // Po přijetí dat ze socketu:
 *   socket.on('MapData', (payload) => {
 *       MapLoader.load(payload, { onReady: () => { ... } });
 *   });
 *   
 *   // Nebo přímo ze souboru (fetch):
 *   MapLoader.loadFromUrl('/data/map_zelda.json', { onReady });
 */

(function (exports) {

    /**
     * Hlavní vstupní bod — načte payload, sestaví grid, vykreslí mapu.
     * 
     * @param {Object}   payload     - výstup z MapData.encode()
     * @param {Object}   options
     * @param {Function} options.onReady     - callback po dokončení (grid je připraven)
     * @param {Function} options.onProgress  - volitelný progress callback (0-1)
     */
    exports.load = function load(payload, options = {}) {
        const { meta, rawGrid } = _decode(payload);
        const onReady = options.onReady || (() => {});

        // Nastav globální parametry (kompatibilita s mapa.js)
        _applyMeta(meta);

        // Sestav grid s Point objekty
        const generatedGrid = _buildGrid(rawGrid, meta);

        // Přepiš globální grid
        grid = generatedGrid;

        // Pokud bg obrázek ještě není načten, počkáme
        if (bgImage && bgImage.complete) {
            _finalizeCanvas(meta);
            onReady(grid);
        } else if (bgImage) {
            bgImage.onload = () => {
                _finalizeCanvas(meta);
                onReady(grid);
            };
        } else {
            // Bez bg image — canvas podle počtu hexů
            _setCanvasByGrid(meta);
            onReady(grid);
        }
    };

    /**
     * Načte mapu přímo z JSON souboru (dev/singleplayer).
     */
    exports.loadFromUrl = function loadFromUrl(url, options = {}) {
        fetch(url)
            .then(r => r.json())
            .then(payload => exports.load(payload, options))
            .catch(err => console.error('[MapLoader] Chyba načítání mapy:', err));
    };

    /**
     * Konverze starého gridData[] na nový formát — migrační nástroj.
     * Spusť jednorázově z konzole prohlížeče:
     *   MapLoader.migrateLegacy(gridData, { hexSize: 16, direction: 'flat' })
     * Vrátí JSON string, který ulož jako data/map_zelda.json
     */
    exports.migrateLegacy = function migrateLegacy(legacyGrid, meta = {}) {
        const rows = legacyGrid.length;
        const cols = legacyGrid[0]?.length || 0;
        const actions = [];
        const castles = [];
        const packed = new Uint8Array(rows * cols);

        for (let r = 0; r < rows; r++) {
            for (let q = 0; q < cols; q++) {
                const cell = legacyGrid[r][q] || {};
                const terrain  = (cell.terrain  || 0) & 0x0F;
                const activity = (cell.activity || 0) & 0x0F;
                packed[r * cols + q] = (terrain << 4) | activity;

                if (cell.action) {
                    const entry = { q, r, ...cell.action };
                    if (cell.action.castle !== undefined) castles.push(entry);
                    else actions.push(entry);
                }
            }
        }

        const binary = Array.from(packed).map(b => String.fromCharCode(b)).join('');
        const base64 = btoa(binary);

        const payload = {
            meta: {
                cols,
                rows,
                hexSize:   meta.hexSize   || hexSize   || 16,
                direction: meta.direction || direction || 'flat',
                bgImage:   meta.bgImage   || 'zelda'
            },
            cells: base64,
            actions,
            castles
        };

        const json = JSON.stringify(payload, null, 2);
        console.log('[MapLoader] Migrace dokončena. Zkopíruj JSON níže nebo stáhni:');
        console.log(json);

        // Ke stažení
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'map_migrated.json';
        a.click();

        return payload;
    };

    // ─── INTERNALS ────────────────────────────────────────────────

    function _decode(payload) {
        const { meta, cells, actions = [], castles = [] } = payload;
        const { cols, rows } = meta;

        // Base64 → Uint8Array
        const binary = atob(cells);
        const packed  = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) packed[i] = binary.charCodeAt(i);

        // Rozbal do rawGrid
        const rawGrid = [];
        for (let r = 0; r < rows; r++) {
            rawGrid[r] = [];
            for (let q = 0; q < cols; q++) {
                const byte     = packed[r * cols + q] || 0;
                rawGrid[r][q]  = {
                    terrain:  (byte >> 4) & 0x0F,
                    activity:  byte & 0x0F,
                    q, r,
                    action: null
                };
            }
        }

        // Vrať akce
        for (const a of actions) {
            if (rawGrid[a.r]?.[a.q]) {
                const { q, r, ...data } = a;
                rawGrid[a.r][a.q].action = data;
            }
        }
        for (const c of castles) {
            if (rawGrid[c.r]?.[c.q]) {
                rawGrid[c.r][c.q].action = { castle: c.castle, ownerId: c.ownerId || null };
            }
        }

        return { meta, rawGrid };
    }

    /**
     * Sestaví grid[][] s plnohodnotnými Point objekty.
     * x, y souřadnice se dopočítají z q, r — nikdy se neukládají.
     */
    function _buildGrid(rawGrid, meta) {
        const { cols, rows, hexSize: hs, direction: dir } = meta;
        const hexWidth  = dir === 'flat' ? Math.sqrt(3) * hs : 2 * hs;
        const hexHeight = dir === 'flat' ? 2 * hs : Math.sqrt(3) * hs;

        const result = [];

        for (let r = 0; r < rows; r++) {
            result[r] = [];
            for (let q = 0; q < cols; q++) {
                const raw = rawGrid[r]?.[q] || { terrain: 0, activity: 0, q, r, action: null };

                // Výpočet pixelových souřadnic středu hexu
                let x, y;
                if (dir === 'flat') {
                    x = q * hexWidth + (r % 2 ? hexWidth / 2 : 0);
                    y = r * hexHeight * 0.75;
                } else {
                    x = q * hexWidth * 0.75;
                    y = r * hexHeight + (q % 2 ? hexHeight / 2 : 0);
                }

                // Vytvoř Point objekt
                // Point(x, y, action, activity, terrain, q, r)
                const point = new Point(x, y, raw.action, raw.activity, raw.terrain, q, r);
                result[r][q] = point;
            }
        }

        return result;
    }

    function _applyMeta(meta) {
        // Přepiš globální proměnné (kompatibilita s mapa.js)
        if (typeof hexSize !== 'undefined')  hexSize  = meta.hexSize;
        if (typeof direction !== 'undefined') direction = meta.direction;
    }

    function _finalizeCanvas(meta) {
        if (typeof canvas === 'undefined' || !canvas) return;
        if (typeof bgImage !== 'undefined' && bgImage?.complete && bgImage.naturalWidth > 0) {
            canvas.width  = bgImage.width  || bgImage.naturalWidth;
            canvas.height = bgImage.height || bgImage.naturalHeight;
        } else {
            _setCanvasByGrid(meta);
        }

        if (typeof maxCapX !== 'undefined') {
            maxCapX = canvas.width  - (window.innerWidth  || 1200) + 324;
            maxCapY = canvas.height - (window.innerHeight || 900)  + 4;
        }
    }

    function _setCanvasByGrid(meta) {
        if (typeof canvas === 'undefined' || !canvas) return;
        const hs = meta.hexSize || 16;
        const dir = meta.direction || 'flat';
        const hexW = dir === 'flat' ? Math.sqrt(3) * hs : 2 * hs;
        const hexH = dir === 'flat' ? 2 * hs : Math.sqrt(3) * hs;
        canvas.width  = meta.cols * hexW + hexW / 2;
        canvas.height = meta.rows * hexH * 0.75 + hexH * 0.25;
    }

})(typeof exports === 'undefined' ? this['MapLoader'] = {} : exports);
