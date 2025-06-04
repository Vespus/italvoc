import { useState, useEffect } from 'react';
import { VocabularyData, VocabularyCard } from '../types/vocabulary';

export const useVocabulary = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVocabulary = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/japanisch-deutsch-500.json');
        if (!response.ok) {
          throw new Error('Vokabeldaten konnten nicht geladen werden');
        }
        
        const data: VocabularyData = await response.json();
        
        if (!data.cards || !Array.isArray(data.cards)) {
          throw new Error('Ungültiges Datenformat');
        }
        
        setVocabulary(data.cards);
        console.log(`✅ ${data.cards.length} Vokabeln geladen`);
        
      } catch (err) {
        console.error('Fehler beim Laden der Vokabeln:', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    };

    loadVocabulary();
  }, []);

  return {
    vocabulary,
    loading,
    error,
    reload: () => {
      setLoading(true);
      setError(null);
      // Trigger useEffect wieder
      window.location.reload();
    }
  };
}; 