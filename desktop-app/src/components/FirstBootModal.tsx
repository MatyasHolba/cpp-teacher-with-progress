import React, { useState } from 'react';
import { SyncSettings } from '../types';
import { Languages, Check, ArrowRight, BookOpen } from 'lucide-react';

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
  // Step 1: choose UI language, Step 2: choose content language
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<SyncSettings>({ ...settings });

  if (!isOpen) return null;

  const isEN = formData.uiLanguage === 'en';

  const handleSelectUiLang = (lang: 'cs' | 'en') => {
    setFormData(prev => ({
      ...prev,
      uiLanguage: lang,
      githubExportUiLang: lang,
    }));
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleSelectContentLang = (lang: 'cs' | 'en') => {
    setFormData(prev => ({
      ...prev,
      contentLanguage: lang,
      githubExportContentLang: lang,
      githubReadmeLang: lang
    }));
  };

  const handleComplete = () => {
    onSaveSettings({ ...formData, isFirstBoot: false });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">

        {/* Step indicator */}
        <div className="flex items-center gap-0 h-1">
          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }} />
          <div className="h-full bg-[var(--border-color)] flex-1" />
        </div>

        {step === 1 ? (
          <>
            {/* Step 1: App UI language */}
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-blue-500/15 rounded-full flex items-center justify-center mb-4">
                <Languages className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-main)] mb-1">
                Welcome! / Vítejte!
              </h2>
              <p className="text-xs text-[var(--text-muted)] mb-5">
                Choose the app interface language · Zvolte jazyk rozhraní aplikace
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleSelectUiLang('en')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    formData.uiLanguage === 'en'
                      ? 'bg-blue-600/20 border-blue-500 text-[var(--text-main)]'
                      : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🇬🇧</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">English</div>
                      <div className="text-[10px] text-[var(--text-muted)]">App interface in English</div>
                    </div>
                  </div>
                  {formData.uiLanguage === 'en' && <Check className="w-4 h-4 text-blue-400" />}
                </button>

                <button
                  onClick={() => handleSelectUiLang('cs')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    formData.uiLanguage === 'cs'
                      ? 'bg-blue-600/20 border-blue-500 text-[var(--text-main)]'
                      : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🇨🇿</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Čeština</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Rozhraní aplikace v češtině</div>
                    </div>
                  </div>
                  {formData.uiLanguage === 'cs' && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              </div>

              <button
                onClick={handleNext}
                disabled={!formData.uiLanguage}
                className="w-full mt-5 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                {isEN ? 'Next' : 'Dále'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Course material language */}
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-emerald-500/15 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-main)] mb-1">
                {isEN ? 'Course Language' : 'Jazyk materiálu'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mb-5">
                {isEN
                  ? 'Which language do you want to read the lessons in?'
                  : 'Ve kterém jazyce chceš číst lekce?'}
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleSelectContentLang('en')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    formData.contentLanguage === 'en'
                      ? 'bg-emerald-600/20 border-emerald-500 text-[var(--text-main)]'
                      : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🇬🇧</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">English — Original</div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {isEN ? 'Original learncpp.com content' : 'Originální obsah z learncpp.com'}
                      </div>
                    </div>
                  </div>
                  {formData.contentLanguage === 'en' && <Check className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  onClick={() => handleSelectContentLang('cs')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    formData.contentLanguage === 'cs'
                      ? 'bg-emerald-600/20 border-emerald-500 text-[var(--text-main)]'
                      : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🇨🇿</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Čeština — Přeloženo AI</div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {isEN ? 'AI-translated Czech version' : 'Verze přeložená pomocí AI'}
                      </div>
                    </div>
                  </div>
                  {formData.contentLanguage === 'cs' && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm font-medium transition-colors"
                >
                  {isEN ? 'Back' : 'Zpět'}
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!formData.contentLanguage}
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  {isEN ? 'Start learning →' : 'Začít studovat →'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
