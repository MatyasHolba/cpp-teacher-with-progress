import fs from 'fs';
import * as cheerio from 'cheerio';

async function extractTOC() {
  console.log('Fetching homepage https://www.learncpp.com/ ...');
  const res = await fetch('https://www.learncpp.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const chapters = [];
  let globalLessonIndex = 0;

  $('.lessontable').each((i, tableEl) => {
    const chapterHeader = $(tableEl).find('.lessontable-header-chapter').text().trim();
    const chapterTitle = $(tableEl).find('.lessontable-header-title').text().trim();
    
    // Parse chapter number / code (e.g. "Chapter 0" -> "0", "Appendix A" -> "A")
    const chapterNumMatch = chapterHeader.match(/(?:Chapter|Appendix)\s+([0-9A-Za-z]+)/i);
    const chapterId = chapterNumMatch ? chapterNumMatch[1] : `ch-${i}`;

    const chapter = {
      id: chapterId,
      header: chapterHeader,
      title: chapterTitle,
      fullTitle: `${chapterHeader}: ${chapterTitle}`,
      lessons: []
    };

    $(tableEl).find('.lessontable-row').each((j, rowEl) => {
      const number = $(rowEl).find('.lessontable-row-number').text().trim();
      const linkEl = $(rowEl).find('.lessontable-row-title a');
      const title = linkEl.text().trim();
      const url = linkEl.attr('href');

      if (url && title) {
        const cleanUrl = url.startsWith('http') ? url : `https://www.learncpp.com${url}`;
        const slug = url.replace(/.*\/cpp-tutorial\//, '').replace(/\/$/, '');
        
        chapter.lessons.push({
          index: globalLessonIndex++,
          chapterId,
          number,
          title,
          url: cleanUrl,
          slug
        });
      }
    });

    if (chapter.lessons.length > 0) {
      chapters.push(chapter);
    }
  });

  const allLessons = chapters.flatMap(c => c.lessons);
  console.log(`Parsed ${chapters.length} chapters.`);
  console.log(`Total lessons across all chapters: ${allLessons.length}`);

  const output = {
    scrapedAt: new Date().toISOString(),
    totalChapters: chapters.length,
    totalLessons: allLessons.length,
    chapters,
    allLessons
  };

  fs.mkdirSync('./content-bundle', { recursive: true });
  fs.writeFileSync('./content-bundle/toc.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log('Saved perfect structure to ./content-bundle/toc.json');
}

extractTOC().catch(console.error);
