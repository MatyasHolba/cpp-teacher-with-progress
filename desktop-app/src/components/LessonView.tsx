import React from 'react';
import { LessonData, NoteItem, LessonMeta } from '../types';
import { BlockItem } from './BlockItem';
import { Clock, CheckCheck, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { formatDuration } from '../services/storage';

interface LessonViewProps {
  lesson: LessonData;
  checkedBlocks: Record<string, boolean>;
  notes: Record<string, NoteItem[]>;
  isActive: boolean;
  idleReason: string | null;
  lessonSeconds: number;
  totalLessonSeconds: number;
  prevLesson?: LessonMeta;
  nextLesson?: LessonMeta;
  onToggleCheck: (blockId: string) => void;
  onAddNote: (blockId: string, content: string, url?: string) => void;
  onDeleteNote: (blockId: string, noteId: string) => void;
  onNavigateLesson: (slug: string) => void;
  onMarkAllDone: () => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  lesson,
  checkedBlocks,
  notes,
  isActive,
  idleReason,
  lessonSeconds,
  totalLessonSeconds,
  prevLesson,
  nextLesson,
  onToggleCheck,
  onAddNote,
  onDeleteNote,
  onNavigateLesson,
  onMarkAllDone
}) => {
  // Compute progress for this lesson
  const checkableBlocks = lesson.blocks.filter(b => b.canCheck);
  const checkedInThisLesson = checkableBlocks.filter(b => !!checkedBlocks[b.id]).length;
  const percentage = checkableBlocks.length > 0
    ? Math.round((checkedInThisLesson / checkableBlocks.length) * 100)
    : 100;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f3f4f6] overflow-hidden">
      {/* Lesson Header */}
      <header className="px-8 py-4 border-b border-gray-800/80 bg-[#161922] select-none flex-shrink-0">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono text-xs font-semibold border border-blue-700/30">
              Lekce {lesson.number}
            </span>
            <span className="text-gray-500">•</span>
            <a
              href={lesson.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-400 hover:text-blue-400 inline-flex items-center gap-1 transition-colors"
            >
              <span>Originál na learncpp.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Time & Active State Indicator */}
          <div className="flex items-center gap-3 text-xs">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
              isActive 
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50' 
                : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-medium">
                {isActive ? 'Aktivní čtení' : idleReason === 'idle' ? 'Pozastaveno (nečinnost)' : 'Pozastaveno (okno)'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800/80 text-gray-200 font-mono">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{formatDuration(totalLessonSeconds + lessonSeconds)}</span>
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight mb-3">
          {lesson.title}
        </h1>

        {/* Lesson Progress Bar */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(2, percentage)}%` }}
            />
          </div>
          <div className="flex items-center gap-3 text-gray-400 font-medium">
            <span className={percentage === 100 ? 'text-emerald-400 font-bold' : 'text-gray-300'}>
              {checkedInThisLesson} / {checkableBlocks.length} splněno ({percentage}%)
            </span>

            {percentage < 100 && (
              <button
                onClick={onMarkAllDone}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700"
              >
                <CheckCheck className="w-3 h-3 text-emerald-400" />
                <span>Označit vše v této lekci</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Lesson Content Area */}
      <main className="flex-1 overflow-y-auto light-scrollbar px-10 py-8 max-w-[850px] mx-auto w-full bg-white text-gray-900 shadow-xl border-x border-gray-200">
        {lesson.blocks.map(block => (
          <BlockItem
            key={block.id}
            block={block}
            lessonSlug={lesson.slug}
            isChecked={!!checkedBlocks[block.id]}
            notes={notes[block.id] || []}
            onToggleCheck={onToggleCheck}
            onAddNote={onAddNote}
            onDeleteNote={onDeleteNote}
          />
        ))}

        {/* Bottom Lesson Navigation */}
        <nav className="mt-12 pt-6 border-t border-gray-800 flex items-center justify-between gap-4 select-none mb-12">
          {prevLesson ? (
            <button
              onClick={() => onNavigateLesson(prevLesson.slug)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-colors text-xs font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <div className="text-left">
                <div className="text-[10px] text-gray-500 uppercase">Předchozí lekce</div>
                <div className="truncate max-w-xs">{prevLesson.number} — {prevLesson.title}</div>
              </div>
            </button>
          ) : <div />}

          {nextLesson ? (
            <button
              onClick={() => onNavigateLesson(nextLesson.slug)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-xs font-bold shadow-md shadow-blue-600/20"
            >
              <div className="text-right">
                <div className="text-[10px] text-blue-200 uppercase">Další lekce</div>
                <div className="truncate max-w-xs">{nextLesson.number} — {nextLesson.title}</div>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : <div />}
        </nav>
      </main>
    </div>
  );
};
