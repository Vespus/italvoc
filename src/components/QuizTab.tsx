import React from 'react';
import { Play, Clock, Brain, Target, Shuffle } from 'lucide-react';
import { useVocabularyManager } from '../hooks/useVocabularyManager';
import { useQuizSettings } from './Settings';
import { getLearningStats, getDueVocabulary } from '../utils/sm2Algorithm';
import { QuizMode } from './QuizSelection';

interface QuizTabProps {
  onStartQuiz: (mode: QuizMode) => void;
  onSettings: () => void;
}

export const QuizTab: React.FC<QuizTabProps> = ({
  onStartQuiz,
  onSettings
}) => {
  const { vocabulary, getStats } = useVocabularyManager();
  const quizSettings = useQuizSettings();
  const stats = getLearningStats(vocabulary);

  const quizModes = [
    {
      id: 'due' as QuizMode,
      title: 'Fällige Wiederholungen',
      description: 'Heute zu lernende Vokabeln',
      icon: Clock,
      count: stats.due,
      color: 'bg-gradient-to-r from-stone-600 to-amber-700 hover:from-stone-700 hover:to-amber-800',
      disabled: stats.due === 0,
      priority: true
    },
    {
      id: 'new' as QuizMode,
      title: 'Neue Vokabeln',
      description: 'Noch nicht gelernte Begriffe',
      icon: Brain,
      count: stats.new,
      color: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700',
      disabled: stats.new === 0,
      priority: false
    },
    {
      id: 'review' as QuizMode,
      title: 'Wiederholung',
      description: 'Bereits gelernte Vokabeln üben',
      icon: Target,
      count: stats.review + stats.learning,
      color: 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800',
      disabled: (stats.review + stats.learning) === 0,
      priority: false
    },
    {
      id: 'random' as QuizMode,
      title: 'Zufällige Auswahl',
      description: 'Gemischte Vokabeln',
      icon: Shuffle,
      count: vocabulary.length,
      color: 'bg-gradient-to-r from-stone-500 to-stone-600 hover:from-stone-600 hover:to-stone-700',
      disabled: vocabulary.length === 0,
      priority: false
    }
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-700 via-amber-800 to-stone-800 text-amber-50 p-4 shadow-2xl">
        <div className="mb-2 flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl text-amber-200/90 font-extralight tracking-wide text-center" style={{ fontFamily: 'serif' }}>
            Amore per l'apprendimento • Liebe zum Lernen
          </h1>
        </div>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-base md:text-lg">
          <div>
            <div className="font-extralight tracking-wider">{getStats().learned}</div>
            <div className="text-xs md:text-sm text-amber-100 font-light">Gelernt</div>
          </div>
          <div>
            <div className="font-extralight tracking-wider">{stats.due}</div>
            <div className="text-xs md:text-sm text-amber-100 font-light">Fällig heute</div>
          </div>
          <div>
            <div className="font-extralight tracking-wider">{stats.mastered}</div>
            <div className="text-xs md:text-sm text-amber-100 font-light">Gemeistert</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 p-4"> {/* pb-20 für Tab Bar */}
        
        {/* Aktuelle Einstellungen */}
        <div className="bg-gradient-to-br from-amber-50 to-stone-100 rounded-3xl border border-amber-200/50 p-4 mb-6 shadow-lg">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600 font-light">Abfragerichtung:</span>
              <span className="font-light text-stone-800">
                {quizSettings.direction === 'it-to-de' && 'Italienisch → Deutsch'}
                {quizSettings.direction === 'de-to-it' && 'Deutsch → Italienisch'}
                {quizSettings.direction === 'random' && 'Zufällig'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600 font-light">Vokabeln pro Quiz:</span>
              <span className="font-light text-stone-800">{quizSettings.wordsPerQuiz}</span>
            </div>
          </div>
        </div>

        {/* Quiz Modi */}
        <div className="space-y-4">
          {quizModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => !mode.disabled && onStartQuiz(mode.id)}
                disabled={mode.disabled}
                className={`w-full p-5 rounded-3xl border transition-all duration-300 ${
                  mode.disabled 
                    ? 'bg-stone-100 border-stone-200 cursor-not-allowed' 
                    : `${mode.color} text-white border-transparent shadow-2xl hover:shadow-3xl transform hover:scale-[1.02]`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-2xl mr-4 ${
                      mode.disabled 
                        ? 'bg-stone-200' 
                        : 'bg-white/15 backdrop-blur-sm'
                    }`}>
                      <Icon 
                        size={24} 
                        className={mode.disabled ? 'text-stone-400' : 'text-white opacity-90'} 
                      />
                    </div>
                    <div className="text-left">
                      <div className={`font-light text-lg tracking-wide ${
                        mode.disabled ? 'text-stone-500' : 'text-white'
                      }`}>
                        {mode.title}
                      </div>
                      <div className={`text-sm font-extralight ${
                        mode.disabled ? 'text-stone-400' : 'text-white/90'
                      }`}>
                        {mode.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`text-3xl font-extralight mr-3 tracking-wider ${
                      mode.disabled ? 'text-stone-400' : 'text-white'
                    }`}>
                      {mode.count}
                    </span>
                    {!mode.disabled && <Play size={18} className="text-white opacity-90" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Empfehlung */}
        {stats.due > 0 && (
          <div className="mt-6 p-5 bg-gradient-to-br from-amber-50 to-stone-100 border border-amber-200/60 rounded-3xl shadow-lg">
            <div className="flex items-center text-amber-800 mb-3">
              <Clock className="mr-2 opacity-80" size={16} />
              <span className="font-light tracking-wide">Empfehlung:</span>
            </div>
            <p className="text-stone-700 text-sm font-light leading-relaxed">
              Du hast {stats.due} fällige Vokabeln. Starte am besten mit "Fällige Wiederholungen" 
              für optimales Lernen nach dem SM-2 System.
            </p>
          </div>
        )}

        {/* Leer State */}
        {vocabulary.length === 0 && (
          <div className="text-center py-8 text-stone-500">
            <Brain size={48} className="mx-auto mb-4 text-stone-300 opacity-60" />
            <h3 className="text-lg font-light mb-2 tracking-wide">Keine Vokabeln vorhanden</h3>
            <p className="text-sm font-light">
              Füge zuerst einige Vokabeln hinzu, um mit dem Quiz zu beginnen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 