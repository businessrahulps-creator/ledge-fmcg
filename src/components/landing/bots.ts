/** One bot per landing moment — every shape appears once only (guarded by a test). */
export type LandingBotType =
  | "clover" | "flower" | "blob" | "ghost" | "star" | "droid" | "mech" | "alien"
  | "hexagon" | "cat" | "cloud" | "pill" | "puddle";

export interface LandingBotSpec { type: LandingBotType; label: string; working?: boolean; sleeping?: boolean }

export const LANDING_BOTS = {
  hero: { type: "star", label: "Ledge helper", working: true },
  problem: { type: "ghost", label: "Lost money finder" },
  how: { type: "clover", label: "Setup helper" },
  outcome: { type: "flower", label: "Results helper" },
  copilot: { type: "alien", label: "Co-Pilot", working: true },
  features: { type: "droid", label: "Orders helper" },
  who: { type: "pill", label: "Team helper" },
  why: { type: "hexagon", label: "Trust helper" },
  voices: { type: "cat", label: "Customer helper" },
  founder: { type: "mech", label: "Builder helper" },
  pricing: { type: "blob", label: "Plans helper" },
  faq: { type: "cloud", label: "Answers helper", sleeping: true },
  final: { type: "puddle", label: "Welcome helper" },
} satisfies Record<string, LandingBotSpec>;

export type LandingBotKey = keyof typeof LANDING_BOTS;
