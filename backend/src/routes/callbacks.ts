import { Router, Response } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { callbackListQuerySchema, callbackUpdateSchema } from '../utils/validators';

const router = Router();

router.use(requireAuth);

type CallbackRow = {
  id: string;
  tenant_id: string;
  conversation_id: string | null;
  customer_name: string | null;
  customer_phone: string;
  requested_time: Date | null;
  context_notes: string | null;
  status: string;
  created_at: Date;
  completed_at: Date | null;
};

function mapCallback(row: CallbackRow) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    requestedTime: row.requested_time,
    contextNotes: row.context_notes,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

async function markOverdueCallbacks(tenantId: string): Promise<void> {
  await pool.query(
    `UPDATE callbacks
     SET status = 'overdue'
     WHERE tenant_id = $1
       AND status = 'pending'
       AND requested_time IS NOT NULL
       AND requested_time < NOW()`,
    [tenantId]
  );
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = callbackListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' });
    return;
  }

  try {
    await markOverdueCallbacks(tenantId);

    const conditions = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (parsed.data.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(parsed.data.status);
    }

    const result = await pool.query<CallbackRow>(
      `SELECT *
       FROM callbacks
       WHERE ${conditions.join(' AND ')}
       ORDER BY requested_time ASC NULLS LAST, created_at ASC`,
      params
    );

    res.json({ callbacks: result.rows.map(mapCallback) });
  } catch (error) {
    console.error('List callbacks failed:', error);
    res.status(500).json({ error: 'Failed to load callbacks' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = callbackUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const data = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [req.params.id, tenantId];
  let idx = 3;

  if (data.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(data.status);
  }

  if (data.completedAt !== undefined) {
    fields.push(`completed_at = $${idx++}`);
    values.push(data.completedAt ? new Date(data.completedAt) : null);
  } else if (data.status === 'done') {
    fields.push(`completed_at = NOW()`);
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  try {
    const result = await pool.query<CallbackRow>(
      `UPDATE callbacks SET ${fields.join(', ')}
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Callback not found' });
      return;
    }

    res.json({ callback: mapCallback(result.rows[0]) });
  } catch (error) {
    console.error('Update callback failed:', error);
    res.status(500).json({ error: 'Failed to update callback' });
  }
});

export default router;
