import { UserProgress, SyncSettings, TOCData } from '../types';
import webViewerHtml from '../templates/webViewer.html?raw';

interface GitHubFileCommit {
  path: string;
  content: string; // UTF-8 plain text string
}

async function getFileSha(owner: string, repo: string, path: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data.sha || null;
    }
    return null;
  } catch {
    return null;
  }
}

async function putFile(owner: string, repo: string, path: string, content: string, message: string, token: string): Promise<boolean> {
  const sha = await getFileSha(owner, repo, path, token);
  // Base64 encode UTF-8 string safely in browser
  const bytes = new TextEncoder().encode(content);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Content = btoa(binary);

  const body: { message: string; content: string; sha?: string } = {
    message,
    content: base64Content
  };
  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return res.ok;
}

function formatExactDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0 min 0 s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes} min`);
  parts.push(`${seconds} s`);
  return parts.join(' ');
}

function formatBadgeDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h%20${minutes}m`;
  if (minutes > 0) return `${minutes}m%20${seconds}s`;
  return `${seconds}s`;
}

export async function pushToGitHub(
  progress: UserProgress,
  settings: SyncSettings,
  toc: TOCData | null
): Promise<{ success: boolean; message: string; filesSynced: number }> {
  if (!settings.githubToken || !settings.repoOwner || !settings.repoName) {
    return {
      success: false,
      message: 'Chybí GitHub přihlašovací údaje (Token, Vlastník nebo Název repozitáře).',
      filesSynced: 0
    };
  }

  const { repoOwner, repoName, githubToken, mode } = settings;

  try {
    // 1. Calculate stats
    const totalChecked = Object.values(progress.checkedBlocks).filter(Boolean).length;
    const totalCheckpoints = 15873; // Course total
    const percentage = Math.min(100, Math.round((totalChecked / totalCheckpoints) * 1000) / 10);
    const readingSeconds = progress.totalSecondsSpent || 0;
    const codingSeconds = progress.totalCodingSeconds || 0;
    const totalStudySeconds = readingSeconds + codingSeconds;

    const totalStudyFormatted = formatExactDuration(totalStudySeconds);
    const readingFormatted = formatExactDuration(readingSeconds);
    const codingFormatted = formatExactDuration(codingSeconds);
    const timeBadge = formatBadgeDuration(totalStudySeconds);
    const notesCount = Object.values(progress.notes).flat().length;

    const stats = {
      course: 'learncpp.com',
      lastSync: new Date().toISOString(),
      mode,
      totalCheckpoints,
      checkedCount: totalChecked,
      progressPercentage: percentage,
      totalHours: Math.round((totalStudySeconds / 3600) * 10) / 10,
      readingHours: Math.round((readingSeconds / 3600) * 10) / 10,
      codingHours: Math.round((codingSeconds / 3600) * 10) / 10,
      totalSeconds: totalStudySeconds,
      readingSeconds,
      codingSeconds,
      formattedTotalTime: totalStudyFormatted,
      formattedReadingTime: readingFormatted,
      formattedCodingTime: codingFormatted,
      notesCount
    };

    const filesToCommit: GitHubFileCommit[] = [];

    // Always commit stats.json & data/progress.json
    filesToCommit.push({
      path: 'stats.json',
      content: JSON.stringify(stats, null, 2)
    });

    filesToCommit.push({
      path: 'data/progress.json',
      content: JSON.stringify(progress, null, 2)
    });

    if (mode === 'full-web') {
      // 1. Upload Web Viewer for GitHub Pages
      // Inject language settings into the web viewer HTML
      const langScript = `<script>
        window.EXPORT_SETTINGS = {
          uiLanguage: "${settings.githubExportUiLang || 'cs'}",
          contentLanguage: "${settings.githubExportContentLang || 'cs'}"
        };
      </script>`;
      let finalHtml = webViewerHtml.replace('</head>', `${langScript}\n</head>`);
      
      if (settings.githubExportUiLang === 'en') {
        finalHtml = finalHtml
          .replace('Nainstalovat aplikaci', 'Install App')
          .replace('Hledat v lekcích...', 'Search lessons...')
          .replace('Zobrazit/Skrýt detailní statistiky', 'Toggle detailed statistics')
          .replace(' splněno', ' completed')
          .replace('Celkový čas:', 'Total active time:')
          .replace('📖 Čtení teorie:', 'Reading theory:')
          .replace('💻 Psaní kódu:', 'Coding & practice:')
          .replace('Splněno úkolů:', 'Completed tasks:')
          .replace('Vlastních poznámek:', 'Personal notes:')
          .replace('Zavřít', 'Close')
          .replace('Stáhněte si desktopovou aplikaci C++ Learning Tracker.', 'Download the C++ Learning Tracker desktop app.')
          .replace('Zobrazit/Skrýt panel', 'Toggle Panel')
          .replace('Další lekce', 'Next Lesson')
          .replace('Předchozí lekce', 'Previous Lesson')
          .replace('Poznámky', 'Notes')
          .replace('Zapsáno', 'Added')
          .replace('Zobrazit zdrojový článek', 'View source article');
      }
      
      filesToCommit.push({
        path: 'index.html',
        content: finalHtml
      });

      // 2. Upload Markdown notes if any
      if (toc && notesCount > 0) {
        const notesByChapter: Record<string, string[]> = {};
        for (const [blockId, noteList] of Object.entries(progress.notes)) {
          if (!noteList || noteList.length === 0) continue;
          const lessonSlug = noteList[0]?.lessonSlug || blockId.split('_b')[0];
          const lesson = toc.allLessons.find(l => l.slug === lessonSlug);
          const chapterId = lesson ? lesson.chapterId : 'general';

          if (!notesByChapter[chapterId]) {
            notesByChapter[chapterId] = [];
          }

          for (const note of noteList) {
            notesByChapter[chapterId].push(
              settings.githubReadmeLang === 'en' 
                ? `### Lesson: ${lesson ? lesson.number + ' — ' + lesson.title : lessonSlug}\n*Block: \`${blockId}\` | Added: ${new Date(note.createdAt).toLocaleDateString('en-US')}*\n\n${note.content}\n${note.url ? `\nLink: [${note.url}](${note.url})\n` : ''}\n---\n`
                : `### Lekce: ${lesson ? lesson.number + ' — ' + lesson.title : lessonSlug}\n*Blok: \`${blockId}\` | Zapsáno: ${new Date(note.createdAt).toLocaleDateString('cs-CZ')}*\n\n${note.content}\n${note.url ? `\nOdkaz: [${note.url}](${note.url})\n` : ''}\n---\n`
            );
          }
        }

        for (const [chapterId, contentArr] of Object.entries(notesByChapter)) {
          filesToCommit.push({
            path: `notes/chapter-${chapterId}.md`,
            content: settings.githubReadmeLang === 'en'
              ? `# Notes — Chapter ${chapterId}\n\n` + contentArr.join('\n')
              : `# Poznámky — Kapitola ${chapterId}\n\n` + contentArr.join('\n')
          });
        }
      }

      // 3. Full Web README with live GitHub Pages URL
      const pagesUrl = `https://${repoOwner}.github.io/${repoName}/`;
      
      const readmeEn = `# C++ Learning Journey

![Progress](https://img.shields.io/badge/C++%20Progress-${percentage}%25-brightgreen)
![Time](https://img.shields.io/badge/Active%20Time-${timeBadge}-blue)
![Completed](https://img.shields.io/badge/Completed-${totalChecked}%20%2F%20${totalCheckpoints}-orange)

> **Credits:** This repository tracks my personal progress studying C++. All source materials and lessons originate from the excellent course at **[learncpp.com](https://www.learncpp.com/)**. Thank you to the authors for their great work!

## Interactive Web Viewer
The complete course, including checked lessons, study time, and notes, is available online on GitHub Pages:
**[Open Interactive Web Viewer](${pagesUrl})**

> Generated by **C++ Learning Tracker** created by Matyáš Holba. Want to download the app and track your own progress? **[Download the app here](https://github.com/MatyasHolba/cpp-teacher-with-progress)**.

### Study Overview

| Metric | Value |
| :--- | :--- |
| **Completed** | **${percentage}%** (${totalChecked.toLocaleString('en-US')} out of ${totalCheckpoints.toLocaleString('en-US')} tasks) |
| **Total Active Time** | **${totalStudyFormatted}** |
| — Theory Reading | ${readingFormatted} |
| — Coding & Practice | ${codingFormatted} |
| **Notes & Code Snippets** | ${notesCount} |
| **Last Updated** | ${new Date().toLocaleDateString('en-US')} at ${new Date().toLocaleTimeString('en-US')} |

### Links and Data
- [Launch Interactive Web on GitHub Pages](${pagesUrl})
${notesCount > 0 ? `- [View Markdown Notes Directory (notes/)](./notes/)\n` : ''}- [Raw Progress Data (data/progress.json)](./data/progress.json)
- [Study Statistics (stats.json)](./stats.json)
`;

      const readmeCs = `# C++ Learning Journey

![Progress](https://img.shields.io/badge/C++%20Progress-${percentage}%25-brightgreen)
![Čas](https://img.shields.io/badge/Aktivn%C3%AD%20%C4%8Cas-${timeBadge}-blue)
![Splněno](https://img.shields.io/badge/Spln%C4%9Bno-${totalChecked}%20%2F%20${totalCheckpoints}-orange)

> **Poděkování:** Tento repozitář obsahuje můj osobní postup studia C++. Veškeré zdrojové texty a výukové materiály pocházejí z vynikajícího kurzu na **[learncpp.com](https://www.learncpp.com/)**. Děkuji autorům za skvělou práci při výuce C++! 

## Interaktivní webový přehled
Kompletní kurz včetně odškrtaných splněných kapitol a úkolů, studijních časů a zapsaných poznámek je dostupný online na GitHub Pages:
**[Otevřít interaktivní web](${pagesUrl})**

> Generováno aplikací **C++ Learning Tracker** vytvořenou Matyášem Holbou. Chceš si aplikaci také stáhnout a zaznamenávat si vlastní postup? **[Stáhnout aplikaci zde](https://github.com/MatyasHolba/cpp-teacher-with-progress)**.

### Přehled studia

| Metrika | Hodnota |
| :--- | :--- |
| **Dokončeno** | **${percentage}%** (${totalChecked.toLocaleString('cs-CZ')} z ${totalCheckpoints.toLocaleString('cs-CZ')} úkolů) |
| **Celkový aktivní čas** | **${totalStudyFormatted}** |
| — Čtení teorie | ${readingFormatted} |
| — Psaní kódu & praxe | ${codingFormatted} |
| **Vlastní poznámky a kód** | ${notesCount} |
| **Poslední aktualizace** | ${new Date().toLocaleDateString('cs-CZ')} v ${new Date().toLocaleTimeString('cs-CZ')} |

### Odkazy a data
- [Spustit interaktivní web na GitHub Pages](${pagesUrl})
${notesCount > 0 ? `- [Prohlédnout složku s poznámkami v Markdownu (notes/)](./notes/)\n` : ''}- [Surová data o postupu (data/progress.json)](./data/progress.json)
- [Statistiky studia (stats.json)](./stats.json)
`;

      filesToCommit.push({
        path: 'README.md',
        content: settings.githubReadmeLang === 'en' ? readmeEn : readmeCs
      });
    } else {
      // Mode === 'data-only'
      const readmeEn = `# C++ Learning Progress

![Progress](https://img.shields.io/badge/C++%20Progress-${percentage}%25-brightgreen)
![Time](https://img.shields.io/badge/Active%20Time-${timeBadge}-blue)
![Completed](https://img.shields.io/badge/Completed-${totalChecked}%20%2F%20${totalCheckpoints}-orange)

> **Credits:** This repository tracks my personal progress studying C++. All source materials and lessons originate from the excellent course at **[learncpp.com](https://www.learncpp.com/)**. Thank you to the authors for their great work!

> Generated by **C++ Learning Tracker** created by Matyáš Holba. Want to download the app and track your own progress? **[Download the app here](https://github.com/MatyasHolba/cpp-teacher-with-progress)**.

### Study Overview

| Metric | Value |
| :--- | :--- |
| **Completed** | **${percentage}%** (${totalChecked.toLocaleString('en-US')} out of ${totalCheckpoints.toLocaleString('en-US')} tasks) |
| **Total Active Time** | **${totalStudyFormatted}** |
| — Theory Reading | ${readingFormatted} |
| — Coding & Practice | ${codingFormatted} |
| **Last Synchronized** | ${new Date().toLocaleDateString('en-US')} at ${new Date().toLocaleTimeString('en-US')} |

### Progress Data
- [Raw Progress Data (data/progress.json)](./data/progress.json)
- [Study Statistics (stats.json)](./stats.json)
`;

      const readmeCs = `# C++ Learning Progress

![Progress](https://img.shields.io/badge/C++%20Progress-${percentage}%25-brightgreen)
![Čas](https://img.shields.io/badge/Aktivn%C3%AD%20%C4%8Cas-${timeBadge}-blue)
![Splněno](https://img.shields.io/badge/Spln%C4%9Bno-${totalChecked}%20%2F%20${totalCheckpoints}-orange)

> **Poděkování:** Tento repozitář obsahuje můj osobní postup studia C++. Veškeré zdrojové texty a výukové materiály pocházejí z vynikajícího kurzu na **[learncpp.com](https://www.learncpp.com/)**. Děkuji autorům za skvělou práci při výuce C++! 

> Generováno aplikací **C++ Learning Tracker** vytvořenou Matyášem Holbou. Chceš si aplikaci také stáhnout a zaznamenávat si vlastní postup? **[Stáhnout aplikaci zde](https://github.com/MatyasHolba/cpp-teacher-with-progress)**.

### Přehled studia

| Metrika | Hodnota |
| :--- | :--- |
| **Dokončeno** | **${percentage}%** (${totalChecked.toLocaleString('cs-CZ')} z ${totalCheckpoints.toLocaleString('cs-CZ')} úkolů) |
| **Celkový aktivní čas** | **${totalStudyFormatted}** |
| — Čtení teorie | ${readingFormatted} |
| — Psaní kódu & praxe | ${codingFormatted} |
| **Poslední synchronizace** | ${new Date().toLocaleDateString('cs-CZ')} v ${new Date().toLocaleTimeString('cs-CZ')} |

### Data o postupu
- [Surová data postupu (data/progress.json)](./data/progress.json)
- [Statistiky studia (stats.json)](./stats.json)
`;

      filesToCommit.push({
        path: 'README.md',
        content: settings.githubReadmeLang === 'en' ? readmeEn : readmeCs
      });
    }

    // Push each file to GitHub
    let pushedCount = 0;
    for (const file of filesToCommit) {
      const ok = await putFile(
        repoOwner,
        repoName,
        file.path,
        file.content,
        `Update ${file.path} — ${percentage}% done (${timeBadge})`,
        githubToken
      );
      if (ok) pushedCount++;
    }

    const successMessage = settings.uiLanguage === 'en'
      ? (mode === 'full-web' 
        ? `Full web, notes, and data successfully pushed to GitHub! (${pushedCount} files)`
        : `Progress data successfully backed up to GitHub! (${pushedCount} files)`)
      : (mode === 'full-web'
        ? `Kompletní web, poznámky i data byly úspěšně nahrány na GitHub! (${pushedCount} souborů)`
        : `Data o postupu byla úspěšně zálohována na GitHub! (${pushedCount} souborů)`);

    return {
      success: true,
      message: successMessage,
      filesSynced: pushedCount
    };
  } catch (err: any) {
    return {
      success: false,
      message: settings.uiLanguage === 'en' 
        ? `Sync error: ${err.message || String(err)}`
        : `Chyba při synchronizaci: ${err.message || String(err)}`,
      filesSynced: 0
    };
  }
}

