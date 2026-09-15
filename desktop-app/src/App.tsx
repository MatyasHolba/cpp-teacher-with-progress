import React, { useState, useEffect, useCallback } from 'react';
import { TOCData, LessonData, UserProgress, SyncSettings, NoteItem } from './types';
import { Sidebar } from './components/Sidebar';
import { LessonView } from './components/LessonView';
import { SettingsModal } from './components/SettingsModal';
import { PortfolioWidgetModal } from './components/PortfolioWidgetModal';
import { loadProgress, saveProgress, loadSettings, saveSettings } from './services/storage';
import { useTimeTracker } from './hooks/useTimeTracker';
import { Sparkles, Loader2, PanelLeft, PanelLeftClose } from 'lucide-react';
import { GithubIcon } from './components/GithubIcon';

export function App() {
  const [toc, setToc] = useState<TOCData | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string>('introduction-to-these-tutorials');
  const [currentLesson, setCurrentLesson] = useState<LessonData | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [progress, setProgress] = useState<UserProgress>(loadProgress);
  const [settings, setSettings] = useState<SyncSettings>(loadSettings);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);

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

  // Handle active time tracker ticks
  const handleTimeTick = useCallback((slug: string, deltaSeconds: number) => {
    setProgress(prev => {
      const currentLessonSecs = (prev.timeSpentPerLesson[slug] || 0) + deltaSeconds;
      return {
        ...prev,
        timeSpentPerLesson: {
          ...prev.timeSpentPerLesson,
          [slug]: currentLessonSecs
        },
        totalSecondsSpent: prev.totalSecondsSpent + deltaSeconds
      };
    });
  }, []);

  const { isActive, idleReason, lessonSeconds } = useTimeTracker({
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#12141a] text-gray-100 font-sans">
      {/* Left Navigation Sidebar */}
      {isSidebarOpen && toc && (
        <Sidebar
          toc={toc}
          progress={progress}
          activeLessonSlug={currentSlug}
          onSelectLesson={slug => setCurrentSlug(slug)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <div className="h-12 border-b border-gray-800 bg-[#181b22] px-6 flex items-center justify-between select-none flex-shrink-0">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
              title={isSidebarOpen ? "Skrýt panel" : "Zobrazit panel"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            <span className="text-gray-300 font-medium">C++ Study Book</span>
            <span>/</span>
            <span className="text-blue-400 font-mono">{currentLesson?.number || ''}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPortfolioOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portfolio Widget</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-medium transition-colors"
            >
              <GithubIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>GitHub Sync</span>
              {settings.lastSyncAt && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" title="Synchronizováno" />
              )}
            </button>
          </div>
        </div>

        {/* Lesson View or Loading State */}
        {isLoadingLesson ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span>Načítání lekce...</span>
          </div>
        ) : currentLesson ? (
          <LessonView
            lesson={currentLesson}
            checkedBlocks={progress.checkedBlocks}
            notes={progress.notes}
            isActive={isActive}
            idleReason={idleReason}
            lessonSeconds={lessonSeconds}
            totalLessonSeconds={progress.timeSpentPerLesson[currentSlug] || 0}
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            onToggleCheck={handleToggleCheck}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onNavigateLesson={slug => setCurrentSlug(slug)}
            onMarkAllDone={handleMarkAllDone}
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

      {/* Portfolio Widget Modal */}
      <PortfolioWidgetModal
        isOpen={isPortfolioOpen}
        settings={settings}
        progress={progress}
        toc={toc}
        onClose={() => setIsPortfolioOpen(false)}
      />
    </div>
  );
}

export default App;
