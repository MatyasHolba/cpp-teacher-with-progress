import React, { useState } from "react";
import { LessonData, NoteItem, LessonMeta } from "../types";
import { BlockItem } from "./BlockItem";
import { Clock, CheckCheck, ExternalLink, ChevronUp, ChevronDown, ArrowLeft, ArrowRight, Play, Code } from "lucide-react";
import { formatDuration } from "../services/storage";

interface LessonViewProps {
  lesson: LessonData;
  checkedBlocks: Record<string, boolean>;
  notes: Record<string, NoteItem[]>;
  isActive: boolean;
  isCodingMode: boolean;
  idleReason: string | null;
  onResumeTracking: () => void;
  onStartCodingMode: () => void;
  onStopCodingMode: () => void;
  lessonSeconds: number;
  codingSeconds: number;
  totalLessonSeconds: number;
  totalCodingSeconds: number;
  prevLesson?: LessonMeta;
  nextLesson?: LessonMeta;
  onToggleCheck: (blockId: string) => void;
  onAddNote: (blockId: string, content: string, url?: string) => void;
  onDeleteNote: (blockId: string, noteId: string) => void;
  onNavigateLesson: (slug: string) => void;
  onMarkAllDone: () => void;
  theme: 'light' | 'dark' | 'oled' | 'sepia';
  uiLanguage: 'cs' | 'en';
  contentLanguage: 'cs' | 'en';
  onToggleTheme: () => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  lesson,
  checkedBlocks,
  notes,
  isActive,
  isCodingMode,
  idleReason,
  onResumeTracking,
  onStartCodingMode,
  onStopCodingMode,
  lessonSeconds,
  codingSeconds,
  totalLessonSeconds,
  totalCodingSeconds,
  prevLesson,
  nextLesson,
  onToggleCheck,
  onAddNote,
  onDeleteNote,
  onNavigateLesson,
  onMarkAllDone,
  theme,
  uiLanguage,
  contentLanguage,
  onToggleTheme
}) => {
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);
  const isDarkMode = theme === "dark" || theme === "oled";

  const checkableBlocks = lesson.blocks.filter(b => b.canCheck);
  const checkedInThisLesson = checkableBlocks.filter(b => !!checkedBlocks[b.id]).length;
  const percentage = checkableBlocks.length > 0
    ? Math.round((checkedInThisLesson / checkableBlocks.length) * 100)
    : 100;

  const getOuterBackground = () => {
    switch (theme) {
      case 'oled': return '#000000';
      case 'dark': return '#0d0f14';
      case 'sepia': return '#e8dfc7';
      default: return '#d6d6d6';
    }
  };

  const getCardBackground = () => {
    switch (theme) {
      case 'oled': return '#000000';
      case 'dark': return '#12141a';
      case 'sepia': return '#f4ecd8';
      default: return '#ffffff';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: getOuterBackground() }}>
      {/* Compact collapsible header bar */}
      <header className="flex-shrink-0 select-none border-b border-[var(--border-color)] bg-[var(--bg-header-alt)]">
        {/* Always-visible strip */}
        <div className="flex items-center justify-between px-6 py-2 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono text-xs font-semibold border border-blue-700/30 flex-shrink-0">
              {lesson.number}
            </span>
            <span className="text-sm font-bold text-[var(--text-main)] truncate">{lesson.title}</span>
            <a
              href={lesson.url}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--text-muted)] hover:text-blue-400 flex-shrink-0 transition-colors"
              title="Originál na learncpp.com"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
              title={isActive ? "Aktivní čtení" : "Pozastaveno"}
            />
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-app)] text-[var(--text-main)] font-mono text-xs border border-[var(--border-color)]"
              title="Čas strávený čtením teorie"
            >
              <Clock className="w-3 h-3 text-blue-400" />
              <span>{formatDuration(totalLessonSeconds + lessonSeconds)}</span>
            </div>
            {(totalCodingSeconds + codingSeconds > 0 || isCodingMode) && (
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-app)] text-emerald-400 font-mono text-xs border border-emerald-500/30 ${isCodingMode ? 'ring-1 ring-emerald-400 animate-pulse' : ''}`}
                title="Čas strávený praktickým psaním kódu"
              >
                <Code className="w-3 h-3 text-emerald-400" />
                <span>{formatDuration(totalCodingSeconds + codingSeconds)}</span>
              </div>
            )}
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${percentage === 100 ? "text-emerald-400" : "text-[var(--text-main)]"}`}>
              {checkedInThisLesson}/{checkableBlocks.length} ({percentage}%)
            </span>
            <button
              onClick={() => setIsHeaderOpen(!isHeaderOpen)}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
              title={isHeaderOpen ? "Skrýt lištu" : "Zobrazit lištu"}
            >
              {isHeaderOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded panel */}
        {isHeaderOpen && (
          <div className="px-6 pb-3 pt-1 border-t border-[var(--border-color)]">
            <div className="flex items-center gap-4 text-xs">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                isCodingMode
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                  : isActive
                  ? "bg-blue-950/40 text-blue-300 border-blue-800/50"
                  : "bg-amber-950/40 text-amber-300 border-amber-800/50"
              }`}>
                <span className={`w-2 h-2 rounded-full ${isCodingMode ? "bg-emerald-400 animate-ping" : isActive ? "bg-blue-400 animate-pulse" : "bg-amber-400"}`} />
                <span className="font-medium">
                  {isCodingMode ? "Měření psaní kódu (aktivní)" : isActive ? "Aktivní čtení teorie" : "Studium pozastaveno"}
                </span>
              </div>
              <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(2, percentage)}%` }}
                />
              </div>
              {percentage < 100 && (
                <button
                  onClick={onMarkAllDone}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] hover:text-[var(--text-main)] transition-colors border border-[var(--border-color)]"
                >
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                  <span>Označit vše</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Reading area: card centered with right margin for floating action buttons */}
      <main
        className="flex-1 overflow-y-auto light-scrollbar py-6 pr-36 relative"
        style={{ background: getOuterBackground() }}
      >
        {/* Sleek Minimalist Pause & Coding Overlay */}
        {(!isActive || isCodingMode) && (
          <div
            onClick={onResumeTracking}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer select-none animate-in fade-in duration-200"
            title="Kliknutím kamkoliv pokračujete ve čtení"
          >
            {isCodingMode ? (
              /* Coding Mode Active Window */
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[var(--bg-header)]/95 border border-emerald-500/50 px-6 py-5 rounded-2xl shadow-2xl flex flex-col items-center gap-3 text-center max-w-xs mx-4 cursor-default animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>MĚŘENÍ PSANÍ KÓDU</span>
                </div>

                <div className="text-3xl font-mono font-bold text-[var(--text-main)] py-1 flex items-center gap-2">
                  <Code className="w-6 h-6 text-emerald-400" />
                  <span>{formatDuration(totalCodingSeconds + codingSeconds)}</span>
                </div>

                <p className="text-[11px] text-[var(--text-muted)]">
                  Čas se počítá, i když píšete kód v jiném okně nebo editoru.
                </p>

                <button
                  onClick={onStopCodingMode}
                  className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Zpět ke čtení</span>
                </button>
              </div>
            ) : (
              /* Simple Minimalist Paused Card */
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[var(--bg-header)]/90 border border-[var(--border-color)] px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-2.5 text-center max-w-xs mx-4 cursor-default"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>POZASTAVENO</span>
                </div>

                <p className="text-xs text-[var(--text-main)]">
                  Klikněte kamkoliv pro pokračování ve studiu
                </p>

                <div className="pt-2 border-t border-[var(--border-color)] w-full">
                  <button
                    onClick={onStartCodingMode}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    title="Spustí počítadlo pro psaní kódu v externím editoru"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Programuji (měřit čas psaní kódu)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mx-auto max-w-[860px] relative px-4" style={{ width: '92%' }}>
          <div
            className={`lc-reader-pane ${theme === 'oled' ? 'theme-oled-pane' : isDarkMode ? 'dark-mode' : theme === 'sepia' ? 'theme-sepia-pane' : ''}`}
            style={{
              background: getCardBackground(),
              borderRadius: "15px",
              boxShadow: theme === 'oled' ? 'none' : isDarkMode ? "0px 4px 16px -4px rgba(0,0,0,0.8)" : "0px 4px 16px -4px rgba(0,0,0,0.49)",
              border: theme === 'oled' ? '1px solid #222222' : theme === 'sepia' ? '1px solid #d3c4a2' : 'none',
              padding: "32px 40px 48px 40px",
            }}
          >
            {/* H1 title */}
            <h1 style={{
              fontSize: "28px",
              fontWeight: 700,
              marginBottom: "1em",
              marginTop: 0,
              fontFamily: '"Open Sans", Arial, sans-serif',
              lineHeight: 1.3,
            }}>
              {lesson.title}
            </h1>

            {/* Lesson blocks */}
            {lesson.blocks.map(block => (
              <BlockItem
                key={block.id}
                block={block}
                lessonSlug={lesson.slug}
                isChecked={!!checkedBlocks[block.id]}
                notes={notes[block.id] || []}
                contentLanguage={contentLanguage}
                onToggleCheck={onToggleCheck}
                onAddNote={onAddNote}
                onDeleteNote={onDeleteNote}
              />
            ))}

            {/* Bottom navigation */}
            <nav style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid #ddd", display: "flex", gap: "16px" }}>
              {prevLesson ? (
                <a
                  href="#"
                  className="nav-button"
                  style={{ flex: 1, textDecoration: "none" }}
                  onClick={e => { e.preventDefault(); onNavigateLesson(prevLesson.slug); }}
                >
                  <span className="nav-button-icon flex items-center justify-center">
                    <ArrowLeft className="w-8 h-8 text-blue-400" />
                  </span>
                  <span>
                    <div className="nav-button-title" style={{ fontSize: "16px" }}>Předchozí lekce</div>
                    <div className="nav-button-lesson">
                      <span className="nav-button-lesson-number">{prevLesson.number}</span>
                      {prevLesson.title}
                    </div>
                  </span>
                </a>
              ) : <div style={{ flex: 1 }} />}

              {nextLesson ? (
                <a
                  href="#"
                  className="nav-button nav-button-next"
                  style={{ flex: 1, textDecoration: "none" }}
                  onClick={e => { e.preventDefault(); onNavigateLesson(nextLesson.slug); }}
                >
                  <span className="nav-button-icon flex items-center justify-center">
                    <ArrowRight className="w-8 h-8 text-emerald-400" />
                  </span>
                  <span>
                    <div className="nav-button-title" style={{ fontSize: "16px" }}>Další lekce</div>
                    <div className="nav-button-lesson">
                      <span className="nav-button-lesson-number">{nextLesson.number}</span>
                      {nextLesson.title}
                    </div>
                  </span>
                </a>
              ) : <div style={{ flex: 1 }} />}
            </nav>
          </div>
        </div>
      </main>
    </div>
  );
};
