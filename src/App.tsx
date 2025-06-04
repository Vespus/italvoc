import React, { useState } from 'react';
import { TabBar, TabType } from './components/TabBar';
import { QuizTab } from './components/QuizTab';
import { VocabularyTab } from './components/VocabularyTab';
import { StatsTab } from './components/StatsTab';
import { AddVocabulary } from './components/AddVocabulary';
import { EditVocabulary } from './components/EditVocabulary';
import { QuizMode } from './components/QuizSelection';
import { Quiz } from './components/Quiz';
import { Settings } from './components/Settings';

import { VocabularyCard as VocabType } from './types/vocabulary';

type AppView = 'tab' | 'add' | 'quiz' | 'settings' | 'edit';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('tab');
  const [activeTab, setActiveTab] = useState<TabType>('quiz');
  const [editingVocabId, setEditingVocabId] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState<QuizMode>('due');
  const [repeatVocabulary, setRepeatVocabulary] = useState<VocabType[] | null>(null);

  // Handler für Vokabel-Aktionen
  const handleEditVocab = (vocab: VocabType) => {
    setEditingVocabId(vocab.id);
    setCurrentView('edit');
  };

  const handleDeleteVocab = (vocab: VocabType) => {
    // Wird direkt in der Suchkomponente über den Manager gehandhabt
    console.log('Lösche Vokabel:', vocab);
  };

  // Navigation Handler
  const navigateTo = (view: AppView) => {
    setCurrentView(view);
  };

  // Tab Handler
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentView('tab');
  };

  // Render verschiedene Views

  if (currentView === 'add') {
    return (
      <AddVocabulary
        onBack={() => {
          setActiveTab('vocabulary');
          navigateTo('tab');
        }}
        onSuccess={() => {
          // Nach erfolgreichem Hinzufügen zu Vokabeln-Tab wechseln
          setTimeout(() => {
            setActiveTab('vocabulary');
            navigateTo('tab');
          }, 2000);
        }}
      />
    );
  }

  if (currentView === 'edit' && editingVocabId) {
    return (
      <EditVocabulary
        vocabId={editingVocabId}
        onBack={() => {
          setEditingVocabId(null);
          setActiveTab('vocabulary');
          navigateTo('tab');
        }}
        onSuccess={() => {
          // Nach erfolgreichem Bearbeiten zu Vokabeln-Tab zurück
          setTimeout(() => {
            setEditingVocabId(null);
            setActiveTab('vocabulary');
            navigateTo('tab');
          }, 2000);
        }}
        onDelete={() => {
          setEditingVocabId(null);
          setActiveTab('vocabulary');
          navigateTo('tab');
        }}
      />
    );
  }

  if (currentView === 'quiz') {
    return (
      <Quiz
        mode={quizMode}
        repeatVocabulary={repeatVocabulary || undefined}
        onBack={() => {
          setRepeatVocabulary(null);
          setActiveTab('quiz');
          navigateTo('tab');
        }}
        onComplete={(wrongVocabs?: VocabType[]) => {
          if (wrongVocabs && wrongVocabs.length > 0) {
            setRepeatVocabulary(wrongVocabs);
            // Quiz wird mit repeatVocabulary neu gestartet
          } else {
            setRepeatVocabulary(null);
            setActiveTab('quiz');
            navigateTo('tab');
          }
        }}
      />
    );
  }

  if (currentView === 'settings') {
    return <Settings />;
  }

  // Tab-basierte Navigation (Standard)
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'quiz' && (
          <QuizTab
            onStartQuiz={(mode) => {
              setQuizMode(mode);
              navigateTo('quiz');
            }}
            onSettings={() => navigateTo('settings')}
          />
        )}
        
        {activeTab === 'vocabulary' && (
          <VocabularyTab
            onEditVocab={handleEditVocab}
            onAddVocab={() => navigateTo('add')}
          />
        )}
        
        {activeTab === 'stats' && <StatsTab />}
        
        {activeTab === 'settings' && <Settings />}
      </div>

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default App;
