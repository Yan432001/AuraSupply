const fs = require('fs');
const path = require('path');

const filesToAudit = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (['node_modules', '.git', 'dist'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?)$/.test(e.name)) filesToAudit.push(p);
  }
}
walk('AuraTheme/src');

const audit = [];

for (const f of filesToAudit) {
  const rel = f.replace(/\\/g, '/');
  const code = fs.readFileSync(f, 'utf8');
  const lines = code.split('\n');
  const items = [];

  lines.forEach((line, idx) => {
    const l = idx + 1;
    const s = line.trim();

    // 1. imports of sample/shopData/websiteDataManager
    if (/import .* from ['"].*(samplePosts|shopData|websiteDataManager|menuImageManager)['"]/.test(s)) {
      items.push({ line: l, type: 'MOCK_FILE_IMPORT', snippet: s });
    }

    // 2. Mock arrays declarations
    if (/const (MOCK_|SAMPLE_|DEMO_|mock|sample|STORES_LIST|INITIAL_CATEGORIES|INITIAL_SHOPS|SELLER_SLUG_MAP)/.test(s) && !s.includes('useMemo') && !s.includes('useState')) {
      items.push({ line: l, type: 'MOCK_ARRAY_DECLARATION', snippet: s });
    }

    // 3. Fallbacks like || MOCK, || sample
    if (/(\|\|\s*(MOCK_|SAMPLE_|DEMO_|samplePosts|shopData|STORES_LIST))/.test(s)) {
      items.push({ line: l, type: 'FALLBACK_TO_MOCK', snippet: s });
    }

    // 4. Placeholder images (unsplash, picsum, placeholder.com)
    if (/(images\.unsplash\.com|picsum\.photos|via\.placeholder\.com)/.test(s) && !s.includes('placeholder=') && !s.includes('<Input')) {
      items.push({ line: l, type: 'PLACEHOLDER_IMAGE', snippet: s.slice(0, 120) });
    }

    // 5. Lorem ipsum
    if (/lorem ipsum/i.test(s)) {
      items.push({ line: l, type: 'LOREM_IPSUM', snippet: s.slice(0, 120) });
    }
  });

  if (items.length > 0) {
    audit.push({ file: rel, count: items.length, items });
  }
}

fs.writeFileSync('scratch/audit_report.json', JSON.stringify(audit, null, 2), 'utf8');
console.log('Audit completed! Total files with mock data:', audit.length);
audit.forEach(a => {
  console.log(`- ${a.file} (${a.count} occurrences):`);
  a.items.forEach(it => {
    console.log(`    Line ${it.line} [${it.type}]: ${it.snippet}`);
  });
});