export async function pullFromGitHub(
  settings: SyncSettings
): Promise<{ success: boolean; message: string; progress?: UserProgress }> {
  if (!settings.githubToken || !settings.repoOwner || !settings.repoName) {
    return {
      success: false,
      message: settings.uiLanguage === 'en' ? 'Missing GitHub credentials.' : 'Chybí GitHub přihlašovací údaje.'
    };
  }

  const { repoOwner, repoName, githubToken } = settings;

  try {
    const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/progress.json`, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      return {
        success: false,
        message: settings.uiLanguage === 'en' 
          ? `Progress file not found in repository (HTTP ${res.status}).`
          : `Soubor s progresem nebyl v repozitáři nalezen (HTTP ${res.status}).`
      };
    }

    const data = await res.json();
    const rawJson = atob(data.content.replace(/\s/g, ''));
    const bytes = Uint8Array.from(rawJson, c => c.charCodeAt(0));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    const progress: UserProgress = JSON.parse(decoded);

    return {
      success: true,
      message: settings.uiLanguage === 'en' ? 'Progress successfully loaded from GitHub!' : 'Progres byl úspěšně načten z GitHubu!',
      progress
    };
  } catch (err: any) {
    return {
      success: false,
      message: settings.uiLanguage === 'en'
        ? `Error downloading data: ${err.message || String(err)}`
        : `Chyba při stahování dat: ${err.message || String(err)}`
    };
  }
}
