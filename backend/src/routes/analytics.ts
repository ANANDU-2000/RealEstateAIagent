import { Router, Response } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { analyticsQuerySchema } from '../utils/validators';

const router = Router();

router.use(requireAuth);

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = analyticsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' });
    return;
  }

  const rangeDays = parsed.data.range;

  try {
    const [
      periodStats,
      priorPeriodStats,
      leadsPerDay,
      leadsByPropertyType,
      languageBreakdown,
      propertyPerformance,
      aiUsageDaily,
      planRow,
    ] = await Promise.all([
      pool.query<{
        total_leads: string;
        meetings_booked: string;
        hot_leads: string;
        ultra_hot_leads: string;
        cold_leads: string;
        callbacks_done: string;
        callbacks_pending: string;
        low_budget_escalations: string;
      }>(
        `SELECT
           COUNT(DISTINCT c.id)::text AS total_leads,
           COUNT(DISTINCT m.id) FILTER (
             WHERE m.status IN ('confirmed', 'completed')
           )::text AS meetings_booked,
           COUNT(DISTINCT c.id) FILTER (
             WHERE c.lead_stage = 'hot'
           )::text AS hot_leads,
           COUNT(DISTINCT c.id) FILTER (
             WHERE c.lead_stage = 'ultra_hot'
           )::text AS ultra_hot_leads,
           COUNT(DISTINCT c.id) FILTER (
             WHERE c.lead_stage = 'cold'
           )::text AS cold_leads,
           (SELECT COUNT(*)::text FROM callbacks cb
            WHERE cb.tenant_id = $1 AND cb.status = 'done'
              AND cb.completed_at >= NOW() - ($2 || ' days')::INTERVAL)::text AS callbacks_done,
           (SELECT COUNT(*)::text FROM callbacks cb
            WHERE cb.tenant_id = $1 AND cb.status IN ('pending', 'overdue'))::text AS callbacks_pending,
           (SELECT COUNT(*)::text FROM lead_escalations le
            WHERE le.tenant_id = $1
              AND le.escalation_type = 'low_budget'
              AND le.triggered_at >= NOW() - ($2 || ' days')::INTERVAL)::text AS low_budget_escalations
         FROM conversations c
         LEFT JOIN meetings m ON m.conversation_id = c.id AND m.tenant_id = c.tenant_id
         WHERE c.tenant_id = $1
           AND c.created_at >= NOW() - ($2 || ' days')::INTERVAL`,
        [tenantId, rangeDays]
      ),
      pool.query<{ total_leads: string; meetings_booked: string }>(
        `SELECT
           COUNT(DISTINCT c.id)::text AS total_leads,
           COUNT(DISTINCT m.id) FILTER (
             WHERE m.status IN ('confirmed', 'completed')
           )::text AS meetings_booked
         FROM conversations c
         LEFT JOIN meetings m ON m.conversation_id = c.id AND m.tenant_id = c.tenant_id
         WHERE c.tenant_id = $1
           AND c.created_at >= NOW() - ($2 || ' days')::INTERVAL * 2
           AND c.created_at < NOW() - ($2 || ' days')::INTERVAL`,
        [tenantId, rangeDays]
      ),
      pool.query<{ day: string; count: string }>(
        `SELECT DATE(created_at)::text AS day, COUNT(*)::text AS count
         FROM conversations
         WHERE tenant_id = $1
           AND created_at >= NOW() - ($2 || ' days')::INTERVAL
         GROUP BY DATE(created_at)
         ORDER BY day ASC`,
        [tenantId, rangeDays]
      ),
      pool.query<{ property_type: string; count: string }>(
        `SELECT COALESCE(preferred_type, 'unknown') AS property_type, COUNT(*)::text AS count
         FROM conversations
         WHERE tenant_id = $1
           AND created_at >= NOW() - ($2 || ' days')::INTERVAL
         GROUP BY COALESCE(preferred_type, 'unknown')
         ORDER BY count DESC`,
        [tenantId, rangeDays]
      ),
      pool.query<{ language: string; count: string }>(
        `SELECT COALESCE(language_pref, 'english') AS language, COUNT(*)::text AS count
         FROM conversations
         WHERE tenant_id = $1
           AND created_at >= NOW() - ($2 || ' days')::INTERVAL
         GROUP BY COALESCE(language_pref, 'english')
         ORDER BY count DESC`,
        [tenantId, rangeDays]
      ),
      pool.query<{
        id: string;
        name: string;
        enquiry_count: number;
        visits: string;
      }>(
        `SELECT p.id,
                p.name,
                p.enquiry_count,
                COUNT(DISTINCT m.id)::text AS visits
         FROM properties p
         LEFT JOIN meetings m ON m.property_id = p.id
           AND m.tenant_id = p.tenant_id
           AND m.status IN ('confirmed', 'completed')
           AND m.scheduled_at >= NOW() - ($2 || ' days')::INTERVAL
         WHERE p.tenant_id = $1 AND p.is_hidden = false
         GROUP BY p.id, p.name, p.enquiry_count
         ORDER BY p.enquiry_count DESC, p.name ASC`,
        [tenantId, rangeDays]
      ),
      pool.query<{ day: string; messages: string; cost_usd: string }>(
        `SELECT DATE(created_at)::text AS day,
                COUNT(*)::text AS messages,
                COALESCE(SUM(cost_usd), 0)::text AS cost_usd
         FROM ai_usage_log
         WHERE tenant_id = $1
           AND created_at >= NOW() - ($2 || ' days')::INTERVAL
         GROUP BY DATE(created_at)
         ORDER BY day ASC`,
        [tenantId, rangeDays]
      ),
      pool.query<{
        ai_messages_used: number;
        ai_message_limit: number;
        ai_reset_date: string;
      }>(
        `SELECT ai_messages_used, ai_message_limit, ai_reset_date::text
         FROM client_plans
         WHERE tenant_id = $1`,
        [tenantId]
      ),
    ]);

    const current = periodStats.rows[0];
    const prior = priorPeriodStats.rows[0];

    const totalLeads = Number(current?.total_leads ?? 0);
    const meetingsBooked = Number(current?.meetings_booked ?? 0);
    const priorTotalLeads = Number(prior?.total_leads ?? 0);
    const priorMeetingsBooked = Number(prior?.meetings_booked ?? 0);

    const conversionRate =
      totalLeads > 0 ? Math.round((meetingsBooked / totalLeads) * 1000) / 10 : 0;

    const aiUsed = planRow.rows[0]?.ai_messages_used ?? 0;
    const aiLimit = planRow.rows[0]?.ai_message_limit ?? 0;
    const aiResetDate = planRow.rows[0]?.ai_reset_date ?? null;

    const daysUntilReset = aiResetDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(aiResetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )
      : null;

    const aiCostEstimate = aiUsageDaily.rows.reduce(
      (sum, row) => sum + Number(row.cost_usd),
      0
    );

    res.json({
      range: rangeDays,
      totalLeads,
      totalLeadsChange: pctChange(totalLeads, priorTotalLeads),
      meetingsBooked,
      meetingsBookedChange: pctChange(meetingsBooked, priorMeetingsBooked),
      hotLeads: Number(current?.hot_leads ?? 0),
      ultraHotLeads: Number(current?.ultra_hot_leads ?? 0),
      coldLeads: Number(current?.cold_leads ?? 0),
      callbacksDone: Number(current?.callbacks_done ?? 0),
      callbacksPending: Number(current?.callbacks_pending ?? 0),
      lowBudgetEscalations: Number(current?.low_budget_escalations ?? 0),
      conversionRate,
      aiMessagesUsed: aiUsed,
      aiMessageLimit: aiLimit,
      daysUntilReset,
      aiCostEstimate,
      leadsPerDay: leadsPerDay.rows.map((row) => ({
        date: row.day,
        count: Number(row.count),
      })),
      leadsByPropertyType: leadsByPropertyType.rows.map((row) => ({
        propertyType: row.property_type,
        count: Number(row.count),
      })),
      languageBreakdown: languageBreakdown.rows.map((row) => ({
        language: row.language,
        count: Number(row.count),
      })),
      propertyPerformance: propertyPerformance.rows.map((row) => {
        const enquiries = row.enquiry_count;
        const visits = Number(row.visits);
        return {
          id: row.id,
          name: row.name,
          enquiries,
          visits,
          conversionRate: enquiries > 0 ? Math.round((visits / enquiries) * 1000) / 10 : 0,
        };
      }),
      aiUsageDaily: aiUsageDaily.rows.map((row) => ({
        date: row.day,
        messages: Number(row.messages),
        costUsd: Number(row.cost_usd),
      })),
    });
  } catch (error) {
    console.error('Analytics failed:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

export default router;
