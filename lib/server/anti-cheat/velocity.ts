import { ANTI_CHEAT } from "@/lib/server/anti-cheat/config";

export type VelocityInput = {
  pagesLogged: number;
  activeSeconds: number;
  wordsPerPage: number | null;
  source: "timer" | "manual_override" | "admin";
};

export type VelocityRules = {
  minSecondsPerPage: number;
  softSecondsPerPage: number;
  maxWpm: number;
  softWpm: number;
  defaultWordsPerPage: number;
};

export type VelocityRoute = "instant" | "diminished" | "verification_queue" | "rejected";

export type VelocityResult = {
  pagesPerMin: number;
  wpmEstimate: number | null;
  velocityScore: number;
  flagged: boolean;
  flagReason: string | null;
  route: VelocityRoute;
};

export function evaluateReadingVelocity(
  input: VelocityInput,
  rules: VelocityRules = {
    minSecondsPerPage: ANTI_CHEAT.MIN_SECONDS_PER_PAGE,
    softSecondsPerPage: ANTI_CHEAT.SOFT_SECONDS_PER_PAGE,
    maxWpm: ANTI_CHEAT.MAX_WPM,
    softWpm: ANTI_CHEAT.SOFT_WPM,
    defaultWordsPerPage: ANTI_CHEAT.DEFAULT_WORDS_PER_PAGE,
  },
): VelocityResult {
  const { pagesLogged, activeSeconds, wordsPerPage, source } = input;

  if (source === "admin") {
    return {
      pagesPerMin: 0,
      wpmEstimate: null,
      velocityScore: 1,
      flagged: false,
      flagReason: null,
      route: "instant",
    };
  }

  if (pagesLogged <= 0 || activeSeconds <= 0) {
    return {
      pagesPerMin: 0,
      wpmEstimate: null,
      velocityScore: 0,
      flagged: true,
      flagReason: "no_engaged_time",
      route: "verification_queue",
    };
  }

  const pagesPerMin = pagesLogged / (activeSeconds / 60);
  const secondsPerPage = activeSeconds / pagesLogged;
  const wpmEstimate =
    wordsPerPage != null ? pagesPerMin * wordsPerPage : pagesPerMin * rules.defaultWordsPerPage;

  if (secondsPerPage < rules.minSecondsPerPage) {
    return {
      pagesPerMin,
      wpmEstimate,
      velocityScore: 0,
      flagged: true,
      flagReason: "seconds_per_page_below_min",
      route: "verification_queue",
    };
  }

  if (wpmEstimate > rules.maxWpm) {
    return {
      pagesPerMin,
      wpmEstimate,
      velocityScore: 0,
      flagged: true,
      flagReason: "wpm_above_max",
      route: "verification_queue",
    };
  }

  let velocityScore = 1;
  if (secondsPerPage < rules.softSecondsPerPage) {
    const range = rules.softSecondsPerPage - rules.minSecondsPerPage;
    const t = (secondsPerPage - rules.minSecondsPerPage) / range;
    velocityScore = Math.max(0.25, Math.min(1, 0.25 + 0.75 * t));
  }

  if (wpmEstimate > rules.softWpm) {
    const wpmRange = rules.maxWpm - rules.softWpm;
    const wpmT = (rules.maxWpm - wpmEstimate) / wpmRange;
    velocityScore = Math.min(velocityScore, Math.max(0.25, wpmT));
  }

  return {
    pagesPerMin,
    wpmEstimate,
    velocityScore,
    flagged: false,
    flagReason: null,
    route: velocityScore < 1 ? "diminished" : "instant",
  };
}
