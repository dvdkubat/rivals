/**
 * Client-side compact map loader.
 *
 * Loads the server payload from /api/maps/:mapId and rebuilds the runtime
 * Point[][] grid asynchronously. The large legacy grid.js file is no longer
 * loaded by the page.
 */
(function (exports) {
  exports.loadFromUrl = function loadFromUrl(url, options = {}) {
    return fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`Map request failed: ${response.status}`);
        return response.json();
      })
      .then(payload => exports.load(payload, options));
  };

  exports.load = function load(payload, options = {}) {
    const decoded = decode(payload);
    const meta = decoded.meta;
    const rawGrid = decoded.rawGrid;

    if (typeof hexSize !== 'undefined') hexSize = meta.hexSize || hexSize;
    if (typeof direction !== 'undefined') direction = meta.direction || direction;

    grid = buildGrid(rawGrid, meta);

    if (options.display && typeof options.display.resizeToMap === 'function') {
      options.display.resizeToMap(meta);
    }

    if (typeof options.onReady === 'function') options.onReady(grid, meta);
    return { grid, meta };
  };

  exports.migrateLegacy = function migrateLegacy(legacyGrid, meta = {}) {
    const rows = legacyGrid.length;
    const cols = legacyGrid[0] ? legacyGrid[0].length : 0;
    const packed = new Uint8Array(rows * cols);
    const actions = [];
    const castles = [];

    for (let r = 0; r < rows; r++) {
      for (let q = 0; q < cols; q++) {
        const cell = legacyGrid[r][q] || {};
        const terrain = (cell.terrain || 0) & 0x0F;
        const activity = (cell.activity || 0) & 0x0F;
        packed[r * cols + q] = (terrain << 4) | activity;

        if (cell.action) {
          const entry = Object.assign({ q, r }, cell.action);
          if (cell.action.castle !== undefined) castles.push(entry);
          else actions.push(entry);
        }
      }
    }

    return {
      meta: {
        cols,
        rows,
        hexSize: meta.hexSize || 16,
        direction: meta.direction || 'flat',
        bgImage: meta.bgImage || 'zelda'
      },
      cells: uint8ToBase64(packed),
      actions,
      castles
    };
  };

  function decode(payload) {
    const meta = payload.meta || {};
    const cols = meta.cols || 0;
    const rows = meta.rows || 0;
    const packed = base64ToUint8(payload.cells || '');
    const rawGrid = [];

    for (let r = 0; r < rows; r++) {
      rawGrid[r] = [];
      for (let q = 0; q < cols; q++) {
        const byte = packed[r * cols + q] || 0;
        rawGrid[r][q] = {
          q,
          r,
          terrain: (byte >> 4) & 0x0F,
          activity: byte & 0x0F,
          action: null
        };
      }
    }

    (payload.actions || []).forEach(action => {
      if (rawGrid[action.r] && rawGrid[action.r][action.q]) {
        const data = Object.assign({}, action);
        delete data.q;
        delete data.r;
        rawGrid[action.r][action.q].action = data;
      }
    });

    (payload.castles || []).forEach(castle => {
      if (rawGrid[castle.r] && rawGrid[castle.r][castle.q]) {
        const data = Object.assign({}, castle);
        delete data.q;
        delete data.r;
        rawGrid[castle.r][castle.q].action = data;
      }
    });

    return { meta, rawGrid };
  }

  function buildGrid(rawGrid, meta) {
    const rows = meta.rows || rawGrid.length;
    const cols = meta.cols || (rawGrid[0] ? rawGrid[0].length : 0);
    const hs = meta.hexSize || 16;
    const dir = meta.direction || 'flat';
    const hexWidth = dir === 'flat' ? Math.sqrt(3) * hs : 2 * hs;
    const hexHeight = dir === 'flat' ? 2 * hs : Math.sqrt(3) * hs;
    const PointCtor = (typeof Point !== 'undefined' && Point.Point) ? Point.Point : null;
    const result = [];

    for (let r = 0; r < rows; r++) {
      result[r] = [];
      for (let q = 0; q < cols; q++) {
        const raw = rawGrid[r] && rawGrid[r][q]
          ? rawGrid[r][q]
          : { terrain: 0, activity: 0, action: null };
        const x = dir === 'flat'
          ? q * hexWidth + (r % 2 ? hexWidth / 2 : 0)
          : q * hexWidth * 0.75;
        const y = dir === 'flat'
          ? r * hexHeight * 0.75
          : r * hexHeight + (q % 2 ? hexHeight / 2 : 0);

        result[r][q] = PointCtor
          ? new PointCtor(x, y, raw.action, raw.activity, raw.terrain, q, r)
          : { x, y, action: raw.action, activity: raw.activity, terrain: raw.terrain, q, r };
      }
    }

    return result;
  }

  function base64ToUint8(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function uint8ToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
})(typeof exports === 'undefined' ? this['MapLoader'] = {} : exports);
