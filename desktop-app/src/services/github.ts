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

export async function pushToGitHub(
  progress: UserProgress,
  settings: SyncSettings,
  toc: TOCData | null
): Promise<{ success: boolean; message: string; filesSynced: number }> {
  if (!settings.githubToken || !settings.repoOwner || !settings.repoName) {
    return {
      success: false,
      message: 'Chybí GitHub token, vlastník repozitáře nebo název repozitáře.',
      filesSynced: 0
    };
  }

  const { repoOwner, repoName, githubToken, mode } = settings;

  try {
    // 1. Calculate stats
    const totalChecked = Object.values(progress.checkedBlocks).filter(Boolean).length;
    const totalCheckpoints = 15873; // Course total
    const percentage = Math.min(100, Math.round((totalChecked / totalCheckpoints) * 1000) / 10);
    const totalReadingHours = Math.round((progress.totalSecondsSpent / 3600) * 10) / 10;
    const totalCodingHours = Math.round(((progress.totalCodingSeconds || 0) / 3600) * 10) / 10;
    const totalStudyHours = Math.round(((progress.totalSecondsSpent + (progress.totalCodingSeconds || 0)) / 3600) * 10) / 10;
    const notesCount = Object.values(progress.notes).flat().length;

    const stats = {
      course: 'learncpp.com',
      lastSync: new Date().toISOString(),
      mode,
      totalCheckpoints,
      checkedCount: totalChecked,
      progressPercentage: percentage,
      totalHours: totalStudyHours,
      readingHours: totalReadingHours,
      codingHours: totalCodingHours,
      totalSeconds: progress.totalSecondsSpent + (progress.totalCodingSeconds || 0),
      readingSeconds: progress.totalSecondsSpent,
      codingSeconds: progress.totalCodingSeconds || 0,
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
              (note.url ? `\n🔗 Odkaz: [${note.url}](${note.url})\n` : '') +
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
        content: `# 📘 C++ Learning Journey & Portfolio — learncpp.com

![Progress](https://img.shields.io/badge/C++%20Progress-${percentage}%25-brightgreen)
![Time](https://img.shields.io/badge/Aktivn%C3%AD%20%C4%8Cas-${totalStudyHours}h-blue)
![Checkpoints](https://img.shields.io/badge/Spln%C4%9Bno-${totalChecked}%20%2F%20${totalCheckpoints}-orange)

## 🌐 Interaktivní Webové Portfolio
Celý kurz i s mými odškrtanými splněnými úkoly, časy a zapsanými poznámkami je publikován na GitHub Pages:
👉 **[Otevřít interaktivní web](${pagesUrl})**

> Automaticky synchronizováno z desktopové aplikace **C++ Learning Tracker**.

### 📊 Celkový přehled
- **Dokončeno**: **${percentage}%** (${totalChecked.toLocaleString('cs-CZ')} z ${totalCheckpoints.toLocaleString('cs-CZ')} odstavců/úkolů)
- **Celkový aktivní čas studia**: **${totalStudyHours} hodin**
  - 📖 Čtení teorie: **${totalReadingHours} hodin**
  - 💻 Praktické psaní kódu: **${totalCodingHours} hodin**
- **Vlastních poznámek a kódů**: **${notesCount}**
- **Poslední aktualizace**: ${new Date().toLocaleDateString('cs-CZ')} v ${new Date().toLocaleTimeString('cs-CZ')}

### 📝 Odkazy a data
- 🌐 [Spustit interaktivní web na GitHub Pages](${pagesUrl})
${notesCount > 0 ? `- 📝 [Prohlédnout složku s poznámkami v Markdownu (notes/)](./notes/)\n` : ''}- 💾 [Surová data o postupu (data/progress.json)](./data/progress.json)
- 📊 [Statistiky studia (stats.json)](./stats.json)

---
*Pro zobrazení webu na GitHub Pages stačí mít v nastavení repozitáře (Settings → Pages) vybranou větev **master** (nebo main) s kořenovou složkou \`/\`.*
`
      });
    } else {
      // Mode === 'data-only'
      // Clean README without notes/ link
      filesToCommit.push({
        path: 'README.md',
        content: `# 📘 C++ Learning Progress — learncpp.com

![Progress](https://img.shields.io/badge/C++%20Progress-${percentage}%25-brightgreen)
![Time](https://img.shields.io/badge/Aktivn%C3%AD%20%C4%8Cas-${totalStudyHours}h-blue)
![Checkpoints](https://img.shields.io/badge/Spln%C4%9Bno-${totalChecked}%20%2F%20${totalCheckpoints}-orange)

> Automaticky zálohováno z desktopové aplikace **C++ Learning Tracker**.

### 📊 Celkový přehled
- **Dokončeno**: **${percentage}%** (${totalChecked.toLocaleString('cs-CZ')} z ${totalCheckpoints.toLocaleString('cs-CZ')} úkolů)
- **Celkový aktivní čas studia**: **${totalStudyHours} hodin** (${Math.floor(progress.totalSecondsSpent / 60)} min čtení${totalCodingHours > 0 ? `, ${Math.floor((progress.totalCodingSeconds || 0) / 60)} min kódování` : ''})
- **Poslední synchronizace**: ${new Date().toLocaleDateString('cs-CZ')} v ${new Date().toLocaleTimeString('cs-CZ')}

### 💾 Data o postupu
Tento repozitář slouží k bezpečnému zálohování a synchronizaci mého postupu studiem C++:
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
        `Update ${file.path} — ${percentage}% done (${totalStudyHours}h)`,
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
