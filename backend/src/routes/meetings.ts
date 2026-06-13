import { Router, Response } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  meetingListQuerySchema,
  meetingCreateSchema,
  meetingUpdateSchema,
} from '../utils/validators';

const router = Router();

router.use(requireAuth);

type MeetingRow = {
  id: string;
  tenant_id: string;
  conversation_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  property_id: string | null;
  meeting_type: string;
  scheduled_at: Date;
  booked_by: string;
  status: string;
  reminder_sent_at: Date | null;
  broker_reminded: boolean;
  notes: string | null;
  created_at: Date;
  property_name?: string | null;
};

function mapMeeting(row: MeetingRow) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    propertyId: row.property_id,
    propertyName: row.property_name ?? null,
    meetingType: row.meeting_type,
    scheduledAt: row.scheduled_at,
    bookedBy: row.booked_by,
    status: row.status,
    reminderSentAt: row.reminder_sent_at,
    brokerReminded: row.broker_reminded,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = meetingListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' });
    return;
  }

  const conditions = ['m.tenant_id = $1'];
  const params: unknown[] = [tenantId];
  let paramIndex = 2;

  if (parsed.data.from) {
    conditions.push(`m.scheduled_at >= $${paramIndex++}`);
    params.push(new Date(parsed.data.from));
  }
  if (parsed.data.to) {
    conditions.push(`m.scheduled_at <= $${paramIndex++}`);
    params.push(new Date(parsed.data.to));
  }

  try {
    const result = await pool.query<MeetingRow>(
      `SELECT m.*, p.name AS property_name
       FROM meetings m
       LEFT JOIN properties p ON p.id = m.property_id AND p.tenant_id = m.tenant_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY m.scheduled_at ASC`,
      params
    );

    res.json({ meetings: result.rows.map(mapMeeting) });
  } catch (error) {
    console.error('List meetings failed:', error);
    res.status(500).json({ error: 'Failed to load meetings' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = meetingCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const data = parsed.data;

  if (data.conversationId) {
    const convCheck = await pool.query(
      `SELECT id FROM conversations WHERE id = $1 AND tenant_id = $2`,
      [data.conversationId, tenantId]
    );
    if (!convCheck.rows[0]) {
      res.status(400).json({ error: 'Conversation not found' });
      return;
    }
  }

  if (data.propertyId) {
    const propCheck = await pool.query(
      `SELECT id FROM properties WHERE id = $1 AND tenant_id = $2`,
      [data.propertyId, tenantId]
    );
    if (!propCheck.rows[0]) {
      res.status(400).json({ error: 'Property not found' });
      return;
    }
  }

  try {
    const result = await pool.query<MeetingRow>(
      `INSERT INTO meetings (
         tenant_id, conversation_id, customer_name, customer_phone,
         property_id, meeting_type, scheduled_at, booked_by, status, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'broker', 'confirmed', $8)
       RETURNING *`,
      [
        tenantId,
        data.conversationId ?? null,
        data.customerName?.trim() ?? null,
        data.customerPhone.trim(),
        data.propertyId ?? null,
        data.meetingType,
        new Date(data.scheduledAt),
        data.notes?.trim() ?? null,
      ]
    );

    res.status(201).json({ meeting: mapMeeting(result.rows[0]) });
  } catch (error) {
    console.error('Create meeting failed:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = meetingUpdateSchema.safeParse(req.body);
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
  if (data.scheduledAt !== undefined) {
    fields.push(`scheduled_at = $${idx++}`);
    values.push(new Date(data.scheduledAt));
  }
  if (data.notes !== undefined) {
    fields.push(`notes = $${idx++}`);
    values.push(data.notes.trim());
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  try {
    const result = await pool.query<MeetingRow>(
      `UPDATE meetings SET ${fields.join(', ')}
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    res.json({ meeting: mapMeeting(result.rows[0]) });
  } catch (error) {
    console.error('Update meeting failed:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

export default router;
