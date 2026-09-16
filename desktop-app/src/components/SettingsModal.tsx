import React, { useState, useEffect } from 'react';
import { SyncSettings, UserProgress, TOCData } from '../types';
import { X, CloudUpload, CloudDownload, CheckCircle, AlertCircle, Loader2, Globe, Database, Key } from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { PortfolioWidgetModal } from './PortfolioWidgetModal';
import { Sparkles } from 'lucide-react';
import { pushToGitHub, pullFromGitHub } from '../services/github';
import { getT } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  settings: SyncSettings;
  progress: UserProgress;
  toc: TOCData | null;
  onClose: () => void;
  onSaveSettings: (settings: SyncSettings) => void;
  onProgressUpdated: (progress: UserProgress) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  progress,
  toc,
  onClose,
  onSaveSettings,
  onProgressUpdated
}) => {
  const t = getT(settings.uiLanguage || 'cs');
  const [formData, setFormData] = useState<SyncSettings>(settings);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setStatusMessage({ 
      type: 'success', 
      text: settings.uiLanguage === 'en' ? 'Settings saved locally.' : 'Nastavení bylo úspěšně uloženo lokálně.' 
    });
  };

  const handlePush = async () => {
    setIsPushing(true);
    setStatusMessage(null);
    const result = await pushToGitHub(progress, formData, toc);
    setIsPushing(false);

    if (result.success) {
      const updatedSettings = { ...formData, lastSyncAt: new Date().toISOString() };
      setFormData(updatedSettings);
      onSaveSettings(updatedSettings);
      setStatusMessage({ type: 'success', text: result.message });
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handlePull = async () => {
    const confirmMsg = settings.uiLanguage === 'en' 
      ? 'Do you really want to pull data from GitHub? This will overwrite your local unsaved progress.'
      : 'Opravdu chcete načíst data z GitHubu? Toto přepíše lokální neuložený stav novými daty z cloudu.';
    if (!confirm(confirmMsg)) {
      return;
    }
    setIsPulling(true);
    setStatusMessage(null);
    const result = await pullFromGitHub(formData);
    setIsPulling(false);

    if (result.success && result.progress) {
      onProgressUpdated(result.progress);
      setStatusMessage({ type: 'success', text: result.message });
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
          <div className="flex items-center gap-2 text-[var(--text-main)] font-bold text-base">
            <GithubIcon className="w-5 h-5 text-blue-400" />
            <span>{t('settingsTitle')}</span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs text-[var(--text-main)]">
          {/* Status message */}
          {statusMessage && (
            <div className={`p-3 rounded-lg flex items-start gap-2.5 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50' 
                : 'bg-red-950/40 text-red-300 border border-red-800/50'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-tight">{statusMessage.text}</span>
            </div>
          )}

          {/* GitHub Credentials */}
          <div className="space-y-3 bg-[var(--bg-header-alt)] p-3.5 rounded-lg border border-[var(--border-color)]">
            <div className="font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('githubAccess')}</span>
            </div>

            <div>
              <label className="block text-[var(--text-muted)] mb-1">{t('githubToken')}</label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={formData.githubToken}
                onChange={e => setFormData({ ...formData, githubToken: e.target.value })}
                className="w-full bg-[var(--bg-hover)] text-[var(--text-main)] px-3 py-2 rounded border border-[var(--border-color)] focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                {t('githubTokenHint')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[var(--text-muted)] mb-1">{t('githubOwner')}</label>
                <input
                  type="text"
                  placeholder="např. matyasholba"
                  value={formData.repoOwner}
                  onChange={e => setFormData({ ...formData, repoOwner: e.target.value })}
                  className="w-full bg-[var(--bg-hover)] text-[var(--text-main)] px-3 py-2 rounded border border-[var(--border-color)] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1">{t('githubRepo')}</label>
                <input
                  type="text"
                  placeholder="cpp-learning-progress"
                  value={formData.repoName}
                  onChange={e => setFormData({ ...formData, repoName: e.target.value })}
                  className="w-full bg-[var(--bg-hover)] text-[var(--text-main)] px-3 py-2 rounded border border-[var(--border-color)] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Sync Mode Selection */}
          <div className="space-y-2">
            <label className="font-semibold text-[var(--text-main)] block">{t('syncModeTitle')}</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'data-only' })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  formData.mode === 'data-only'
                    ? 'bg-blue-600/20 border-blue-500 text-[var(--text-main)] shadow-sm'
                    : 'bg-[var(--bg-hover)]/40 border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span>{t('syncModeData')}</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                  {t('syncModeDataDesc')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'full-web' })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  formData.mode === 'full-web'
                    ? 'bg-emerald-600/20 border-emerald-500 text-[var(--text-main)] shadow-sm'
                    : 'bg-[var(--bg-hover)]/40 border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>{t('syncModeFull')}</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                  {t('syncModeFullDesc')}
                </p>
              </button>
            </div>
            {formData.mode === 'full-web' && formData.repoOwner && formData.repoName && (
              <div className="text-[11px] bg-emerald-950/30 border border-emerald-800/40 rounded p-2 text-emerald-300 flex items-center justify-between">
                <span>🌐 GitHub Pages URL:</span>
                <span className="font-mono select-all">https://{formData.repoOwner}.github.io/{formData.repoName}/</span>
              </div>
            )}
          </div>



          {/* Help Section */}
          <details className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-header-alt)] border border-[var(--border-color)] rounded-lg p-3 cursor-pointer group">
            <summary className="font-semibold text-[var(--text-main)] flex items-center justify-between select-none">
              <span>{settings.uiLanguage === 'en' ? 'Need help with setup? Click here' : 'Máš problém se zobrazením stránky nebo nastavením? Klikni zde'}</span>
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 space-y-2 cursor-text select-text">
              {settings.uiLanguage === 'en' ? (
                <>
                  <p><strong>1. How to get a PAT token:</strong><br/>
                  Go to <em>GitHub.com → Settings → Developer Settings → Personal access tokens → Tokens (classic)</em>. Click <strong>Generate new token (classic)</strong>. Check the <strong>repo</strong> scope. Copy the token (starts with <code>ghp_</code>) and paste it here.</p>
                  <p><strong>2. What is Owner and Repo Name?</strong><br/>
                  If your project URL is <code>https://github.com/John123/my-site</code>, the Owner is <code>John123</code> and repo name is <code>my-site</code>.</p>
                  <p><strong>3. How to enable GitHub Pages?</strong><br/>
                  Go to your repository: <em>Settings → Pages</em>. Under <strong>Build and deployment</strong>, select <strong>Deploy from a branch</strong> and choose <strong>main</strong> (or master). Save. Your site will be live in a few minutes.</p>
                </>
              ) : (
                <>
                  <p><strong>1. Jak získat token (PAT):</strong><br/>
                  Běž na <em>GitHub.com → Settings → Developer Settings → Personal access tokens → Tokens (classic)</em>. Zvol <strong>Generate new token (classic)</strong>. Zaškrtni sekci <strong>repo</strong> (plný přístup) a případně <strong>workflow</strong> (pokud by ses rozhodl použít akce). Token zkopíruj a vlož sem (začíná na <code>ghp_</code>).</p>
                  
                  <p><strong>2. Co je to Vlastník a Název repozitáře?</strong><br/>
                  Když máš na GitHubu projekt např. <code>https://github.com/Pepa123/moje-stranka</code>, pak je Vlastník <code>Pepa123</code> a název <code>moje-stranka</code>.</p>

                  <p><strong>3. Jak zprovoznit GitHub Pages?</strong><br/>
                  Aby fungoval Režim 2 (kompletní web), nahraje se na tvůj GitHub soubor <code>index.html</code>. Poté musíš jít na GitHub do svého repozitáře: <em>Settings → Pages</em>. V sekci <strong>Build and deployment</strong> zvol <strong>Deploy from a branch</strong> a vyber větev <strong>main</strong> (případně <strong>master</strong>). Ulož to. Během pár minut GitHub stránku vygeneruje a ty ji najdeš na adrese <code>https://[Vlastnik].github.io/[Nazev_repozitare]/</code>.</p>
                </>
              )}
            </div>
          </details>

          {/* 1-Click Sync Buttons */}
          <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePull}
              disabled={isPulling || isPushing || !formData.githubToken}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-[var(--text-main)] hover:text-[var(--text-main)] border border-[var(--border-color)] transition-colors disabled:opacity-50"
            >
              {isPulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudDownload className="w-3.5 h-3.5 text-blue-400" />}
              <span>{t('pullButton')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-[var(--text-main)] font-medium transition-colors"
              >
                {t('saveSettings')}
              </button>

              <button
                type="button"
                onClick={handlePush}
                disabled={isPushing || isPulling || !formData.githubToken}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-[var(--text-main)] font-bold transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
              >
                {isPushing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                <span>{t('syncButton')}</span>
              </button>
            </div>
          </div>
        </form>
        <PortfolioWidgetModal
          isOpen={isWidgetOpen}
          settings={settings}
          progress={progress}
          toc={toc}
          onClose={() => setIsWidgetOpen(false)}
        />
      </div>
    </div>
  );
};


