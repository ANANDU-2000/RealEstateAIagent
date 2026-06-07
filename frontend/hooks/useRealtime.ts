'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api';

type RealtimeHandlers = {
  onNewMessage?: (data: unknown) => void;
  onEscalation?: (data: unknown) => void;
  onMeetingBooked?: (data: unknown) => void;
};

export function useRealtime(token: string | null, handlers: RealtimeHandlers = {}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = io(API_BASE_URL, {
      auth: { tenantId: token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    if (handlers.onNewMessage) {
      socket.on('new_message', handlers.onNewMessage);
    }
    if (handlers.onEscalation) {
      socket.on('escalation', handlers.onEscalation);
    }
    if (handlers.onMeetingBooked) {
      socket.on('meeting_booked', handlers.onMeetingBooked);
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, handlers.onNewMessage, handlers.onEscalation, handlers.onMeetingBooked]);

  return socketRef;
}
