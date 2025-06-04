import React, { useState } from 'react';
import { ArrowLeft, Save, AlertCircle, Check, Tag, BookOpen } from 'lucide-react';
import { useVocabularyManager } from '../hooks/useVocabularyManager';

interface AddVocabularyProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export const AddVocabulary: React.FC<AddVocabularyProps> = ({
  onBack,
  onSuccess
}) => {
  const { addVocabulary, checkDuplicate } = useVocabularyManager();
  
  const [formData, setFormData] = useState({
    it: '',
    de: '',
    notes: '',
    tags: [] as string[]
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Validierung
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.it.trim()) {
      newErrors.it = 'Italienisches Wort ist erforderlich';
    }
    
    if (!formData.de.trim()) {
      newErrors.de = 'Deutsche Übersetzung ist erforderlich';
    }
    
    // Duplikat-Prüfung
    if (formData.it.trim() && formData.de.trim()) {
      if (checkDuplicate(formData.it.trim(), formData.de.trim())) {
        newErrors.duplicate = 'Eine Vokabel mit diesen Werten existiert bereits';
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
      const newVocab = addVocabulary({
        it: formData.it.trim(),
        de: formData.de.trim(),
        notes: formData.notes.trim(),
        tags: formData.tags
      });
      
      console.log('Neue Vokabel erstellt:', newVocab);
      
      // Erfolg anzeigen
      setShowSuccess(true);
      
      // Formular zurücksetzen
      setFormData({
        it: '',
        de: '',
        notes: '',
        tags: []
      });
      
      // Nach 2 Sekunden ausblenden
      setTimeout(() => {
        setShowSuccess(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen:', error);
      setErrors({ submit: 'Fehler beim Speichern der Vokabel' });
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-stone-700 via-amber-800 to-stone-800 text-amber-50 shadow-2xl">
        <div className="flex items-center p-4">
          <button
            onClick={onBack}
            className="mr-3 p-2 hover:bg-stone-700/50 rounded-xl transition-all duration-300"
          >
            <ArrowLeft size={24} className="text-amber-50 opacity-90" />
          </button>
          <h1 className="text-xl font-extralight tracking-widest">Neue Vokabel hinzufügen</h1>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-gradient-to-r from-teal-100 to-emerald-100 border border-teal-300/60 text-teal-800 px-4 py-3 mx-4 mt-4 rounded-2xl shadow-lg">
          <div className="flex items-center font-light">
            <Check className="mr-2 opacity-80" size={20} />
            <span>Vokabel erfolgreich hinzugefügt!</span>
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
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-amber-400 disabled:to-amber-500 text-white font-light py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-lg tracking-wide"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 opacity-80"></div>
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="mr-2 opacity-90" size={20} />
                  Vokabel speichern
                </>
              )}
            </button>
          </form>
        </div>

        {/* Hinweise */}
        <div className="mt-6 p-5 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/60 rounded-3xl shadow-sm">
          <h3 className="font-light text-amber-800 mb-3 tracking-wide">Hinweise:</h3>
          <ul className="text-sm text-amber-700 space-y-2 font-light leading-relaxed">
            <li>• Italienisches Wort und deutsche Übersetzung sind erforderlich</li>
            <li>• Tags und Notizen sind optional</li>
            <li>• Duplikate werden automatisch erkannt</li>
            <li>• Die Vokabel wird mit SM-2 Standard-Werten erstellt</li>
            <li>• Daten werden lokal gespeichert</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 