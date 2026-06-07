const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', '..', 'render-postgres-only.md');
const content = fs.readFileSync(mdPath, 'utf8');
const match = content.match(/```sql\n([\s\S]*?)```/);

if (!match) {
  console.error('Schema block not found');
  process.exit(1);
}

let sql = match[1];
sql = sql.replace(
  /INSERT INTO prompt_versions[\s\S]*?ON CONFLICT DO NOTHING;/,
  `INSERT INTO prompt_versions (version, content, created_by, is_active, deployed_at)
SELECT 3, 'v3 — see docs/prompts/ai-system-prompt-v3.md', 'admin', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM prompt_versions WHERE version = 3);`
);

const outPath = path.join(__dirname, '..', 'src', 'db', 'schema.sql');
fs.writeFileSync(outPath, sql);
console.log('Wrote', outPath);
