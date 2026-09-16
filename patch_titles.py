import json
import os

toc_path = 'desktop-app/public/content-bundle/toc.json'
with open(toc_path, 'r', encoding='utf-8') as f:
    toc = json.load(f)

# Build a mapping from slug to title_cs
slug_to_cs = {}
for ch in toc.get('chapters', []):
    for l in ch.get('lessons', []):
        if 'title_cs' in l:
            slug_to_cs[l['slug']] = l['title_cs']

directories = [
    'content-bundle/lessons',
    'desktop-app/public/content-bundle/lessons'
]

for d in directories:
    if not os.path.exists(d): continue
    for fname in os.listdir(d):
        if not fname.endswith('.json'): continue
        fpath = os.path.join(d, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        slug = data.get('slug')
        if slug in slug_to_cs:
            data['title_cs'] = slug_to_cs[slug]
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

print("Done patching titles!")
