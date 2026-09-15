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

  const owner = settings.repoOwner || 'matyasholba';
  const repo = settings.repoName || 'cpp-learning-progress';

  // Embed code snippet for user's website (e.g. matyasholba.cz)
  const embedCodeSnippet = `<!-- C++ Learning Tracker Portfolio Widget -->
<div id="cpp-tracker-widget" style="background:#181b22; color:#fff; border-radius:12px; padding:20px; font-family:sans-serif; border:1px solid #2d3140;">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
    <div>
      <h3 style="margin:0; font-size:16px;">🎓 C++ Mastery Progress</h3>
      <p style="margin:4px 0 0; color:#888; font-size:12px;">Kurz learncpp.com — poctivě proškrtané odstavce & poznámky</p>
    </div>
    <div style="text-align:right;">
      <span style="font-size:20px; font-weight:bold; color:#3b82f6;">${percentage}%</span>
      <div style="font-size:11px; color:#10b981;">⏱ ${totalHours} hodin studia</div>
    </div>
  </div>
  <div style="background:#2d3140; height:8px; border-radius:4px; overflow:hidden;">
    <div style="background:linear-gradient(90deg, #3b82f6, #10b981); width:${percentage}%; height:100%;"></div>
  </div>
  <div style="display:flex; justify-content:space-between; font-size:11px; color:#888; margin-top:8px;">
    <span>Splněno: ${totalChecked} z ${totalCheckpoints} úkolů</span>
    <span>Poznámek: ${totalNotes}</span>
  </div>
  <div style="margin-top:14px; text-align:center;">
    <a href="https://github.com/${owner}/${repo}" target="_blank" style="color:#60a5fa; text-decoration:none; font-size:12px;">
      🔍 Zobrazit detailní rozpis a moje poznámky na GitHubu →
    </a>
  </div>
</div>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#181b22] border border-gray-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1e222b]">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Napojení na Portfolio (matyasholba.cz)</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-gray-300 overflow-y-auto max-h-[80vh]">
          {/* Live Preview */}
          <div>
            <div className="text-gray-400 font-semibold mb-2 flex items-center justify-between">
              <span>Živý náhled widgetu na tvém webu:</span>
              <span className="text-[10px] text-emerald-400">Automaticky aktualizováno</span>
            </div>

            <div className="bg-[#12141a] p-4 rounded-xl border border-gray-800 shadow-inner">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>🎓 C++ Mastery Progress</span>
                  </h4>
                  <p className="text-[11px] text-gray-400">learncpp.com — kompletní interaktivní záznam</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-400">{percentage}%</div>
                  <div className="text-[11px] text-emerald-400 font-medium">⏱ {totalHours} hodin aktivního studia</div>
                </div>
              </div>

              <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                  style={{ width: `${Math.max(2, percentage)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1">
                <span>Splněno {totalChecked.toLocaleString()} z {totalCheckpoints.toLocaleString()} odstavců & kvízů</span>
                <span>{totalNotes} vlastních poznámek a kódů</span>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
                <span className="text-[10px] text-gray-500">Zdroj: GitHub repo {owner}/{repo}</span>
                <span className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer">
                  <span>Prohlédnout poznámky</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Code Snippet to Copy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-200 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-blue-400" />
                <span>Kód pro vložení na tvůj web (HTML / JS):</span>
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Zkopírováno!' : 'Zkopírovat kód'}</span>
              </button>
            </div>

            <pre className="p-3 bg-gray-950 text-gray-300 rounded-lg font-mono text-[11px] overflow-x-auto border border-gray-800 max-h-48 custom-scrollbar">
              {embedCodeSnippet}
            </pre>
          </div>

          {/* Explanations */}
          <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg p-3 text-[11px] text-blue-200 space-y-1">
            <p className="font-semibold">💡 Jak to funguje s tvým portfoliem:</p>
            <p className="text-blue-300/90">
              Jakmile v aplikaci klikneš na <strong>„Uložit na GitHub“</strong>, data se ihned nahrají do tvého repozitáře. Tvůj web (nebo tento widget) si data z GitHubu kdykoliv přečte v reálném čase, takže máš na portfoliu vždy aktuální čísla bez nutnosti cokoliv ručně přepisovat!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
