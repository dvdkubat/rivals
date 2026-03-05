//todo - nějak to sem nasunout z app.js




/*

/ časem - ukázka pro automatické doplnění jazyků

const fs = require('fs');
const filePath = './locales/cs.json';
const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const missing = { settings: "", hero_select: "", ... };

const merged = { ...existing, ...missing };

// Seřadit podle abecedy
const sorted = Object.fromEntries(Object.entries(merged).sort());

fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2));
*/

