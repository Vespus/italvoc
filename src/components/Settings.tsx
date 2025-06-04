import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Info, Sparkles } from 'lucide-react';
import { initDB, loadVocabulary, loadFromLocalStorage } from '../utils/storage';
import { KiVocabGenerator } from './KiVocabGenerator';
import { useVocabularyManager } from '../hooks/useVocabularyManager';

interface SettingsProps {
  // Keine Props mehr benötigt - Navigation über Tab Bar
}

export type QuizDirection = 'it-to-de' | 'de-to-it' | 'random';

export interface QuizSettings {
  direction: QuizDirection;
  wordsPerQuiz: number;
}

const SETTINGS_KEY = 'italvoc-settings';

const DEFAULT_SETTINGS: QuizSettings = {
  direction: 'it-to-de',
  wordsPerQuiz: 20
};

// Debug-Bereich für Speicherstatus
const DebugStorage = () => {
  const [storageInfo, setStorageInfo] = useState<{
    indexedDB: number;
    localStorage: number;
  }>({ indexedDB: 0, localStorage: 0 });

  const checkStorage = async () => {
    try {
      // IndexedDB prüfen
      const db = await initDB();
      const transaction = db.transaction(['vocabulary'], 'readonly');
      const store = transaction.objectStore('vocabulary');
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        setStorageInfo(prev => ({
          ...prev,
          indexedDB: countRequest.result
        }));
      };

      // LocalStorage prüfen
      const backup = localStorage.getItem('japanvoc-backup');
      if (backup) {
        const data = JSON.parse(backup);
        setStorageInfo(prev => ({
          ...prev,
          localStorage: data.length
        }));
      }
    } catch (err) {
      console.error('Fehler beim Prüfen des Speichers:', err);
    }
  };

  useEffect(() => {
    checkStorage();
  }, []);

  return (
    <div className="mt-8 p-4 bg-amber-50 rounded-lg">
      <h3 className="text-lg font-medium text-stone-700 mb-2">Speicherstatus</h3>
      <div className="space-y-2 text-sm text-stone-600">
        <p>IndexedDB: {storageInfo.indexedDB} Vokabeln</p>
        <p>LocalStorage Backup: {storageInfo.localStorage} Vokabeln</p>
        <button
          onClick={checkStorage}
          className="mt-2 px-3 py-1 bg-amber-200 text-stone-700 rounded hover:bg-amber-300"
        >
          Aktualisieren
        </button>
      </div>
    </div>
  );
};

function DebugVocabularyStorage({ onClose }: { onClose: () => void }) {
  const [indexedCount, setIndexedCount] = useState<number | null>(null);
  const [localCount, setLocalCount] = useState<number | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const check = async () => {
    try {
      const indexed = await loadVocabulary();
      setIndexedCount(indexed.length);
      setPreview(indexed.slice(0, 3));
    } catch {
      setIndexedCount(null);
    }
    try {
      const local = loadFromLocalStorage();
      setLocalCount(local ? local.length : 0);
    } catch {
      setLocalCount(null);
    }
  };

  useEffect(() => { check(); }, []);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl p-6 min-w-[320px] max-w-xs relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-amber-100"
          title="Schließen"
        >
          ×
        </button>
        <div className="font-light text-stone-700 mb-2">Speicher-Info</div>
        <div className="text-sm text-stone-600 mb-2">
          IndexedDB: <b>{indexedCount ?? '–'}</b> Vokabeln<br />
          LocalStorage: <b>{localCount ?? '–'}</b> Vokabeln
        </div>
        {preview.length > 0 && (
          <div className="text-xs text-stone-500">
            <div className="mb-1">Vorschau (erste 3):</div>
            <ul className="list-disc ml-5">
              {preview.map((v, i) => (
                <li key={i}>{v.kanji} / {v.kana} – {v.de}</li>
              ))}
            </ul>
          </div>
        )}
        <button onClick={check} className="mt-3 px-3 py-1 bg-amber-200 rounded font-light text-stone-700 hover:bg-amber-300 transition">Aktualisieren</button>
      </div>
    </div>
  );
}

