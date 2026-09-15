import * as cheerio from 'cheerio';

async function inspectEntryContent() {
  const res = await fetch('https://www.learncpp.com/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('Main containers found:');
  console.log('.entry-content exists?', $('.entry-content').length);
  console.log('.post exists?', $('.post').length);
  console.log('article exists?', $('article').length);

  // Find parent of the first lesson link
  const firstLessonLink = $('a[href*="/cpp-tutorial/introduction-to-these-tutorials/"]');
  console.log('firstLessonLink parent:', firstLessonLink.parent().prop('tagName'), firstLessonLink.parent().attr('class'));
  console.log('firstLessonLink grandparent:', firstLessonLink.parent().parent().prop('tagName'), firstLessonLink.parent().parent().attr('class'));
  console.log('firstLessonLink great-grandparent:', firstLessonLink.parent().parent().parent().prop('tagName'), firstLessonLink.parent().parent().parent().attr('class'));
  
  // Print HTML around first lesson link
  console.log('\nHTML snippet around first lesson:');
  console.log(firstLessonLink.parent().parent().html()?.substring(0, 300));
}

inspectEntryContent().catch(console.error);
