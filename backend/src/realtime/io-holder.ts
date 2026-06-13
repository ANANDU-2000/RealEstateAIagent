import { Server as SocketServer } from 'socket.io';

let ioInstance: SocketServer | null = null;

export function setIo(io: SocketServer): void {
  ioInstance = io;
}

export function getIo(): SocketServer | null {
  return ioInstance;
}
