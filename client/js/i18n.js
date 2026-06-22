/**
 * client/js/i18n.js
 * Klientský i18n systém.
 *
 * Funkce:
 *  - Načte překlad z /api/lang/:lang (JSON)
 *  - Aplikuje ho na DOM přes data-i18n atributy (bez reloadu stránky)
 *  - Uloží volbu do cookie a URL (lang query param se aktualizuje)
 *  - Při načtení stránky auto-detekuje jazyk z URL / cookie
 *  - Exportuje globální objekt `I18n` pro použití kdekoliv v kódu
 *
 * Použití v HTML:
 *   <button data-i18n="play">Hrát</button>
 *   <span data-i18n="player_name"></span>
 *
 * Použití v JS:
 *   I18n.t('play')           // → "Play" / "Hrát"
 *   I18n.setLang('en')       // přepne jazyk bez reloadu
 *   I18n.currentLang         // 'cs' | 'en'
 *
 * Přidání přepínače do HTML (kdekoliv):
 *   <select id="lang-switcher" onchange="I18n.setLang(this.value)">
 *     <option value="cs">🇨🇿 Čeština</option>
 *     <option value="en">🇬🇧 English</option>
 *   </select>
 */

const I18n = (function () {

  const SUPPORTED  = ['cs', 'en'];
  const DEFAULT    = 'cs';
  const COOKIE_KEY = 'lang';

  let _translations = {};   // { key: "přeložený text" }
  let _lang         = DEFAULT;
  let _callbacks    = [];   // funkce voláné po každé změně jazyka

  // ─── VEŘEJNÉ API ─────────────────────────────────────────────

  /**
   * Přeloží klíč. Pokud klíč chybí, vrátí klíč samotný (viditelný fallback).
   */
  function t(key) {
    return _translations[key] ?? key;
  }

  /**
   * Přepne jazyk — načte překlad ze serveru, aplikuje na DOM, uloží cookie + URL.
   */
  async function setLang(lang) {
    const safe = SUPPORTED.includes(lang) ? lang : DEFAULT;
    if (safe === _lang && Object.keys(_translations).length > 0) return; // nic nového

    try {
      const res  = await fetch(`/api/lang/${safe}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _translations = await res.json();
      _lang = safe;

      _applyToDOM();
      _saveCookie(safe);
      _updateUrl(safe);
      _syncSwitcher(safe);

      // Notifikuj ostatní části kódu (GameManager UI, lobby texty, ...)
      _callbacks.forEach(cb => cb(safe, _translations));

      console.log(`[i18n] Jazyk: ${safe} (${Object.keys(_translations).length} klíčů)`);
    } catch (err) {
      console.error('[i18n] Chyba načítání překladu:', err);
    }
  }

  /** Zaregistruj callback volaný po změně jazyka */
  function onChange(fn) {
    _callbacks.push(fn);
  }

  /** Aktuální jazyk */
  function currentLang() {
    return _lang;
  }

  // ─── INICIALIZACE ────────────────────────────────────────────

  /**
   * Zavolej jednou při startu aplikace.
   * Auto-detekuje jazyk z URL → cookie → Accept-Language → default.
   */
  async function init() {
    const lang = _detectLang();
    await setLang(lang);
  }

  function _detectLang() {
    // 1. URL query param ?lang=en
    const urlParam = new URLSearchParams(window.location.search).get('lang');
    if (urlParam && SUPPORTED.includes(urlParam)) return urlParam;

    // 2. Cookie
    const cookie = _readCookie(COOKIE_KEY);
    if (cookie && SUPPORTED.includes(cookie)) return cookie;

    // 3. Prohlížečový jazyk
    const browser = (navigator.language || '').split('-')[0].toLowerCase();
    if (SUPPORTED.includes(browser)) return browser;

    return DEFAULT;
  }

  // ─── DOM ─────────────────────────────────────────────────────

  /**
   * Přeloží všechny elementy s atributem data-i18n="klic".
   * Pro input placeholder: data-i18n-placeholder="klic"
   */
  function _applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = t(key);
    });

    // HTML lang atribut
    document.documentElement.lang = _lang;
  }

  function _syncSwitcher(lang) {
    const switcher = document.getElementById('lang-switcher');
    if (switcher) switcher.value = lang;
  }

  // ─── COOKIE ──────────────────────────────────────────────────

  function _saveCookie(lang) {
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_KEY}=${lang}; expires=${expires}; path=/; SameSite=Lax`;
  }

  function _readCookie(key) {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(key + '='))
      ?.split('=')[1] ?? null;
  }

  // ─── URL ──────────────────────────────────────────────────────

  /**
   * Aktualizuje ?lang= v URL bez reloadu stránky.
   */
  function _updateUrl(lang) {
    const url = new URL(window.location.href);
    if (lang === DEFAULT) {
      url.searchParams.delete('lang');  // cs je default, neznepřehledňujeme URL
    } else {
      url.searchParams.set('lang', lang);
    }
    window.history.replaceState({}, '', url.toString());
  }

  // ─── EXPORT ──────────────────────────────────────────────────

  return { t, setLang, onChange, init, currentLang };

})();

// ─── AUTO-INIT ───────────────────────────────────────────────

// Spusť hned po načtení DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18n.init());
} else {
  I18n.init();
}
