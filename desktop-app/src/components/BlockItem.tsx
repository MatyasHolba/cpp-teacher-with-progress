import React, { useState } from 'react';
import { ContentBlock, NoteItem } from '../types';
import { Check, CheckCircle2, MessageSquarePlus, MessageSquare, Trash2, ExternalLink, HelpCircle, Eye, EyeOff, Lightbulb } from 'lucide-react';

interface BlockItemProps {
  block: ContentBlock;
  lessonSlug: string;
  isChecked: boolean;
  notes: NoteItem[];
  onToggleCheck: (blockId: string) => void;
  onAddNote: (blockId: string, content: string, url?: string) => void;
  onDeleteNote: (blockId: string, noteId: string) => void;
}

export const BlockItem: React.FC<BlockItemProps> = ({
  block,
  lessonSlug,
  isChecked,
  notes,
  onToggleCheck,
  onAddNote,
  onDeleteNote
}) => {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteUrl, setNoteUrl] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Section headings don't have checkboxes
  if (block.type === 'section') {
    return (
      <div className="pt-6 pb-2 my-2 border-b border-gray-200" id={block.id}>
        <div dangerouslySetInnerHTML={{ __html: block.html }} className="text-2xl font-bold text-gray-900 tracking-tight" />
      </div>
    );
  }

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    onAddNote(block.id, noteContent.trim(), noteUrl.trim() || undefined);
    setNoteContent('');
    setNoteUrl('');
    setIsAddingNote(false);
  };

  const isQuiz = block.type === 'quiz';
  const labelText = isQuiz ? 'Splněno' : 'Přečteno';

  return (
    <div 
      className={`group relative transition-colors duration-200 ${
        isChecked ? 'bg-emerald-50/50 rounded-sm' : ''
      }`}
    >
      {/* Floating Action Bar (Absolute Right Gutter) */}
      <div className="absolute -right-36 top-0 flex flex-col items-start gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity select-none z-10 w-32">
        {block.canCheck && (
          <button
            onClick={() => onToggleCheck(block.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all w-full shadow-sm ${
              isChecked
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Check className={`w-3.5 h-3.5 ${isChecked ? 'stroke-[3]' : 'text-gray-400'}`} />
            <span>{labelText}</span>
          </button>
        )}

        <button
          onClick={() => setIsAddingNote(!isAddingNote)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all w-full shadow-sm ${
            notes.length > 0
              ? 'bg-amber-100 text-amber-700 border border-amber-300'
              : 'bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-200'
          }`}
          title="Přidat poznámku, postřeh nebo odkaz"
        >
          {notes.length > 0 ? (
            <>
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Poznámka ({notes.length})</span>
            </>
          ) : (
            <>
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Poznámka</span>
            </>
          )}
        </button>
      </div>

      {/* Block Body */}
      {isQuiz ? (
        <div className="bg-[#f8f9fa] rounded-lg p-5 border border-gray-200 my-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#204a94] font-bold text-sm mb-3">
            <HelpCircle className="w-4 h-4" />
            <span>{block.questionTitle || 'Kvízová otázka'}</span>
          </div>

          {block.questionHtml && (
            <div 
              dangerouslySetInnerHTML={{ __html: block.questionHtml }}
              className="text-gray-900 text-sm mb-3 prose max-w-none"
            />
          )}

          {/* Quiz controls: Hint & Solution toggles */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
            {block.hintHtml && (
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint ? 'Skrýt nápovědu' : 'Zobrazit nápovědu'}</span>
              </button>
            )}

            {block.solutionHtml && (
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                {showSolution ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSolution ? 'Skrýt řešení' : 'Zobrazit řešení'}</span>
              </button>
            )}
          </div>

          {showHint && block.hintHtml && (
            <div className="mt-3 p-4 rounded bg-amber-50/50 border border-amber-200 text-sm text-gray-800">
              <div dangerouslySetInnerHTML={{ __html: block.hintHtml }} />
            </div>
          )}

          {showSolution && block.solutionHtml && (
            <div className="mt-3 p-4 rounded bg-blue-50/50 border border-blue-200 text-sm text-gray-800 font-mono">
              <div dangerouslySetInnerHTML={{ __html: block.solutionHtml }} />
            </div>
          )}
        </div>
      ) : (
        /* Immutable original content */
        <div 
          dangerouslySetInnerHTML={{ __html: block.html }}
          className="learncpp-content text-gray-900 text-[15px] leading-relaxed selection:bg-blue-200"
        />
      )}

      {/* Inline Note Composer */}
      {isAddingNote && (
        <form onSubmit={handleSaveNote} className="mt-3 p-4 rounded-lg bg-gray-50 border border-blue-200 shadow-sm relative z-20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
              <MessageSquarePlus className="w-4 h-4" />
              Nová poznámka k tomuto odstavci
            </span>
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="text-xs font-medium text-gray-500 hover:text-gray-800"
            >
              Zrušit
            </button>
          </div>

          <textarea
            rows={3}
            placeholder="Zapiš si vlastní postřeh, shrnutí, nebo část kódu..."
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            className="w-full bg-white text-sm text-gray-800 p-3 rounded border border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 resize-y shadow-inner"
            autoFocus
          />

          <div className="flex items-center gap-3 mt-3">
            <input
              type="url"
              placeholder="Volitelný odkaz (YouTube video, dokumentace, GitHub gist)..."
              value={noteUrl}
              onChange={e => setNoteUrl(e.target.value)}
              className="flex-1 bg-white text-sm text-gray-800 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 shadow-inner"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-colors shadow-sm"
            >
              Uložit poznámku
            </button>
          </div>
        </form>
      )}

      {/* Notes List under this block */}
      {notes.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
          {notes.map(note => (
            <div 
              key={note.id}
              className="p-3 rounded-md bg-amber-50 border border-amber-200 text-sm flex items-start justify-between gap-3 shadow-sm relative z-20"
            >
              <div className="flex-1 space-y-1">
                <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
                  {note.content}
                </div>
                {note.url && (
                  <a
                    href={note.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate max-w-sm">{note.url}</span>
                  </a>
                )}
                <div className="text-[10px] text-gray-400 pt-1">
                  Uloženo: {new Date(note.createdAt).toLocaleString('cs-CZ')}
                </div>
              </div>

              <button
                onClick={() => onDeleteNote(block.id, note.id)}
                className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-white transition-colors"
                title="Smazat tuto poznámku"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
