import React, { useState } from 'react';
import { Search, ArrowLeft, Edit, Trash2, Loader2, X, Tag, BookOpen } from 'lucide-react';
import { VocabularyCard as VocabType } from '../types/vocabulary';
import { useVocabularyManager } from '../hooks/useVocabularyManager';
import { useSearch } from '../hooks/useSearch';

interface VocabularySearchProps {
  onBack: () => void;
  onEditVocab: (vocab: VocabType) => void;
  onDeleteVocab: (vocab: VocabType) => void;
  onSelect: (vocab: VocabType) => void;
  onClose: () => void;
}

export const VocabularySearch: React.FC<VocabularySearchProps> = ({
  onBack,
  onEditVocab,
  onDeleteVocab,
  onSelect,
  onClose
}) => {
  const { vocabulary, isLoading, error, deleteVocabulary } = useVocabularyManager();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    highlightMatch,
    isSearching,
    resultCount
  } = useSearch(vocabulary);

  // Löschen bestätigen
  const handleDeleteConfirm = (vocab: VocabType) => {
    setShowDeleteConfirm(vocab.id);
  };

  const handleDeleteExecute = async () => {
    if (showDeleteConfirm) {
      try {
        await deleteVocabulary(showDeleteConfirm);
        setShowDeleteConfirm(null);
        onDeleteVocab(vocabulary.find(v => v.id === showDeleteConfirm)!);
      } catch (error) {
        console.error('Fehler beim Löschen der Vokabel:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex items-center justify-center">
        <div className="text-stone-600">Lade Vokabeln...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p className="font-bold">Fehler</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Suche nach Vokabeln..."
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-light"
                autoFocus
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-xl transition-all"
            >
              <X size={20} className="text-stone-600" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-stone-500 font-light">
              Suche...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {searchResults.map((vocab) => (
                <button
                  key={vocab.id}
                  onClick={() => onSelect(vocab)}
                  className="w-full p-4 text-left hover:bg-stone-50 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      {/* Italienisch */}
                      <div className="text-lg font-light text-stone-700"
                        dangerouslySetInnerHTML={{
                          __html: highlightMatch(vocab.it, searchTerm)
                        }}
                      />
                      {/* Deutsch */}
                      <div className="text-lg font-light text-stone-700"
                        dangerouslySetInnerHTML={{
                          __html: highlightMatch(vocab.de, searchTerm)
                        }}
                      />
                      {/* Tags */}
                      {vocab.tags && vocab.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {vocab.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-light"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Notizen */}
                      {vocab.notes && (
                        <div className="mt-1 text-sm text-stone-500 font-light">
                          {vocab.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="p-4 text-center text-stone-500 font-light">
              Keine Vokabeln gefunden
            </div>
          ) : (
            <div className="p-4 text-center text-stone-500 font-light">
              Gib einen Suchbegriff ein
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 