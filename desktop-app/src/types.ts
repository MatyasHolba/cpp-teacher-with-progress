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
  html: string;
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
  timeSpentPerLesson: Record<string, number>; // slug -> seconds
  totalSecondsSpent: number;
  lastActiveLessonSlug: string;
}

export interface SyncSettings {
  githubToken: string;
  repoOwner: string;
  repoName: string;
  mode: 'data-only' | 'full-web';
  lastSyncAt?: string;
}
