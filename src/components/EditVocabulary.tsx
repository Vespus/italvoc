import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, AlertCircle, Check, Trash2, Tag, BookOpen } from 'lucide-react';
import { useVocabularyManager } from '../hooks/useVocabularyManager';
import { VocabularyCard as VocabType } from '../types/vocabulary';

interface EditVocabularyProps {
  vocabId: string;
  onBack: () => void;
  onSuccess?: () => void;
  onDelete?: () => void;
}

export const EditVocabulary: React.FC<EditVocabularyProps> = ({
  vocabId,
  onBack,
  onSuccess,
  onDelete
}) => {
  const { getVocabularyById, updateVocabulary, deleteVocabulary, checkDuplicate, isLoading } = useVocabularyManager();
  
  const [formData, setFormData] = useState({
    it: '',
    de: '',
    notes: '',
    tags: [] as string[]
  });
  
  const [originalVocab, setOriginalVocab] = useState<VocabType | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Vokabel laden
  useEffect(() => {
    // Warte bis die Daten geladen sind
    if (isLoading) return;
    
    const vocab = getVocabularyById(vocabId);
    if (vocab) {
      setOriginalVocab(vocab);
      setFormData({
        it: vocab.it,
        de: vocab.de,
        notes: vocab.notes || '',
        tags: vocab.tags || []
      });
      // Lösche eventuelle Load-Fehler
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.load;
        return newErrors;
      });
    } else {
      setErrors({ load: 'Vokabel nicht gefunden' });
    }
  }, [vocabId, getVocabularyById, isLoading]);

  // Validierung
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.it.trim()) {
      newErrors.it = 'Italienisches Wort ist erforderlich';
    }
    
    if (!formData.de.trim()) {
      newErrors.de = 'Deutsche Übersetzung ist erforderlich';
    }
    
    // Duplikat-Prüfung (außer für die aktuelle Vokabel)
    if (formData.it.trim() && formData.de.trim()) {
      if (checkDuplicate(formData.it.trim(), formData.de.trim(), vocabId)) {
        newErrors.duplicate = 'Eine andere Vokabel mit diesen Werten existiert bereits';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedVocab = updateVocabulary(vocabId, {
        it: formData.it.trim(),
        de: formData.de.trim(),
        notes: formData.notes.trim(),
        tags: formData.tags
      });
      
      console.log('Vokabel aktualisiert:', updatedVocab);
      
      // Erfolg anzeigen
      setShowSuccess(true);
      
      // Nach 2 Sekunden ausblenden
      setTimeout(() => {
        setShowSuccess(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      setErrors({ submit: 'Fehler beim Speichern der Änderungen' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Löschen bestätigen
  const handleDelete = () => {
    try {
      deleteVocabulary(vocabId);
      console.log('Vokabel gelöscht:', vocabId);
      
      if (onDelete) {
        onDelete();
      }
      onBack();
      
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      setErrors({ delete: 'Fehler beim Löschen der Vokabel' });
    }
  };

  // Input-Handler
  const handleInputChange = (field: keyof typeof formData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Fehler für dieses Feld löschen
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Tag-Handler
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  // Prüfen ob Änderungen vorliegen
  const hasChanges = originalVocab && (
    formData.it !== originalVocab.it ||
    formData.de !== originalVocab.de ||
    formData.notes !== (originalVocab.notes || '') ||
    JSON.stringify(formData.tags) !== JSON.stringify(originalVocab.tags || [])
  );

  // Loading-Zustand anzeigen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-stone-600 font-light">Lade Vokabel...</p>
        </div>
      </div>
    );
  }

  if (errors.load) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-r from-rose-100 to-rose-200 border border-rose-300/60 text-rose-800 px-6 py-4 rounded-3xl max-w-md shadow-lg">
          <p className="font-light text-lg mb-2">Fehler</p>
          <p className="font-light mb-4">{errors.load}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl hover:from-rose-600 hover:to-rose-700 transition-all duration-300 font-light tracking-wide"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-extralight tracking-widest">Vokabel bearbeiten</h1>
          </div>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-rose-300 hover:bg-rose-500/20 rounded-xl transition-all duration-300"
            title="Vokabel löschen"
          >
            <Trash2 size={20} className="opacity-90" />
          </button>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-gradient-to-r from-teal-100 to-emerald-100 border border-teal-300/60 text-teal-800 px-4 py-3 mx-4 mt-4 rounded-2xl shadow-lg">
          <div className="flex items-center font-light">
            <Check className="mr-2 opacity-80" size={20} />
            <span>Änderungen erfolgreich gespeichert!</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-amber-50 to-stone-100 rounded-3xl p-6 max-w-sm w-full border border-amber-200/50 shadow-2xl">
            <h3 className="text-lg font-light text-stone-800 mb-4 tracking-wide">Vokabel löschen?</h3>
            <p className="text-stone-600 mb-6 font-light leading-relaxed">
              Möchtest du diese Vokabel wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-all duration-300 font-light tracking-wide"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl hover:from-rose-600 hover:to-rose-700 transition-all duration-300 font-light tracking-wide shadow-lg"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="p-4 max-w-md mx-auto">
        <div className="bg-gradient-to-br from-white to-amber-50 rounded-3xl border border-amber-300/60 shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Italienisch */}
            <div>
              <label htmlFor="it" className="block text-sm font-light text-stone-700 mb-3 tracking-wide">
                Italienisch *
              </label>
              <input
                id="it"
                type="text"
                value={formData.it}
                onChange={(e) => handleInputChange('it', e.target.value)}
                className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-2xl font-light bg-white/80 backdrop-blur-sm ${
                  errors.it ? 'border-rose-400' : 'border-stone-300/60'
                }`}
              />
              {errors.it && (
                <p className="mt-2 text-sm text-rose-600 flex items-center font-light">
                  <AlertCircle size={16} className="mr-1 opacity-80" />
                  {errors.it}
                </p>
              )}
            </div>

            {/* Deutsch */}
            <div>
              <label htmlFor="de" className="block text-sm font-light text-stone-700 mb-3 tracking-wide">
                Deutsche Übersetzung *
              </label>
              <input
                id="de"
                type="text"
                value={formData.de}
                onChange={(e) => handleInputChange('de', e.target.value)}
                className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent font-light bg-white/80 backdrop-blur-sm tracking-wide ${
                  errors.de ? 'border-rose-400' : 'border-stone-300/60'
                }`}
              />
              {errors.de && (
                <p className="mt-2 text-sm text-rose-600 flex items-center font-light">
                  <AlertCircle size={16} className="mr-1 opacity-80" />
                  {errors.de}
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-light text-stone-700 mb-3 tracking-wide">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-sm font-light flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-stone-400 hover:text-stone-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Neuer Tag..."
                  className="flex-1 px-4 py-2 border border-stone-300/60 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent font-light bg-white/80 backdrop-blur-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all duration-300 font-light"
                >
                  <Tag size={18} />
                </button>
              </div>
            </div>

            {/* Notizen */}
            <div>
              <label htmlFor="notes" className="block text-sm font-light text-stone-700 mb-3 tracking-wide">
                Notizen
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent font-light bg-white/80 backdrop-blur-sm tracking-wide min-h-[100px]"
                placeholder="Zusätzliche Notizen oder Beispielsätze..."
              />
            </div>

            {/* Duplikat-Fehler */}
            {errors.duplicate && (
              <div className="bg-gradient-to-r from-rose-100 to-rose-200 border border-rose-300/60 text-rose-800 px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex items-center font-light">
                  <AlertCircle className="mr-2 opacity-80" size={20} />
                  <span>{errors.duplicate}</span>
                </div>
              </div>
            )}

            {/* Submit-Fehler */}
            {errors.submit && (
              <div className="bg-gradient-to-r from-rose-100 to-rose-200 border border-rose-300/60 text-rose-800 px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex items-center font-light">
                  <AlertCircle className="mr-2 opacity-80" size={20} />
                  <span>{errors.submit}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !hasChanges}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-stone-400 disabled:to-stone-500 text-white font-light py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-lg tracking-wide"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 opacity-80"></div>
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="mr-2 opacity-90" size={20} />
                  {hasChanges ? 'Änderungen speichern' : 'Keine Änderungen'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* SM-2 Info */}
        {originalVocab && (
          <div className="mt-6 p-5 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/60 rounded-3xl shadow-sm">
            <h3 className="font-light text-amber-800 mb-3 tracking-wide">SM-2 Statistiken:</h3>
            <div className="text-sm text-amber-700 space-y-2 font-light leading-relaxed">
              <div>Wiederholungen: {originalVocab.sm2.repetitions}</div>
              <div>Intervall: {originalVocab.sm2.interval} Tag{originalVocab.sm2.interval !== 1 ? 'e' : ''}</div>
              <div>Schwierigkeitsfaktor: {originalVocab.sm2.easeFactor.toFixed(2)}</div>
              {originalVocab.sm2.lastReview && (
                <div>Letzte Wiederholung: {new Date(originalVocab.sm2.lastReview).toLocaleDateString('de-DE')}</div>
              )}
              {originalVocab.sm2.nextReview && (
                <div>Nächste Wiederholung: {new Date(originalVocab.sm2.nextReview).toLocaleDateString('de-DE')}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 