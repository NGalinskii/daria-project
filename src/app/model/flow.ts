export const FLOW = [
  "chat",
  "chess",
  "flappy",
  "tetris",
  "captcha",
  "lighthouse",
  "test",
  "after",
  "credits",
] as const;

export type ScreenId = (typeof FLOW)[number];
export type ChallengeId = Exclude<ScreenId, "chat" | "captcha">;

export function nextScreen(screen: ScreenId): ScreenId | null {
  const next = FLOW[FLOW.indexOf(screen) + 1];
  return next ?? null;
}

export function isChallenge(screen: ScreenId): screen is ChallengeId {
  return screen !== "chat" && screen !== "captcha";
}
