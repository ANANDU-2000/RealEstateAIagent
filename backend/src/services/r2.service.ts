import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim()
  );
}

function getR2Client(): S3Client | null {
  if (!isR2Configured()) return null;

  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    },
  });
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string | null> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (!client || !bucket) return null;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const publicBase = process.env.R2_PUBLIC_URL?.trim();
  if (publicBase) {
    return `${publicBase.replace(/\/$/, '')}/${key}`;
  }

  return `r2://${bucket}/${key}`;
}
