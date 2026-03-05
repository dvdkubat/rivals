/**
 * Inicializace serveru, kominikace servere a client + základní funkce pro ovládání (připojení, výber hry, ...)
 */

const { Console } = require('console');
var express = require('express');
var app = express();
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'client'));
app.use('/client', express.static(__dirname + '/client'));

const DEFAULT_LANG = 'cs';
const missingTranslations = {};
const gameData = JSON.parse(fs.readFileSync('./data/races.json', 'utf8'));
//console.log(gameData["races"][0]["name"]);

// ===== Načítání překladů =====
function loadTranslations(lang = DEFAULT_LANG) {
  const file = path.join(__dirname, 'locales', `${lang}.json`);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (err) {
      console.warn(`❗ Chyba v JSON ${lang}.json:`, err.message);
    }
  }
  console.warn(`⚠️ Překlad ${lang}.json nenalezen. Používám výchozí.`);
  return {}; // fallback: prázdný překlad
}

// ===== Načtení všech partial EJS šablon =====
function loadPartials(translations) {
  const html = {};
  const partialsDir = path.join(__dirname, 'client', 'partials');

  if (!fs.existsSync(partialsDir)) return html;

  const files = fs.readdirSync(partialsDir).filter(f => f.endsWith('.ejs'));
  for (const file of files) {
    const name = path.basename(file, '.ejs');
    try {


      // někde tady musím udělat ten profi fígl
      const translationProxy = new Proxy(translations, {
        get(target, prop) {
          if (prop in target) {
            return target[prop];
          } else {
            missingTranslations[prop] = `<%= ${prop} %>`;
            return `<%= ${prop} %>`;
          }
        }
      });

      ejs.renderFile(path.join(__dirname, 'client', 'partials', file), { text: translationProxy }, (err, renderedLobby) => {
        html[name] = renderedLobby;
      });
    } catch (err) {
      console.error(`❌ Chyba při načítání partialu "${file}":`, err.message);
    }
  }

  return html;
}

//načtení by šlo sloučit do jedné funkce - to url udělá navíc pouze nějaké drobnosti... musím vyvolat server.connect(id) --- časem?
// ===== Výchozí stránka (homepage) =====
app.get('/', (req, res) => {
  const lang = req.query.lang || DEFAULT_LANG;
  const translations = loadTranslations(lang);

  const translationProxy = new Proxy(translations, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      } else {
        missingTranslations[prop] = `<%= ${prop} %>`;
        return `<%= ${prop} %>`;
      }
    }
  });

  const html = loadPartials(translations);

  res.render('index', { text: translationProxy, html });

  if (Object.keys(missingTranslations).length > 0) {
    console.log(`\n[⚠️ Chybějící překlady pro jazyk "${lang}"]`);
    console.log(JSON.stringify(missingTranslations, null, 2));
  }

});

// ===== Zobrazení konkrétní lobby :: víceméně taky zobrazím domovskou stránku, ale můžu se pak přesměrovat na Lobby =====
const lobbies = new Set(['a45der', 'b89zty']);
app.get('/:lobbyId', (req, res) => {
  const lobbyId = req.params.lobbyId;
  const lang = req.query.lang || DEFAULT_LANG;

  if (!lobbies.has(lobbyId)) {
    return res.status(404).send(`<h2>❌ Lobby <code>${lobbyId}</code> nenalezena.</h2>`);
  }

  const translations = loadTranslations(lang);

  const translationProxy = new Proxy(translations, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      } else {
        missingTranslations[prop] = `<%= ${prop} %>`;
        return `<%= ${prop} %>`;
      }
    }
  });

  const html = loadPartials(translations, translationProxy);
  res.render('index', { text: translationProxy, lobbyId, html });

  if (Object.keys(missingTranslations).length > 0) {
    console.log(`\n[⚠️ Chybějící překlady pro jazyk "${lang}"]`);
    console.log(JSON.stringify(missingTranslations, null, 2));
  }

});



//////////// níž je to snad nějak ok neměnit


//gameData["races"][0]["name"]

// založení třídy pro server a tím volání základních funkcí a kontrol
var server = new (require("./scripts/server")).server(gameData);
// Výchozí servery pro testování
server.createGame({ pass: "", name: "Svet 1", max: 94, map: "zelda" });
// server.createGame({ pass: "deset", name: "Lasagne", max: 64 });

// // takže můžu jako JS i jako JSON, na clientovy to je : loadedVariables.INITIAL_PARAMETERS
//var DATA = require("./client/js/data");
// console.log(DATA.INITIAL_PARAMETERS)

// založení serveru a naslouchání na portu
var _server = require('http').Server(app);
_server.listen(process.env.PORT || 2000);

/**
 * Socket communication
 */
var io = require('socket.io')(_server, {});
// 2. na clientovi proběhlo socket = io(); >> vyvolá se connection
io.sockets.on('connection', function (socket) {
  socket.on('disconnect', function () { server.disconnect(socket.id) });

  console.log('Connected: ', socket.id);
  //  socket.emit('Connect', server.connect(socket.id));
  socket.on('Connect', function (id) { server.connect(id, socket) });



  /**
   * Get available Lobbies
   */
  socket.on('ShowGameList', function () { socket.emit('OnShowGameList', server.getLobbies()) });

  /**
   * Join seleted Lobby - OnJoinGame() menu.js 
   */
  socket.on('JoinGame', function (data) { socket.emit('OnJoinGame', server.join(socket, data)) });

  /**
   * Host game
   */
  socket.on('CreateLobby', function (data) { server.createGame(data); socket.emit('OnCreateLobby', server.getLobbies()); });

  /**
   * Player ready
   */
  socket.on('Ready', function (data) { server.ready(socket.id, data); });

  /**
   * Start game -- to by se asi mělo volat samo po nějaké době (případně až když jsou višchni ready !)
   */
  socket.on('StartLobby', function (data) { server.startLoby(data); });

  /**
   * Disconnect - Delete connection data 
   */
  socket.on('Leave', function (playerId) { server.leave(socket.id) });

  /**
   * General communication Client <> Server
   */
  socket.on('LobbyMessage', function (data) { server.LobbyMessage(socket.id, data) });

});



