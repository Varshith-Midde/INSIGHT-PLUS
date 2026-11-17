# INSIGHT+
**PLAY TOGETHER. THINK DIFFERENTLY.**

INSIGHT+ is an original, free-to-play social party-game starter project for browser and Android packaging. It includes a React + TypeScript client, Node/Express + Socket.IO server, eight party-game categories, a local question bank, room codes, live room updates, a simple voting/scoring loop, and optional Supabase schema.

> This ZIP is a runnable MVP foundation, not a finished production service. It intentionally does not include paid features, mandatory ads, or copied assets/content from another app.

## Requirements
- Node.js 20 or newer
- npm 10 or newer

## Run locally
1. Extract the ZIP.
2. Open the extracted `INSIGHT-PLUS` folder in VS Code.
3. In the terminal run:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `server/.env` (or set environment variables in your shell). The local app works without Supabase.
5. Start both apps:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:5173` in your browser. The API/socket server runs on `http://localhost:3001`.

For testing multiplayer, open the app in two or more browser tabs. Create a room in one tab and join using its room code in the others.

## Included modes
Classic, Blackout, Deep Questions, Spicy, Battle, Truth or Dare, Would You Rather, and Most Likely To. The modes use original prompts from `client/src/data/questions.json`. Some modes share the same room/round engine and differ by prompt category and instructions; expand their unique mechanics before public release.

## Android packaging
The project includes Capacitor configuration and dependencies. After the web client is built:
```bash
npm run build --workspace client
cd client
npx cap add android
npx cap sync android
npx cap open android
```
Android Studio and its Android SDK are required to build an APK. Android platform files are generated locally and are not included in this ZIP.

## Supabase (optional)
1. Create a Supabase project.
2. Run `database/schema.sql` in the Supabase SQL editor.
3. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `server/.env`.
4. The current MVP keeps active rooms in server memory. Supabase schema is provided for future persistence; production integration, authentication, row-level security policies, and durable room recovery still need implementation.

## Project layout
- `client/` React UI and browser app
- `server/` Express API and Socket.IO room engine
- `database/` optional PostgreSQL schema and seed data
- `docs/` architecture and release checklist
- `tests/` starter test notes

## Important production checklist
- Add authentication and secure profile management.
- Persist rooms, matches, answers, and scores in a database.
- Add server-side validation, rate limits, moderation, and abuse reporting.
- Add automated unit/integration/e2e tests.
- Review privacy, accessibility, security, and app-store requirements.
- Load-test rooms at the intended concurrency.
