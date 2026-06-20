'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';

const CORRECT_HOST = 'real-estate-a-iagent.vercel.app';
const CORRECT_URL = `https://${CORRECT_HOST}`;

export function WrongUrlBanner() {
  const [wrongHost, setWrongHost] = useState<string | null>(null);

  useEffect(() => {
    const host = window.location.hostname;
    if (host.includes('vercel.app') && host !== CORRECT_HOST) {
      setWrongHost(host);
    }
  }, []);

  if (!wrongHost) return null;

  return (
    <Alert variant="warning" className="mb-4 shrink-0">
      You are on the wrong app URL ({wrongHost}). Chats and WhatsApp will not sync here.{' '}
      <Link href={CORRECT_URL} className="font-semibold text-primary underline">
        Open {CORRECT_HOST}
      </Link>
    </Alert>
  );
}
