import fs from 'fs';
import path from 'path';

const LESSONS_DIR = './content-bundle/lessons';
const files = fs.readdirSync(LESSONS_DIR).filter(f => f.endsWith('.json'));

let totalBlocks = 0;
let totalCheckpoints = 0;
const lessonStats = [];

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(LESSONS_DIR, file), 'utf-8'));
  totalBlocks += data.totalBlocks || 0;
  totalCheckpoints += data.totalCheckpoints || 0;
  lessonStats.push({
    slug: data.slug,
    number: data.number,
    title: data.title,
    blocks: data.totalBlocks,
    checkpoints: data.totalCheckpoints
  });
}

const summary = {
  totalLessons: files.length,
  totalBlocks,
  totalCheckpoints,
  scrapedAt: new Date().toISOString()
};

fs.writeFileSync('./content-bundle/summary.json', JSON.stringify(summary, null, 2), 'utf-8');
console.log('=== LEARNCPP COURSE SUMMARY ===');
console.log(`Total Lessons: ${files.length}`);
console.log(`Total Blocks (paragraphs, code, callouts, quizzes): ${totalBlocks}`);
console.log(`Total Granular Checkpoints: ${totalCheckpoints}`);
