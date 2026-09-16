import React, { useState } from 'react';
import { ContentBlock, NoteItem } from '../types';
import { Check, MessageSquarePlus, MessageSquare, Trash2, ExternalLink, HelpCircle, Eye, EyeOff, Lightbulb, Globe } from 'lucide-react';
import { getT } from '../utils/i18n';

interface BlockItemProps {
  block: ContentBlock;
  lessonSlug: string;
  isChecked: boolean;
  notes: NoteItem[];
  uiLanguage?: 'cs' | 'en';
  contentLanguage?: 'cs' | 'en';
  onToggleCheck: (blockId: string) => void;
  onAddNote: (blockId: string, content: string, url?: string) => void;
  onDeleteNote: (blockId: string, noteId: string) => void;
}

export const BlockItem: React.FC<BlockItemProps> = ({
  block,
  lessonSlug,
  isChecked,
  notes,
  uiLanguage = 'cs',
  contentLanguage = 'cs',
  onToggleCheck,
  onAddNote,
  onDeleteNote
}) => {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteUrl, setNoteUrl] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [forceTranslation, setForceTranslation] = useState(false);

  const currentLang = forceTranslation ? (contentLanguage === 'en' ? 'cs' : 'en') : contentLanguage;
  const displayHtml = (currentLang === 'cs' && block.html_cs) ? block.html_cs : block.html;

  // Section headings — no action buttons
  if (block.type === 'section') {
    return (
      <div className="lc-block-wrap lc-reader-pane" id={block.id}>
        <div dangerouslySetInnerHTML={{ __html: displayHtml }} />
      </div>
    );
  }

  const t = getT(uiLanguage);
  
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    onAddNote(block.id, noteContent.trim(), noteUrl.trim() || undefined);
    setNoteContent('');
    setNoteUrl('');
    setIsAddingNote(false);
  };

  const isQuiz = block.type === 'quiz';
  const labelText = t('markDone');

  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('a')) {
      return;
    }
    if (e.ctrlKey || e.shiftKey || e.altKey) {
      setIsAddingNote(prev => !prev);
    } else if (block.canCheck) {
      onToggleCheck(block.id);
    }
  };

  return (
    <div
      className={`lc-block-wrap relative lc-reader-pane cursor-pointer group/block ${isChecked ? 'lc-block-checked' : ''}`}
      onDoubleClick={handleDoubleClick}
      title={t('doubleClickHint')}
    >
      {/* Floating action bar — appears in right gutter on hover */}
      <div className="lc-block-actions">
        {block.html_cs && (
          <button
            onClick={(e) => { e.stopPropagation(); setForceTranslation(!forceTranslation); }}
            className={`lc-action-btn ${forceTranslation ? 'lc-checked' : ''}`}
            title="Translate toggle"
          >
            <Globe className="w-3 h-3 flex-shrink-0 text-blue-500" />
            <span className="text-blue-500">{currentLang === 'cs' ? 'EN' : 'CS'}</span>
          </button>
        )}
        {block.canCheck && (
          <button
            onClick={() => onToggleCheck(block.id)}
            className={`lc-action-btn ${isChecked ? 'lc-checked' : ''}`}
          >
            <Check className="w-3 h-3 flex-shrink-0" />
            <span>{labelText}</span>
          </button>
        )}
        <button
          onClick={() => setIsAddingNote(!isAddingNote)}
          className={`lc-action-btn ${notes.length > 0 ? 'lc-note-active' : ''}`}
          title={t('addNoteHint')}
        >
          {notes.length > 0 ? (
            <><MessageSquare className="w-3 h-3 flex-shrink-0" /><span>({notes.length})</span></>
          ) : (
            <><MessageSquarePlus className="w-3 h-3 flex-shrink-0" /><span>{t('addNote')}</span></>
          )}
        </button>
      </div>

      {/* Block body — original learncpp HTML, unstyled by us */}
      {isQuiz ? (
        <div className="cpp-note cpp-lightbluebackground" style={{ marginTop: '1em' }}>
          <p className="cpp-note-title cpp-bottomline" style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <HelpCircle style={{ width:'14px', height:'14px', flexShrink:0 }} />
            {block.questionTitle || 'Kvízová otázka'}
          </p>

          {block.questionHtml && (
            <div dangerouslySetInnerHTML={{ __html: block.questionHtml }} />
          )}

          {/* Hint / Solution toggles */}
          <div style={{ display:'flex', gap:'8px', marginTop:'12px', paddingTop:'10px', borderTop:'1px solid #c0ceee' }}>
            {block.hintHtml && (
              <button
                onClick={() => setShowHint(!showHint)}
                style={{
                  display:'flex', alignItems:'center', gap:'4px',
                  padding:'4px 10px', borderRadius:'5px', fontSize:'12px', fontWeight:700, cursor:'pointer',
                  background: showHint ? '#fff3cd' : '#fffef0',
                  border:'1px solid #e0c060', color:'#7a5a00'
                }}
              >
                <Lightbulb style={{ width:'12px', height:'12px' }} />
                {showHint ? 'Skrýt nápovědu' : 'Zobrazit nápovědu'}
              </button>
            )}
            {block.solutionHtml && (
              <button
                onClick={() => setShowSolution(!showSolution)}
                style={{
                  display:'flex', alignItems:'center', gap:'4px',
                  padding:'4px 10px', borderRadius:'5px', fontSize:'12px', fontWeight:700, cursor:'pointer',
                  background: showSolution ? '#e7dfff' : '#f5f0ff',
                  border:'1px solid #c1acff', color:'#4a2fa0'
                }}
              >
                {showSolution ? <EyeOff style={{ width:'12px', height:'12px' }} /> : <Eye style={{ width:'12px', height:'12px' }} />}
                {showSolution ? t('hideSolution') : t('solution')}
              </button>
            )}
          </div>

          {showHint && block.hintHtml && (
            <div className="cpp-note cpp-lightyellowbackground" style={{ margin:'8px 0' }}>
              <div dangerouslySetInnerHTML={{ __html: block.hintHtml }} />
            </div>
          )}
          {showSolution && block.solutionHtml && (
            <div className="cpp-note cpp-lightpurplebackground" style={{ margin:'8px 0' }}>
              <div dangerouslySetInnerHTML={{ __html: block.solutionHtml }} />
            </div>
          )}
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: displayHtml }} />
      )}

      {/* Inline note composer */}
      {isAddingNote && (
        <div className="lc-note-form">
          <form onSubmit={handleSaveNote}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
              <span style={{ fontSize:'12px', fontWeight:700, color:'#7a5a00', display:'flex', alignItems:'center', gap:'5px' }}>
                <MessageSquarePlus style={{ width:'14px', height:'14px' }} />
                {t('newNoteTitle')}
              </span>
              <button type="button" onClick={() => setIsAddingNote(false)} style={{ fontSize:'11px', color:'#999', cursor:'pointer', background:'none', border:'none' }}>
                {t('cancelNote')}
              </button>
            </div>
            <textarea
              rows={3}
              placeholder={t('notePlaceholder')}
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              style={{ width:'100%', padding:'8px', borderRadius:'5px', border:'1px solid #d4b840', fontSize:'13px', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }}
              autoFocus
            />
            <div style={{ display:'flex', gap:'8px', marginTop:'6px' }}>
              <input
                type="url"
                placeholder={t('urlPlaceholder')}
                value={noteUrl}
                onChange={e => setNoteUrl(e.target.value)}
                style={{ flex:1, padding:'6px 10px', borderRadius:'5px', border:'1px solid #d4b840', fontSize:'12px', fontFamily:'inherit' }}
              />
              <button
                type="submit"
                style={{ padding:'6px 14px', background:'#0dcc82', color:'#fff', border:'none', borderRadius:'5px', fontWeight:700, fontSize:'12px', cursor:'pointer' }}
              >
                {t('saveNote')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Saved notes */}
      {notes.length > 0 && (
        <div style={{ marginTop:'6px', borderTop:'1px solid #e8d87f', paddingTop:'6px' }}>
          {notes.map(note => (
            <div key={note.id} className="lc-saved-note" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ whiteSpace:'pre-wrap', lineHeight:'1.5' }}>{note.content}</div>
                {note.url && (
                  <a href={note.url} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'3px', fontSize:'11px', color:'#365da0', marginTop:'3px' }}>
                    <ExternalLink style={{ width:'10px', height:'10px' }} />
                    <span style={{ maxWidth:'300px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'inline-block' }}>{note.url}</span>
                  </a>
                )}
                <div style={{ fontSize:'10px', color:'#aaa', marginTop:'3px' }}>
                  {t('savedAt')} {new Date(note.createdAt).toLocaleString(uiLanguage === 'en' ? 'en-US' : 'cs-CZ')}
                </div>
              </div>
              <button
                onClick={() => onDeleteNote(block.id, note.id)}
                title={t('deleteNote')}
                style={{ marginLeft:'8px', color:'#ccc', cursor:'pointer', background:'none', border:'none', padding:'2px', flexShrink:0 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e74c3c')}
                onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
              >
                <Trash2 style={{ width:'13px', height:'13px' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
