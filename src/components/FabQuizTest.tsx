import React, { useState } from 'react';

const QUALITY_LABELS = [
  { value: 0, label: 'Keine Ahnung', color: 'bg-rose-400' },
  { value: 1, label: 'Falsch aber vertraut', color: 'bg-rose-500' },
  { value: 2, label: 'Falsch aber erinnert', color: 'bg-amber-400' },
  { value: 3, label: 'Richtig aber mühsam', color: 'bg-amber-500' },
  { value: 4, label: 'Richtig nach Zögern', color: 'bg-teal-500' },
  { value: 5, label: 'Sofort richtig', color: 'bg-emerald-500' },
];

interface FabQuizTestProps {
  onBack: () => void;
}

export const FabQuizTest: React.FC<FabQuizTestProps> = ({ onBack }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-stone-700 via-amber-800 to-stone-800 text-amber-50 shadow-2xl px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-stone-700/50 transition-all"
        >
          ← Zurück
        </button>
        <h1 className="text-lg font-extralight tracking-wide">FAB-Quiz-Test</h1>
        <div style={{ width: 44 }} />
      </header>

      {/* Beispielkarte */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 pb-32">
        <div className="bg-gradient-to-br from-white to-amber-50 rounded-3xl border border-amber-200/60 shadow-lg p-8 w-full max-w-md text-center">
          <div className="mb-6">
            <div className="inline-flex items-center px-5 py-2 bg-stone-100/80 text-stone-600 text-sm font-light rounded-full border border-stone-200/60 shadow-sm mb-4">
              Japanisch → Deutsch
            </div>
            <div className="text-6xl font-extralight text-stone-800 mb-2" style={{ fontFamily: 'serif' }}>犬</div>
            <div className="text-2xl text-stone-700 mb-1 font-light">いぬ</div>
            <div className="text-lg text-stone-500 font-light">inu</div>
          </div>
          <div className="border-t border-amber-200/60 pt-6">
            <h3 className="text-lg font-light text-stone-700 mb-4 tracking-wide">Deutsche Bedeutung:</h3>
            {showAnswer ? (
              <div className="text-3xl font-light text-amber-800 mb-4">Hund</div>
            ) : (
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full py-4 px-6 bg-gradient-to-r from-stone-600 to-amber-700 text-amber-50 rounded-2xl hover:from-stone-700 hover:to-amber-800 transition-all duration-500 font-light text-lg shadow-xl min-h-[56px] flex items-center justify-center tracking-wide"
              >
                Antwort anzeigen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      {showAnswer && (
        <div className="fixed bottom-0 left-0 right-0 pb-4 flex flex-col items-center z-40">
          <div className="w-full max-w-md mx-auto grid grid-cols-3 gap-3 bg-white/80 rounded-2xl shadow-2xl p-4 border border-amber-200/60">
            {QUALITY_LABELS.map(q => (
              <button
                key={q.value}
                onClick={() => setSelected(q.value)}
                className={`min-w-[90px] max-w-[120px] py-3 px-1 rounded-2xl text-white font-light text-center transition-all duration-200 shadow-lg text-[0.98rem] leading-tight ${q.color} ${selected === q.value ? 'ring-4 ring-amber-400 scale-105' : ''}`}
                style={{ touchAction: 'manipulation' }}
              >
                <span className="block break-words whitespace-pre-line">{q.label}</span>
              </button>
            ))}
          </div>
          {selected !== null && (
            <div className="mt-2 text-stone-700 font-light">Ausgewählt: {QUALITY_LABELS[selected].label}</div>
          )}
        </div>
      )}
    </div>
  );
}; 