import React, { useState } from 'react';
import { Search, Plus, Edit3, Trash2, FileText, Tag, BookOpen } from 'lucide-react';
import { useVocabularyManager } from '../hooks/useVocabularyManager';
import { useSearch } from '../hooks/useSearch';
import { VocabularyCard } from '../types/vocabulary';

interface VocabularyTabProps {
  onEditVocab: (vocab: VocabularyCard) => void;
  onAddVocab: () => void;
}

export const VocabularyTab: React.FC<VocabularyTabProps> = ({
  onEditVocab,
  onAddVocab
}) => {
  const { vocabulary, deleteVocabulary } = useVocabularyManager();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const { 
    searchTerm, 
    setSearchTerm, 
    searchResults, 
    isSearching, 
    resultCount 
  } = useSearch(vocabulary);

  const handleDelete = (vocab: VocabularyCard) => {
    deleteVocabulary(vocab.id);
    setShowDeleteConfirm(null);
  };

  const displayVocabs = searchTerm.trim() ? searchResults : vocabulary.slice(0, 50); // Zeige nur erste 50 wenn keine Suche

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      {/* Header mit Suche */}
      <div className="bg-gradient-to-r from-amber-50 to-stone-50 border-b border-amber-200/60 p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          {/* Suchfeld */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 opacity-80" size={20} />
            <input
              type="text"
              placeholder="Vokabeln durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-stone-300/60 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white/80 backdrop-blur-sm font-light tracking-wide placeholder:text-stone-400"
            />
          </div>
          
          {/* Add Button */}
          <button
            onClick={onAddVocab}
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg"
            aria-label="Neue Vokabel hinzufügen"
          >
            <Plus size={24} className="opacity-90" />
          </button>
        </div>
        
        {/* Suchergebnisse Info */}
        {searchTerm.trim() && (
          <div className="mt-3 text-sm text-stone-600 font-light">
            {isSearching ? (
              'Suche läuft...'
            ) : (
              `${resultCount} Ergebnis${resultCount !== 1 ? 'se' : ''} gefunden`
            )}
          </div>
        )}
      </div>

      {/* Vokabelliste */}
      <div className="flex-1 overflow-y-auto pb-20"> {/* pb-20 für Tab Bar Platz */}
        {displayVocabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-stone-500">
            <FileText size={48} className="mb-4 text-stone-300 opacity-60" />
            <h3 className="text-lg font-light mb-2 tracking-wide">
              {searchTerm.trim() ? 'Keine Ergebnisse' : 'Keine Vokabeln'}
            </h3>
            <p className="text-center text-sm font-light">
              {searchTerm.trim() 
                ? 'Versuche einen anderen Suchbegriff'
                : 'Füge deine erste Vokabel hinzu'
              }
            </p>
            {!searchTerm.trim() && (
              <button
                onClick={onAddVocab}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 font-light tracking-wide shadow-lg"
              >
                Vokabel hinzufügen
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {displayVocabs.map((vocab: VocabularyCard) => (
              <div
                key={vocab.id}
                className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-300/60 p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] shadow-md cursor-pointer active:scale-95 group"
                onClick={() => onEditVocab(vocab)}
                tabIndex={0}
                role="button"
                aria-label="Vokabel anzeigen und bearbeiten"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Italienisch */}
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-xs text-stone-400 font-light mr-1">Italienisch:</span>
                      <span className="text-xl font-light text-stone-800">{vocab.it}</span>
                    </div>
                    
                    {/* Deutsche Bedeutung */}
                    <div className="flex items-center mb-3">
                      <span className="text-xs text-stone-400 font-light mr-1">Deutsch:</span>
                      <span className="text-base text-amber-800 font-light tracking-wide">{vocab.de}</span>
                    </div>

                    {/* Tags */}
                    {vocab.tags && vocab.tags.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <Tag size={14} className="text-stone-400" />
                        <div className="flex flex-wrap gap-1">
                          {vocab.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full text-xs font-light"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notizen */}
                    {vocab.notes && (
                      <div className="flex items-start gap-2 mb-2">
                        <BookOpen size={14} className="text-stone-400 mt-1" />
                        <span className="text-sm text-stone-600 font-light">{vocab.notes}</span>
                      </div>
                    )}

                    {/* SM-2 Info */}
                    <div className="mt-3 text-xs text-stone-400 font-light">
                      {vocab.sm2.repetitions > 0 ? (
                        `${vocab.sm2.repetitions} Wiederholungen • Faktor: ${vocab.sm2.easeFactor.toFixed(1)}`
                      ) : (
                        'Noch nicht gelernt'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Mehr laden Hinweis */}
            {!searchTerm.trim() && vocabulary.length > 50 && (
              <div className="text-center py-4 text-stone-500 text-sm font-light">
                Verwende die Suche um alle {vocabulary.length} Vokabeln zu durchsuchen
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-amber-50 to-stone-100 rounded-3xl p-6 max-w-sm w-full border border-amber-200/50 shadow-2xl">
            <h3 className="text-lg font-light text-stone-800 mb-3 tracking-wide">
              Vokabel löschen?
            </h3>
            <p className="text-stone-600 mb-6 font-light">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-all duration-300 font-light tracking-wide"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  const vocab = vocabulary.find(v => v.id === showDeleteConfirm);
                  if (vocab) handleDelete(vocab);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl hover:from-rose-600 hover:to-rose-700 transition-all duration-300 font-light tracking-wide shadow-lg"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 