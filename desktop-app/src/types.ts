export interface LessonMeta {
  index: number;
  chapterId: string;
  number: string;
  title: string;
  url: string;
  slug: string;
}

export interface Chapter {
  id: string;
  header: string;
  title: string;
  fullTitle: string;
  lessons: LessonMeta[];
}

export interface TOCData {
  scrapedAt: string;
  totalChapters: number;
  totalLessons: number;
  chapters: Chapter[];
  allLessons: LessonMeta[];
}

export interface ContentBlock {
  id: string;
  type: 'section' | 'paragraph' | 'callout' | 'code' | 'output' | 'quiz' | 'list' | 'table';
  title?: string;
  title_cs?: string;
  html: string;
  html_cs?: string;
  preview?: string;
  code?: string;
  language?: string;
  canCheck: boolean;
  calloutType?: string;
  questionTitle?: string;
  questionHtml?: string;
  hintHtml?: string;
  solutionHtml?: string;
}

export interface LessonData {
  index: number;
  chapterId: string;
  number: string;
  title: string;
  title_cs?: string;
  url: string;
  slug: string;
  scrapedAt: string;
  totalBlocks: number;
  totalCheckpoints: number;
  blocks: ContentBlock[];
}

export interface NoteItem {
  id: string;
  blockId: string;
  lessonSlug: string;
  content: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProgress {
  checkedBlocks: Record<string, boolean>; // blockId -> boolean
  notes: Record<string, NoteItem[]>; // blockId -> NoteItem[]
  timeSpentPerLesson: Record<string, number>; // slug -> seconds (reading time CS)
  codingTimePerLesson?: Record<string, number>; // slug -> seconds (coding time CS)
  timeSpentPerLessonEN?: Record<string, number>; // slug -> seconds (reading time EN)
  codingTimePerLessonEN?: Record<string, number>; // slug -> seconds (coding time EN)
  totalSecondsSpent: number; // total reading seconds
  totalCodingSeconds?: number; // total coding seconds
  lastActiveLessonSlug: string;
}

export interface SyncSettings {
  githubToken: string;
  repoOwner: string;
  repoName: string;
  mode: 'data-only' | 'full-web';
  theme?: 'light' | 'dark' | 'oled' | 'sepia';
  uiLanguage?: 'cs' | 'en';
  contentLanguage?: 'cs' | 'en';
  githubExportContentLang?: 'cs' | 'en';
  githubExportUiLang?: 'cs' | 'en';
  githubReadmeLang?: 'cs' | 'en';
  lastSyncAt?: string;
  isFirstBoot?: boolean;
}

export interface SiteIndexEntry {
  id: string;
  term: string;
  is_sub: boolean;
  is_cross_ref: boolean;
  cross_ref: string | null;
  lessons: { number: string; url: string }[];
  children: SiteIndexEntry[];
}

export interface SiteIndexData {
  letters: string[];
  index: Record<string, SiteIndexEntry[]>;
}
