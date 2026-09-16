import React, { useState } from 'react';
import { SyncSettings, UserProgress, TOCData } from '../types';
import { X, Code2, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { formatDuration } from '../services/storage';

interface PortfolioWidgetModalProps {
  isOpen: boolean;
  settings: SyncSettings;
  progress: UserProgress;
  toc: TOCData | null;
  onClose: () => void;
}

export const PortfolioWidgetModal: React.FC<PortfolioWidgetModalProps> = ({
  isOpen,
  settings,
  progress,
  toc,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalChecked = Object.values(progress.checkedBlocks).filter(Boolean).length;
  const totalCheckpoints = 15873;
  const percentage = Math.min(100, Math.round((totalChecked / totalCheckpoints) * 1000) / 10);
  const totalHours = Math.round((progress.totalSecondsSpent / 3600) * 10) / 10;
  const totalNotes = Object.values(progress.notes).flat().length;

  const owner = settings.repoOwner || 'YOUR_GITHUB';
  const repo = settings.repoName || 'cpp-myWebsite';

  const tTitle = settings.uiLanguage === 'en' ? '🎓 C++ Mastery Progress' : '🎓 C++ Mastery Progress';
  const tSub = settings.uiLanguage === 'en' ? 'learncpp.com course' : 'Kurz learncpp.com';
  const tHours = settings.uiLanguage === 'en' ? '⏱ -- hours' : '⏱ -- hodin';
  const tCompleted = settings.uiLanguage === 'en' ? 'Completed: -- / 15873' : 'Splněno: -- / 15873';
  const tNotes = settings.uiLanguage === 'en' ? 'Notes: --' : 'Poznámek: --';
  const tLink = settings.uiLanguage === 'en' ? '🔍 View detailed breakdown on GitHub →' : '🔍 Zobrazit detailní rozpis na GitHubu →';
  const jsHours = settings.uiLanguage === 'en' ? "'⏱ ' + hours + ' hours'" : "'⏱ ' + hours + ' hodin'";
  const jsCompleted = settings.uiLanguage === 'en' ? "'Completed: ' + checked + ' / 15873'" : "'Splněno: ' + checked + ' / 15873'";
  const jsNotes = settings.uiLanguage === 'en' ? "'Notes: ' + notesCount" : "'Poznámek: ' + notesCount";

  // Dynamic embed code using GitHub raw user content
  const embedCodeSnippet = `<!-- C++ Learning Tracker Portfolio Widget -->
<div id="cpp-tracker-widget" style="background:#181b22; color:#fff; border-radius:12px; padding:20px; font-family:sans-serif; border:1px solid #2d3140; max-width:400px;">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
    <div>
      <h3 style="margin:0; font-size:16px;">${tTitle}</h3>
      <p style="margin:4px 0 0; color:#888; font-size:12px;">${tSub}</p>
    </div>
    <div style="text-align:right;">
      <span id="cpp-percent" style="font-size:20px; font-weight:bold; color:#3b82f6;">--%</span>
      <div id="cpp-hours" style="font-size:11px; color:#10b981;">${tHours}</div>
    </div>
  </div>
  <div style="background:#2d3140; height:8px; border-radius:4px; overflow:hidden;">
    <div id="cpp-bar" style="background:linear-gradient(90deg, #3b82f6, #10b981); width:0%; height:100%; transition: width 1s ease-out;"></div>
  </div>
  <div style="display:flex; justify-content:space-between; font-size:11px; color:#888; margin-top:8px;">
    <span id="cpp-checked">${tCompleted}</span>
    <span id="cpp-notes">${tNotes}</span>
  </div>
  <div style="margin-top:14px; text-align:center;">
    <a href="https://github.com/${owner}/${repo}" target="_blank" style="color:#60a5fa; text-decoration:none; font-size:12px;">
      ${tLink}
    </a>
  </div>
</div>

<script>
  // Dynamické načtení dat z GitHubu / Dynamic load from GitHub
  fetch("https://raw.githubusercontent.com/${owner}/${repo}/master/tracker-data/progress.json")
    .then(res => res.json())
    .then(data => {
      const checked = Object.values(data.checkedBlocks).filter(Boolean).length;
      const notesCount = Object.values(data.notes).reduce((acc, arr) => acc + arr.length, 0);
      const hours = Math.round((data.totalSecondsSpent / 3600) * 10) / 10;
      const pct = Math.min(100, Math.round((checked / 15873) * 1000) / 10);
      
      document.getElementById('cpp-percent').textContent = pct + '%';
      document.getElementById('cpp-bar').style.width = pct + '%';
      document.getElementById('cpp-checked').textContent = ${jsCompleted};
      document.getElementById('cpp-hours').textContent = ${jsHours};
      document.getElementById('cpp-notes').textContent = ${jsNotes};
    })
    .catch(err => console.error("Could not load C++ progress:", err));
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
          <div className="flex items-center gap-2 text-[var(--text-main)] font-bold text-base">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{settings.uiLanguage === 'en' ? 'Portfolio Widget Connection' : 'Napojení na tvé Portfolio (Dynamický Widget)'}</span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-[var(--text-main)] overflow-y-auto max-h-[80vh]">
          {/* Live Preview */}
          <div>
            <div className="text-[var(--text-muted)] font-semibold mb-2 flex items-center justify-between">
              <span>{settings.uiLanguage === 'en' ? 'Live Preview for your website:' : 'Náhled widgetu pro tvůj web:'}</span>
              <span className="text-[10px] text-emerald-400">{settings.uiLanguage === 'en' ? 'Fetches live from GitHub JSON' : 'Tahá se live přes JSON z GitHubu'}</span>
            </div>

            <div className="bg-[#12141a] p-4 rounded-xl border border-[var(--border-color)] shadow-inner">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-1.5">
                    <span>{tTitle}</span>
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">{tSub}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-500">{percentage}%</div>
                  <div className="text-[10px] text-emerald-500">{settings.uiLanguage === 'en' ? `⏱ ${totalHours} hours` : `⏱ ${totalHours} hodin`}</div>
                </div>
              </div>

              <div className="bg-[var(--bg-hover)] rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-4">
                <span>{settings.uiLanguage === 'en' ? `Completed: ${totalChecked} / ${totalCheckpoints}` : `Splněno: ${totalChecked} / ${totalCheckpoints}`}</span>
                <span>{settings.uiLanguage === 'en' ? `Notes: ${totalNotes}` : `Poznámek: ${totalNotes}`}</span>
              </div>
              
              <div className="text-center">
                <a href={`https://github.com/${owner}/${repo}`} target="_blank" className="text-blue-400 hover:text-blue-300 transition-colors">
                  {tLink}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-header-alt)]lue-950/30 border border-blue-900/50 rounded-lg p-3 text-blue-200">
            {settings.uiLanguage === 'en' ? (
              <p className="mb-2">
                <strong className="text-blue-300">How it works?</strong> Copy this code and paste it on your personal website (e.g., in the footer or "About Me" section). 
                Using JavaScript, the code will automatically connect to your GitHub repository <code>{owner}/{repo}</code>, download <code>progress.json</code> and display your current progress live, without you having to update anything.
              </p>
            ) : (
              <p className="mb-2">
                <strong className="text-blue-300">Jak to funguje?</strong> Tento kód si zkopíruj a vlož na svůj osobní web (např. do patičky nebo do sekce "O mně"). 
                Pomocí JavaScriptu se kód automaticky připojí na tvůj GitHub repozitář <code>{owner}/{repo}</code>, stáhne si <code>progress.json</code> a live zobrazí tvůj aktuální postup, aniž bys musel cokoliv přepisovat.
              </p>
            )}
            <p className="text-[10px] opacity-80 mt-1">
              {settings.uiLanguage === 'en' ? 'Note: `raw.githubusercontent.com` supports CORS, so you don\'t need any additional server.' : 'Poznámka: `raw.githubusercontent.com` podporuje sdílení dat na jiné weby (CORS), takže žádný další server nepotřebuješ.'}
            </p>
          </div>

          {/* Code Export */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--text-muted)] font-semibold flex items-center gap-1.5">
                <Code2 className="w-4 h-4" /> {settings.uiLanguage === 'en' ? 'HTML/JS Code to embed on your site' : 'HTML/JS Kód k vložení na tvůj web'}
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  copied
                    ? 'bg-emerald-500 text-[var(--text-main)]'
                    : 'bg-[#2b3140] hover:bg-[#3e4659] text-[var(--text-main)]'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? (settings.uiLanguage === 'en' ? 'Copied!' : 'Zkopírováno!') : (settings.uiLanguage === 'en' ? 'Copy Code' : 'Zkopírovat Kód')}
              </button>
            </div>
            <pre className="bg-[#0b0c10] border border-[var(--border-color)] rounded-xl p-4 text-[10px] text-[var(--text-muted)] overflow-x-auto custom-scrollbar font-mono">
              <code>{embedCodeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};


