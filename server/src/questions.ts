import questions from "../../client/src/data/questions.json" with { type: "json" };
import type { ModeId } from "./types.js";
const bank = questions as { id: string; mode: ModeId; text: string }[];
export function getQuestion(mode: ModeId, previous: string[] = []) {
  const options = bank.filter(q => q.mode === mode && !previous.includes(q.id));
  const pool = options.length ? options : bank.filter(q => q.mode === mode);
  const item = pool[Math.floor(Math.random() * pool.length)];
  return item ?? { id: "fallback", text: "What is one thing that makes a great hangout?" };
}
