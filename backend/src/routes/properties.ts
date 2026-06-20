import { Router, Response } from 'express';
import multer from 'multer';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  propertyCreateSchema,
  propertyUpdateSchema,
  propertyStatusSchema,
  propertyPhotoSchema,
} from '../utils/validators';
import {
  chunkText,
  extractTextFromBuffer,
  storeDocumentChunks,
} from '../services/document.service';
import { isR2Configured, uploadToR2 } from '../services/r2.service';

const router = Router();

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    const allowed =
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('text/') ||
      name.endsWith('.pdf') ||
      name.endsWith('.txt');
    cb(null, allowed);
  },
});

router.use(requireAuth);

type PropertyRow = {
  id: string;
  tenant_id: string;
  name: string;
  property_type: string;
  listing_type: string;
  area_size: string | null;
  area_unit: string;
  price: string;
  currency: string;
  city: string;
  location: string;
  area_tags: string[];
  details: string | null;
  is_available: boolean;
  is_hidden: boolean;
  land_type: string | null;
  status: string;
  enquiry_count: number;
  created_at: Date;
  updated_at: Date;
  photo_urls?: string[] | null;
};

function mapProperty(row: PropertyRow) {
  return {
    id: row.id,
    name: row.name,
    propertyType: row.property_type,
    listingType: row.listing_type,
    areaSize: row.area_size ? Number(row.area_size) : null,
    areaUnit: row.area_unit,
    price: Number(row.price),
    currency: row.currency,
    city: row.city,
    location: row.location,
    areaTags: row.area_tags ?? [],
    details: row.details,
    isAvailable: row.is_available,
    isHidden: row.is_hidden,
    landType: row.land_type,
    status: row.status,
    enquiryCount: row.enquiry_count,
    photoUrls: row.photo_urls?.filter(Boolean) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function statusToFlags(status: 'available' | 'sold' | 'hidden') {
  if (status === 'available') {
    return { is_available: true, is_hidden: false, status: 'available' as const };
  }
  if (status === 'sold') {
    return { is_available: false, is_hidden: false, status: 'sold' as const };
  }
  return { is_available: false, is_hidden: true, status: 'hidden' as const };
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const available =
    req.query.available === 'true' ? true : req.query.available === 'false' ? false : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const includeHidden = req.query.includeHidden === 'true';

  const conditions = ['p.tenant_id = $1'];
  const params: unknown[] = [tenantId];
  let paramIndex = 2;

  if (!includeHidden) {
    conditions.push('p.is_hidden = false');
  } else {
    conditions.push('p.is_hidden = true');
  }

  if (type) {
    conditions.push(`p.property_type = $${paramIndex++}`);
    params.push(type);
  }
  if (available !== undefined) {
    conditions.push(`p.is_available = $${paramIndex++}`);
    params.push(available);
  }
  if (search) {
    conditions.push(`(p.name ILIKE $${paramIndex} OR p.location ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  try {
    const result = await pool.query<PropertyRow>(
      `SELECT p.*,
              array_agg(ph.url ORDER BY ph.sort_order) FILTER (WHERE ph.id IS NOT NULL) AS photo_urls
       FROM properties p
       LEFT JOIN property_photos ph ON ph.property_id = p.id AND ph.is_cover = true
       WHERE ${conditions.join(' AND ')}
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      params
    );

    res.json({ properties: result.rows.map(mapProperty) });
  } catch (error) {
    console.error('List properties failed:', error);
    res.status(500).json({ error: 'Failed to load properties' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = propertyCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const data = parsed.data;
  const flags = data.status ? statusToFlags(data.status === 'rented' ? 'sold' : data.status) : statusToFlags('available');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO broker_settings (tenant_id) VALUES ($1) ON CONFLICT (tenant_id) DO NOTHING`,
      [tenantId]
    );

    const result = await client.query<PropertyRow>(
      `INSERT INTO properties (
         tenant_id, name, property_type, listing_type, area_size, area_unit,
         price, currency, city, location, details, area_tags, land_type,
         is_available, is_hidden, status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        tenantId,
        data.name.trim(),
        data.propertyType,
        data.listingType,
        data.areaSize ?? null,
        data.areaUnit,
        data.price,
        data.currency,
        data.city.trim(),
        data.location.trim(),
        data.details?.trim() ?? null,
        data.areaTags,
        data.landType ?? null,
        flags.is_available,
        flags.is_hidden,
        flags.status,
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({ property: mapProperty(result.rows[0]) });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create property failed:', error);
    res.status(500).json({ error: 'Failed to create property' });
  } finally {
    client.release();
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const propertyResult = await pool.query<PropertyRow>(
      `SELECT * FROM properties WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );

    const property = propertyResult.rows[0];
    if (!property) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const photosResult = await pool.query(
      `SELECT id, url, caption, sort_order, is_cover, file_size_kb, uploaded_at
       FROM property_photos
       WHERE property_id = $1 AND tenant_id = $2
       ORDER BY sort_order ASC, uploaded_at ASC`,
      [property.id, tenantId]
    );

    res.json({
      property: mapProperty(property),
      photos: photosResult.rows.map((photo) => ({
        id: photo.id,
        url: photo.url,
        caption: photo.caption,
        sortOrder: photo.sort_order,
        isCover: photo.is_cover,
        fileSizeKb: photo.file_size_kb,
        uploadedAt: photo.uploaded_at,
      })),
    });
  } catch (error) {
    console.error('Get property failed:', error);
    res.status(500).json({ error: 'Failed to load property' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = propertyUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const data = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [req.params.id, tenantId];
  let idx = 3;

  const mapping: Record<string, unknown> = {
    name: data.name?.trim(),
    property_type: data.propertyType,
    listing_type: data.listingType,
    area_size: data.areaSize,
    area_unit: data.areaUnit,
    price: data.price,
    currency: data.currency,
    city: data.city?.trim(),
    location: data.location?.trim(),
    details: data.details?.trim(),
    area_tags: data.areaTags,
    land_type: data.landType,
  };

  if (data.status) {
    const flags = statusToFlags(data.status === 'rented' ? 'sold' : data.status);
    mapping.is_available = flags.is_available;
    mapping.is_hidden = flags.is_hidden;
    mapping.status = flags.status;
  }

  for (const [column, value] of Object.entries(mapping)) {
    if (value !== undefined) {
      fields.push(`${column} = $${idx++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  try {
    const result = await pool.query<PropertyRow>(
      `UPDATE properties SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    res.json({ property: mapProperty(result.rows[0]) });
  } catch (error) {
    console.error('Update property failed:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE properties
       SET is_hidden = true, is_available = false, status = 'hidden', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING id`,
      [req.params.id, tenantId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete property failed:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = propertyStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const flags = statusToFlags(parsed.data.status);

  try {
    const result = await pool.query(
      `UPDATE properties
       SET is_available = $3, is_hidden = $4, status = $5, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING id`,
      [req.params.id, tenantId, flags.is_available, flags.is_hidden, flags.status]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    res.json({ ok: true, status: parsed.data.status });
  } catch (error) {
    console.error('Update property status failed:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.post('/:id/photos', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = propertyPhotoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const propertyCheck = await client.query(
      `SELECT id FROM properties WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );
    if (!propertyCheck.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const limitResult = await client.query<{ max_photos_per_property: number }>(
      `SELECT max_photos_per_property FROM client_plans WHERE tenant_id = $1`,
      [tenantId]
    );
    const maxPhotos = limitResult.rows[0]?.max_photos_per_property ?? 5;

    const countResult = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM property_photos WHERE property_id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );
    if (Number(countResult.rows[0]?.count ?? 0) >= maxPhotos) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: `Photo limit reached (${maxPhotos} max)` });
      return;
    }

    if (parsed.data.isCover) {
      await client.query(
        `UPDATE property_photos SET is_cover = false WHERE property_id = $1 AND tenant_id = $2`,
        [req.params.id, tenantId]
      );
    }

    const photoResult = await client.query(
      `INSERT INTO property_photos (property_id, tenant_id, url, caption, sort_order, is_cover)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, url, caption, sort_order, is_cover, uploaded_at`,
      [
        req.params.id,
        tenantId,
        parsed.data.url,
        parsed.data.caption ?? null,
        parsed.data.sortOrder,
        parsed.data.isCover,
      ]
    );

    await client.query('COMMIT');

    const photo = photoResult.rows[0];
    res.status(201).json({
      photo: {
        id: photo.id,
        url: photo.url,
        caption: photo.caption,
        sortOrder: photo.sort_order,
        isCover: photo.is_cover,
        uploadedAt: photo.uploaded_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add photo failed:', error);
    res.status(500).json({ error: 'Failed to add photo' });
  } finally {
    client.release();
  }
});

router.delete('/:id/photos/:photoId', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const propertyCheck = await pool.query(
      `SELECT id FROM properties WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );
    if (!propertyCheck.rows[0]) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const result = await pool.query(
      `DELETE FROM property_photos
       WHERE id = $1 AND property_id = $2 AND tenant_id = $3
       RETURNING id`,
      [req.params.photoId, req.params.id, tenantId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete photo failed:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

function mapDocument(row: {
  id: string;
  filename: string;
  file_url: string | null;
  mime_type: string | null;
  status: string;
  error_message: string | null;
  created_at: Date;
}) {
  return {
    id: row.id,
    filename: row.filename,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

router.get('/:id/documents', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const propertyCheck = await pool.query(
      `SELECT id FROM properties WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );
    if (!propertyCheck.rows[0]) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const result = await pool.query(
      `SELECT id, filename, file_url, mime_type, status, error_message, created_at
       FROM tenant_documents
       WHERE tenant_id = $1 AND property_id = $2
       ORDER BY created_at DESC`,
      [tenantId, req.params.id]
    );

    res.json({ documents: result.rows.map(mapDocument) });
  } catch (error) {
    console.error('List documents failed:', error);
    res.status(500).json({ error: 'Failed to load documents' });
  }
});

router.post(
  '/:id/documents',
  documentUpload.single('file'),
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Upload a PDF or plain text file.' });
      return;
    }

    try {
      const propertyCheck = await pool.query(
        `SELECT id FROM properties WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!propertyCheck.rows[0]) {
        res.status(404).json({ error: 'Property not found' });
        return;
      }

      const insert = await pool.query<{
        id: string;
        filename: string;
        file_url: string | null;
        mime_type: string | null;
        status: string;
        error_message: string | null;
        created_at: Date;
      }>(
        `INSERT INTO tenant_documents (tenant_id, property_id, filename, mime_type, status)
         VALUES ($1, $2, $3, $4, 'processing')
         RETURNING id, filename, file_url, mime_type, status, error_message, created_at`,
        [tenantId, req.params.id, file.originalname, file.mimetype]
      );

      const doc = insert.rows[0];
      if (!doc) {
        res.status(500).json({ error: 'Failed to create document record' });
        return;
      }

      let fileUrl: string | null = null;
      if (isR2Configured()) {
        const key = `tenants/${tenantId}/properties/${req.params.id}/documents/${doc.id}-${file.originalname}`;
        fileUrl = await uploadToR2(key, file.buffer, file.mimetype);
      }

      try {
        const text = await extractTextFromBuffer(file.buffer, file.mimetype, file.originalname);
        const chunks = chunkText(text);
        if (!chunks.length) {
          throw new Error('No readable text found in this file.');
        }

        await storeDocumentChunks(tenantId, doc.id, chunks);

        const updated = await pool.query(
          `UPDATE tenant_documents
           SET file_url = $1, status = 'ready', error_message = NULL, updated_at = NOW()
           WHERE id = $2 AND tenant_id = $3
           RETURNING id, filename, file_url, mime_type, status, error_message, created_at`,
          [fileUrl, doc.id, tenantId]
        );

        res.status(201).json({ document: mapDocument(updated.rows[0]!) });
      } catch (processError) {
        const message =
          processError instanceof Error ? processError.message : 'Could not process document';
        await pool.query(
          `UPDATE tenant_documents
           SET file_url = $1, status = 'failed', error_message = $2, updated_at = NOW()
           WHERE id = $3 AND tenant_id = $4`,
          [fileUrl, message, doc.id, tenantId]
        );
        res.status(400).json({ error: message });
      }
    } catch (error) {
      console.error('Upload document failed:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

router.delete('/:id/documents/:docId', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const result = await pool.query(
      `DELETE FROM tenant_documents
       WHERE id = $1 AND property_id = $2 AND tenant_id = $3
       RETURNING id`,
      [req.params.docId, req.params.id, tenantId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete document failed:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
