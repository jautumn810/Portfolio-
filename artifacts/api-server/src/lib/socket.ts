import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "node:http";
import { logger } from "./logger";

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");
    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitEvent(event: string, payload: unknown): void {
  if (io) io.emit(event, payload);
}
