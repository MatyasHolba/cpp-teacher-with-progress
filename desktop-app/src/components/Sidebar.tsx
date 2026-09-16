import React, { useState } from 'react';
import { TOCData, UserProgress } from '../types';
import { BookOpen, CheckCircle2, ChevronDown, ChevronRight, Search, Clock, PanelLeftClose } from 'lucide-react';
import { formatDuration } from '../services/storage';

import { getT } from '../utils/i18n';

interface SidebarProps {
  toc: TOCData;
  progress: UserProgress;
  activeLessonSlug: string;
  uiLanguage: 'cs' | 'en';
  onSelectLesson: (slug: string) => void;
  onToggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  toc,
  progress,
  activeLessonSlug,
  uiLanguage,
  onSelectLesson,
  onToggleSidebar
}) => {
  const t = getT(uiLanguage);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    '0': true,
    '1': true
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const [showGlobalStats, setShowGlobalStats] = useState(false);

  const totalChecked = Object.values(progress.checkedBlocks).filter(Boolean).length;
  const totalCheckpoints = 15873;
  const overallPercentage = Math.min(100, Math.round((totalChecked / totalCheckpoints) * 1000) / 10);
  const totalNotes = Object.values(progress.notes).reduce((acc, arr) => acc + arr.length, 0);

  // Helper for chapter cumulative time (reading + coding)
  const getChapterStats = (lessons: any[]) => {
    let readSecs = 0;
    let codeSecs = 0;
    for (const l of lessons) {
      readSecs += (progress.timeSpentPerLesson[l.slug] || 0) + (progress.timeSpentPerLessonEN?.[l.slug] || 0);
      codeSecs += (progress.codingTimePerLesson?.[l.slug] || 0) + (progress.codingTimePerLessonEN?.[l.slug] || 0);
    }
    return { readSecs, codeSecs, totalSecs: readSecs + codeSecs };
  };

  // Filter lessons if searching
  const filteredChapters = toc.chapters.map(chapter => {
    if (!searchQuery.trim()) return chapter;
    const matchingLessons = chapter.lessons.filter(l => 
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.number.includes(searchQuery)
    );
    return { ...chapter, lessons: matchingLessons };
  }).filter(chapter => !searchQuery.trim() || chapter.lessons.length > 0);

  const totalStudySeconds = progress.totalSecondsSpent + (progress.totalCodingSeconds || 0);

  return (
    <aside className="w-80 h-full bg-[var(--bg-sidebar)] text-[var(--text-main)] flex flex-col border-r border-[var(--border-color)] select-none">
      {/* Minimalist Header */}
      <div className="pt-3 pb-2 px-3 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            title="Skrýt panel"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
          
          <div className="flex items-center">
            <div className={`relative flex items-center transition-all ${isSearchOpen ? 'w-48' : 'w-8'}`}>
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="absolute right-0 p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors z-10"
                title="Hledat v lekcích"
              >
                <Search className="w-5 h-5" />
              </button>
              {isSearchOpen && (
                <input
                  type="text"
                  autoFocus
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg-app)] text-xs text-[var(--text-main)] pl-3 pr-8 py-1.5 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Progress Bar & Clickable Stats Summary */}
        <div
          onClick={() => setShowGlobalStats(!showGlobalStats)}
          className="cursor-pointer group/stat py-1"
          title={t('showDetailsHint') || 'Klikněte pro zobrazení detailních statistik'}
        >
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--text-muted)] group-hover/stat:text-blue-400 transition-colors">
              <Clock className="w-3 h-3 text-blue-400" />
              {formatDuration(totalStudySeconds)}
            </span>
            <span className="font-semibold text-blue-400 text-[10px]">
              {overallPercentage}% ({totalChecked} {t('tasksSuffix') || 'úkolů'})
            </span>
          </div>

          <div className="w-full bg-[var(--border-color)] h-[3px] rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(2, overallPercentage)}%` }}
            />
          </div>

          {showGlobalStats && (
            <div className="mt-2 p-2.5 bg-[var(--bg-app)] rounded-lg border border-[var(--border-color)] text-[10px] text-[var(--text-muted)] flex flex-col gap-1.5 animate-in fade-in duration-150 shadow-lg">
              <div className="flex justify-between">
                <span>{t('totalTime')}</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{formatDuration(totalStudySeconds)}</span>
              </div>
              <div className="flex justify-between pl-2 border-l border-blue-500/40">
                <span>{t('readingTime')}</span>
                <span className="font-mono font-medium text-blue-400">{formatDuration(progress.totalSecondsSpent)}</span>
              </div>
              <div className="flex justify-between pl-2 border-l border-emerald-500/40">
                <span>{t('codingTime')}</span>
                <span className="font-mono font-medium text-emerald-400">{formatDuration(progress.totalCodingSeconds || 0)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[var(--border-color)]">
                <span>{t('completedTasks')}</span>
                <span className="font-bold text-emerald-400">{totalChecked} / {totalCheckpoints}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('notesCount')}</span>
                <span className="font-bold text-amber-400">{totalNotes}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {filteredChapters.map(chapter => {
          const isExpanded = expandedChapters[chapter.id] || searchQuery.trim() !== '';
          const { readSecs, codeSecs, totalSecs } = getChapterStats(chapter.lessons);

          return (
            <div key={chapter.id} className="mb-1">
              {/* Chapter header button */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-hover)]/60 rounded transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-2 flex-1">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-[var(--text-muted)]" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-blue-500 font-mono text-[10px] font-bold uppercase tracking-wide leading-tight">
                      Chapter {chapter.id}
                    </div>
                    {isExpanded && (
                      <div className="text-[var(--text-muted)] text-[10px] leading-tight truncate font-normal mt-0.5">
                        {chapter.title}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {totalSecs > 0 && (
                    <span
                      className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded"
                      title={codeSecs > 0 ? `Reading: ${formatDuration(readSecs)} | Coding: ${formatDuration(codeSecs)}` : `Chapter time: ${formatDuration(readSecs)}`}
                    >
                      {codeSecs > 0 ? `${formatDuration(totalSecs)}` : formatDuration(readSecs)}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-header-alt)] px-1.5 py-0.5 rounded-sm">
                    {chapter.lessons.length}
                  </span>
                </div>
              </button>
              
              {isExpanded && (
                <div className="mt-0.5 ml-2 pl-2 border-l-2 border-[var(--border-color)] flex flex-col gap-0.5">
                  {chapter.lessons.map(lesson => {
                    const isActive = activeLessonSlug === lesson.slug;
                    const lessonReadCS = progress.timeSpentPerLesson[lesson.slug] || 0;
                    const lessonReadEN = progress.timeSpentPerLessonEN?.[lesson.slug] || 0;
                    const lessonCodeCS = progress.codingTimePerLesson?.[lesson.slug] || 0;
                    const lessonCodeEN = progress.codingTimePerLessonEN?.[lesson.slug] || 0;
                    
                    const lessonRead = lessonReadCS + lessonReadEN;
                    const lessonCode = lessonCodeCS + lessonCodeEN;

                    return (
                      <button
                        key={lesson.slug}
                        onClick={() => onSelectLesson(lesson.slug)}
                        className={`text-left px-2 py-1.5 text-xs rounded transition-colors truncate flex items-center justify-between group ${
                          isActive
                            ? 'bg-blue-600/20 text-blue-500 font-medium border-l-2 border-blue-500 pl-2'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]/40'
                        }`}
                        title={lesson.title}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0 pr-2">
                          <span className={`flex-shrink-0 font-mono text-[10px] ${isActive ? 'text-blue-400' : 'text-[var(--text-muted)]'}`}>{lesson.number}</span>
                          <span className="truncate">{lesson.title.replace(/^[0-9.]+\s*[—–-]\s*/, '')}</span>
                        </div>

                        {(lessonRead > 0 || lessonCode > 0) && (
                          <div className="flex items-center gap-1 flex-shrink-0 text-[10px] font-mono">
                            {lessonRead > 0 && (
                              <span
                                className="text-blue-400 flex items-center gap-0.5"
                                title={uiLanguage === 'en' ? 'Reading time' : 'Čas čtení'}
                              >
                                {lessonReadCS > 0 && lessonReadEN === 0 && <span className="text-[8px] font-bold opacity-60">CS</span>}
                                {lessonReadEN > 0 && lessonReadCS === 0 && <span className="text-[8px] font-bold opacity-60">EN</span>}
                                {lessonReadCS > 0 && lessonReadEN > 0 && <span className="text-[8px] font-bold opacity-60">+</span>}
                                {formatDuration(lessonRead)}
                              </span>
                            )}
                            {lessonCode > 0 && (
                              <span
                                className="text-emerald-400 font-semibold flex items-center gap-0.5"
                                title={uiLanguage === 'en' ? 'Coding time' : 'Čas kódování'}
                              >
                                <span className="text-[9px]">⌨</span>{formatDuration(lessonCode)}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

