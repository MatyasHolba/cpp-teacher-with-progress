import React, { useEffect, useState, useRef } from 'react';
import { Languages, X, Loader2 } from 'lucide-react';

interface PopupState {
  visible: boolean;
  x: number;
  y: number;
  text: string;
  translation: string;
  loading: boolean;
  error: boolean;
}

export const HighlightTranslator: React.FC<{ uiLanguage?: 'cs' | 'en' }> = ({ uiLanguage = 'cs' }) => {
  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
    translation: '',
    loading: false,
    error: false,
  });
  
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Don't trigger if clicking inside the popup itself
      if (popupRef.current && popupRef.current.contains(e.target as Node)) {
        return;
      }

      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      if (text.length > 1 && text.length < 500) {
        // Find position for the button (just above the selection)
        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setPopup({
          visible: true,
          x: rect.left + (rect.width / 2),
          y: rect.top - 10,
          text,
          translation: '',
          loading: false,
          error: false
        });
      } else if (text.length === 0 && popup.visible) {
        // Clicked elsewhere, hide
        setPopup(p => ({ ...p, visible: false }));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && popup.visible) {
        setPopup(p => ({ ...p, visible: false }));
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [popup.visible]);

  const translateText = async () => {
    if (!popup.text) return;
    
    setPopup(p => ({ ...p, loading: true, error: false }));
    
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=cs&dt=t&q=${encodeURIComponent(popup.text)}`
      );
      const data = await res.json();
      
      let translated = '';
      if (data && data[0]) {
        for (let i = 0; i < data[0].length; i++) {
          if (data[0][i][0]) {
            translated += data[0][i][0];
          }
        }
      }
      
      if (translated) {
        setPopup(p => ({ ...p, translation: translated, loading: false }));
      } else {
        throw new Error("Empty translation");
      }
    } catch (err) {
      console.error("Translation error:", err);
      setPopup(p => ({ ...p, error: true, loading: false }));
    }
  };

  if (!popup.visible) return null;

  return (
    <div 
      ref={popupRef}
      className="fixed z-50 animate-in fade-in zoom-in duration-150"
      style={{ 
        left: Math.max(10, Math.min(window.innerWidth - 300, popup.x)), 
        top: Math.max(10, popup.y),
        transform: 'translate(-50%, -100%)' // center above selection
      }}
    >
      {!popup.translation && !popup.loading && !popup.error ? (
        <button
          onClick={translateText}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-colors border border-blue-400"
        >
          <Languages className="w-3.5 h-3.5" />
          {uiLanguage === 'en' ? 'Translate' : 'Přeložit'}
        </button>
      ) : (
        <div className="bg-[var(--bg-app)] border border-[var(--border-color)] shadow-xl rounded-lg overflow-hidden w-72 flex flex-col">
          <div className="bg-[var(--bg-header)] px-2.5 py-1.5 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[10px] uppercase">
              <Languages className="w-3.5 h-3.5" />
              <span>{uiLanguage === 'en' ? 'Translation (EN → CS)' : 'Překlad (EN → CS)'}</span>
            </div>
            <button 
              onClick={() => setPopup(p => ({ ...p, visible: false }))}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="p-3 text-xs text-[var(--text-main)] max-h-48 overflow-y-auto custom-scrollbar">
            {popup.loading ? (
              <div className="flex items-center justify-center py-2 text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : popup.error ? (
              <div className="text-red-400 text-center py-1">
                {uiLanguage === 'en' ? 'Translation failed. Try again.' : 'Překlad se nezdařil. Zkuste to znovu.'}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[var(--text-muted)] italic text-[11px] pb-2 border-b border-[var(--border-color)]">
                  {popup.text}
                </div>
                <div className="font-medium text-[13px] leading-relaxed">
                  {popup.translation}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
