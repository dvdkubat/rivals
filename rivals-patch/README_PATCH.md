# Rivals — Patch Balík

Kompletní sada nových a opravených souborů. Stačí nakopírovat do projektu,
provést 3 drobné úpravy v existujících souborech a spustit.

---

## Struktura balíku

```
rivals-patch/
├── app.js                          ← nahradí kořenový app.js
├── scripts/
│   ├── server.js                   ← nahradí scripts/server.js
│   ├── serverLobby.js              ← nahradí scripts/serverLobby.js
│   ├── mapData.js                  ← NOVÝ (server-side komprese mapy)
│   └── serverMap.js                ← NOVÝ (správa map souborů)
├── client/
│   ├── index_patch.ejs             ← DIFF pro client/index.ejs (viz krok 3)
│   └── js/
│       ├── index.js                ← nahradí client/js/index.js
│       ├── i18n.js                 ← NOVÝ (klientský překlad bez reloadu)
│       ├── army.js                 ← NOVÝ (armáda na mapě)
│       ├── gameManager.js          ← NOVÝ (herní cyklus, tahy, dny)
│       ├── mapLoader.js            ← NOVÝ (načítání mapy ze serveru)
│       ├── mapController.js        ← NOVÝ (klikání, pathfinding, pohyb)
│       └── shr/
│           └── combat.js           ← NOVÝ (battle simulátor)
└── locales/
    └── en.json                     ← nahradí locales/en.json (kompletní překlad)
```

---

## Instalace (5 kroků)

### Krok 1 — Nakopíruj soubory

Zkopíruj celý obsah tohoto balíku do kořene projektu.
Soubory se stejným názvem **přepíší** origináty — doporučuji zálohu.

```bash
cp -r rivals-patch/* .
```

### Krok 2 — Jednorázová migrace mapy

Starý `client/js/grid.js` je obrovský (~700 KB). Tento krok ho převede
na komprimovaný formát (~14 KB) a uloží do `data/map_zelda.json`.

V `app.js` dočasně odkomentuj tento řádek (je tam připravený):
```js
// mapManager.convertAndSave('./client/js/grid.js', 'zelda', { hexSize: 16, direction: 'flat' });
```
Spusť server (`npm start`), zkontroluj že vznikl soubor `data/map_zelda.json`,
pak řádek znovu zakomentuj.

### Krok 3 — Uprav client/index.ejs

Otevři `client/index.ejs` a proveď tyto 3 změny:

**a) Nahraď `<head>` blok script tagů** podle `client/index_patch.ejs`
(správné pořadí skriptů + i18n.js jako první)

**b) Přidej atributy do `<body>` tagu:**
```html
<!-- PŘED: -->
<body class="game-bg" style="color: black;">

<!-- PO: -->
<body class="game-bg" style="color: black;"
      data-lobby-id="<%= lobbyId || '' %>"
      data-lang="<%= lang || 'cs' %>">
```

**c) Přidej lang switcher** (kdekoliv v HTML, doporučeně hned za `<body>`):
```html
<div style="position: fixed; top: 8px; right: 8px; z-index: 999;">
  <select id="lang-switcher" onchange="I18n.setLang(this.value)"
          style="font-size: 16px; border-radius: 4px; padding: 2px 4px;">
    <option value="cs" <%= (lang === 'cs' ? 'selected' : '') %>>🇨🇿</option>
    <option value="en" <%= (lang === 'en' ? 'selected' : '') %>>🇬🇧</option>
  </select>
</div>
```

### Krok 4 — Nainstaluj závislosti (pokud jsi ještě neaktualizoval)

```bash
npm install
```
Závislosti se nezměnily — express, ejs, socket.io.

### Krok 5 — Spusť a otestuj

```bash
npm start
```

---

## Co bylo opraveno / přidáno

### Bugy
| Soubor | Problém | Oprava |
|--------|---------|--------|
| `scripts/server.js` | `playerSocketList.splice(index, 1)` přiřazením smazalo celý seznam | Odstraněno přiřazení, přidán null-check |
| `scripts/server.js` | `disconnect()` a `leave()` dělaly totéž, ale každá jinak | Sjednoceno — `disconnect()` deleguje na `leave()` |
| `scripts/serverLobby.js` | `socketList` bylo pole → hledání při odpojeníO(n) smyčkou | Nahrazeno `Map` → O(1) lookup |
| `app.js` | `Proxy` byl vytvářen 3× pro totéž | Jeden `createProxy()` helper |
| `app.js` | `loadPartials` používal async `ejs.renderFile` synchronně | Nahrazeno sync `ejs.render` + `fs.readFileSync` |
| `app.js` | Lobby ověřováno proti hardcoded `Set` | Dynamicky proti `server.lobbies` |

### Nové funkce
| Co | Jak použít |
|----|-----------|
| **URL přepínání jazyka** | `/?lang=en` nebo `/lobby123?lang=en` |
| **Překlad bez reloadu** | `I18n.setLang('en')` nebo lang switcher select |
| **URL auto-join** | Otevři `/:lobbyId` — automaticky se připojíš |
| **Komprimovaná mapa** | Server posílá ~14 KB místo ~700 KB |
| **Herní cyklus** | `GameManager` — tahy, dny, produkce |
| **Armáda na mapě** | `Army` — pohyb, BFS dosah, inventář |
| **MapController** | Klikání na canvas, A* path, highlight, animace |
| **Combat prototyp** | `Combat.Battle` — vícedenní boj 2-3 armád |

---

## Přidání překladu do šablon (doporučeno postupně)

Pro každý viditelný text v EJS přidej `data-i18n` atribut.
Text se při server-side renderu zobrazí česky (fallback),
při přepnutí jazyka klientem se přeloží bez reloadu.

```html
<!-- Před -->
<button onclick="UserEvent('btnPlay')">Hrát</button>

<!-- Po -->
<button onclick="UserEvent('btnPlay')" data-i18n="play">Hrát</button>
```

Klíče jsou definovány v `locales/cs.json` a `locales/en.json`.

---

## Workflow pro TODO metody

Kdykoli napíšeš:
```js
// todo - metoda která načte armády ze serveru a přidá je do gridu
loadArmies(data) {

}
```
Stačí mi ukázat soubor nebo vložit kontext a pomůžu metodu implementovat,
optimalizovat nebo propojit s okolním kódem.
