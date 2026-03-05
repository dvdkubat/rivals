/**
 * app.js
 * Inicializace serveru, HTTP routes, socket komunikace.
 * 
 * Opravy:
 *  - Proxy a loadPartials sdílí jeden helper createProxy() — bez duplikace
 *  - Lang se předává do šablony (klient si ho uloží a může přepínat)
 *  - Fallback: cs.json se načte vždy, en.json ho přepíše jen kde má hodnoty
 *  - URL /:lobbyId dynamicky ověřuje existenci lobby v server.lobbies (ne hardcoded Set)
 *  - Přidána route GET /api/lobbies pro klientský fetch
 *  - Přidána route GET /api/lang/:lang pro překlad bez reloadu
 */

const express = require('express');
const app     = express();
const ejs     = require('ejs');
const fs      = require('fs');
const path    = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'client'));
app.use('/client', express.static(path.join(__dirname, 'client')));

// ─── KONFIGURACE ─────────────────────────────────────────────

const DEFAULT_LANG    = 'cs';
const SUPPORTED_LANGS = ['cs', 'en'];          // snadné rozšíření
const missingKeys     = {};                    // logování chybějících klíčů

const gameData = JSON.parse(fs.readFileSync('./data/races.json', 'utf8'));

// ─── PŘEKLADY ────────────────────────────────────────────────

/**
 * Načte překlady pro daný jazyk s fallbackem na cs.
 * Výsledek = cs.json přepsaný klíči z lang.json (pokud existují a jsou neprázdné).
 */
function loadTranslations(lang = DEFAULT_LANG) {
  const base    = _readLocale(DEFAULT_LANG);        // vždy cs jako základ
  if (lang === DEFAULT_LANG) return base;

  const overlay = _readLocale(lang);                // en přepíše jen existující klíče
  return { ...base, ...Object.fromEntries(
    Object.entries(overlay).filter(([, v]) => v !== '')
  )};
}

function _readLocale(lang) {
  const file = path.join(__dirname, 'locales', `${lang}.json`);
  if (!fs.existsSync(file)) {
    console.warn(`⚠️  Překlad ${lang}.json nenalezen.`);
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    console.warn(`❗  Chyba v JSON ${lang}.json:`, err.message);
    return {};
  }
}

/**
 * Vytvoří Proxy nad překladem — chybějící klíče zaloguje a vrátí klíč samotný
 * (místo "<%= key %>" které by prošlo do HTML).
 */
function createProxy(translations, lang) {
  return new Proxy(translations, {
    get(target, prop) {
      if (typeof prop !== 'string') return target[prop]; // Symbol apod.
      if (prop in target) return target[prop];

      // Chybějící klíč — zaloguj jednou
      if (!missingKeys[lang]) missingKeys[lang] = {};
      if (!missingKeys[lang][prop]) {
        missingKeys[lang][prop] = true;
        console.warn(`[i18n] Chybí klíč "${prop}" v ${lang}.json`);
      }
      return prop; // vrátíme klíč jako fallback (ne EJS syntax)
    }
  });
}

/**
 * Renderuje všechny EJS partialy s daným překladem.
 */
function loadPartials(translations, lang) {
  const html        = {};
  const partialsDir = path.join(__dirname, 'client', 'partials');
  if (!fs.existsSync(partialsDir)) return html;

  const proxy = createProxy(translations, lang);

  const files = fs.readdirSync(partialsDir).filter(f => f.endsWith('.ejs'));
  for (const file of files) {
    const name     = path.basename(file, '.ejs');
    const filePath = path.join(partialsDir, file);
    try {
      // Synchronní render — ejs.renderFile s callbackem je zbytečně async zde
      html[name] = ejs.render(fs.readFileSync(filePath, 'utf-8'), { text: proxy });
    } catch (err) {
      console.error(`❌  Chyba v partialu "${file}":`, err.message);
      html[name] = `<!-- error in ${file} -->`;
    }
  }
  return html;
}

// ─── HELPER: sestavení dat pro render ───────────────────────

function buildRenderData(lang, lobbyId = null) {
  const safeLang     = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  const translations = loadTranslations(safeLang);
  const proxy        = createProxy(translations, safeLang);
  const html         = loadPartials(translations, safeLang);

  return {
    text:    proxy,
    html,
    lang:    safeLang,
    lobbyId: lobbyId || null
  };
}

