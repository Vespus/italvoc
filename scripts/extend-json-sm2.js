const fs = require('fs');
const path = require('path');

// Pfad zur JSON-Datei
const jsonPath = path.join(__dirname, '../public/japanisch-deutsch-500.json');

// JSON-Datei lesen
console.log('📖 Lade JSON-Datei...');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// SM-2 Standard-Werte
const defaultSM2 = {
  easeFactor: 2.5,      // Standard Ease Factor
  interval: 1,          // Erstes Intervall: 1 Tag
  repetitions: 0,       // Anzahl erfolgreicher Wiederholungen
  nextReview: null,     // Nächster Wiederholungstermin (wird beim ersten Lernen gesetzt)
  lastReview: null,     // Letzter Wiederholungstermin
  quality: null         // Letzte Bewertung (0-5)
};

console.log(`📊 Erweitere ${data.cards.length} Vokabeln um SM-2-Felder...`);

// Alle Karten um SM-2-Felder erweitern
data.cards = data.cards.map(card => ({
  ...card,
  sm2: { ...defaultSM2 }
}));

// Metadaten aktualisieren
data.meta = {
  ...data.meta,
  lastUpdated: new Date().toISOString(),
  sm2Enabled: true,
  version: "2.0"
};

// Backup der ursprünglichen Datei erstellen
const backupPath = jsonPath.replace('.json', '-backup.json');
fs.writeFileSync(backupPath, fs.readFileSync(jsonPath));
console.log(`💾 Backup erstellt: ${backupPath}`);

// Erweiterte JSON-Datei speichern
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

console.log('✅ JSON-Datei erfolgreich erweitert!');
console.log(`📈 SM-2-Felder hinzugefügt zu ${data.cards.length} Vokabeln`);
console.log('🔧 Neue Felder:');
console.log('   - easeFactor: 2.5 (Standard)');
console.log('   - interval: 1 (Tag)');
console.log('   - repetitions: 0');
console.log('   - nextReview: null');
console.log('   - lastReview: null');
console.log('   - quality: null'); 