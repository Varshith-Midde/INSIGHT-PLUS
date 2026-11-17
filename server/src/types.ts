export type ModeId = "classic" | "blackout" | "deep-questions" | "spicy" | "battle" | "truth-or-dare" | "would-you-rather" | "most-likely-to";
export type Player = { id: string; name: string; score: number; isHost: boolean; connected: boolean };
export type Answer = { playerId: string; playerName: string; text: string; votes: number; voters: string[] };
export type Room = { code: string; hostId: string; mode: ModeId; players: Player[]; question: string; round: number; phase: "lobby" | "answer" | "vote" | "results"; answers: Answer[] };
