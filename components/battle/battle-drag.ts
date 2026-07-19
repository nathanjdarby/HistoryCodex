import type { BattleAction } from "@/lib/battle/types";

export const HAND_CARD_DRAG_MIME = "application/x-historycodex-hand-index";

export type HandPlayAction = Extract<
  BattleAction,
  { type: "deploy_unit" | "play_event" | "play_location" }
>;

export function readHandDragIndex(dataTransfer: DataTransfer): number | null {
  const raw = dataTransfer.getData(HAND_CARD_DRAG_MIME);
  if (raw === "") return null;
  const index = Number(raw);
  return Number.isInteger(index) && index >= 0 ? index : null;
}

export function handPlayActionsForIndex(
  legalActions: BattleAction[],
  handIndex: number,
): HandPlayAction[] {
  return legalActions.filter(
    (action): action is HandPlayAction =>
      (action.type === "deploy_unit" ||
        action.type === "play_event" ||
        action.type === "play_location") &&
      action.handIndex === handIndex,
  );
}

export function resolveHandDropAction(
  legalActions: BattleAction[],
  handIndex: number,
  laneIndex: number,
  targetInstanceId?: string,
): HandPlayAction | null {
  const actions = handPlayActionsForIndex(legalActions, handIndex);

  if (targetInstanceId) {
    return (
      actions.find(
        (action) =>
          action.type === "play_event" &&
          action.targetInstanceId === targetInstanceId &&
          action.laneIndex === laneIndex,
      ) ?? null
    );
  }

  const playLocation = actions.find(
    (action) => action.type === "play_location" && action.laneIndex === laneIndex,
  );
  if (playLocation) return playLocation;

  const deploy = actions.find(
    (action) => action.type === "deploy_unit" && action.laneIndex === laneIndex,
  );
  if (deploy) return deploy;

  return (
    actions.find(
      (action) =>
        action.type === "play_event" &&
        (action.laneIndex === laneIndex || action.laneIndex === undefined),
    ) ?? null
  );
}

export function handCardCanDropOnLane(
  legalActions: BattleAction[],
  handIndex: number,
  laneIndex: number,
): boolean {
  return resolveHandDropAction(legalActions, handIndex, laneIndex) !== null;
}

export function handCardCanDropOnTarget(
  legalActions: BattleAction[],
  handIndex: number,
  laneIndex: number,
  targetInstanceId: string,
): boolean {
  return resolveHandDropAction(legalActions, handIndex, laneIndex, targetInstanceId) !== null;
}

export function handIndexIsDraggable(legalActions: BattleAction[], handIndex: number): boolean {
  return handPlayActionsForIndex(legalActions, handIndex).length > 0;
}
