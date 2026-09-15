import fs from 'fs';
import * as cheerio from 'cheerio';

async function inspectStructure() {
  const res = await fetch('https://www.learncpp.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('--- Inspecting headings and tables ---');
  $('h1, h2, h3, h4, table, .section-header, .chapter').each((i, el) => {
    const tag = el.tagName;
    const cls = $(el).attr('class') || '';
    const text = $(el).text().trim().substring(0, 60);
    if (text.toLowerCase().includes('chapter') || text.toLowerCase().includes('introduction') || text.toLowerCase().includes('basic')) {
      console.log(`[${tag}.${cls}] ${text}`);
    }
  });
}

inspectStructure().catch(console.error);
