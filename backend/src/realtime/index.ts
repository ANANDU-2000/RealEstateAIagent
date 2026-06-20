import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { verifyAccessToken } from '../services/auth.service';
import { parseAllowedOrigins } from '../utils/corsOrigins';

export function initSocketIO(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: parseAllowedOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.tenantId = payload.tenant_id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const tenantId = socket.data.tenantId as string | undefined;

    if (!tenantId) {
      socket.disconnect(true);
      return;
    }

    socket.join(`tenant:${tenantId}`);

    socket.on('disconnect', () => {
      socket.leave(`tenant:${tenantId}`);
    });
  });

  return io;
}

export type RealtimeEvents = {
  new_message: { conversationId: string; message: unknown };
  escalation: { conversationId: string; type: string };
  meeting_booked: { meetingId: string };
  conversation_update: { conversation: unknown };
  human_override: { conversationId: string; customerPhone: string };
};
