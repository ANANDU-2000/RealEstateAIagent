# PropAgent — Skills Map

Skills and tools agents should use for this project.

## Cursor Rules (Auto-Applied)
| Rule | Scope | Purpose |
|------|-------|---------|
| `00-propagent-core.mdc` | Always | Stack, tenant isolation, anti-slop |
| `10-design-system.mdc` | `frontend/**` | Colors, typography, UI states |
| `20-ai-agent.mdc` | AI services | Arjun hard rules, hallucination control |

## MCP Servers
| Server | Use For |
|--------|---------|
| Render (`user-render`) | Service env vars, deploys, logs, read-only SQL |
| Cloudflare bindings | R2 bucket setup (OAuth required) |

## External Skills (When Relevant)
| Skill | When |
|-------|------|
| `render-deploy` | Render service config, render.yaml |
| `render-postgres` | DB connection, indexes, backups |
| `render-env-vars` | Setting production secrets |
| `wrangler` | Cloudflare R2 CLI operations |
| `workers-best-practices` | If adding Cloudflare Workers later |

## Key Reference Files
| File | Content |
|------|---------|
| `files/MASTER-PLAN.md` | Product vision, pricing, phases |
| `files/PROJECT-STRUCTURE.md` | Full folder map |
| `files/build-order-prompts.md` | Page build order + Cursor prompts |
| `files/ai-system-prompt-v3.md` | Arjun master prompt |
| `render-postgres-only.md` | DB schema + deployment |
| `backend/src/db/schema.sql` | Live SQL schema |

## Agent Workflow
1. Check `PROGRESS-CURRENT.md`
2. Pick task from `TASKS.md`
3. Read spec file for that feature
4. Implement with strict types + tenant isolation
5. Verify build passes
6. Update tracking docs
