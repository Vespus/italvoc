import { useState, useEffect, useMemo } from 'react';
import { VocabularyCard } from '../types/vocabulary';

export const useSearch = (vocabulary: VocabularyCard[], debounceMs: number = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce der Sucheingabe
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Gefilterte Ergebnisse
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return vocabulary; // Alle Vokabeln anzeigen wenn keine Suche
    }

    const term = debouncedSearchTerm.toLowerCase().trim();
    
    return vocabulary.filter(card => {
      // Suche in allen Feldern
      const searchFields = [
        card.it,
        card.de,
        ...(card.tags || []),
        card.notes || ''
      ];
      
      return searchFields.some(field => 
        field.toLowerCase().includes(term)
      );
    });
  }, [vocabulary, debouncedSearchTerm]);

  // Highlight-Funktion für Suchergebnisse
  const highlightMatch = (text: string, searchTerm: string): string => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    highlightMatch,
    isSearching: debouncedSearchTerm !== searchTerm, // Zeigt Loading-State
    hasResults: searchResults.length > 0,
    resultCount: searchResults.length
  };
}; 