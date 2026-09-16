import React, { useState, useEffect, useCallback } from 'react';
import { TOCData, LessonData, UserProgress, SyncSettings, NoteItem } from './types';
import { Sidebar } from './components/Sidebar';
import { LessonView } from './components/LessonView';
import { SettingsModal } from './components/SettingsModal';
import { loadProgress, saveProgress, loadSettings, saveSettings } from './services/storage';
import { useTimeTracker } from './hooks/useTimeTracker';
import { Sparkles, Loader2, PanelLeft, PanelLeftClose, Languages } from 'lucide-react';
import { GithubIcon } from './components/GithubIcon';
import { HighlightTranslator } from './components/HighlightTranslator';
import { LanguageSettingsModal } from './components/LanguageSettingsModal';
import { FirstBootModal } from './components/FirstBootModal';
import { getT } from './utils/i18n';

export function App() {
  const [progress, setProgress] = useState<UserProgress>(loadProgress);
  const [settings, setSettings] = useState<SyncSettings>(loadSettings);
  const t = getT(settings.uiLanguage || 'en');
  const activeTheme = settings.theme || "dark";
  const [toc, setToc] = useState<TOCData | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string>('introduction-to-these-tutorials');
  const [currentLesson, setCurrentLesson] = useState<LessonData | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageSettingsOpen, setIsLanguageSettingsOpen] = useState(false);
  // Load TOC on startup
  useEffect(() => {
    fetch('/content-bundle/toc.json')
      .then(r => r.json())
      .then((data: TOCData) => {
        setToc(data);
        if (progress.lastActiveLessonSlug) {
          setCurrentSlug(progress.lastActiveLessonSlug);
        }
      })
      .catch(err => console.error('Failed to load TOC:', err));
  }, []);

  // Save progress whenever it updates
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Save settings whenever they update
  const handleSaveSettings = (newSettings: SyncSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Load lesson content when currentSlug changes
  useEffect(() => {
    if (!currentSlug) return;
    setIsLoadingLesson(true);

    fetch(`/content-bundle/lessons/${currentSlug}.json`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP error ${r.status}`);
        return r.json();
      })
      .then((data: LessonData) => {
        setCurrentLesson(data);
        setIsLoadingLesson(false);
        // Highlight prism code blocks if prism is loaded
        setTimeout(() => {
          if ((window as any).Prism) {
            (window as any).Prism.highlightAll();
          }
        }, 50);
      })
      .catch(err => {
        console.error(`Failed to load lesson ${currentSlug}:`, err);
        setIsLoadingLesson(false);
      });

    setProgress(prev => ({ ...prev, lastActiveLessonSlug: currentSlug }));
  }, [currentSlug]);

  // Handle active time tracker ticks (reading vs coding)
  const handleTimeTick = useCallback((slug: string, deltaSeconds: number, type: 'reading' | 'coding' = 'reading') => {
    const lang = settings.contentLanguage || 'cs';
    setProgress(prev => {
      if (type === 'coding') {
        if (lang === 'en') {
          const codingMap = prev.codingTimePerLessonEN || {};
          return {
            ...prev,
            codingTimePerLessonEN: { ...codingMap, [slug]: (codingMap[slug] || 0) + deltaSeconds },
            totalCodingSeconds: (prev.totalCodingSeconds || 0) + deltaSeconds
          };
        } else {
          const codingMap = prev.codingTimePerLesson || {};
          return {
            ...prev,
            codingTimePerLesson: { ...codingMap, [slug]: (codingMap[slug] || 0) + deltaSeconds },
            totalCodingSeconds: (prev.totalCodingSeconds || 0) + deltaSeconds
          };
        }
      }

      // reading
      if (lang === 'en') {
        const timeMap = prev.timeSpentPerLessonEN || {};
        return {
          ...prev,
          timeSpentPerLessonEN: { ...timeMap, [slug]: (timeMap[slug] || 0) + deltaSeconds },
          totalSecondsSpent: (prev.totalSecondsSpent || 0) + deltaSeconds
        };
      } else {
        const timeMap = prev.timeSpentPerLesson || {};
        return {
          ...prev,
          timeSpentPerLesson: { ...timeMap, [slug]: (timeMap[slug] || 0) + deltaSeconds },
          totalSecondsSpent: (prev.totalSecondsSpent || 0) + deltaSeconds
        };
      }
    });
  }, [settings.contentLanguage]);

  const {
    isActive,
    isCodingMode,
    idleReason,
    lessonSeconds,
    codingSeconds,
    resumeTracking,
    startCodingMode,
    stopCodingMode
  } = useTimeTracker({
    currentLessonSlug: currentSlug,
    onTick: handleTimeTick
  });

  // Checkbox toggle
  const handleToggleCheck = (blockId: string) => {
    setProgress(prev => {
      const updatedChecked = {
        ...prev.checkedBlocks,
        [blockId]: !prev.checkedBlocks[blockId]
      };
      return { ...prev, checkedBlocks: updatedChecked };
    });
  };

  // Add Note
  const handleAddNote = (blockId: string, content: string, url?: string) => {
    const newNote: NoteItem = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      blockId,
      lessonSlug: currentSlug,
      content,
      url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setProgress(prev => {
      const existing = prev.notes[blockId] || [];
      return {
        ...prev,
        notes: {
          ...prev.notes,
          [blockId]: [...existing, newNote]
        }
      };
    });
  };

  // Delete Note
  const handleDeleteNote = (blockId: string, noteId: string) => {
    setProgress(prev => {
      const existing = prev.notes[blockId] || [];
      return {
        ...prev,
        notes: {
          ...prev.notes,
          [blockId]: existing.filter(n => n.id !== noteId)
        }
      };
    });
  };

  // Mark all checkable items in current lesson as completed
  const handleMarkAllDone = () => {
    if (!currentLesson) return;
    setProgress(prev => {
      const nextChecked = { ...prev.checkedBlocks };
      currentLesson.blocks.forEach(b => {
        if (b.canCheck) {
          nextChecked[b.id] = true;
        }
      });
      return { ...prev, checkedBlocks: nextChecked };
    });
  };

  // Find next and prev lessons
  const currentIndex = toc?.allLessons.findIndex(l => l.slug === currentSlug) ?? -1;
  const prevLesson = currentIndex > 0 && toc ? toc.allLessons[currentIndex - 1] : undefined;
  const nextLesson = currentIndex >= 0 && currentIndex < (toc?.allLessons.length ?? 0) - 1 && toc
    ? toc.allLessons[currentIndex + 1]
    : undefined;
  // Find current chapter
  const currentChapter = toc?.chapters.find(ch => ch.lessons.some(l => l.slug === currentSlug));

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-main)] font-sans theme-${activeTheme}`}>
      {/* Left Navigation Sidebar */}
      {isSidebarOpen && toc && (
        <Sidebar
          toc={toc}
          progress={progress}
          activeLessonSlug={currentSlug}
          onSelectLesson={slug => setCurrentSlug(slug)}
          onToggleSidebar={() => setIsSidebarOpen(false)}
          uiLanguage={settings.uiLanguage || 'en'}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <div className="h-12 border-b border-[var(--border-color)] bg-[var(--bg-header)] px-6 flex items-center justify-between select-none flex-shrink-0">
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded hover:bg-[var(--bg-hover)] transition-colors" title={t('toggleSidebar')}><PanelLeft className="w-5 h-5" /></button>}
            <span className="text-[var(--text-main)] font-medium">C++ Study Book</span>
            {currentChapter && (
              <>
                <span>/</span>
                <span className="text-[var(--text-muted)] font-mono text-[10px]">Ch.{currentChapter.id}</span>
                <span className="text-[var(--text-main)] truncate max-w-[200px]" title={currentChapter.title}>{currentChapter.title}</span>
              </>
            )}
          </div>

                      <div className="flex items-center gap-2">
              <select
                value={activeTheme}
                onChange={(e) => {
                  const newSettings = { ...settings, theme: e.target.value as any };
                  setSettings(newSettings);
                  saveSettings(newSettings);
                }}
                className="bg-transparent text-[var(--text-main)] border border-[var(--border-color)] rounded-md px-2 py-1 text-xs outline-none cursor-pointer hover:bg-[var(--bg-hover)]"
              >
                <option value="light">{t('themeLight')}</option>
                <option value="dark">{t('themeDark')}</option>
                <option value="oled">{t('themeOLED')}</option>
                <option value="sepia">{t('themeSepia')}</option>
              </select>
              
              <button
                onClick={() => setIsLanguageSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] text-xs font-medium transition-colors hover:bg-[var(--border-color)]"
              >
                <Languages className="w-3.5 h-3.5 text-blue-400" />
                <span>{t('languageSettings')}</span>
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-[var(--bg-hover)] text-gray-200 border border-gray-700 text-xs font-medium transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>{t('githubSync')}</span>
                {settings.lastSyncAt && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" title={settings.uiLanguage === 'en' ? 'Synchronized' : 'Synchronizováno'} />
                )}
              </button>
            </div>
          </div>

        {/* Lesson View or Loading State */}
        {isLoadingLesson ? (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span>{settings.uiLanguage === 'en' ? 'Loading lesson...' : 'Načítání lekce...'}</span>
          </div>
        ) : currentLesson ? (
            <LessonView
              lesson={currentLesson}
              theme={settings.theme || 'dark'}
              uiLanguage={settings.uiLanguage || 'en'}
              contentLanguage={settings.contentLanguage || 'en'}
              onToggleTheme={() => {
                const newSettings: SyncSettings = { ...settings, theme: settings.theme === 'light' ? 'dark' : 'light' };
                setSettings(newSettings);
                saveSettings(newSettings);
              }}
              checkedBlocks={progress.checkedBlocks}
              notes={progress.notes}
              isActive={isActive}
              isCodingMode={isCodingMode}
              idleReason={idleReason}
              onResumeTracking={resumeTracking}
              onStartCodingMode={startCodingMode}
              onStopCodingMode={stopCodingMode}
              lessonSeconds={lessonSeconds}
              codingSeconds={codingSeconds}
              totalLessonSeconds={(settings.contentLanguage === 'en' ? progress.timeSpentPerLessonEN?.[currentSlug] : progress.timeSpentPerLesson[currentSlug]) || 0}
              totalCodingSeconds={(settings.contentLanguage === 'en' ? progress.codingTimePerLessonEN?.[currentSlug] : progress.codingTimePerLesson?.[currentSlug]) || 0}
              prevLesson={prevLesson}
              nextLesson={nextLesson}
              onToggleCheck={handleToggleCheck}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onNavigateLesson={slug => setCurrentSlug(slug)}
              onMarkAllDone={() => {
                const checkable = currentLesson.blocks.filter(b => b.canCheck);
                const allChecked = checkable.every(b => progress.checkedBlocks[b.id]);
                setProgress(prev => {
                  const updatedChecked = { ...prev.checkedBlocks };
                  checkable.forEach(b => {
                    updatedChecked[b.id] = !allChecked;
                  });
                  return { ...prev, checkedBlocks: updatedChecked };
                });
              }}
            />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Vyberte lekci v levém menu pro zahájení studia.
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        progress={progress}
        toc={toc}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={handleSaveSettings}
        onProgressUpdated={newProgress => setProgress(newProgress)}
      />

      <LanguageSettingsModal
        isOpen={isLanguageSettingsOpen}
        settings={settings}
        onClose={() => setIsLanguageSettingsOpen(false)}
        onSaveSettings={handleSaveSettings}
      />

      {/* Global Highlight Translator */}
      <HighlightTranslator uiLanguage={settings.uiLanguage || 'en'} />
      <FirstBootModal
        isOpen={settings.isFirstBoot === true}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}

export default App;









