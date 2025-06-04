import { useState, useEffect, useCallback } from 'react';
import { VocabularyData, VocabularyCard } from '../types/vocabulary';
import { saveVocabulary, loadVocabulary, backupToLocalStorage, loadFromLocalStorage, initDB } from '../utils/storage';

const STORAGE_KEY = 'italvoc-vocabulary';

export const useVocabularyManager = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vokabeln laden
  const loadVocabularyData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Versuche zuerst IndexedDB
      const data = await loadVocabulary();
      if (data && data.length > 0) {
        setVocabulary(data);
        // Backup in LocalStorage aktualisieren
        backupToLocalStorage(data);
        return;
      }

      // Wenn IndexedDB leer, versuche LocalStorage
      const backupData = loadFromLocalStorage();
      if (backupData && backupData.length > 0) {
        setVocabulary(backupData);
        // Wiederherstellen in IndexedDB
        await saveVocabulary(backupData);
        return;
      }

      // Wenn beide leer, lade aus JSON
      console.log('📥 Versuche Vokabeln aus JSON zu laden...');
      const response = await fetch('/ital-deutsch-vocabulary.json');
      if (!response.ok) {
        console.error('❌ JSON-Ladefehler:', response.status, response.statusText);
        throw new Error('Fehler beim Laden der Vokabeln');
      }
      const jsonData = await response.json();
      console.log('📦 JSON-Daten geladen:', jsonData.meta);
      
      if (!jsonData.cards || !Array.isArray(jsonData.cards)) {
        console.error('❌ Ungültiges JSON-Format:', jsonData);
        throw new Error('Ungültiges JSON-Format');
      }
      
      console.log(`✅ ${jsonData.cards.length} Vokabeln aus JSON geladen`);
      
      // Die Karten sind bereits im richtigen Format
      const formattedData = jsonData.cards;
      
      console.log('📝 Daten formatiert:', formattedData.length, 'Vokabeln');
      setVocabulary(formattedData);
      
      // Speichere in IndexedDB und LocalStorage
      console.log('💾 Speichere in IndexedDB...');
      await saveVocabulary(formattedData);
      console.log('💾 Backup in LocalStorage...');
      backupToLocalStorage(formattedData);
    } catch (err) {
      console.error('Fehler beim Laden der Vokabeln:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  };

  // Vokabeln speichern
  const saveVocabularyData = async (data: VocabularyCard[]) => {
    try {
      await saveVocabulary(data);
      backupToLocalStorage(data);
      setVocabulary(data);
    } catch (err) {
      console.error('Fehler beim Speichern der Vokabeln:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    }
  };

  // Vokabeln neu laden
  const reloadVocabulary = async () => {
    try {
      // Lösche IndexedDB und LocalStorage
      const db = await initDB();
      const transaction = db.transaction(['vocabulary'], 'readwrite');
      const store = transaction.objectStore('vocabulary');
      await store.clear();
      localStorage.removeItem('italvoc-backup');
      
      // Lade neu
      await loadVocabularyData();
    } catch (err) {
      console.error('Fehler beim Neuladen der Vokabeln:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    }
  };

  // Initial laden
  useEffect(() => {
    loadVocabularyData();
  }, []);

  // Speichern in IndexedDB und LocalStorage
  const saveToStorage = useCallback(async (vocabs: VocabularyCard[]) => {
    try {
      await saveVocabulary(vocabs);
      backupToLocalStorage(vocabs);
      console.log(`💾 ${vocabs.length} Vokabeln gespeichert`);
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
    }
  }, []);

  // Mehrere neue Vokabeln als Batch hinzufügen
  const addVocabularies = useCallback((newVocabs: Omit<VocabularyCard, 'id' | 'sm2'>[]) => {
    const now = Date.now();
    const batch = newVocabs.map((v, i) => ({
      ...v,
      id: `custom-${now + i}-${Math.random().toString(36).substr(2, 9)}`,
      sm2: {
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReview: null,
        lastReview: null,
        quality: null
      }
    }));
    const updatedVocabs = [...vocabulary, ...batch];
    setVocabulary(updatedVocabs);
    saveToStorage(updatedVocabs);
    console.log(`➕ Batch: ${batch.length} neue Vokabeln hinzugefügt.`);
    return batch;
  }, [vocabulary, saveToStorage]);

  // Neue Vokabel hinzufügen
  const addVocabulary = useCallback((newVocab: Omit<VocabularyCard, 'id' | 'sm2'>) => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const vocabWithDefaults: VocabularyCard = {
      ...newVocab,
      id,
      sm2: {
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReview: null,
        lastReview: null,
        quality: null
      }
    };
    
    const updatedVocabs = [...vocabulary, vocabWithDefaults];
    setVocabulary(updatedVocabs);
    saveToStorage(updatedVocabs);
    
    console.log('➕ Neue Vokabel hinzugefügt:', vocabWithDefaults);
    return vocabWithDefaults;
  }, [vocabulary, saveToStorage]);

  // Vokabel bearbeiten
  const updateVocabulary = useCallback((id: string, updates: Partial<Omit<VocabularyCard, 'id'>>) => {
    const updatedVocabs = vocabulary.map(vocab => 
      vocab.id === id 
        ? { ...vocab, ...updates }
        : vocab
    );
    
    setVocabulary(updatedVocabs);
    saveToStorage(updatedVocabs);
    
    console.log('✏️ Vokabel bearbeitet:', id, updates);
    return updatedVocabs.find(v => v.id === id);
  }, [vocabulary, saveToStorage]);

  // Vokabel löschen
  const deleteVocabulary = useCallback((id: string) => {
    const updatedVocabs = vocabulary.filter(vocab => vocab.id !== id);
    setVocabulary(updatedVocabs);
    saveToStorage(updatedVocabs);
    
    console.log('🗑️ Vokabel gelöscht:', id);
    return true;
  }, [vocabulary, saveToStorage]);

  // SM-2 Daten aktualisieren
  const updateSM2Data = useCallback((id: string, sm2Data: Partial<VocabularyCard['sm2']>) => {
    const vocab = vocabulary.find(v => v.id === id);
    if (!vocab) {
      console.error('Vokabel nicht gefunden:', id);
      return null;
    }
    
    return updateVocabulary(id, { 
      sm2: { 
        ...vocab.sm2,
        ...sm2Data 
      } 
    });
  }, [vocabulary, updateVocabulary]);

  // Vokabel nach ID finden
  const getVocabularyById = useCallback((id: string) => {
    return vocabulary.find(vocab => vocab.id === id);
  }, [vocabulary]);

  // Duplikat-Prüfung
  const checkDuplicate = useCallback((it: string, de: string, excludeId?: string) => {
    return vocabulary.some(vocab => 
      vocab.id !== excludeId && (
        vocab.it === it || 
        vocab.de === de
      )
    );
  }, [vocabulary]);

  // Statistiken
  const getStats = useCallback(() => {
    const learned = vocabulary.filter(v => v.sm2.repetitions > 0).length;
    const toReview = vocabulary.filter(v => {
      if (!v.sm2.nextReview) return false;
      return new Date(v.sm2.nextReview) <= new Date();
    }).length;
    
    return {
      total: vocabulary.length,
      learned,
      toReview,
      available: vocabulary.length - learned
    };
  }, [vocabulary]);

  return {
    vocabulary,
    isLoading,
    error,
    addVocabulary,
    addVocabularies,
    updateVocabulary,
    deleteVocabulary,
    updateSM2Data,
    getVocabularyById,
    checkDuplicate,
    getStats,
    reloadVocabulary,
    saveVocabulary: saveVocabularyData
  };
}; 