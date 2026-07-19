import type { BattleAction, Lane, Phase } from "@/lib/battle/types";

type Props = {
  lanes: Lane[];
  phase: Phase;
  isPlayerTurn: boolean;
  selectedHandIndex: number | null;
  hand: import("@/lib/battle/types").CardSnapshot[];
  legalActions: BattleAction[];
  selectedAttackerId: string | null;
  onSelectAttacker: (instanceId: string | null) => void;
  onSelectLane: (laneIndex: number) => void;
  onAttack: (laneIndex: number, attackerInstanceId: string, defenderInstanceId: string) => void;
};

function attackActionsFor(
  legalActions: BattleAction[],
  laneIndex: number,
  attackerInstanceId: string,
) {
  return legalActions.filter(
    (action): action is Extract<BattleAction, { type: "attack" }> =>
      action.type === "attack" &&
      action.laneIndex === laneIndex &&
      action.attackerInstanceId === attackerInstanceId,
  );
}

export function BattleBoard({
  lanes,
  phase,
  isPlayerTurn,
  selectedHandIndex,
  hand,
  legalActions,
  selectedAttackerId,
  onSelectAttacker,
  onSelectLane,
  onAttack,
}: Props) {
  const selectedCard = selectedHandIndex != null ? hand[selectedHandIndex] : null;
  const canDeploy =
    isPlayerTurn &&
    phase === "logistics" &&
    selectedCard &&
    (selectedCard.cardType === "character" || selectedCard.cardType === "unit" || selectedCard.cardType === "event");

  const inCampaign = isPlayerTurn && phase === "campaign";

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {lanes.map((lane, laneIndex) => (
        <div
          key={`${lane.location.characterId}-${laneIndex}`}
          className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Lane {laneIndex + 1}</p>
              <h3 className="font-medium text-neutral-100">{lane.location.name}</h3>
              <p className="text-xs text-neutral-500">{lane.location.eraName}</p>
            </div>
            <div className="text-right text-xs text-neutral-400">
              <div>You: {lane.playerInfluence} influence</div>
              <div>AI: {lane.aiInfluence} influence</div>
            </div>
          </div>

          {canDeploy ? (
            <button
              type="button"
              onClick={() => onSelectLane(laneIndex)}
              className="mb-3 w-full rounded-md border border-dashed border-amber-700/50 px-2 py-1 text-xs text-amber-300 hover:bg-amber-950/30"
            >
              Deploy / target here
            </button>
          ) : null}

          {inCampaign ? (
            <p className="mb-2 text-[10px] text-neutral-500">
              Select one of your units, then click a highlighted enemy. Warriors must be attacked first.
            </p>
          ) : null}

          <div className="space-y-3">
            <div>
              <p className="mb-1 text-[10px] uppercase text-neutral-500">Your units</p>
              <div className="space-y-2">
                {lane.playerUnits.map((unit) => {
                  const legalAttacks = attackActionsFor(legalActions, laneIndex, unit.instanceId);
                  const canAttack = inCampaign && !unit.summoningSickness && unit.currentDefense > 0;
                  const isSelected = selectedAttackerId === unit.instanceId;

                  return (
                    <UnitRow
                      key={unit.instanceId}
                      name={unit.name}
                      attack={unit.baseAttack + unit.tempAttackBonus}
                      defense={unit.currentDefense}
                      archetype={unit.archetype}
                      highlight={isSelected}
                      dimmed={Boolean(selectedAttackerId && !isSelected)}
                      actionLabel={
                        canAttack
                          ? isSelected
                            ? "Selected"
                            : legalAttacks.length > 0
                              ? "Select"
                              : undefined
                          : unit.summoningSickness
                            ? "Resting"
                            : undefined
                      }
                      onAction={
                        canAttack && legalAttacks.length > 0
                          ? () => onSelectAttacker(isSelected ? null : unit.instanceId)
                          : undefined
                      }
                    />
                  );
                })}
                {lane.playerUnits.length === 0 ? (
                  <p className="text-xs text-neutral-600">No units</p>
                ) : null}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase text-neutral-500">AI units</p>
              <div className="space-y-2">
                {lane.aiUnits.map((unit) => {
                  const isTarget = legalActions.some(
                    (action) =>
                      action.type === "attack" &&
                      action.laneIndex === laneIndex &&
                      action.defenderInstanceId === unit.instanceId &&
                      action.attackerInstanceId === selectedAttackerId,
                  );

                  return (
                    <UnitRow
                      key={unit.instanceId}
                      name={unit.name}
                      attack={unit.baseAttack}
                      defense={unit.currentDefense}
                      archetype={unit.archetype}
                      highlight={isTarget}
                      actionLabel={isTarget ? "Attack" : undefined}
                      onAction={
                        isTarget && selectedAttackerId
                          ? () => onAttack(laneIndex, selectedAttackerId, unit.instanceId)
                          : undefined
                      }
                    />
                  );
                })}
                {lane.aiUnits.length === 0 ? (
                  <p className="text-xs text-neutral-600">No units</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UnitRow({
  name,
  attack,
  defense,
  archetype,
  highlight = false,
  dimmed = false,
  actionLabel,
  onAction,
}: {
  name: string;
  attack: number;
  defense: number;
  archetype: string | null;
  highlight?: boolean;
  dimmed?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border px-2 py-1.5 ${
        highlight
          ? "border-amber-600 bg-amber-950/30"
          : dimmed
            ? "border-neutral-900 bg-neutral-950/30 opacity-50"
            : "border-neutral-800 bg-neutral-950/60"
      }`}
    >
      <div>
        <p className="text-sm text-neutral-100">{name}</p>
        {archetype ? <p className="text-[10px] capitalize text-neutral-500">{archetype}</p> : null}
      </div>
      <div className="flex items-center gap-1 text-xs font-mono">
        <span className="text-red-300">ATK {attack}</span>
        <span className="text-sky-300">DEF {defense}</span>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className={`ml-1 rounded px-2 py-0.5 text-[10px] ${
              actionLabel === "Attack"
                ? "bg-red-900/60 text-red-200 hover:bg-red-800/60"
                : actionLabel === "Selected"
                  ? "bg-amber-800/60 text-amber-100"
                  : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
            }`}
          >
            {actionLabel}
          </button>
        ) : actionLabel ? (
          <span className="ml-1 text-[10px] text-neutral-500">{actionLabel}</span>
        ) : null}
      </div>
    </div>
  );
}
