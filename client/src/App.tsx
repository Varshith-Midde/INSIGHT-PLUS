import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Copy, Crown, Gamepad2, Plus, Users,
  Wifi, WifiOff, Sparkles, Trophy, LogIn
} from "lucide-react";
import { socket } from "./services/socket";
import { modes } from "./data/modes";
import type { ModeId, Room } from "./types";

type Notice = { kind: "success" | "error"; text: string };

const SESSION_CODE = "insight-room-code";
const SESSION_PLAYER = "insight-player-id";

export default function App() {
  const [name, setName] = useState(localStorage.getItem("insight-name") || "");
  const [roomCode, setRoomCode] = useState("");
  const [selectedMode, setSelectedMode] = useState<ModeId>("classic");
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [answer, setAnswer] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);

  const isHost = !!room && room.hostId === playerId;
  const mode = useMemo(
    () => modes.find(m => m.id === room?.mode),
    [room]
  );

  function saveSession(code: string, id: string) {
    localStorage.setItem(SESSION_CODE, code);
    localStorage.setItem(SESSION_PLAYER, id);
  }

  function clearSession() {
    localStorage.removeItem(SESSION_CODE);
    localStorage.removeItem(SESSION_PLAYER);
  }

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);

      const savedCode = localStorage.getItem(SESSION_CODE);
      const savedPlayer = localStorage.getItem(SESSION_PLAYER);

      if (savedCode && savedPlayer) {
        setNotice({
          kind: "success",
          text: "Connection restored. Rejoining your room..."
        });

        socket.emit("room:reconnect", {
          code: savedCode,
          playerId: savedPlayer
        });
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setNotice({
        kind: "error",
        text: "Connection lost. Trying to reconnect..."
      });
    });

    socket.on("room:update", (next: Room) => {
      setRoom(next);
    });

    socket.on("room:error", (message: string) => {
      setNotice({ kind: "error", text: message });
      setBusy(false);
    });

    socket.on(
      "room:created",
      ({ room: next, playerId: id }: { room: Room; playerId: string }) => {
        setRoom(next);
        setPlayerId(id);
        saveSession(next.code, id);
        setBusy(false);
        setNotice({
          kind: "success",
          text: "Room created. Invite your friends!"
        });
      }
    );

    socket.on(
      "room:joined",
      ({ room: next, playerId: id }: { room: Room; playerId: string }) => {
        setRoom(next);
        setPlayerId(id);
        saveSession(next.code, id);
        setBusy(false);
        setNotice({
          kind: "success",
          text: "You joined the room!"
        });
      }
    );

    socket.on(
      "room:reconnected",
      ({ room: next, playerId: id }: { room: Room; playerId: string }) => {
        setRoom(next);
        setPlayerId(id);
        saveSession(next.code, id);
        setBusy(false);
        setNotice({
          kind: "success",
          text: "Successfully reconnected to your room!"
        });
      }
    );

    socket.on("game:answer-received", () => {
      setNotice({
        kind: "success",
        text: "Answer submitted!"
      });
    });

    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  function validName() {
    const clean = name.trim().slice(0, 18);

    if (clean.length < 2) {
      setNotice({
        kind: "error",
        text: "Enter a name with at least 2 characters."
      });
      return false;
    }

    localStorage.setItem("insight-name", clean);
    setName(clean);

    return true;
  }

  function createRoom() {
    if (!validName()) return;

    setBusy(true);

    socket.emit("room:create", {
      name: name.trim(),
      mode: selectedMode
    });
  }

  function joinRoom() {
    if (!validName()) return;

    if (!/^[A-Z0-9]{4,6}$/i.test(roomCode.trim())) {
      setNotice({
        kind: "error",
        text: "Enter a valid 4–6 character room code."
      });
      return;
    }

    setBusy(true);

    socket.emit("room:join", {
      name: name.trim(),
      code: roomCode.trim().toUpperCase()
    });
  }

  function startGame() {
    socket.emit("game:start", { code: room?.code });
  }

  function submitAnswer() {
    if (!room || answer.trim().length < 1) return;

    socket.emit("game:answer", {
      code: room.code,
      text: answer.trim().slice(0, 240)
    });

    setAnswer("");
  }

  function nextRound() {
    if (room) {
      socket.emit("game:next", { code: room.code });
    }
  }

  function vote(targetId: string) {
    if (room) {
      socket.emit("game:vote", {
        code: room.code,
        targetId
      });
    }
  }

  async function copyCode() {
    if (!room) return;

    try {
      await navigator.clipboard.writeText(room.code);

      setNotice({
        kind: "success",
        text: "Room code copied."
      });
    } catch {
      setNotice({
        kind: "error",
        text: `Share code: ${room.code}`
      });
    }
  }

  function leaveRoom() {
    if (room) {
      socket.emit("room:leave", { code: room.code });
    }

    clearSession();
    setRoom(null);
    setPlayerId("");
    setAnswer("");
    setNotice(null);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">I+</span>
          <span>
            INSIGHT<span className="brand-plus">+</span>
            <small>PLAY TOGETHER. THINK DIFFERENTLY.</small>
          </span>
        </a>

        <div className={`connection ${connected ? "online" : "offline"}`}>
          {connected ? <Wifi size={15} /> : <WifiOff size={15} />}
          {connected ? "Connected" : "Connecting…"}
        </div>
      </header>

      {notice && (
        <button
          className={`notice ${notice.kind}`}
          onClick={() => setNotice(null)}
        >
          {notice.text} <span>×</span>
        </button>
      )}

      {!room ? (
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={14} /> THE PARTY STARTS HERE
            </div>

            <h1>
              Good friends.
              <br />
              <span>Better questions.</span>
            </h1>

            <p>
              Break the ice, discover surprising answers,
              and make every hangout a story worth remembering.
            </p>

            <div className="name-field">
              <label htmlFor="player-name">YOUR PLAYER NAME</label>
              <input
                id="player-name"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={18}
                placeholder="What should we call you?"
              />
            </div>

            <div className="room-actions">
              <button
                className="primary-btn"
                onClick={createRoom}
                disabled={busy}
              >
                <Plus size={18} /> Create a room <ArrowRight size={17} />
              </button>

              <div className="join-box">
                <input
                  aria-label="Room code"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  maxLength={6}
                />

                <button
                  className="secondary-btn"
                  onClick={joinRoom}
                  disabled={busy}
                >
                  <LogIn size={17} /> Join
                </button>
              </div>
            </div>

            <div className="microcopy">
              <Users size={15} /> 3–20 players
              <span>•</span> Free to play
              <span>•</span> No downloads required
            </div>
          </div>

          <div className="hero-art">
            <div className="orb orb-one" />
            <div className="orb orb-two" />

            <div className="floating-card card-top">
              <span>✦</span>
              <b>Unexpected answers</b>
              <small>Every round is different</small>
            </div>

            <div className="game-tile">
              <div className="tile-glow" />
              <span className="tile-symbol">?</span>
              <b>
                HOW WELL
                <br />
                DO YOU KNOW
                <br />
                YOUR FRIENDS?
              </b>
              <div className="tile-bottom">
                <span>INSIGHT+ PARTY</span>
                <span>✦ ✦ ✦</span>
              </div>
            </div>

            <div className="floating-card card-bottom">
              <span>◎</span>
              <b>Make memories</b>
              <small>One question at a time</small>
            </div>
          </div>

          <section className="mode-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">PICK YOUR ENERGY</div>
                <h2>Choose a game mode</h2>
              </div>
              <span className="mode-count">08 MODES</span>
            </div>

            <div className="mode-grid">
              {modes.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  className={`mode-card ${selectedMode === m.id ? "selected" : ""}`}
                >
                  <span className={`mode-icon ${m.color}`}>
                    {m.icon}
                  </span>

                  <span className="mode-text">
                    <b>{m.name}</b>
                    <small>{m.description}</small>
                  </span>

                  <span className="radio">
                    {selectedMode === m.id ? "✓" : ""}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </section>
      ) : (
        <section className="room-view">
          <div className="room-header">
            <div>
              <div className="eyebrow">YOUR GAME ROOM</div>
              <h1>
                {room.phase === "lobby"
                  ? "Waiting room"
                  : mode?.name || "Game time"}
              </h1>
              <p>
                {room.phase === "lobby"
                  ? "Invite your friends to join the fun."
                  : `Round ${room.round} · ${room.players.length} players`}
              </p>
            </div>

            <button className="ghost-btn" onClick={leaveRoom}>
              Leave room
            </button>
          </div>

          <div className="room-code-panel">
            <div>
              <small>ROOM CODE</small>
              <strong>{room.code}</strong>
            </div>

            <button className="secondary-btn" onClick={copyCode}>
              <Copy size={16} /> Copy code
            </button>
          </div>

          <div className="room-columns">
            <div className="panel players-panel">
              <div className="panel-title">
                <Users size={18} /> Players
                <span>{room.players.length}/20</span>
              </div>

              {room.players.map(p => (
                <div className="player-row" key={p.id}>
                  <span className="avatar">
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>

                  <b>
                    {p.name}
                    {p.id === playerId ? " (you)" : ""}
                  </b>

                  {p.isHost && (
                    <span className="host-tag">
                      <Crown size={13} /> HOST
                    </span>
                  )}

                  <strong>{p.score} pts</strong>
                </div>
              ))}

              {room.phase === "lobby" && (
                <div className="waiting-note">
                  Waiting for more players to join…
                </div>
              )}
            </div>

            <div className="panel game-panel">
              {room.phase === "lobby" ? (
                <>
                  <div className="eyebrow">READY WHEN YOU ARE</div>
                  <h2>
                    {mode?.icon} {mode?.name}
                  </h2>
                  <p>{mode?.description}</p>

                  {isHost ? (
                    <button
                      className="primary-btn full"
                      onClick={startGame}
                      disabled={room.players.length < 3}
                    >
                      Start game <ArrowRight size={17} />
                    </button>
                  ) : (
                    <div className="waiting-state">
                      <span className="pulse-dot" />
                      Waiting for the host to start…
                    </div>
                  )}

                  <small className="hint">
                    At least 3 players are needed to start.
                  </small>
                </>
              ) : (
                <>
                  <div className="round-label">
                    ROUND {room.round} · {room.phase.toUpperCase()}
                  </div>

                  <h2 className="question">{room.question}</h2>

                  {room.phase === "answer" && (
                    <>
                      <textarea
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        maxLength={240}
                        placeholder="Type your answer…"
                      />

                      <button
                        className="primary-btn full"
                        onClick={submitAnswer}
                        disabled={!answer.trim()}
                      >
                        Submit answer <ArrowRight size={17} />
                      </button>

                      <div className="hint">
                        Keep it friendly. Your answer is visible to the room.
                      </div>
                    </>
                  )}

                  {(room.phase === "vote" || room.phase === "results") && (
                    <div className="answer-list">
                      {room.answers.map(a => (
                        <div className="answer-card" key={a.playerId}>
                          <p>{a.text}</p>

                          <div>
                            <span>— {a.playerName}</span>

                            {room.phase === "vote" ? (
                              <button
                                className="vote-btn"
                                onClick={() => vote(a.playerId)}
                              >
                                Vote
                              </button>
                            ) : (
                              <b>{a.votes} votes</b>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {room.phase === "results" && (
                    <div className="result-banner">
                      <Trophy size={20} />
                      Round results are in! Vote points are added to the scoreboard.
                    </div>
                  )}

                  {isHost && room.phase !== "answer" && (
                    <button
                      className="primary-btn full"
                      onClick={nextRound}
                    >
                      Next round <ArrowRight size={17} />
                    </button>
                  )}

                  {room.phase === "answer" && (
                    <div className="hint">
                      Submit your answer. The host can move the room to voting when ready.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="leaderboard-strip">
            <Trophy size={17} />
            <b>Live scoreboard</b>

            {[...room.players]
              .sort((a, b) => b.score - a.score)
              .slice(0, 3)
              .map((p, i) => (
                <span key={p.id}>
                  {["🥇", "🥈", "🥉"][i]} {p.name} · {p.score}
                </span>
              ))}
          </div>
        </section>
      )}

      <footer>
        <span>© 2026 INSIGHT+ · Made for good company.</span>
        <span>
          <Gamepad2 size={14} /> 8 original game modes
          <span>·</span> Free forever
        </span>
      </footer>
    </main>
  );
}
