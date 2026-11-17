import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  createRoom,
  joinRoom,
  startGame,
  submitAnswer,
  voteAnswer,
  nextRound,
  leaveRoom,
  disconnectPlayer,
  reconnectPlayer
} from "./roomManager.js";
import type { ModeId } from "./types.js";

const app = express();

const allowedOrigins =
  process.env.CLIENT_ORIGIN?.split(",") ?? "http://localhost:5173";

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (_req, res) =>
  res.json({
    ok: true,
    app: "INSIGHT+",
    timestamp: new Date().toISOString()
  })
);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins }
});

io.on("connection", socket => {
  let currentCode = "";
  let playerId = "";

  const broadcast = (code: string, room: unknown) => {
    io.to(code).emit("room:update", room);
  };

  const fail = (error: unknown) => {
    socket.emit(
      "room:error",
      error instanceof Error ? error.message : "Something went wrong."
    );
  };

  socket.on("room:create", ({ name, mode }: { name: string; mode: ModeId }) => {
    try {
      const result = createRoom(name, mode);

      currentCode = result.room.code;
      playerId = result.playerId;

      socket.join(currentCode);
      socket.emit("room:created", result);
    } catch (e) {
      fail(e);
    }
  });

  socket.on("room:join", ({ name, code }: { name: string; code: string }) => {
    try {
      const result = joinRoom(String(code).toUpperCase(), name);

      currentCode = result.room.code;
      playerId = result.playerId;

      socket.join(currentCode);
      socket.emit("room:joined", result);
      broadcast(currentCode, result.room);
    } catch (e) {
      fail(e);
    }
  });

  socket.on("room:reconnect", ({ code, playerId: savedPlayerId }: {
    code: string;
    playerId: string;
  }) => {
    try {
      const result = reconnectPlayer(
        String(code).toUpperCase(),
        savedPlayerId
      );

      currentCode = result.room.code;
      playerId = result.playerId;

      socket.join(currentCode);

      socket.emit("room:reconnected", result);
      broadcast(currentCode, result.room);
    } catch (e) {
      fail(e);
    }
  });

  socket.on("game:start", ({ code }: { code: string }) => {
    try {
      broadcast(code, startGame(code, playerId));
    } catch (e) {
      fail(e);
    }
  });

  socket.on("game:answer", ({ code, text }: {
    code: string;
    text: string;
  }) => {
    try {
      const room = submitAnswer(code, playerId, text);

      broadcast(code, room);
      socket.emit("game:answer-received");
    } catch (e) {
      fail(e);
    }
  });

  socket.on("game:vote", ({ code, targetId }: {
    code: string;
    targetId: string;
  }) => {
    try {
      broadcast(code, voteAnswer(code, playerId, targetId));
    } catch (e) {
      fail(e);
    }
  });

  socket.on("game:next", ({ code }: { code: string }) => {
    try {
      broadcast(code, nextRound(code, playerId));
    } catch (e) {
      fail(e);
    }
  });

  socket.on("room:leave", ({ code }: { code: string }) => {
    try {
      const room = leaveRoom(code, playerId);

      socket.leave(code);

      if (room) {
        broadcast(code, room);
      }

      currentCode = "";
      playerId = "";
    } catch (e) {
      fail(e);
    }
  });

  socket.on("disconnect", () => {
    if (currentCode && playerId) {
      const room = disconnectPlayer(currentCode, playerId);

      if (room) {
        broadcast(currentCode, room);
      }
    }
  });
});

const port = Number(process.env.PORT || 3001);

httpServer.listen(port, () => {
  console.log(`INSIGHT+ server listening on http://localhost:${port}`);
});
