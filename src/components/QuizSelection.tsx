import React, { useState } from 'react';
import { ArrowLeft, Info, BookOpen, Clock, Shuffle, Repeat } from 'lucide-react';
import { useVocabularyManager } from '../hooks/useVocabularyManager';
import { VocabularyCard } from '../types/vocabulary';
import { getDueVocabulary, sortByPriority } from '../utils/sm2';
import { useSettings } from '../hooks/useSettings';

interface QuizSelectionProps {
  onBack: () => void;
  onStartQuiz: (vocab: VocabularyCard[], mode: 'it-de' | 'de-it' | 'random') => void;
}

export const QuizSelection: React.FC<QuizSelectionProps> = ({
  onBack,
  onStartQuiz
}) => {
  const { vocabulary } = useVocabularyManager();
  const { settings } = useSettings();
  const [showInfo, setShowInfo] = useState(false);

  // Vokabeln für verschiedene Modi filtern
  const dueVocab = getDueVocabulary(vocabulary);
  const newVocab = vocabulary.filter(v => v.sm2.repetitions === 0);
  const reviewVocab = vocabulary.filter(v => v.sm2.repetitions > 0);

  // Quiz starten
  const handleStartQuiz = (mode: 'it-de' | 'de-it' | 'random', vocab: VocabularyCard[]) => {
    const selectedVocab = vocab.slice(0, settings.wordsPerQuiz);
    onStartQuiz(selectedVocab, mode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-stone-700 via-amber-800 to-stone-800 text-amber-50 shadow-2xl">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-3 p-2 hover:bg-stone-700/50 rounded-xl transition-all duration-300"
            >
              <ArrowLeft size={24} className="text-amber-50 opacity-90" />
            </button>
            <h1 className="text-xl font-extralight tracking-widest">Quiz auswählen</h1>
          </div>
          
          <button
            onClick={() => setShowInfo(true)}
            className="p-2 text-amber-200 hover:bg-amber-500/20 rounded-xl transition-all duration-300"
            title="Info"
          >
            <Info size={20} className="opacity-90" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Fällige Vokabeln */}
          <button
            onClick={() => handleStartQuiz(settings.direction, sortByPriority(dueVocab))}
            disabled={dueVocab.length === 0}
            className="w-full bg-gradient-to-br from-white to-amber-50 rounded-3xl border border-amber-300/60 shadow-lg p-6 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="text-amber-700 mr-3" size={24} />
                <div className="text-left">
                  <h3 className="text-lg font-light text-stone-800 tracking-wide">Fällige Vokabeln</h3>
                  <p className="text-sm text-stone-600 font-light">{dueVocab.length} Vokabeln</p>
                </div>
              </div>
              <div className="text-amber-700 font-light">{dueVocab.length > 0 ? '→' : '✓'}</div>
            </div>
          </button>

          {/* Neue Vokabeln */}
          <button
            onClick={() => handleStartQuiz(settings.direction, newVocab)}
            disabled={newVocab.length === 0}
            className="w-full bg-gradient-to-br from-white to-amber-50 rounded-3xl border border-amber-300/60 shadow-lg p-6 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="text-amber-700 mr-3" size={24} />
                <div className="text-left">
                  <h3 className="text-lg font-light text-stone-800 tracking-wide">Neue Vokabeln</h3>
                  <p className="text-sm text-stone-600 font-light">{newVocab.length} Vokabeln</p>
                </div>
              </div>
              <div className="text-amber-700 font-light">{newVocab.length > 0 ? '→' : '✓'}</div>
            </div>
          </button>

          {/* Wiederholung */}
          <button
            onClick={() => handleStartQuiz(settings.direction, reviewVocab)}
            disabled={reviewVocab.length === 0}
            className="w-full bg-gradient-to-br from-white to-amber-50 rounded-3xl border border-amber-300/60 shadow-lg p-6 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Repeat className="text-amber-700 mr-3" size={24} />
                <div className="text-left">
                  <h3 className="text-lg font-light text-stone-800 tracking-wide">Wiederholung</h3>
                  <p className="text-sm text-stone-600 font-light">{reviewVocab.length} Vokabeln</p>
                </div>
              </div>
              <div className="text-amber-700 font-light">{reviewVocab.length > 0 ? '→' : '✓'}</div>
            </div>
          </button>

          {/* Zufällig */}
          <button
            onClick={() => handleStartQuiz(settings.direction, vocabulary)}
            disabled={vocabulary.length === 0}
            className="w-full bg-gradient-to-br from-white to-amber-50 rounded-3xl border border-amber-300/60 shadow-lg p-6 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shuffle className="text-amber-700 mr-3" size={24} />
                <div className="text-left">
                  <h3 className="text-lg font-light text-stone-800 tracking-wide">Zufällig</h3>
                  <p className="text-sm text-stone-600 font-light">{vocabulary.length} Vokabeln</p>
                </div>
              </div>
              <div className="text-amber-700 font-light">{vocabulary.length > 0 ? '→' : '✓'}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-amber-50 to-stone-100 rounded-3xl p-6 max-w-sm w-full border border-amber-200/50 shadow-2xl">
            <h3 className="text-lg font-light text-stone-800 mb-4 tracking-wide">Quiz-Modi</h3>
            
            <div className="space-y-4 text-sm text-stone-600 font-light leading-relaxed">
              <div>
                <h4 className="font-medium text-stone-700 mb-1">Fällige Vokabeln</h4>
                <p>Vokabeln, die laut SM-2 Algorithmus wiederholt werden sollten.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-stone-700 mb-1">Neue Vokabeln</h4>
                <p>Vokabeln, die noch nie gelernt wurden.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-stone-700 mb-1">Wiederholung</h4>
                <p>Vokabeln, die bereits mindestens einmal gelernt wurden.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-stone-700 mb-1">Zufällig</h4>
                <p>Alle Vokabeln in zufälliger Reihenfolge.</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowInfo(false)}
              className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 font-light tracking-wide shadow-lg"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 