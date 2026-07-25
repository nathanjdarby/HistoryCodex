import type { MatchEvent } from "@/lib/battle/types";

export type LogSubsection = {
  actor: "player" | "ai" | "setup";
  label: string;
  entries: MatchEvent[];
};

export type LogTurnSection = {
  turn: number | null;
  label: string;
  subsections: LogSubsection[];
};

function chronosActor(message: string): "player" | "ai" | null {
  if (message.startsWith("player ")) return "player";
  if (message.startsWith("ai ")) return "ai";
  return null;
}

function isSetupEntry(entry: MatchEvent): boolean {
  return entry.type === "setup" || entry.type === "location_deck_shuffled";
}

/** Group flat match log entries into turns (player + enemy halves). */
export function groupMatchLogByTurns(log: MatchEvent[]): LogTurnSection[] {
  const sections: LogTurnSection[] = [];
  let currentTurn = 0;
  let currentActor: "player" | "ai" | "setup" = "setup";

  function ensureSetupSection() {
    if (!sections.some((section) => section.turn === null)) {
      sections.push({ turn: null, label: "Setup", subsections: [] });
    }
    return sections.find((section) => section.turn === null)!;
  }

  function ensureTurnSection(turn: number) {
    let section = sections.find((s) => s.turn === turn);
    if (!section) {
      section = { turn, label: `Turn ${turn}`, subsections: [] };
      sections.push(section);
    }
    return section;
  }

  function ensureSubsection(
    section: LogTurnSection,
    actor: LogSubsection["actor"],
    label: string,
  ): LogSubsection {
    const last = section.subsections[section.subsections.length - 1];
    if (last?.actor === actor) return last;
    const created: LogSubsection = { actor, label, entries: [] };
    section.subsections.push(created);
    return created;
  }

  function appendEntry(section: LogTurnSection, actor: LogSubsection["actor"], label: string, entry: MatchEvent) {
    ensureSubsection(section, actor, label).entries.push(entry);
  }

  for (const entry of log) {
    if (isSetupEntry(entry)) {
      currentActor = "setup";
      appendEntry(ensureSetupSection(), "setup", "Before turn 1", entry);
      continue;
    }

    if (entry.type === "chronos") {
      const actor = chronosActor(entry.message);
      if (!actor) {
        if (currentTurn === 0) {
          appendEntry(ensureSetupSection(), "setup", "Before turn 1", entry);
        } else {
          appendEntry(
            ensureTurnSection(currentTurn),
            currentActor === "setup" ? "player" : currentActor,
            currentActor === "player" ? "Your turn" : currentActor === "ai" ? "Enemy turn" : "Your turn",
            entry,
          );
        }
        continue;
      }

      if (actor === "player") {
        if (currentActor === "ai" || currentTurn === 0) {
          currentTurn += 1;
        }
        currentActor = "player";
        appendEntry(ensureTurnSection(currentTurn), "player", "Your turn", entry);
        continue;
      }

      if (currentTurn === 0) currentTurn = 1;
      currentActor = "ai";
      appendEntry(ensureTurnSection(currentTurn), "ai", "Enemy turn", entry);
      continue;
    }

    if (currentTurn === 0) {
      appendEntry(ensureSetupSection(), "setup", "Before turn 1", entry);
      continue;
    }

    const label =
      currentActor === "player" ? "Your turn" : currentActor === "ai" ? "Enemy turn" : "Your turn";
    const actor = currentActor === "setup" ? "player" : currentActor;
    appendEntry(ensureTurnSection(currentTurn), actor, label, entry);
  }

  return sections;
}
