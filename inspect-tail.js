import * as cheerio from 'cheerio';

async function inspectTail() {
  const res = await fetch('https://www.learncpp.com/cpp-tutorial/statements-and-the-structure-of-a-program/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const entry = $('.entry-content');
  entry.children().slice(60).each((i, el) => {
    const tag = el.tagName;
    const cls = $(el).attr('class') || '';
    const textPreview = $(el).text().replace(/\s+/g, ' ').trim().substring(0, 70);
    console.log(`[#${i + 60} ${tag}.${cls.split(' ').join('.')}] ${textPreview}`);
  });
}

inspectTail().catch(console.error);
