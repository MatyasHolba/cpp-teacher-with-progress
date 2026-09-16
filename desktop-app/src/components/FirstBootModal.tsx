import React, { useState } from 'react';
import { SyncSettings } from '../types';
import { Languages, Check } from 'lucide-react';
import { getT } from '../utils/i18n';

interface FirstBootModalProps {
  isOpen: boolean;
  settings: SyncSettings;
  onSaveSettings: (settings: SyncSettings) => void;
}

export const FirstBootModal: React.FC<FirstBootModalProps> = ({
  isOpen,
  settings,
  onSaveSettings
}) => {
  const [formData, setFormData] = useState<SyncSettings>(settings);
  const t = getT(formData.uiLanguage || 'en');

  if (!isOpen) return null;

  const handleComplete = () => {
    onSaveSettings({ ...formData, isFirstBoot: false });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-6 text-center border-b border-[var(--border-color)] bg-[var(--bg-header)]">
          <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
            <Languages className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-1">
            {formData.uiLanguage === 'en' ? 'Welcome!' : 'Vítejte!'}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            {formData.uiLanguage === 'en' ? 'Choose your preferred language' : 'Vyberte si preferovaný jazyk'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <button
              onClick={() => setFormData({ ...formData, uiLanguage: 'en', contentLanguage: 'en', githubExportUiLang: 'en', githubExportContentLang: 'en', githubReadmeLang: 'en' })}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                formData.uiLanguage === 'en'
                  ? 'bg-blue-600/20 border-blue-500 text-[var(--text-main)] shadow-sm'
                  : 'bg-[var(--bg-hover)]/40 border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🇬🇧</span>
                <span className="font-semibold">English</span>
              </div>
              {formData.uiLanguage === 'en' && <Check className="w-4 h-4 text-blue-400" />}
            </button>

            <button
              onClick={() => setFormData({ ...formData, uiLanguage: 'cs', contentLanguage: 'cs', githubExportUiLang: 'cs', githubExportContentLang: 'cs', githubReadmeLang: 'cs' })}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                formData.uiLanguage === 'cs'
                  ? 'bg-blue-600/20 border-blue-500 text-[var(--text-main)] shadow-sm'
                  : 'bg-[var(--bg-hover)]/40 border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🇨🇿</span>
                <span className="font-semibold">Čeština</span>
              </div>
              {formData.uiLanguage === 'cs' && <Check className="w-4 h-4 text-blue-400" />}
            </button>
          </div>

          <button
            onClick={handleComplete}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-colors"
          >
            {formData.uiLanguage === 'en' ? 'Continue' : 'Pokračovat'}
          </button>
        </div>
      </div>
    </div>
  );
};
