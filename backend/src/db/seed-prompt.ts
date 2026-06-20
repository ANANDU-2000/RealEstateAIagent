import fs from 'fs';
import path from 'path';
import type { PoolClient } from 'pg';

const PROMPT_MARKER = '## THE MASTER SYSTEM PROMPT';

function findPromptFile(): string {
  const candidates = [
    path.join(__dirname, '../prompts/ai-system-prompt-v3.md'),
    path.join(__dirname, '..', '..', 'src', 'prompts', 'ai-system-prompt-v3.md'),
    path.join(__dirname, '..', '..', '..', 'files', 'ai-system-prompt-v3.md'),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error('ai-system-prompt-v3.md not found for prompt seed');
  }
  return found;
}

export function extractMasterPromptFromMarkdown(markdown: string): string {
  const markerIndex = markdown.indexOf(PROMPT_MARKER);
  if (markerIndex === -1) {
    throw new Error('Master prompt section not found in ai-system-prompt-v3.md');
  }

  const afterMarker = markdown.slice(markerIndex);
  const openFence = afterMarker.indexOf('```\n');
  const closeFence = afterMarker.indexOf('```', openFence + 4);
  if (openFence === -1 || closeFence === -1) {
    throw new Error('Master prompt code fence not found in ai-system-prompt-v3.md');
  }

  return afterMarker.slice(openFence + 4, closeFence).trim();
}

export async function seedPromptIfNeeded(client: PoolClient): Promise<void> {
  const active = await client.query<{ content: string; version: number }>(
    `SELECT content, version FROM prompt_versions
     WHERE is_active = true
     ORDER BY version DESC
     LIMIT 1`
  );

  const row = active.rows[0];
  const placeholder =
    !row?.content?.trim() ||
    row.content.includes('see docs') ||
    row.content.length < 500;

  if (!placeholder) {
    console.log(`Prompt v${row.version} already seeded — skipping`);
    return;
  }

  const markdown = fs.readFileSync(findPromptFile(), 'utf-8');
  const content = extractMasterPromptFromMarkdown(markdown);

  await client.query(`UPDATE prompt_versions SET is_active = false WHERE is_active = true`);

  const nextVersionResult = await client.query<{ next_version: number }>(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM prompt_versions`
  );
  const nextVersion = nextVersionResult.rows[0]?.next_version ?? 4;

  await client.query(
    `INSERT INTO prompt_versions (version, content, created_by, is_active, deployed_at)
     VALUES ($1, $2, 'system', true, NOW())`,
    [nextVersion, content]
  );

  console.log(`Seeded prompt_versions v${nextVersion} (${content.length} chars)`);
}
