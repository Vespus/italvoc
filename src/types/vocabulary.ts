// SM-2 Spaced Repetition Daten
export interface SM2Data {
  easeFactor: number;      // Schwierigkeitsfaktor (Standard: 2.5)
  interval: number;        // Wiederholungsintervall in Tagen
  repetitions: number;     // Anzahl erfolgreicher Wiederholungen
  nextReview: string | null;  // Nächster Wiederholungstermin (ISO-String)
  lastReview: string | null;  // Letzter Wiederholungstermin (ISO-String)
  quality: number | null;     // Letzte Bewertung (0-5)
}

// Einzelne Vokabelkarte
export interface VocabularyCard {
  id: string;
  it: string;           // Italienischer Text
  de: string;           // Deutsche Übersetzung
  notes?: string;       // Optional: Notizen
  tags?: string[];      // Optional: Tags
  sm2: SM2Data;
}

// Metadaten der Vokabelsammlung
export interface VocabularyMeta {
  setId: string;
  total_cards: number;
  created: string;
  lastUpdated?: string;
  sm2Enabled?: boolean;
  version?: string;
}

// Komplette Vokabelsammlung
export interface VocabularyData {
  meta: VocabularyMeta;
  cards: VocabularyCard[];
}

// Quiz-Konfiguration
export interface QuizConfig {
  count: number;
  direction: 'it-de' | 'de-it' | 'random';
  mode: 'text';  // Vereinfacht, da wir keine verschiedenen Schreibweisen haben
}

// Quiz-Ergebnis
export interface QuizResult {
  vocab: VocabularyCard;
  correct: boolean;
  direction: string;
  mode: string;
  timestamp: string;
}

// App-Zustand
export interface AppState {
  currentView: 'home' | 'quiz' | 'search' | 'add' | 'stats' | 'settings';
  vocabulary: VocabularyCard[];
  loading: boolean;
  error: string | null;
}

// Vokabel-Statistiken
export interface VocabularyStats {
  total: number;      // Gesamtanzahl der Vokabeln
  learned: number;    // Anzahl der gelernten Vokabeln (repetitions > 0)
  toReview: number;   // Anzahl der fälligen Wiederholungen
  available: number;  // Anzahl der noch nicht gelernten Vokabeln
}

export interface VocabularyManagerReturnType {
  vocabulary: VocabularyCard[];
  isLoading: boolean;
  error: string | null;
  addVocabulary: (newVocab: Omit<VocabularyCard, 'id' | 'sm2'>) => VocabularyCard;
  updateVocabulary: (id: string, updates: Partial<Omit<VocabularyCard, 'id'>>) => VocabularyCard | undefined;
  deleteVocabulary: (id: string) => boolean;
  updateSM2Data: (id: string, sm2Data: Partial<VocabularyCard['sm2']>) => VocabularyCard | undefined;
  getVocabularyById: (id: string) => VocabularyCard | undefined;
  checkDuplicate: (it: string, de: string, excludeId?: string) => boolean;
  getStats: () => VocabularyStats;
  reloadVocabulary: () => Promise<void>;
  saveVocabulary: (data: VocabularyCard[]) => Promise<void>;
} 