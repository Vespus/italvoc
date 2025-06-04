import React from 'react';
import { TrendingUp, Calendar, Target, Award, Clock, Brain, BarChart3 } from 'lucide-react';
import { useVocabularyManager } from '../hooks/useVocabularyManager';
import { getLearningStats } from '../utils/sm2Algorithm';

export const StatsTab: React.FC = () => {
  const { vocabulary } = useVocabularyManager();
  const stats = getLearningStats(vocabulary);

  const statCards = [
    {
      title: 'Gesamt',
      value: stats.total,
      icon: Brain,
      color: 'bg-gradient-to-br from-stone-600 to-stone-700',
      description: 'Vokabeln insgesamt'
    },
    {
      title: 'Neue',
      value: stats.new,
      icon: Target,
      color: 'bg-gradient-to-br from-teal-500 to-teal-600',
      description: 'Noch zu lernen'
    },
    {
      title: 'Lernphase',
      value: stats.learning,
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-amber-500 to-amber-600',
      description: 'In Bearbeitung'
    },
    {
      title: 'Wiederholung',
      value: stats.review,
      icon: Calendar,
      color: 'bg-gradient-to-br from-amber-600 to-amber-700',
      description: 'Regelmäßig üben'
    },
    {
      title: 'Fällig heute',
      value: stats.due,
      icon: Clock,
      color: 'bg-gradient-to-br from-rose-400 to-rose-500',
      description: 'Zu wiederholen'
    },
    {
      title: 'Gemeistert',
      value: stats.mastered,
      icon: Award,
      color: 'bg-gradient-to-br from-amber-700 to-amber-800',
      description: 'Gut gelernt'
    }
  ];

  const progressPercentage = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-700 via-amber-800 to-stone-800 text-amber-50 p-6 shadow-2xl">
        <h1 className="text-2xl font-extralight tracking-widest mb-2">Lernstatistiken</h1>
        <p className="text-amber-100 font-light">Dein Fortschritt im Überblick</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 p-4"> {/* pb-20 für Tab Bar */}
        
        {/* Fortschrittsübersicht */}
        <div className="bg-gradient-to-br from-white to-amber-50 rounded-3xl border border-amber-300/60 p-6 mb-6 shadow-lg">
          <h2 className="text-lg font-light text-stone-800 mb-4 tracking-wide">Gesamtfortschritt</h2>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-stone-600 mb-3 font-light">
              <span>Gemeisterte Vokabeln</span>
              <span>{stats.mastered} von {stats.total} ({progressPercentage}%)</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-4 shadow-inner">
              <div 
                className="bg-gradient-to-r from-amber-600 to-amber-700 h-4 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl border border-rose-200/60 shadow-sm">
              <div className="text-2xl font-extralight text-rose-700 tracking-wider">{stats.due}</div>
              <div className="text-sm text-rose-600 font-light">Fällig heute</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl border border-teal-200/60 shadow-sm">
              <div className="text-2xl font-extralight text-teal-700 tracking-wider">{stats.new}</div>
              <div className="text-sm text-teal-600 font-light">Neue Vokabeln</div>
            </div>
          </div>
        </div>

        {/* Detaillierte Statistiken */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-300/60 p-4 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl ${card.color} shadow-sm`}>
                    <Icon size={20} className="text-white opacity-90" />
                  </div>
                  <span className="text-2xl font-extralight text-stone-800 tracking-wider">{card.value}</span>
                </div>
                <div>
                  <div className="font-light text-stone-800 text-sm tracking-wide">{card.title}</div>
                  <div className="text-xs text-stone-500 font-light">{card.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SM-2 Insights */}
        <div className="bg-gradient-to-br from-white to-amber-50 rounded-3xl border border-amber-300/60 p-6 mb-6 shadow-lg">
          <h2 className="text-lg font-light text-stone-800 mb-4 tracking-wide">Lern-Insights</h2>
          
          <div className="space-y-4">
            {stats.due > 0 && (
              <div className="flex items-start p-4 bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200/60 rounded-2xl shadow-sm">
                <Clock className="mr-3 mt-0.5 text-rose-600 opacity-80" size={16} />
                <div>
                  <div className="font-light text-rose-800 tracking-wide">Fällige Wiederholungen</div>
                  <div className="text-sm text-rose-700 font-light leading-relaxed">
                    {stats.due} Vokabeln sollten heute wiederholt werden für optimales Lernen.
                  </div>
                </div>
              </div>
            )}
            
            {stats.overdue > 0 && (
              <div className="flex items-start p-4 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/60 rounded-2xl shadow-sm">
                <Calendar className="mr-3 mt-0.5 text-amber-700 opacity-80" size={16} />
                <div>
                  <div className="font-light text-amber-800 tracking-wide">Überfällige Vokabeln</div>
                  <div className="text-sm text-amber-700 font-light leading-relaxed">
                    {stats.overdue} Vokabeln sind überfällig. Wiederhole sie bald, um das Gelernte nicht zu vergessen.
                  </div>
                </div>
              </div>
            )}
            
            {stats.mastered > 0 && (
              <div className="flex items-start p-4 bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300/60 rounded-2xl shadow-sm">
                <Award className="mr-3 mt-0.5 text-amber-700 opacity-80" size={16} />
                <div>
                  <div className="font-light text-amber-800 tracking-wide">Gut gemacht!</div>
                  <div className="text-sm text-amber-700 font-light leading-relaxed">
                    Du hast bereits {stats.mastered} Vokabeln gemeistert. Weiter so!
                  </div>
                </div>
              </div>
            )}
            
            {stats.new > 0 && (
              <div className="flex items-start p-4 bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200/60 rounded-2xl shadow-sm">
                <Brain className="mr-3 mt-0.5 text-teal-600 opacity-80" size={16} />
                <div>
                  <div className="font-light text-teal-800 tracking-wide">Neue Herausforderungen</div>
                  <div className="text-sm text-teal-700 font-light leading-relaxed">
                    {stats.new} neue Vokabeln warten darauf, gelernt zu werden.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leer State */}
        {stats.total === 0 && (
          <div className="text-center py-12 text-stone-500">
            <BarChart3 size={48} className="mx-auto mb-4 text-stone-300 opacity-60" />
            <h3 className="text-lg font-light mb-2 tracking-wide">Keine Daten verfügbar</h3>
            <p className="text-sm font-light">
              Füge Vokabeln hinzu und starte ein Quiz, um Statistiken zu sehen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 