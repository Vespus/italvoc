import { VocabularyCard } from '../types/vocabulary';

const DB_NAME = 'japanvoc-db';
const STORE_NAME = 'vocabulary';
const DB_VERSION = 1;

// IndexedDB initialisieren
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB Fehler:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Vokabeln in IndexedDB speichern
export const saveVocabulary = async (vocabulary: VocabularyCard[]): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Bestehende Daten löschen
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Neue Daten speichern
    for (const card of vocabulary) {
      await new Promise<void>((resolve, reject) => {
        const request = store.add(card);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  } catch (err) {
    console.error('Fehler beim Speichern in IndexedDB:', err);
    throw err;
  }
};

// Vokabeln aus IndexedDB laden
export const loadVocabulary = async (): Promise<VocabularyCard[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Fehler beim Laden aus IndexedDB:', err);
    throw err;
  }
};

// Backup in LocalStorage
export const backupToLocalStorage = (vocabulary: VocabularyCard[]): void => {
  try {
    localStorage.setItem('japanvoc-backup', JSON.stringify(vocabulary));
  } catch (err) {
    console.error('Fehler beim Backup in LocalStorage:', err);
    throw err;
  }
};

// Backup aus LocalStorage laden
export const loadFromLocalStorage = (): VocabularyCard[] | null => {
  try {
    const backup = localStorage.getItem('japanvoc-backup');
    return backup ? JSON.parse(backup) : null;
  } catch (err) {
    console.error('Fehler beim Laden aus LocalStorage:', err);
    return null;
  }
}; 