# INSIGHT+ Architecture

## Runtime
- Browser client: React, TypeScript, Vite.
- Game server: Express HTTP API + Socket.IO.
- Active room state: in-memory Map for this MVP.
- Question bank: 320 original prompt records, grouped by eight modes.
- Optional persistence: PostgreSQL schema in `database/schema.sql`.

## Multiplayer event flow
1. Client connects to Socket.IO.
2. Host emits `room:create`; server returns room code and player id.
3. Friends emit `room:join`.
4. Host emits `game:start`.
5. Players submit answers; server changes phase to vote when all players have answered.
6. Players vote for another player's answer; when all votes are cast, score is awarded.
7. Host emits `game:next`.

## MVP limitations
- Rooms are lost when the server restarts.
- Socket identity is not authenticated or persisted.
- Reconnection/rejoin tokens are not implemented.
- Mode-specific mechanics are represented by mode-specific question decks and can be expanded.
- Voting currently awards 10 points per received vote.
