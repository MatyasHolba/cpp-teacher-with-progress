import * as cheerio from 'cheerio';

async function inspectLessonTable() {
  const res = await fetch('https://www.learncpp.com/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('--- Inspecting lessontable elements ---');
  $('[class*="lessontable"]').each((i, el) => {
    const cls = $(el).attr('class');
    if (!cls.includes('row')) {
      console.log(`[${el.tagName}.${cls}] text preview: ${$(el).text().trim().substring(0, 80)}`);
    }
  });
}

inspectLessonTable().catch(console.error);
