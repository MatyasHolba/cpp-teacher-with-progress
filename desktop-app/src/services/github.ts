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
      filesToCommit.push({
        path: 'index.html',
        content: webViewerHtml
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
              `### Lekce: ${lesson ? lesson.number + ' — ' + lesson.title : lessonSlug}\n` +
              `*Blok: \`${blockId}\` | Zapsáno: ${new Date(note.createdAt).toLocaleDateString('cs-CZ')}*\n\n` +
              `${note.content}\n` +
              (note.url ? `\nOdkaz: [${note.url}](${note.url})\n` : '') +
              `\n---\n`
            );
          }
        }

        for (const [chapterId, contentArr] of Object.entries(notesByChapter)) {
          filesToCommit.push({
            path: `notes/chapter-${chapterId}.md`,
            content: `# Poznámky — Kapitola ${chapterId}\n\n` + contentArr.join('\n')
          });
        }
      }

      // 3. Full Web README with live GitHub Pages URL
      const pagesUrl = `https://${repoOwner}.github.io/${repoName}/`;
      filesToCommit.push({
        path: 'README.md',
        content: `# C++ Learning Journey

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
`
      });
    } else {
      // Mode === 'data-only'
      // Clean README without notes/ link
      filesToCommit.push({
        path: 'README.md',
        content: `# C++ Learning Progress

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
`
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

    const successMessage = mode === 'full-web'
      ? `Kompletní web, poznámky i data byly úspěšně nahrány na GitHub! (${pushedCount} souborů)`
      : `Data o postupu byla úspěšně zálohována na GitHub! (${pushedCount} souborů)`;

    return {
      success: true,
      message: successMessage,
      filesSynced: pushedCount
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Chyba při synchronizaci: ${err.message || String(err)}`,
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
      message: 'Chybí GitHub přihlašovací údaje.'
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
        message: `Soubor s progresem nebyl v repozitáři nalezen (HTTP ${res.status}).`
      };
    }

    const data = await res.json();
    const rawJson = atob(data.content.replace(/\s/g, ''));
    const bytes = Uint8Array.from(rawJson, c => c.charCodeAt(0));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    const progress = JSON.parse(decoded) as UserProgress;

    return {
      success: true,
      message: 'Progres byl úspěšně stažen a načten z GitHubu!',
      progress
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Chyba při načítání z GitHubu: ${err.message || String(err)}`
    };
  }
}