// ─── HELPER: detekce jazyka z požadavku ──────────────────────

function detectLang(req) {
  // 1. URL param ?lang=en  (nejvyšší priorita)
  if (req.query.lang && SUPPORTED_LANGS.includes(req.query.lang))
    return req.query.lang;

  // 2. Cookie (klient si ho uložil při přepnutí)
  const cookie = req.headers.cookie
    ?.split(';')
    .map(c => c.trim().split('='))
    .find(([k]) => k === 'lang');
  if (cookie && SUPPORTED_LANGS.includes(cookie[1]))
    return cookie[1];

  // 3. Accept-Language header (prohlížeč)
  const accept = req.headers['accept-language'] || '';
  const preferred = accept.split(',')[0]?.split('-')[0]?.toLowerCase();
  if (preferred && SUPPORTED_LANGS.includes(preferred))
    return preferred;

  return DEFAULT_LANG;
}

// ─── ROUTES ──────────────────────────────────────────────────

// Hlavní stránka
app.get('/', (req, res) => {
  const lang = detectLang(req);
  res.render('index', buildRenderData(lang));
});

// API: vrátí JSON překlad (klient může přepínat jazyk bez reloadu)
app.get('/api/lang/:lang', (req, res) => {
  const lang = SUPPORTED_LANGS.includes(req.params.lang)
    ? req.params.lang
    : DEFAULT_LANG;
  res.json(loadTranslations(lang));
});

// API: seznam aktivních lobbies (pro refresh v klientu)
app.get('/api/lobbies', (req, res) => {
  res.json(server.getLobbies());
});

// URL přímé připojení do lobby: /AbCdEfGh nebo /AbCdEfGh?lang=en
app.get('/:lobbyId', (req, res) => {
  const lobbyId = req.params.lobbyId;
  const lang    = detectLang(req);

  // Ověř existenci lobby dynamicky — ne hardcoded Set!
  const exists = server && server.lobbies && server.lobbies[lobbyId] !== undefined;
  if (!exists) {
    return res.status(404).send(
      `<h2>❌ Lobby <code>${lobbyId}</code> nenalezena.</h2>` +
      `<a href="/">← Zpět na hlavní stránku</a>`
    );
  }

  const data = buildRenderData(lang, lobbyId);
  res.render('index', data);
});

// ─── SERVER SETUP ─────────────────────────────────────────────

const _server = require('http').Server(app);
_server.listen(process.env.PORT || 2000, () => {
  console.log(`🚀  Server běží na portu ${process.env.PORT || 2000}`);
});

// ─── SOCKET.IO ───────────────────────────────────────────────

const io = require('socket.io')(_server, {});

io.sockets.on('connection', function (socket) {

  console.log('🔌  Socket připojen:', socket.id);

  socket.on('disconnect', function () {
    // disconnect = náhlé přerušení (zavření tabu, výpadek sítě)
    server.disconnect(socket.id);
  });

  socket.on('Connect', function (savedId) {
    // Explicitní handshake od klienta (po načtení stránky)
    const newId = server.connect(savedId, socket);
    socket.emit('OnConnect', newId);
  });

  socket.on('ShowGameList', function () {
    socket.emit('OnShowGameList', server.getLobbies());
  });

  socket.on('JoinGame', function (data) {
    socket.emit('OnJoinGame', server.join(socket, data));
  });

  // Přímé připojení přes URL /:lobbyId — klient pošle lobbyId ihned po Connect
  socket.on('JoinByUrl', function (data) {
    // data = { lobbyId, pass, name }
    const result = server.join(socket, { connect: data.lobbyId, pass: data.pass || '', name: data.name || 'Hráč' });
    socket.emit('OnJoinGame', result);
  });

  socket.on('CreateLobby', function (data) {
    server.createGame(data);
    socket.emit('OnCreateLobby', server.getLobbies());
  });

  socket.on('Ready', function (data) {
    server.ready(socket.id, data);
  });

  socket.on('StartLobby', function (data) {
    server.startLoby(data);
  });

  socket.on('Leave', function () {
    server.leave(socket.id);
  });

  socket.on('LobbyMessage', function (data) {
    server.LobbyMessage(socket.id, data);
  });

});

// ─── GAME SERVER ──────────────────────────────────────────────

var server = new (require('./scripts/server')).server(gameData);
server.createGame({ pass: '', name: 'Svět 1', max: 4, map: 'zelda' });
