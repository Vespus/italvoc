import { VocabularyCard } from '../types/vocabulary';

/**
 * SM-2 Algorithmus für Spaced Repetition
 * Basiert auf dem SuperMemo-2 Algorithmus von Piotr Wozniak
 */

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview: string;
}

/**
 * Berechnet die nächsten SM-2 Parameter basierend auf der Antwortqualität
 * @param vocab - Die aktuelle Vokabel
 * @param quality - Qualität der Antwort (0-5)
 *   0: Totaler Blackout
 *   1: Falsche Antwort, aber richtige schien vertraut
 *   2: Falsche Antwort, aber richtige war leicht zu merken
 *   3: Richtige Antwort, aber mit ernsthaften Schwierigkeiten
 *   4: Richtige Antwort nach etwas Zögern
 *   5: Perfekte Antwort
 * @returns Neue SM-2 Parameter
 */
export function calculateSM2(vocab: VocabularyCard, quality: number): SM2Result {
  const { sm2 } = vocab;
  const now = new Date().toISOString();
  
  // Validierung der Qualität
  if (quality < 0 || quality > 5) {
    throw new Error('Quality muss zwischen 0 und 5 liegen');
  }
  
  let newEaseFactor = sm2.easeFactor;
  let newInterval = sm2.interval;
  let newRepetitions = sm2.repetitions;
  
  // Bei Qualität < 3: Wiederholung von vorne beginnen
  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Erfolgreiche Antwort
    newRepetitions += 1;
    
    // Intervall-Berechnung basierend auf Wiederholungsanzahl
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(sm2.interval * newEaseFactor);
    }
  }
  
  // Ease Factor Anpassung (nur bei Qualität >= 3)
  if (quality >= 3) {
    newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }
  
  // Ease Factor darf nicht unter 1.3 fallen
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }
  
  // Nächstes Review-Datum berechnen
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  
  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100, // Auf 2 Dezimalstellen runden
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview: nextReviewDate.toISOString(),
    lastReview: now
  };
}

/**
 * Prüft ob eine Vokabel zur Wiederholung fällig ist
 */
export function isDue(vocab: VocabularyCard): boolean {
  if (!vocab.sm2.nextReview) {
    return true; // Neue Vokabeln sind immer fällig
  }
  
  const now = new Date();
  const nextReview = new Date(vocab.sm2.nextReview);
  
  return now >= nextReview;
}

/**
 * Filtert Vokabeln die zur Wiederholung fällig sind (mit Debug)
 */
export function getDueVocabulary(vocabulary: VocabularyCard[]): VocabularyCard[] {
  console.log(`🔍 Prüfe ${vocabulary.length} Vokabeln auf Fälligkeit...`);
  
  const due = vocabulary.filter(vocab => {
    const result = isDue(vocab);
    if (vocabulary.length <= 10) { // Nur bei wenigen Vokabeln detailliert loggen
      console.log(`  ${vocab.kanji} (${vocab.id}): repetitions=${vocab.sm2.repetitions}, nextReview=${vocab.sm2.nextReview}, isDue=${result}`);
    }
    return result;
  });
  
  console.log(`📊 Ergebnis: ${due.length} von ${vocabulary.length} Vokabeln sind fällig`);
  return due;
}

/**
 * Sortiert Vokabeln nach Priorität (überfällige zuerst, dann nach Schwierigkeit)
 */
export function sortByPriority(vocabulary: VocabularyCard[]): VocabularyCard[] {
  const now = new Date();
  
  return [...vocabulary].sort((a, b) => {
    const aNextReview = a.sm2.nextReview ? new Date(a.sm2.nextReview) : new Date(0);
    const bNextReview = b.sm2.nextReview ? new Date(b.sm2.nextReview) : new Date(0);
    
    // Überfällige Vokabeln zuerst
    const aOverdue = now.getTime() - aNextReview.getTime();
    const bOverdue = now.getTime() - bNextReview.getTime();
    
    if (aOverdue !== bOverdue) {
      return bOverdue - aOverdue; // Mehr überfällig = höhere Priorität
    }
    
    // Bei gleicher Überfälligkeit: niedrigerer Ease Factor = höhere Priorität
    return a.sm2.easeFactor - b.sm2.easeFactor;
  });
}

/**
 * Gibt Statistiken über den Lernfortschritt zurück
 */
export function getLearningStats(vocabulary: VocabularyCard[]) {
  const now = new Date();
  
  const stats = {
    total: vocabulary.length,
    new: 0,
    learning: 0,
    review: 0,
    due: 0,
    overdue: 0,
    mastered: 0
  };
  
  vocabulary.forEach(vocab => {
    const { sm2 } = vocab;
    
    // Neue Vokabeln (noch nie gelernt)
    if (sm2.repetitions === 0) {
      stats.new++;
      if (!sm2.nextReview || new Date(sm2.nextReview) <= now) {
        stats.due++;
      }
      return;
    }
    
    // Lernphase (1-2 Wiederholungen)
    if (sm2.repetitions <= 2) {
      stats.learning++;
    } else if (sm2.repetitions >= 5 && sm2.easeFactor >= 2.5) {
      // Gemeistert (5+ Wiederholungen mit gutem Ease Factor)
      stats.mastered++;
    } else {
      // Wiederholung
      stats.review++;
    }
    
    // Fälligkeitsprüfung
    if (sm2.nextReview) {
      const nextReview = new Date(sm2.nextReview);
      if (nextReview <= now) {
        stats.due++;
        
        // Überfällig (mehr als 1 Tag)
        const daysDiff = (now.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 1) {
          stats.overdue++;
        }
      }
    }
  });
  
  return stats;
}

/**
 * Zentrale Farblogik für Qualitätswerte (0-5)
 */
export const QUALITY_COLORS = [
  { value: 0, label: 'Keine Ahnung', tailwind: 'bg-rose-400', hex: '#fb7185' },
  { value: 1, label: 'Falsch aber vertraut', tailwind: 'bg-rose-500', hex: '#f43f5e' },
  { value: 2, label: 'Falsch aber erinnert', tailwind: 'bg-amber-400', hex: '#fbbf24' },
  { value: 3, label: 'Richtig aber mühsam', tailwind: 'bg-amber-500', hex: '#f59e42' },
  { value: 4, label: 'Richtig nach Zögern', tailwind: 'bg-teal-500', hex: '#14b8a6' },
  { value: 5, label: 'Sofort richtig', tailwind: 'bg-emerald-500', hex: '#10b981' }
] as const; 