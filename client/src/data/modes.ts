import type { Mode } from "../types";
export const modes: Mode[] = [
  { id: "classic", name: "Classic", description: "Easygoing questions to get everyone talking.", icon: "✦", color: "violet" },
  { id: "blackout", name: "Blackout", description: "Unexpected prompts. No overthinking.", icon: "◐", color: "blue" },
  { id: "deep-questions", name: "Deep Questions", description: "Go beyond small talk and get real.", icon: "◈", color: "cyan" },
  { id: "spicy", name: "Spicy", description: "Bold, playful questions for your group.", icon: "♨", color: "pink" },
  { id: "battle", name: "Battle", description: "Compete, vote, and climb the scoreboard.", icon: "⚔", color: "orange" },
  { id: "truth-or-dare", name: "Truth or Dare", description: "Choose truth or take on a dare.", icon: "◇", color: "green" },
  { id: "would-you-rather", name: "Would You Rather", description: "Two choices. One impossible decision.", icon: "⇄", color: "purple" },
  { id: "most-likely-to", name: "Most Likely To", description: "Vote for the friend who fits the prompt.", icon: "◎", color: "yellow" }
];
