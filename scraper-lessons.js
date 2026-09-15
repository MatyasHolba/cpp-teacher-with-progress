import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const LESSONS_DIR = './content-bundle/lessons';
fs.mkdirSync(LESSONS_DIR, { recursive: true });

function parseLesson(html, meta) {
  const $ = cheerio.load(html);
  const entry = $('.entry-content');

  // Remove unwanted elements: ads, scripts, tracking, style tags
  entry.find('.code-block, script, style, .sharedaddy, .wpc-views, ins').remove();

  const blocks = [];
  let blockIndex = 0;
  let currentQuiz = null;

  entry.children().each((i, el) => {
    const $el = $(el);
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    const cls = $el.attr('class') || '';

    // Ignore empty elements or pure whitespace
    if (!$el.text().trim() && !$el.find('img, pre, code').length) {
      return;
    }

    // Ignore prevnext navigation at the very bottom (we generate our own clean navigation)
    if (cls.includes('prevnext')) {
      return;
    }

    // Section header
    if ($el.hasClass('cpp-section') || tag === 'h2' || tag === 'h3') {
      blocks.push({
        id: `${meta.slug}_b${blockIndex++}`,
        type: 'section',
        title: $el.text().trim(),
        html: `<h3 class="cpp-section-heading">${$el.html().trim()}</h3>`,
        canCheck: false
      });
      return;
    }

    // Callout note / box
    if ($el.hasClass('cpp-note')) {
      // Determine note sub-type from background class or text
      let noteType = 'info';
      if (cls.includes('lightgray')) noteType = 'advanced';
      else if (cls.includes('lightpurple')) noteType = 'rule';
      else if (cls.includes('lightgreen')) noteType = 'best-practice';
      else if (cls.includes('lightblue')) noteType = 'insight';
      else if (cls.includes('lightred')) noteType = 'warning';
      else if (cls.includes('yellow')) noteType = 'tip';

      blocks.push({
        id: `${meta.slug}_b${blockIndex++}`,
        type: 'callout',
        calloutType: noteType,
        html: $el.prop('outerHTML'),
        preview: $el.text().replace(/\s+/g, ' ').trim().substring(0, 100),
        canCheck: true
      });
      return;
    }

    // C++ Code block
    if (tag === 'pre' && (cls.includes('language-cpp') || $el.find('code[class*="language-cpp"]').length)) {
      blocks.push({
        id: `${meta.slug}_b${blockIndex++}`,
        type: 'code',
        language: 'cpp',
        code: $el.text(),
        html: $el.prop('outerHTML'),
        canCheck: true
      });
      return;
    }

    // Output or generic pre block
    if (tag === 'pre') {
      blocks.push({
        id: `${meta.slug}_b${blockIndex++}`,
        type: 'output',
        text: $el.text(),
        html: $el.prop('outerHTML'),
        canCheck: false
      });
      return;
    }

    // Quiz question header
    if ($el.hasClass('cpp-quiz-question')) {
      currentQuiz = {
        id: `${meta.slug}_b${blockIndex++}`,
        type: 'quiz',
        questionTitle: $el.text().trim(),
        questionHtml: '',
        hintHtml: '',
        solutionHtml: '',
        canCheck: true
      };
      blocks.push(currentQuiz);
      return;
    }

    // Quiz hint
    if ($el.hasClass('wphint') && currentQuiz) {
      currentQuiz.hintHtml = $el.html();
      return;
    }

    // Quiz solution
    if ($el.hasClass('wpsolution') && currentQuiz) {
      currentQuiz.solutionHtml = $el.html();
      return;
    }

    // If we're right after a quiz question and this is the question text
    if (currentQuiz && !currentQuiz.questionHtml && !currentQuiz.solutionHtml && tag === 'p' && !$el.text().includes('Show Solution') && !$el.text().includes('Show Hint')) {
      currentQuiz.questionHtml = $el.html();
      return;
    }

    // Ignore lone "Show Solution" / "Show Hint" paragraphs because our UI will render its own toggle
    if ($el.text().trim() === 'Show Solution' || $el.text().trim() === 'Show Hint' || $el.text().trim() === 'Hide Solution') {
      return;
    }

    // Tables
    if (tag === 'table') {
      blocks.push({
        id: `${meta.slug}_b${blockIndex++}`,
        type: 'table',
        html: $el.prop('outerHTML'),
        canCheck: true
      });
      return;
    }

    // Standard paragraph or list
    blocks.push({
      id: `${meta.slug}_b${blockIndex++}`,
      type: tag === 'ul' || tag === 'ol' ? 'list' : 'paragraph',
      html: $el.prop('outerHTML'),
      preview: $el.text().replace(/\s+/g, ' ').trim().substring(0, 80),
      canCheck: true
    });
  });

  const totalCheckpoints = blocks.filter(b => b.canCheck).length;

  return {
    ...meta,
    title: $('.entry-title').text().trim() || meta.title,
    scrapedAt: new Date().toISOString(),
    totalBlocks: blocks.length,
    totalCheckpoints,
    blocks
  };
}

async function scrapeLessons(slugsToScrape = null) {
  const toc = JSON.parse(fs.readFileSync('./content-bundle/toc.json', 'utf-8'));
  const lessons = slugsToScrape 
    ? toc.allLessons.filter(l => slugsToScrape.includes(l.slug))
    : toc.allLessons;

  console.log(`Starting scraper for ${lessons.length} lessons...`);

  let completed = 0;
  for (const lesson of lessons) {
    const filePath = path.join(LESSONS_DIR, `${lesson.slug}.json`);
    if (fs.existsSync(filePath) && !slugsToScrape) {
      completed++;
      continue;
    }

    try {
      console.log(`[${completed + 1}/${lessons.length}] Fetching ${lesson.number} — ${lesson.title}...`);
      const res = await fetch(lesson.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const html = await res.text();
      const parsed = parseLesson(html, lesson);

      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
      console.log(`  -> Saved ${parsed.blocks.length} blocks, ${parsed.totalCheckpoints} checkpoints.`);
      completed++;

      // Polite delay between requests
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.error(`  -> ERROR fetching ${lesson.slug}:`, err.message);
    }
  }

  console.log(`\nFinished! Processed ${completed} lessons.`);
}

// Check if specific slugs were passed via CLI: e.g. node scraper-lessons.js --test
const isTest = process.argv.includes('--test');
if (isTest) {
  const testSlugs = [
    'introduction-to-these-tutorials',
    'statements-and-the-structure-of-a-program',
    'comments',
    'chapter-1-summary-and-quiz',
    'introduction-to-pointers'
  ];
  scrapeLessons(testSlugs).catch(console.error);
} else {
  scrapeLessons().catch(console.error);
}
