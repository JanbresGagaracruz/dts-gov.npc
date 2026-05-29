import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIO } from "socket.io";

const dev  = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);
const app  = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIO(httpServer, {
    path: "/api/socketio",
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  (global as any)._io = io;

  io.on("connection", (socket) => {
    const { userId, userLevel } = socket.handshake.auth as {
      userId?: string;
      userLevel?: number;
    };

    if (userId) {
      socket.join(`user:${userId}`);
      if (typeof userLevel === "number" && userLevel >= 3) {
        socket.join("admins");
      }
    }

    socket.on("disconnect", () => {});
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
