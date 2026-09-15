import * as cheerio from 'cheerio';

async function inspectLesson(url) {
  console.log(`Fetching lesson: ${url} ...`);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const entry = $('.entry-content');
  console.log('Total children in .entry-content:', entry.children().length);

  entry.children().slice(0, 25).each((i, el) => {
    const tag = el.tagName;
    const cls = $(el).attr('class') || '';
    const id = $(el).attr('id') || '';
    const textPreview = $(el).text().replace(/\s+/g, ' ').trim().substring(0, 70);
    console.log(`[#${i} ${tag}${cls ? '.' + cls.split(' ').join('.') : ''}${id ? '#' + id : ''}] ${textPreview}`);
  });
}

inspectLesson('https://www.learncpp.com/cpp-tutorial/statements-and-the-structure-of-a-program/').catch(console.error);
