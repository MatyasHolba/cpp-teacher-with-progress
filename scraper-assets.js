import fs from 'fs';
import path from 'path';

async function downloadAssets() {
  const assetsDir = './content-bundle/assets';
  fs.mkdirSync(assetsDir, { recursive: true });

  const urls = [
    { url: 'https://www.learncpp.com/blog/wp-content/plugins/learncpp-prism/prism.js?ver=4084444bfee884f6024e8b1b3cfa6cdd', file: 'prism.js' },
    { url: 'https://www.learncpp.com/blog/wp-content/plugins/learncpp-prism/prism-theme.css?ver=0.135', file: 'prism-theme.css' },
    { url: 'https://www.learncpp.com/blog/wp-content/plugins/learncpp-prism/fonts/monaco.css?ver=0.135', file: 'monaco.css' },
    { url: 'https://www.learncpp.com/blog/wp-content/uploads/custom-css-js/18062.css?v=430', file: 'custom-learncpp.css' }
  ];

  for (const item of urls) {
    try {
      console.log(`Downloading ${item.file}...`);
      const res = await fetch(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const text = await res.text();
      fs.writeFileSync(path.join(assetsDir, item.file), text, 'utf-8');
      console.log(`Saved ${item.file} (${text.length} bytes)`);
    } catch (err) {
      console.error(`Error downloading ${item.file}:`, err.message);
    }
  }
}

downloadAssets().catch(console.error);
