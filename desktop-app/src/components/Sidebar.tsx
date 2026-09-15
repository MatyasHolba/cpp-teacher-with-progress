import React, { useState } from 'react';
import { TOCData, UserProgress } from '../types';
import { BookOpen, CheckCircle2, ChevronDown, ChevronRight, Search, Clock } from 'lucide-react';
import { formatDuration } from '../services/storage';

interface SidebarProps {
  toc: TOCData;
  progress: UserProgress;
  activeLessonSlug: string;
  onSelectLesson: (slug: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  toc,
  progress,
  activeLessonSlug,
  onSelectLesson
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    '0': true,
    '1': true
  });

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const totalChecked = Object.values(progress.checkedBlocks).filter(Boolean).length;
  const totalCheckpoints = 15873;
  const overallPercentage = Math.min(100, Math.round((totalChecked / totalCheckpoints) * 1000) / 10);

  // Filter lessons if searching
  const filteredChapters = toc.chapters.map(chapter => {
    if (!searchQuery.trim()) return chapter;
    const matchingLessons = chapter.lessons.filter(l => 
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.number.includes(searchQuery)
    );
    return { ...chapter, lessons: matchingLessons };
  }).filter(chapter => !searchQuery.trim() || chapter.lessons.length > 0);

  return (
    <aside className="w-80 h-full bg-[#1e222b] text-gray-200 flex flex-col border-r border-gray-800 select-none">
      {/* App Header & Branding */}
      <div className="p-4 border-b border-gray-800 bg-[#181b22]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            C++
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide">LEARNCPP TRACKER</h1>
            <p className="text-xs text-gray-400">Offline Interaktivní Kniha</p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="bg-gray-800/80 rounded-lg p-2.5 border border-gray-700/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-300 font-medium">Celkový postup:</span>
            <span className="font-bold text-blue-400">{overallPercentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(2, overallPercentage)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1.5">
            <span>{totalChecked.toLocaleString()} / {totalCheckpoints.toLocaleString()} úkolů</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              {formatDuration(progress.totalSecondsSpent)}
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Hledat lekci nebo téma..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 text-xs text-gray-200 pl-8 pr-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-500 transition-colors"
          />
        </div>
      </div>

      {/* Chapters & Lessons Tree */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {filteredChapters.map(chapter => {
          const isExpanded = !!expandedChapters[chapter.id] || searchQuery.trim().length > 0;
          return (
            <div key={chapter.id} className="rounded-md overflow-hidden">
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800/60 rounded transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-blue-400 font-mono text-[11px] flex-shrink-0">{chapter.header}:</span>
                  <span className="truncate">{chapter.title}</span>
                </div>
                <span className="text-[10px] text-gray-500 ml-1 flex-shrink-0">
                  {chapter.lessons.length}
                </span>
              </button>

              {isExpanded && (
                <div className="pl-4 pr-1 py-0.5 space-y-0.5 border-l border-gray-800 ml-3 my-0.5">
                  {chapter.lessons.map(lesson => {
                    const isActive = lesson.slug === activeLessonSlug;
                    const lessonSeconds = progress.timeSpentPerLesson[lesson.slug] || 0;

                    return (
                      <button
                        key={lesson.slug}
                        onClick={() => onSelectLesson(lesson.slug)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded transition-all text-left ${
                          isActive
                            ? 'bg-blue-600/20 text-blue-300 font-medium border-l-2 border-blue-500 pl-2'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[11px] text-gray-500 flex-shrink-0">
                            {lesson.number}
                          </span>
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        {lessonSeconds > 0 && (
                          <span className="text-[10px] text-emerald-400/80 font-mono ml-1 flex-shrink-0">
                            {formatDuration(lessonSeconds)}
                          </span>
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
