'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api';

type RealtimeHandlers = {
  onNewMessage?: (data: unknown) => void;
  onEscalation?: (data: unknown) => void;
  onMeetingBooked?: (data: unknown) => void;
  onConversationUpdate?: (data: unknown) => void;
  onHumanOverride?: (data: unknown) => void;
};

export function useRealtime(token: string | null, handlers: RealtimeHandlers = {}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = io(API_BASE_URL, {
      auth: { token },
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
    if (handlers.onConversationUpdate) {
      socket.on('conversation_update', handlers.onConversationUpdate);
    }
    if (handlers.onHumanOverride) {
      socket.on('human_override', handlers.onHumanOverride);
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    token,
    handlers.onNewMessage,
    handlers.onEscalation,
    handlers.onMeetingBooked,
    handlers.onConversationUpdate,
    handlers.onHumanOverride,
  ]);

  return socketRef;
}
