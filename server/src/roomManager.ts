import { nanoid } from "nanoid";
import { getQuestion } from "./questions.js";
import type { ModeId, Player, Room } from "./types.js";

const rooms = new Map<string, Room>();
const usedQuestions = new Map<string, string[]>();

const makeCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();

export function createRoom(name: string, mode: ModeId) {
  let code = makeCode();
  while (rooms.has(code)) code = makeCode();

  const id = nanoid(10);
  const host: Player = {
    id,
    name: cleanName(name),
    score: 0,
    isHost: true,
    connected: true
  };

  const room: Room = {
    code,
    hostId: id,
    mode,
    players: [host],
    question: "",
    round: 0,
    phase: "lobby",
    answers: []
  };

  rooms.set(code, room);
  usedQuestions.set(code, []);

  return { room, playerId: id };
}

export function joinRoom(code: string, name: string) {
  const room = rooms.get(code);

  if (!room) throw new Error("Room not found. Check the code and try again.");
  if (room.players.length >= 20) throw new Error("This room is full (20 players maximum).");
  if (room.phase !== "lobby") throw new Error("This game has already started.");

  const id = nanoid(10);

  room.players.push({
    id,
    name: cleanName(name),
    score: 0,
    isHost: false,
    connected: true
  });

  return { room, playerId: id };
}

export function disconnectPlayer(code: string, playerId: string) {
  const room = rooms.get(code);
  if (!room) return null;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;

  player.connected = false;
  return room;
}

export function reconnectPlayer(code: string, playerId: string) {
  const room = rooms.get(code);

  if (!room) throw new Error("Room no longer exists. Please create or join another room.");

  const player = room.players.find(p => p.id === playerId);

  if (!player) throw new Error("Player session not found. Please join the room again.");

  player.connected = true;

  return { room, playerId };
}

export function startGame(code: string, playerId: string) {
  const room = getRoom(code);

  requireHost(room, playerId);

  if (room.players.length < 3) {
    throw new Error("At least 3 players are required.");
  }

  beginRound(room);
  return room;
}

export function submitAnswer(code: string, playerId: string, text: string) {
  const room = getRoom(code);

  if (room.phase !== "answer") throw new Error("This round is not accepting answers.");

  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new Error("You are not in this room.");

  if (room.answers.some(a => a.playerId === playerId)) {
    throw new Error("You already submitted an answer.");
  }

  room.answers.push({
    playerId,
    playerName: player.name,
    text: text.trim().slice(0, 240),
    votes: 0,
    voters: []
  });

  if (room.answers.length >= room.players.length) {
    room.phase = "vote";
  }

  return room;
}

export function voteAnswer(code: string, voterId: string, targetId: string) {
  const room = getRoom(code);

  if (room.phase !== "vote") throw new Error("Voting is not open.");
  if (voterId === targetId) throw new Error("You cannot vote for your own answer.");

  const answer = room.answers.find(a => a.playerId === targetId);

  if (!answer) throw new Error("Answer not found.");
  if (answer.voters.includes(voterId)) throw new Error("You already voted this round.");

  answer.voters.push(voterId);
  answer.votes += 1;

  if (room.answers.reduce((n, a) => n + a.voters.length, 0) >= room.players.length) {
    room.phase = "results";

    for (const a of room.answers) {
      const p = room.players.find(x => x.id === a.playerId);
      if (p) p.score += a.votes * 10;
    }
  }

  return room;
}

export function nextRound(code: string, playerId: string) {
  const room = getRoom(code);

  requireHost(room, playerId);

  if (room.phase !== "results") {
    throw new Error("Finish voting before starting the next round.");
  }

  beginRound(room);
  return room;
}

export function leaveRoom(code: string, playerId: string) {
  const room = rooms.get(code);
  if (!room) return null;

  room.players = room.players.filter(p => p.id !== playerId);

  if (!room.players.length) {
    rooms.delete(code);
    usedQuestions.delete(code);
    return null;
  }

  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;

    room.players.forEach(p => {
      if (p.id !== room.hostId) p.isHost = false;
    });
  }

  return room;
}

export function getRoom(code: string) {
  const room = rooms.get(code);

  if (!room) throw new Error("Room not found.");

  return room;
}

function beginRound(room: Room) {
  const used = usedQuestions.get(room.code) ?? [];
  const q = getQuestion(room.mode, used);

  used.push(q.id);
  usedQuestions.set(room.code, used);

  room.round += 1;
  room.question = q.text;
  room.phase = "answer";
  room.answers = [];
}

function requireHost(room: Room, id: string) {
  if (room.hostId !== id) throw new Error("Only the host can do that.");
}

function cleanName(name: string) {
  return String(name || "Player")
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, 18) || "Player";
}
