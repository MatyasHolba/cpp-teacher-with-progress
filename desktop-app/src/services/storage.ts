import { UserProgress, SyncSettings, NoteItem } from '../types';

const PROGRESS_STORAGE_KEY = 'cpp_tracker_progress_v1';
const SETTINGS_STORAGE_KEY = 'cpp_tracker_settings_v1';

export const DEFAULT_PROGRESS: UserProgress = {
  checkedBlocks: {},
  notes: {},
  timeSpentPerLesson: {},
  codingTimePerLesson: {},
  totalSecondsSpent: 0,
  totalCodingSeconds: 0,
  lastActiveLessonSlug: 'introduction-to-these-tutorials'
};

export const DEFAULT_SETTINGS: SyncSettings = {
  githubToken: '',
  repoOwner: '',
  repoName: 'cpp-learning-progress',
  mode: 'data-only'
};

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROGRESS, ...parsed };
  } catch (err) {
    console.error('Failed to load progress from storage:', err);
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save progress to storage:', err);
  }
}

export function loadSettings(): SyncSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: SyncSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
