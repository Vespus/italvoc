import React, { useState } from 'react';
import { useVocabularyManager } from '../hooks/useVocabularyManager';

interface Vocabulary {
  japanese: string;
  kana: string;
  romaji: string;
  german: string;
  example?: string;
}

interface KiVocabGeneratorProps {
  onClose: () => void;
}

type Status =
  | 'idle'
  | 'fetching'
  | 'checking-duplicates'
  | 'refetching'
  | 'done'
  | 'error';

const MAX_REFETCH_ATTEMPTS = 3;
const BATCH_SIZE = 10;

export const KiVocabGenerator: React.FC<KiVocabGeneratorProps> = ({ onClose }) => {
  const [count, setCount] = useState<number>(5);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [missingCount, setMissingCount] = useState<number>(0);
  const [refetchProgress, setRefetchProgress] = useState<{current: number, total: number, attempts: number}>({current: 0, total: 0, attempts: 0});
  const [apiPrompts, setApiPrompts] = useState<string[]>([]);
  const { vocabulary: existingVocabulary, isLoading: vocabLoading, addVocabulary, addVocabularies } = useVocabularyManager();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Simulierte Statuswechsel für Testzwecke
  const simulateStatus = (newStatus: Status) => {
    setStatus(newStatus);
    if (newStatus === 'error') {
      setError('Dies ist eine simulierte Fehlermeldung.');
    } else {
      setError(null);
    }
  };

  // Hilfsfunktion: Duplikatprüfung gegen Bestand und bereits generierte Vokabeln
  const isDuplicate = (vocab: Vocabulary, allVocabs: Vocabulary[], existing: typeof existingVocabulary) => {
    return (
      allVocabs.some(v =>
        (v.japanese && v.japanese === vocab.japanese) ||
        (v.kana && v.kana === vocab.kana)
      ) ||
      existing.some(ev =>
        (ev.kanji && ev.kanji === vocab.japanese) ||
        (ev.kana && ev.kana === vocab.kana)
      )
    );
  };

  // Prompt-Tracking
  const prompts: string[] = [];

  // Hauptfunktion: KI-Call, Duplikatprüfung, ggf. Nachfordern
  const handleGenerate = async () => {
    setStatus('fetching');
    setError(null);
    setDuplicateCount(0);
    setMissingCount(0);
    setRefetchProgress({current: 0, total: 0, attempts: 0});
    setApiPrompts([]);
    let allVocabs: Vocabulary[] = [];
    let totalDuplicates = 0;
    let missing = 0;
    try {
      // Initialer KI-Call
      const initialPrompt = JSON.stringify({ count });
      prompts.push(initialPrompt);
      const response = await fetch('/api/generate-vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: initialPrompt
      });

      if (!response.ok) {
        const errorData = await response.json();
        setStatus('error');
        throw new Error(errorData.error || 'Fehler bei der Generierung');
      }

      const data = await response.json();
      setStatus('checking-duplicates');
      // Duplikatprüfung (1:1 auf Kanji und Kana)
      const duplicates = data.vocabularies.filter((vocab: Vocabulary) =>
        isDuplicate(vocab, [], existingVocabulary)
      );
      const uniqueVocabs = data.vocabularies.filter((vocab: Vocabulary) =>
        !isDuplicate(vocab, [], existingVocabulary)
      );
      totalDuplicates = duplicates.length;
      missing = count - uniqueVocabs.length;
      setDuplicateCount(totalDuplicates);
      setMissingCount(missing);
      allVocabs = [...uniqueVocabs];

      // Nachfordern, falls nötig
      let attempts = 0;
      while (allVocabs.length < count && attempts < MAX_REFETCH_ATTEMPTS) {
        setStatus('refetching');
        setRefetchProgress({current: allVocabs.length, total: count, attempts: attempts+1});
        const toFetch = count - allVocabs.length;
        let batchSize = toFetch;
        if (toFetch >= 11) batchSize = BATCH_SIZE;
        const refetchPrompt = JSON.stringify({ count: batchSize });
        prompts.push(refetchPrompt);
        const refetchResponse = await fetch('/api/generate-vocabulary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: refetchPrompt
        });
        if (!refetchResponse.ok) {
          const errorData = await refetchResponse.json();
          setStatus('error');
          throw new Error(errorData.error || 'Fehler bei der Nachgenerierung');
        }
        const refetchData = await refetchResponse.json();
        // Prüfe neue Vokabeln auf Duplikate gegen Bestand und bereits generierte
        const newUnique = refetchData.vocabularies.filter((vocab: Vocabulary) =>
          !isDuplicate(vocab, allVocabs, existingVocabulary)
        );
        allVocabs = [...allVocabs, ...newUnique];
        attempts++;
      }
      setVocabularies(allVocabs.slice(0, count));
      setDuplicateCount(count - allVocabs.length > 0 ? count - allVocabs.length : 0);
      setMissingCount(count - allVocabs.length > 0 ? count - allVocabs.length : 0);
      setApiPrompts([...prompts]);
      setTimeout(() => setStatus('done'), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      setStatus('error');
      console.error('Fehler:', err);
    }
  };

  // Nach Generierung: alle Vokabeln standardmäßig selektieren
  React.useEffect(() => {
    if (status === 'done' && vocabularies.length > 0) {
      setSelectedIndices(vocabularies.map((_, i) => i));
    }
  }, [status, vocabularies]);

  // Einzelne Vokabel selektieren/de-selektieren
  const toggleSelect = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Alle auswählen
  const selectAll = () => {
    setSelectedIndices(vocabularies.map((_, i) => i));
  };
  // Alle abwählen
  const deselectAll = () => {
    setSelectedIndices([]);
  };

  // Übernahme-Handler (nur selektierte Vokabeln)
  const handleAccept = () => {
    try {
      const newVocabs = selectedIndices.map(idx => ({
        kanji: vocabularies[idx].japanese,
        kana: vocabularies[idx].kana,
        romaji: vocabularies[idx].romaji,
        de: vocabularies[idx].german,
        example: vocabularies[idx].example
      }));
      addVocabularies(newVocabs);
      setSuccessMsg(`${newVocabs.length} neue Vokabel(n) übernommen!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1800);
    } catch (e) {
      setError('Fehler beim Übernehmen der Vokabeln.');
    }
  };

  // UI für Statusmeldungen
  const renderStatus = () => {
    switch (status) {
      case 'fetching':
        return <div className="text-amber-700 flex items-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full"></span>Vokabeln werden abgefragt...</div>;
      case 'checking-duplicates':
        return (
          <div className="text-amber-700 flex flex-col gap-1 items-start">
            <div className="flex items-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full"></span>Duplikate werden identifiziert...</div>
            <div className="text-xs text-stone-600">{duplicateCount} Duplikate gefunden, {missingCount} Vokabel(n) fehlen noch.</div>
          </div>
        );
      case 'refetching':
        return (
          <div className="text-amber-700 flex flex-col gap-1 items-start">
            <div className="flex items-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full"></span>Ersatz für Duplikate wird abgefragt...</div>
            <div className="text-xs text-stone-600">{refetchProgress.current} / {refetchProgress.total} Vokabeln duplikatfrei, Versuch {refetchProgress.attempts} von {MAX_REFETCH_ATTEMPTS}</div>
          </div>
        );
      case 'error':
        return <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-md">{error}</div>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-50/95 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-stone-700">KI Vokabel Generator</h2>
          <span className="text-xs text-stone-400 ml-2">v0.24</span>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Anzahl neuer Vokabeln
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Status-Feedback */}
          {renderStatus()}

          <button
            onClick={handleGenerate}
            disabled={status === 'fetching' || status === 'checking-duplicates' || status === 'refetching' || vocabLoading}
            className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'fetching' ? 'Generiere...' : 'Vokabeln generieren'}
          </button>

          {status === 'done' && vocabularies.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-stone-700">Generierte Vokabeln</h3>
              {/* Select/Deselect All Buttons */}
              <div className="flex gap-2 mb-2">
                <button onClick={selectAll} className="px-3 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 text-xs">Alle auswählen</button>
                <button onClick={deselectAll} className="px-3 py-1 bg-stone-100 text-stone-700 rounded hover:bg-stone-200 text-xs">Alle abwählen</button>
              </div>
              <div className="space-y-3">
                {vocabularies.map((vocab, index) => (
                  <div
                    key={index}
                    className={`p-4 border border-amber-200 rounded-lg bg-amber-50 flex items-start gap-3 ${selectedIndices.includes(index) ? '' : 'opacity-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIndices.includes(index)}
                      onChange={() => toggleSelect(index)}
                      className="mt-1 accent-amber-600"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xl font-medium text-stone-800">
                            {vocab.japanese}
                          </div>
                          <div className="text-sm text-stone-600">
                            {vocab.kana}
                          </div>
                          {vocab.romaji && (
                            <div className="text-sm text-amber-700 italic">
                              {vocab.romaji}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-stone-800">
                            {vocab.german}
                          </div>
                        </div>
                      </div>
                      {vocab.example && (
                        <div className="mt-2 text-sm text-stone-600">
                          {vocab.example}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Übernehmen/Abbrechen-Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAccept}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-md hover:bg-amber-700 transition"
                  disabled={selectedIndices.length === 0 || !!successMsg}
                >
                  Übernehmen
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-stone-200 text-stone-700 py-2 rounded-md hover:bg-stone-300 transition"
                  disabled={!!successMsg}
                >
                  Abbrechen
                </button>
              </div>
              {successMsg && (
                <div className="mt-3 bg-teal-100 border border-teal-300 text-teal-800 px-4 py-2 rounded-md text-center">
                  {successMsg}
                </div>
              )}
            </div>
          )}

          {/* Prompts anzeigen */}
          {status === 'done' && apiPrompts.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-semibold text-stone-500 mb-1">Verwendete API-Prompts:</h4>
              <pre className="bg-stone-100 text-xs p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">{apiPrompts.map((p, i) => `#${i+1}: ${p}`).join('\n')}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 