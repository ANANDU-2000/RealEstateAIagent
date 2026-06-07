import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';

export function initSocketIO(httpServer: HttpServer): SocketServer {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  const io = new SocketServer(httpServer, {
    cors: {
      origin: frontendUrl,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const tenantId = socket.handshake.auth?.tenantId as string | undefined;

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
};
