import React, { useState } from 'react';
import { SyncSettings } from '../types';
import { X, Languages, Save, CheckCircle } from 'lucide-react';
import { getT } from '../utils/i18n';

interface LanguageSettingsModalProps {
  isOpen: boolean;
  settings: SyncSettings;
  onClose: () => void;
  onSaveSettings: (settings: SyncSettings) => void;
}

export const LanguageSettingsModal: React.FC<LanguageSettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSaveSettings
}) => {
  const t = getT(settings.uiLanguage || 'cs');
  const [formData, setFormData] = useState<SyncSettings>({
    ...settings,
    githubExportContentLang: settings.githubExportContentLang || settings.contentLanguage || 'cs',
    githubExportUiLang: settings.githubExportUiLang || settings.uiLanguage || 'cs',
    githubReadmeLang: settings.githubReadmeLang || 'cs'
  });
  
  const [showSaved, setShowSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setShowSaved(true);
    setTimeout(() => {
      setShowSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
          <div className="flex items-center gap-2 text-[var(--text-main)] font-bold text-base">
            <Languages className="w-5 h-5 text-blue-400" />
            <span>{t('langTitle')}</span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-6 text-xs text-[var(--text-main)] max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {showSaved && (
             <div className="p-3 rounded-lg flex items-center gap-2.5 bg-emerald-950/40 text-emerald-300 border border-emerald-800/50">
               <CheckCircle className="w-4 h-4 flex-shrink-0" />
               <span>{t('langSaved')}</span>
             </div>
          )}

          {/* Local App Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {t('localApp')}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--bg-hover)]/30 p-3 rounded-lg border border-[var(--border-color)]">
                <label className="block text-[var(--text-muted)] font-medium mb-1.5">{t('uiLangLabel')}</label>
                <select
                  value={formData.uiLanguage || 'cs'}
                  onChange={e => setFormData({ ...formData, uiLanguage: e.target.value as 'cs' | 'en' })}
                  className="w-full bg-[var(--bg-app)] text-[var(--text-main)] px-3 py-2 rounded border border-[var(--border-color)] focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="cs">🇨🇿 Čeština</option>
                  <option value="en">🇬🇧 English</option>
                </select>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5 leading-tight">{t('uiLangHint')}</p>
              </div>
              
              <div className="bg-[var(--bg-hover)]/30 p-3 rounded-lg border border-[var(--border-color)]">
                <label className="block text-[var(--text-muted)] font-medium mb-1.5">{t('contentLangLabel')}</label>
                <select
                  value={formData.contentLanguage || 'cs'}
                  onChange={e => setFormData({ ...formData, contentLanguage: e.target.value as 'cs' | 'en' })}
                  className="w-full bg-[var(--bg-app)] text-[var(--text-main)] px-3 py-2 rounded border border-[var(--border-color)] focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="cs">🇨🇿 {settings.uiLanguage === 'en' ? 'Czech (Translated)' : 'Přeloženo (Czech)'}</option>
                  <option value="en">🇬🇧 {settings.uiLanguage === 'en' ? 'English (Original)' : 'Originál (English)'}</option>
                </select>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5 leading-tight">{t('contentLangHint')}</p>
              </div>
            </div>
          </div>

          {/* GitHub Export Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {t('exportTitle')}
            </h3>
            
            <div className="bg-[var(--bg-hover)]/30 p-3 rounded-lg border border-[var(--border-color)] space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-muted)] font-medium mb-1.5">{t('exportUiLabel')}</label>
                  <select
                    value={formData.githubExportUiLang || 'cs'}
                    onChange={e => setFormData({ ...formData, githubExportUiLang: e.target.value as 'cs' | 'en' })}
                    className="w-full bg-[var(--bg-app)] text-[var(--text-main)] px-3 py-2 rounded border border-[var(--border-color)] focus:outline-none focus:border-blue-500"
                  >
                    <option value="cs">🇨🇿 Čeština</option>
                    <option value="en">🇬🇧 English</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[var(--text-muted)] font-medium mb-1.5">{t('exportContentLabel')}</label>
                  <select
                    value={formData.githubExportContentLang || 'cs'}
                    onChange={e => setFormData({ ...formData, githubExportContentLang: e.target.value as 'cs' | 'en' })}
                    className="w-full bg-[var(--bg-app)] text-[var(--text-main)] px-3 py-2 rounded border border-[var(--border-color)] focus:outline-none focus:border-blue-500"
                  >
                    <option value="cs">🇨🇿 Čeština</option>
                    <option value="en">🇬🇧 English</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-color)]">
                <label className="block text-[var(--text-muted)] font-medium mb-1.5">{t('exportReadmeLabel')}</label>
                <select
                  value={formData.githubReadmeLang || 'cs'}
                  onChange={e => setFormData({ ...formData, githubReadmeLang: e.target.value as 'cs' | 'en' })}
                  className="w-full bg-[var(--bg-app)] text-[var(--text-main)] px-3 py-2 rounded border border-[var(--border-color)] focus:outline-none focus:border-blue-500 max-w-xs"
                >
                  <option value="cs">🇨🇿 Čeština</option>
                  <option value="en">🇬🇧 English</option>
                </select>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5 leading-tight">{t('exportReadmeHint')}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-color)] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-md transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{t('saveSettings')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
