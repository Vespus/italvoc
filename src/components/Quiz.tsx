import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useVocabularyManager } from '../hooks/useVocabularyManager';
import { QuizMode } from './QuizSelection';
import { useQuizSettings, QuizDirection } from './Settings';
import { 
  calculateSM2, 
  getDueVocabulary, 
  sortByPriority, 
  QUALITY_COLORS 
} from '../utils/sm2Algorithm';
import { VocabularyCard } from '../types/vocabulary';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RepeatQuiz } from './RepeatQuiz';

interface QuizProps {
  mode: QuizMode;
  onBack: () => void;
  onComplete?: (wrongVocabs?: VocabularyCard[]) => void;
  repeatVocabulary?: VocabularyCard[];
}

export const Quiz: React.FC<QuizProps> = ({
  mode,
  onBack,
  onComplete,
  repeatVocabulary
}) => {
  const { vocabulary, updateSM2Data, isLoading } = useVocabularyManager();
  const quizSettings = useQuizSettings();
  
  // Zentrale States für Quiz-Flow
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentDirection, setCurrentDirection] = useState<QuizDirection>('it-to-de');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [repeatQuizState, setRepeatQuizState] = useState<{ show: boolean, vocabs: VocabularyCard[] }>({ show: false, vocabs: [] });
  
  // Statistiken und Ergebnisse
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    total: 0,
    streak: 0,
    maxStreak: 0
  });
  const [results, setResults] = useState<{vocab: VocabularyCard, quality: number}[]>([]);

  // Vokabeln für das Quiz bestimmen
  const quizVocabulary = useMemo(() => {
    if (repeatVocabulary && repeatVocabulary.length > 0) {
      console.log(`🔁 Wiederholungsquiz mit ${repeatVocabulary.length} Vokabeln`);
      return repeatVocabulary;
    }
    console.log(`🎯 Quiz-Modus: ${mode}, Verfügbare Vokabeln: ${vocabulary.length}`);
    let filtered: VocabularyCard[] = [];
    switch (mode) {
      case 'due':
        filtered = getDueVocabulary(vocabulary);
        break;
      case 'new':
        filtered = vocabulary.filter(v => v.sm2.repetitions === 0);
        break;
      case 'review':
        filtered = vocabulary.filter(v => v.sm2.repetitions > 0);
        break;
      case 'random':
        filtered = [...vocabulary];
        break;
    }
    if (mode !== 'random') {
      filtered = sortByPriority(filtered);
    } else {
      filtered = filtered.sort(() => Math.random() - 0.5);
    }
    const result = filtered.slice(0, quizSettings.wordsPerQuiz);
    return result;
  }, [vocabulary, mode, quizSettings.wordsPerQuiz, repeatVocabulary]);

  // Quiz beenden wenn keine Vokabeln vorhanden
  useEffect(() => {
    if (!isLoading && quizVocabulary.length === 0) {
      console.log('⚠️ Keine Quiz-Vokabeln verfügbar, beende Quiz');
      setTimeout(() => onComplete && onComplete(), 1000);
    }
  }, [isLoading, quizVocabulary.length, onComplete]);

  // Abfragerichtung für aktuelle Vokabel bestimmen
  useEffect(() => {
    if (quizSettings.direction === 'random') {
      const directions: QuizDirection[] = ['it-to-de', 'de-to-it'];
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      setCurrentDirection(randomDirection);
    } else {
      setCurrentDirection(quizSettings.direction);
    }
  }, [currentIndex, quizSettings.direction]);

  // States zurücksetzen, wenn ein neues Quiz (Modus oder Wiederholung) gestartet wird
  useEffect(() => {
    setCurrentIndex(0);
    setResults([]);
    setIsQuizComplete(false);
    setSessionStats({ correct: 0, total: 0, streak: 0, maxStreak: 0 });
    setShowAnswer(false);
  }, [repeatVocabulary, mode]);

  // Antwort bewerten und zur nächsten Vokabel
  const handleQualityRating = (quality: number) => {
    // Sicherheitscheck
    if (!quizVocabulary[currentIndex]) {
      console.error('Keine Vokabel verfügbar für Index:', currentIndex);
      return;
    }

    try {
      // SM-2 Berechnung
      const sm2Result = calculateSM2(quizVocabulary[currentIndex], quality);
      
      // Daten aktualisieren
      updateSM2Data(quizVocabulary[currentIndex].id, {
        ...sm2Result,
        quality
      });
      
      // Session-Statistiken aktualisieren
      const isCorrect = quality >= 3;
      setSessionStats(prev => {
        const newStreak = isCorrect ? prev.streak + 1 : 0;
        return {
          correct: prev.correct + (isCorrect ? 1 : 0),
          total: prev.total + 1,
          streak: newStreak,
          maxStreak: Math.max(prev.maxStreak, newStreak)
        };
      });
      
      // Ergebnis speichern
      setResults(prev => [...prev, { 
        vocab: quizVocabulary[currentIndex], 
        quality 
      }]);
      
      // Quiz-Ende prüfen
      const isLastCard = currentIndex + 1 >= quizVocabulary.length;
      if (isLastCard) {
        console.log('🎯 Quiz abgeschlossen!');
        setIsQuizComplete(true);
      } else {
        // Zur nächsten Karte
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      }
    } catch (error) {
      console.error('Fehler bei der Bewertung:', error);
      // Optional: Fehlerbehandlung für den Benutzer
    }
  };

  // Antwort anzeigen/verstecken
  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  // Ergebnisbildschirm
  if (isQuizComplete) {
    const qualityCounts = QUALITY_COLORS.map(q => ({
      ...q,
      count: results.filter(r => r.quality === q.value).length
    })).filter(d => d.count > 0);
    
    const wrongVocabsResult = results.filter(r => r.quality < 3).map(r => r.vocab);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-amber-200/80 flex flex-col items-center">
          <h2 className="text-2xl font-light text-stone-800 mb-4">Quiz-Ergebnis</h2>
          <div className="w-full flex flex-col items-center">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={qualityCounts}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {qualityCounts.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.hex} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}x`} />
              </PieChart>
            </ResponsiveContainer>
            {/* Eigene Legende unterhalb des Charts */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {qualityCounts.map((entry, idx) => (
                <div key={entry.label} className="flex items-center space-x-2 text-sm font-light">
                  <span
                    className="inline-block w-4 h-4 rounded-full"
                    style={{ background: entry.hex }}
                  />
                  <span>{entry.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 w-full text-center">
            <div className="text-lg font-light text-stone-700 mb-2">
              Richtige Antworten: {results.filter(r => r.quality >= 3).length} / {results.length}
            </div>
            {wrongVocabsResult.length > 0 ? (
              <button
                onClick={() => {
                  if (typeof onComplete === 'function') {
                    onComplete(wrongVocabsResult);
                  }
                }}
                className="mt-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-amber-600 text-white rounded-2xl shadow-lg font-light text-lg hover:from-rose-600 hover:to-amber-700 transition-all"
              >
                Falsche wiederholen ({wrongVocabsResult.length})
              </button>
            ) : (
              <div className="text-emerald-600 font-light mt-2">Alle Vokabeln richtig! 🎉</div>
            )}
            <button
              onClick={() => {
                if (typeof onComplete === 'function') {
                  onComplete();
                }
              }}
              className="mt-4 px-6 py-3 bg-stone-300 text-stone-700 rounded-2xl shadow font-light text-base hover:bg-stone-400 transition-all"
            >
              Zurück
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Wiederholungsquiz
  if (repeatQuizState.show) {
    return (
      <RepeatQuiz
        vocabulary={repeatQuizState.vocabs}
        onBack={() => setRepeatQuizState({ show: false, vocabs: [] })}
        onComplete={() => onComplete && onComplete()}
      />
    );
  }

  // Quiz-Karte
  if (currentIndex < quizVocabulary.length) {
    return (
      <div className="h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-stone-700 via-amber-800 to-stone-800 text-amber-50 shadow-2xl px-4 py-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowExitConfirm(true)}
              className="mr-2 p-2 hover:bg-stone-700/50 rounded-lg transition-all duration-300 min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Zurück"
            >
              <ArrowLeft size={20} className="text-amber-50 opacity-90" />
            </button>
            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-center space-x-4 text-sm font-light">
                <span className="text-amber-100">{currentIndex + 1} von {quizVocabulary.length}</span>
                <span className="text-amber-100">Richtig: {sessionStats.correct}/{sessionStats.total}</span>
                <span className="text-amber-200">Serie: {sessionStats.streak}</span>
              </div>
            </div>
            <div style={{ width: 36 }} />
          </div>
        </header>

        {/* Progress Bar */}
        <div className="bg-gradient-to-r from-amber-50 to-stone-50 border-b border-amber-200/60 px-4 py-2">
          <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-600 to-stone-700 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${((currentIndex + 1) / quizVocabulary.length) * 100}%` }}
            />
          </div>
          <div className="text-xs text-stone-500 text-center mt-1 font-light">
            {Math.round(((currentIndex + 1) / quizVocabulary.length) * 100)}% abgeschlossen
          </div>
        </div>

        {/* Quiz Card */}
        <div className="flex-1 flex flex-col justify-center px-6 py-4">
          <div className="bg-gradient-to-br from-amber-25 via-stone-25 to-amber-50 rounded-3xl shadow-2xl p-6 mx-auto w-full max-w-lg border border-amber-100/80 relative" style={{ backgroundColor: '#fefdfb' }}>
            {/* Abfragerichtung Indikator */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center px-5 py-2 bg-stone-100/80 text-stone-600 text-sm font-light rounded-full border border-stone-200/60 shadow-sm">
                <div className="w-2 h-2 bg-amber-600 rounded-full mr-3 opacity-80"></div>
                {currentDirection === 'it-to-de' && 'Italienisch → Deutsch'}
                {currentDirection === 'de-to-it' && 'Deutsch → Italienisch'}
              </div>
            </div>

            {/* Frage/Auflösung */}
            <div className="flex flex-col items-center justify-center min-h-[120px] mb-4 gap-4">
              {/* Frage */}
              {currentDirection === 'it-to-de' && (
                <div className="text-4xl font-light text-stone-800 leading-tight tracking-wide">
                  {quizVocabulary[currentIndex].it}
                </div>
              )}
              {currentDirection === 'de-to-it' && (
                <div className="text-4xl font-light text-stone-800 leading-tight tracking-wide">
                  {quizVocabulary[currentIndex].de}
                </div>
              )}

              {/* Antwort */}
              {showAnswer && (
                <div className="w-full flex flex-col items-center justify-center mt-2">
                  {currentDirection === 'it-to-de' && (
                    <div className="text-3xl font-light text-amber-800 tracking-wide bg-amber-50 rounded-xl px-6 py-3 shadow-inner border border-amber-100/60">
                      {quizVocabulary[currentIndex].de}
                    </div>
                  )}
                  {currentDirection === 'de-to-it' && (
                    <div className="text-3xl font-light text-amber-800 tracking-wide bg-amber-50 rounded-xl px-6 py-3 shadow-inner border border-amber-100/60">
                      {quizVocabulary[currentIndex].it}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Antwort anzeigen/verstecken Button */}
            <div className="flex justify-center mt-4">
              <button
                onClick={toggleAnswer}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl shadow-lg font-light text-lg hover:from-amber-700 hover:to-amber-800 transition-all flex items-center"
              >
                {showAnswer ? (
                  <>
                    <EyeOff className="mr-2" size={20} />
                    Antwort verstecken
                  </>
                ) : (
                  <>
                    <Eye className="mr-2" size={20} />
                    Antwort anzeigen
                  </>
                )}
              </button>
            </div>

            {/* Bewertungsbuttons */}
            {showAnswer && (
              <div className="mt-6 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((quality) => (
                  <button
                    key={quality}
                    onClick={() => handleQualityRating(quality)}
                    className="px-4 py-3 bg-gradient-to-br from-white to-amber-50 rounded-xl border border-amber-200/60 shadow-sm hover:shadow-md transition-all font-light text-lg"
                  >
                    {quality}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Ladeansicht
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <h2 className="text-xl font-light text-stone-800 mb-2 tracking-wide">Quiz wird vorbereitet...</h2>
          <p className="text-stone-600 font-light">Vokabeln werden geladen</p>
        </div>
      </div>
    );
  }

  return null;
}; 