export const Settings: React.FC<SettingsProps> = () => {
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showKiVocab, setShowKiVocab] = useState(false);

  // Einstellungen laden
  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      } catch (error) {
        console.error('Fehler beim Laden der Einstellungen:', error);
      }
    }
  }, []);

  // Einstellungen speichern
  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setHasChanges(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
    console.log('⚙️ Einstellungen gespeichert:', settings);
  };

  // Einstellungen zurücksetzen
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  };

  // Änderungen verfolgen
  const updateSetting = <K extends keyof QuizSettings>(
    key: K, 
    value: QuizSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const directionOptions = [
    {
      value: 'it-to-de' as QuizDirection,
      label: 'Italienisch → Deutsch',
      description: 'Italienisches Wort → Deutsche Übersetzung'
    },
    {
      value: 'de-to-it' as QuizDirection,
      label: 'Deutsch → Italienisch',
      description: 'Deutsches Wort → Italienische Übersetzung'
    },
    {
      value: 'random' as QuizDirection,
      label: 'Zufällig',
      description: 'Gemischte Abfragerichtungen'
    }
  ];

  const wordsPerQuizOptions = [5, 10, 15, 20, 25, 30, 50];

  if (showKiVocab) {
    return <KiVocabGenerator onClose={() => setShowKiVocab(false)} />;
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 pb-32 flex flex-col h-full">
      {/* Header */}
      <header className="bg-gradient-to-r from-stone-700 via-amber-800 to-stone-800 text-amber-50 shadow-2xl">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-extralight tracking-widest">Einstellungen</h1>
            <span className="text-xs align-top ml-2 text-amber-100">V0.827</span>
          </div>
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <button
                onClick={saveSettings}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg font-light tracking-wide"
              >
                <Save size={16} className="mr-2 opacity-90" />
                Speichern
              </button>
            )}
            {/* Info-Icon für Debug */}
            <button
              onClick={() => setShowDebug(v => !v)}
              className="ml-2 p-2 rounded-full hover:bg-amber-200/30 transition"
              title="Speicher-Info anzeigen"
            >
              <Info size={22} className="text-amber-100 hover:text-amber-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {showSaved && (
        <div className="bg-gradient-to-r from-teal-100 to-emerald-100 border border-teal-300/60 text-teal-800 px-4 py-3 mx-4 mt-4 rounded-2xl shadow-lg font-light">
          ✅ Einstellungen erfolgreich gespeichert!
        </div>
      )}

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 max-w-md mx-auto space-y-6">
          {/* KI Vokabel Generator Button (jetzt ganz oben) */}
          <div className="mb-6">
            <button
              onClick={() => setShowKiVocab(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              <Sparkles size={20} />
              <span>KI Vokabel Generator</span>
            </button>
          </div>

          {/* Quiz-Konfiguration */}
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-3xl border border-amber-300/60 shadow-lg p-6">
            <h2 className="text-lg font-light text-stone-800 mb-4 tracking-wide">
              Quiz-Konfiguration
            </h2>
            
            {/* Abfragerichtung */}
            <div className="mb-6">
              <label className="block text-sm font-light text-stone-700 mb-3 tracking-wide">
                Abfragerichtung
              </label>
              <div className="space-y-3">
                {directionOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start p-4 border border-amber-200/60 rounded-2xl cursor-pointer hover:bg-amber-50/50 transition-all duration-300 hover:shadow-md"
                  >
                    <input
                      type="radio"
                      name="direction"
                      value={option.value}
                      checked={settings.direction === option.value}
                      onChange={(e) => updateSetting('direction', e.target.value as QuizDirection)}
                      className="mt-1 mr-3 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-light text-stone-800 tracking-wide">{option.label}</div>
                      <div className="text-sm text-stone-600 font-light">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Anzahl Vokabeln pro Quiz */}
            <div>
              <label className="block text-sm font-light text-stone-700 mb-3 tracking-wide">
                Vokabeln pro Quiz
              </label>
              <div className="grid grid-cols-4 gap-3">
                {wordsPerQuizOptions.map((count) => (
                  <button
                    key={count}
                    onClick={() => updateSetting('wordsPerQuiz', count)}
                    className={`p-3 text-center rounded-xl border transition-all duration-300 font-light ${
                      settings.wordsPerQuiz === count
                        ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white border-amber-600 shadow-lg'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-amber-50 hover:border-amber-300 shadow-sm'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className="text-sm text-stone-600 mt-3 font-light">
                Aktuell: {settings.wordsPerQuiz} Vokabeln pro Quiz-Session
              </p>
            </div>
          </div>

          {/* Aktionen */}
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-3xl border border-amber-300/60 shadow-lg p-6">
            <h2 className="text-lg font-light text-stone-800 mb-4 tracking-wide">
              Aktionen
            </h2>
            
            <button
              onClick={resetSettings}
              className="w-full flex items-center justify-center px-4 py-3 border border-stone-300 text-stone-700 rounded-2xl hover:bg-stone-50 hover:border-stone-400 transition-all duration-300 font-light tracking-wide shadow-sm mb-3"
            >
              <RotateCcw size={16} className="mr-2 opacity-80" />
              Auf Standardwerte zurücksetzen
            </button>
          </div>

          {/* Info */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/60 rounded-3xl p-5 shadow-sm">
            <h3 className="font-light text-amber-800 mb-2 tracking-wide">💡 Tipp</h3>
            <p className="text-amber-700 text-sm font-light leading-relaxed">
              Die Einstellungen werden automatisch für alle zukünftigen Quiz-Sessions übernommen. 
              Du kannst sie jederzeit hier ändern.
            </p>
          </div>
        </div>
      </div>

      {/* Debug-Overlay (immer verfügbar, auch in Produktion) */}
      {showDebug && <DebugVocabularyStorage onClose={() => setShowDebug(false)} />}

      {showKiVocab && (
        <KiVocabGenerator onClose={() => setShowKiVocab(false)} />
      )}
    </div>
  );
};

// Hook für andere Komponenten um Einstellungen zu laden
export const useQuizSettings = (): QuizSettings => {
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      } catch (error) {
        console.error('Fehler beim Laden der Einstellungen:', error);
      }
    }
  }, []);

  return settings;
}; 