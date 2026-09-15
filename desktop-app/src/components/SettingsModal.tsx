import React, { useState } from 'react';
import { SyncSettings, UserProgress, TOCData } from '../types';
import { X, CloudUpload, CloudDownload, CheckCircle, AlertCircle, Loader2, Globe, Database, Key } from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { PortfolioWidgetModal } from './PortfolioWidgetModal';
import { Sparkles } from 'lucide-react';
import { pushToGitHub, pullFromGitHub } from '../services/github';

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
  const [formData, setFormData] = useState<SyncSettings>(settings);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setStatusMessage({ type: 'success', text: 'Nastavení bylo úspěšně uloženo lokálně.' });
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
    if (!confirm('Opravdu chcete načíst data z GitHubu? Toto přepíše lokální neuložený stav novými daty z cloudu.')) {
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
            <span>Nastavení & GitHub Synchronizace</span>
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
              <span>GitHub Přístup (pro uložení z 1 kliku)</span>
            </div>

            <div>
              <label className="block text-[var(--text-muted)] mb-1">GitHub Personal Access Token (PAT):</label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={formData.githubToken}
                onChange={e => setFormData({ ...formData, githubToken: e.target.value })}
                className="w-full bg-[var(--bg-hover)] text-[var(--text-main)] px-3 py-2 rounded border border-[var(--border-color)] focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Vygeneruj si token na GitHubu v <em>Settings → Developer Settings → Tokens</em> s oprávněním <code>repo</code>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Vlastník (GitHub Username):</label>
                <input
                  type="text"
                  placeholder="např. matyasholba"
                  value={formData.repoOwner}
                  onChange={e => setFormData({ ...formData, repoOwner: e.target.value })}
                  className="w-full bg-[var(--bg-hover)] text-[var(--text-main)] px-3 py-2 rounded border border-[var(--border-color)] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Název repozitáře:</label>
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
            <label className="font-semibold text-[var(--text-main)] block">Režim synchronizace:</label>
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
                  <span>Režim 1: Data & Poznámky</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                  Ukládá čistý JSON progres, časy a přehledné Markdowny s tvými poznámkami. Rychlé a úsporné.
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
                  <span>Režim 2: Kompletní Web</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                  Nahraje i celý interaktivní prohlížeč pro GitHub Pages, aby kdokoliv viděl tvůj kurz i poznámky v browseru.
                </p>
              </button>
            </div>
          </div>

          {/* 1-Click Sync Buttons */}
          <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePull}
              disabled={isPulling || isPushing || !formData.githubToken}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-[var(--text-main)] hover:text-[var(--text-main)] border border-[var(--border-color)] transition-colors disabled:opacity-50"
              title="Stáhnout a načíst data z GitHubu"
            >
              {isPulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudDownload className="w-3.5 h-3.5 text-blue-400" />}
              <span>Načíst z GitHubu (Pull)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-[var(--text-main)] font-medium transition-colors"
              >
                Uložit nastavení
              </button>

              <button
                type="button"
                onClick={handlePush}
                disabled={isPushing || isPulling || !formData.githubToken}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-[var(--text-main)] font-bold transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
              >
                {isPushing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                <span>Uložit na GitHub (1 klik)</span>
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


