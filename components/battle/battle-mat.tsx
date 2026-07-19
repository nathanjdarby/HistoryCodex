"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Bot, Layers, Plus, Trash2 } from "lucide-react";
import { BattleCard } from "@/components/battle/battle-card";
import { BattleCardBack } from "@/components/battle/battle-card-back";
import { BattlePileModal } from "@/components/battle/battle-pile-modal";
import {
  HAND_CARD_DRAG_MIME,
  handCardCanDropOnLane,
  handCardCanDropOnTarget,
  handIndexIsDraggable,
  readHandDragIndex,
} from "@/components/battle/battle-drag";
import { boardUnitToFace, cardSnapshotToFace, type BattleCardFace } from "@/components/battle/battle-card-face";
import { CharacterArt } from "@/components/character-art";
import { clampImageFrame } from "@/lib/image-frame";
import type { Archetype } from "@/lib/sprite/generateSprite";
import type { BattleAction, BoardUnit, CardSnapshot, Lane, MatchState, Phase } from "@/lib/battle/types";

/** Every lane row reserves exactly this many slots — filled or empty — so the
 * row's width (and the mat's overall proportions) never depends on how many
 * units happen to be deployed. */
const LANE_SLOT_COUNT = 5;

type Props = {
  matchLabel: ReactNode;
  statusBadge: ReactNode | null;
  lanes: Lane[];
  phase: Phase;
  turnNumber: number;
  cp: number;
  cpCap: number;
  capturedLocations: number;
  aiCapturedLocations: number;
  locationsToWin: number;
  activePlayer: string;
  isPlayerTurn: boolean;
  playerHand: CardSnapshot[];
  playerDeck: CardSnapshot[];
  playerDiscard: CardSnapshot[];
  aiHandCount: number;
  log: MatchState["log"];
  selectedHandIndex: number | null;
  legalActions: BattleAction[];
  selectedAttackerId: string | null;
  onSelectHand: (index: number | null) => void;
  onSelectAttacker: (instanceId: string | null) => void;
  onDeployLane: (laneIndex: number) => void;
  onPlayHandCard: (handIndex: number, laneIndex: number, targetInstanceId?: string) => void;
  onAttack: (laneIndex: number, attackerInstanceId: string, defenderInstanceId: string) => void;
  onInspect: (card: BattleCardFace) => void;
  onEndPhase: () => void;
  canPlaySelected: boolean;
  actionPending: boolean;
};

const PHASES: Phase[] = ["opening", "chronos", "logistics", "campaign", "consolidation"];
const PHASE_LABEL: Record<Phase, string> = {
  opening: "Opening",
  chronos: "Chronos",
  logistics: "Logistics",
  campaign: "Campaign",
  consolidation: "Consolidation",
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

export function BattleMat({
  matchLabel,
  statusBadge,
  lanes,
  phase,
  turnNumber,
  cp,
  cpCap,
  capturedLocations,
  aiCapturedLocations,
  locationsToWin,
  activePlayer,
  isPlayerTurn,
  playerHand,
  playerDeck,
  playerDiscard,
  aiHandCount,
  log,
  selectedHandIndex,
  legalActions,
  selectedAttackerId,
  onSelectHand,
  onSelectAttacker,
  onDeployLane,
  onPlayHandCard,
  onAttack,
  onInspect,
  onEndPhase,
  canPlaySelected,
  actionPending,
}: Props) {
  const [pileView, setPileView] = useState<"deck" | "discard" | null>(null);
  const [draggingHandIndex, setDraggingHandIndex] = useState<number | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const lane = lanes[0];
  const laneIndex = 0;
  const activeDragIndex = draggingHandIndex ?? selectedHandIndex;
  const canDeploy =
    isPlayerTurn &&
    phase === "logistics" &&
    activeDragIndex != null &&
    handIndexIsDraggable(legalActions, activeDragIndex);
  const laneAcceptsHandDrop =
    activeDragIndex != null && handCardCanDropOnLane(legalActions, activeDragIndex, laneIndex);
  const locationAcceptsHandDrop =
    activeDragIndex != null &&
    phase === "logistics" &&
    handCardCanDropOnLane(legalActions, activeDragIndex, laneIndex) &&
    playerHand[activeDragIndex]?.cardType === "location";
  const inCampaign = isPlayerTurn && phase === "campaign";
  const influenceToCapture = 3;

  function clearDragState() {
    setDraggingHandIndex(null);
    setDragOverZone(null);
  }

  function allowDrop(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleHandDrop(event: DragEvent, targetInstanceId?: string) {
    event.preventDefault();
    event.stopPropagation();
    const handIndex = readHandDragIndex(event.dataTransfer);
    if (handIndex == null) return;
    onPlayHandCard(handIndex, laneIndex, targetInstanceId);
    clearDragState();
  }

  if (!lane) {
    return (
      <div className="battle-mat p-6 text-center text-sm text-neutral-500">
        No battlefield lane configured.
      </div>
    );
  }

  return (
    <>
      {/* Fixed (not min-) height: every zone below is a single card-height
          row, so the mat's total content height is deterministic regardless
          of match state — capping it here means it always fits one screen
          instead of growing past the viewport on tall hands/boards.
          overflow-y-auto is a safety net for extreme viewports, not the
          normal path. */}
      <div className="battle-mat-fullbleed battle-mat relative flex h-[calc(100vh-3.5rem)] flex-col overflow-y-auto">
        {lane.location ? <LocationBackdrop location={lane.location} /> : null}
        <div className="battle-mat-texture pointer-events-none absolute inset-0" />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          {/* Top strip — match info / enemy status | phase + turn | your resources */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-amber-950/40 px-4 py-2 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {matchLabel}
              <div className="hidden items-center gap-2 text-[11px] text-red-300/80 sm:flex">
                <Bot size={13} />
                <span className="uppercase tracking-wide">Enemy</span>
                <span className="flex items-center gap-1 text-neutral-500">
                  <Layers size={11} />
                  {aiHandCount}
                </span>
                <CapturePips count={aiCapturedLocations} total={locationsToWin} color="red" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {PHASES.map((p) => (
                <span
                  key={p}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    p === phase ? "bg-amber-700 text-amber-50" : "bg-neutral-900/80 text-neutral-500"
                  }`}
                >
                  {PHASE_LABEL[p]}
                </span>
              ))}
              <span className="ml-1 whitespace-nowrap text-[11px] text-neutral-400">T{turnNumber}</span>
              <span
                className={`whitespace-nowrap text-[11px] ${
                  activePlayer === "player" ? "text-sky-300" : "text-red-300"
                }`}
              >
                {activePlayer === "player" ? "Your turn" : "AI…"}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
              {statusBadge}
              <div className="hidden items-center gap-2 sm:flex">
                <CapturePips count={capturedLocations} total={locationsToWin} color="sky" />
                <CpGauge cp={cp} cap={cpCap} />
              </div>
            </div>
          </div>

          {/* Latest action ticker — lives here, well clear of the hand, so it
              never overlaps a hovered/enlarged hand card below. */}
          {log.slice(-1)[0] ? (
            <p className="shrink-0 truncate border-b border-amber-950/40 px-4 py-1 text-center text-[10px] text-neutral-600 sm:px-6">
              <span className="text-neutral-700">[{log.slice(-1)[0]!.type}]</span>{" "}
              {log.slice(-1)[0]!.message}
            </p>
          ) : null}

          {/* Battlefield — fixed 5-slot rows so proportions hold regardless of
              how many units are actually deployed. */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-x-auto px-3 py-2 sm:gap-3 sm:py-4">
            <SlotRow
              label="Enemy"
              labelClass="text-red-300/70"
              units={lane.aiUnits}
              side="ai"
              laneIndex={laneIndex}
              legalActions={legalActions}
              draggingHandIndex={draggingHandIndex}
              selectedAttackerId={selectedAttackerId}
              inCampaign={inCampaign}
              onInspect={onInspect}
              onSelectAttacker={onSelectAttacker}
              onAttack={onAttack}
              onHandDrop={handleHandDrop}
              onDragOverZone={setDragOverZone}
              dragOverZone={dragOverZone}
            />

            {/* Center seam — the location card, influence track, and phase
                actions sit as a panel interrupting a glowing divider line,
                echoing a physical mat's centerline. */}
            <div className="relative flex w-full items-center justify-center py-1">
              <div className="battle-lane-divider absolute inset-x-6 top-1/2 -z-10 -translate-y-1/2 sm:inset-x-12" />
              <div
                onDragOver={(event) => {
                  if (!locationAcceptsHandDrop) return;
                  allowDrop(event);
                  setDragOverZone("location");
                }}
                onDragLeave={() => {
                  if (dragOverZone === "location") setDragOverZone(null);
                }}
                onDrop={(event) => handleHandDrop(event)}
                className={`flex flex-wrap items-center justify-center gap-3 rounded-2xl border bg-[#0c0a08]/95 px-3 py-2 shadow-xl sm:gap-4 sm:px-5 sm:py-3 ${
                  locationAcceptsHandDrop && dragOverZone === "location"
                    ? "border-amber-400 ring-2 ring-amber-400/60"
                    : "border-amber-900/40"
                }`}
              >
                {lane.location ? (
                  <BattleCard
                    card={cardSnapshotToFace(lane.location)}
                    size="board"
                    showCost={false}
                    showCombat={false}
                    onClick={() => onInspect(cardSnapshotToFace(lane.location!))}
                    className="transition-transform hover:-translate-y-0.5"
                  />
                ) : (
                  <div className="battle-play-card flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-950/50 p-1 text-center">
                    <p className="text-[8px] text-neutral-500">No location</p>
                    {locationAcceptsHandDrop ? (
                      <p className="mt-1 text-[7px] text-amber-200/80">Drop location</p>
                    ) : null}
                  </div>
                )}

                <div className="flex flex-col items-center gap-2">
                  <InfluenceTrack
                    player={lane.playerInfluence}
                    ai={lane.aiInfluence}
                    toCapture={influenceToCapture}
                  />
                  {locationAcceptsHandDrop ? (
                    <p className="text-center text-[8px] text-amber-200/80">
                      Drop to {lane.location ? "override" : "claim"} the lane
                    </p>
                  ) : null}
                  {canDeploy && lane.location && !laneAcceptsHandDrop ? (
                    <button
                      type="button"
                      onClick={() => onDeployLane(laneIndex)}
                      className="w-full rounded border border-dashed border-amber-600/50 bg-amber-950/20 px-2 py-0.5 text-[9px] text-amber-200 hover:bg-amber-950/40"
                    >
                      Deploy here
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {canPlaySelected ? (
                    <ActionButton onClick={() => onDeployLane(laneIndex)} variant="amber" outline>
                      Play selected
                    </ActionButton>
                  ) : null}
                  {isPlayerTurn ? (
                    <button
                      type="button"
                      onClick={onEndPhase}
                      disabled={actionPending}
                      className="rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-semibold text-neutral-900 shadow-lg transition-colors hover:bg-white disabled:opacity-50"
                    >
                      End phase
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              onDragOver={(event) => {
                if (activeDragIndex == null || !laneAcceptsHandDrop) return;
                allowDrop(event);
                setDragOverZone("player-lane");
              }}
              onDragLeave={() => {
                if (dragOverZone === "player-lane") setDragOverZone(null);
              }}
              onDrop={(event) => handleHandDrop(event)}
              className={`rounded-xl transition-colors ${
                dragOverZone === "player-lane" && laneAcceptsHandDrop
                  ? "bg-emerald-950/20 ring-1 ring-emerald-500/40"
                  : ""
              }`}
            >
              <SlotRow
                label="You"
                labelClass="text-sky-300/70"
                units={lane.playerUnits}
                side="player"
                laneIndex={laneIndex}
                legalActions={legalActions}
                draggingHandIndex={draggingHandIndex}
                selectedAttackerId={selectedAttackerId}
                inCampaign={inCampaign}
                onInspect={onInspect}
                onSelectAttacker={onSelectAttacker}
                onAttack={onAttack}
                onHandDrop={handleHandDrop}
                onDragOverZone={setDragOverZone}
                dragOverZone={dragOverZone}
                dropHintActive={laneAcceptsHandDrop}
              />
            </div>

            {inCampaign || draggingHandIndex != null ? (
              <p className="truncate text-center text-[10px] text-neutral-500">
                {draggingHandIndex != null && phase === "logistics"
                  ? "Release on the lane to play the card"
                  : null}
                {draggingHandIndex != null && phase === "logistics" && inCampaign ? " · " : null}
                {inCampaign ? "Tap your unit, then a highlighted enemy" : null}
              </p>
            ) : null}
          </div>

          {/* Hand + piles */}
          <div className="shrink-0 border-t border-amber-950/40 px-2 py-3 sm:px-3 sm:py-4">
            <div className="flex items-end justify-center gap-3 sm:gap-5">
              <PileButton
                icon={<Layers size={14} />}
                label="Deck"
                count={playerDeck.length}
                onClick={() => setPileView("deck")}
              />

              <HandFan
                hand={playerHand}
                cp={cp}
                phase={phase}
                isPlayerTurn={isPlayerTurn}
                legalActions={legalActions}
                selectedIndex={selectedHandIndex}
                draggingIndex={draggingHandIndex}
                onSelect={onSelectHand}
                onInspect={onInspect}
                onDragStart={(index) => setDraggingHandIndex(index)}
                onDragEnd={clearDragState}
              />

              <PileButton
                icon={<Trash2 size={14} />}
                label="Discard"
                count={playerDiscard.length}
                onClick={() => setPileView("discard")}
                muted
              />
            </div>
          </div>
        </div>
      </div>

      {pileView === "deck" ? (
        <BattlePileModal
          title={`Your deck (${playerDeck.length})`}
          cards={playerDeck}
          topCardHint
          onInspect={onInspect}
          onClose={() => setPileView(null)}
        />
      ) : null}
      {pileView === "discard" ? (
        <BattlePileModal
          title={`Your discard (${playerDiscard.length})`}
          cards={[...playerDiscard].reverse()}
          onInspect={onInspect}
          onClose={() => setPileView(null)}
        />
      ) : null}
    </>
  );
}

/** The active location's art, faded/desaturated/blurred behind the whole
 * mat — flavor, not a UI element, so it must never compete with the actual
 * cards and text sitting on top of it for attention. */
function LocationBackdrop({ location }: { location: CardSnapshot }) {
  const imageFrame =
    location.imageFocusX == null && location.imageFocusY == null && location.imageScale == null
      ? undefined
      : clampImageFrame({
          focusX: location.imageFocusX,
          focusY: location.imageFocusY,
          scale: location.imageScale,
        });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Scaled up slightly so the blur's soft edge falls outside the
          visible box instead of leaving a faint halo along the border. */}
      <div className="absolute inset-0 scale-110 opacity-[0.14] grayscale-[0.4] blur-[3px]">
        <CharacterArt
          seed={location.seed}
          imageUrl={location.imageUrl}
          imageFrame={imageFrame}
          era={{ colorPrimary: location.eraColorPrimary, colorSecondary: location.eraColorSecondary }}
          rarity={location.rarity}
          archetype={location.archetype as Archetype | null}
          className="h-full w-full rounded-none"
        />
      </div>
      {/* Dark scrim — keeps foreground contrast constant regardless of how
          bright or busy the location art itself happens to be. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a08] via-[#0c0a08]/75 to-[#0c0a08]" />
    </div>
  );
}

function CapturePips({
  count,
  total,
  color,
}: {
  count: number;
  total: number;
  color: "sky" | "red";
}) {
  const active = color === "sky" ? "border-sky-400 bg-sky-400" : "border-red-400 bg-red-400";
  return (
    <span className="flex items-center gap-0.5" title={`${count}/${total} locations captured`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full border sm:h-2.5 sm:w-2.5 ${
            i < count ? active : "border-neutral-700 bg-neutral-900"
          }`}
        />
      ))}
    </span>
  );
}

function CpGauge({ cp, cap }: { cp: number; cap: number }) {
  const pct = cap > 0 ? Math.min(100, Math.round((cp / cap) * 100)) : 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-2 w-16 overflow-hidden rounded-full bg-neutral-900 ring-1 ring-amber-900/40 sm:w-20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="whitespace-nowrap font-mono text-[11px] text-amber-300">{cp} CP</span>
    </div>
  );
}

function InfluenceTrack({ player, ai, toCapture }: { player: number; ai: number; toCapture: number }) {
  return (
    <div className="flex flex-col gap-1 text-[8px] sm:text-[9px]">
      <div className="flex items-center justify-between gap-1">
        <span className="text-sky-300">You</span>
        <div className="flex gap-0.5">
          {Array.from({ length: toCapture }, (_, i) => (
            <span
              key={`p-${i}`}
              className={`h-1.5 w-1.5 rounded-full border sm:h-2 sm:w-2 ${
                i < player ? "border-sky-400 bg-sky-400" : "border-neutral-700 bg-neutral-900"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-red-300">AI</span>
        <div className="flex gap-0.5">
          {Array.from({ length: toCapture }, (_, i) => (
            <span
              key={`a-${i}`}
              className={`h-1.5 w-1.5 rounded-full border sm:h-2 sm:w-2 ${
                i < ai ? "border-red-400 bg-red-400" : "border-neutral-700 bg-neutral-900"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SlotRow({
  label,
  labelClass,
  units,
  side,
  laneIndex,
  legalActions,
  draggingHandIndex,
  selectedAttackerId,
  inCampaign,
  onInspect,
  onSelectAttacker,
  onAttack,
  onHandDrop,
  onDragOverZone,
  dragOverZone,
  dropHintActive = false,
}: {
  label: string;
  labelClass: string;
  units: BoardUnit[];
  side: "player" | "ai";
  laneIndex: number;
  legalActions: BattleAction[];
  draggingHandIndex: number | null;
  selectedAttackerId: string | null;
  inCampaign: boolean;
  onInspect: (card: BattleCardFace) => void;
  onSelectAttacker: (id: string | null) => void;
  onAttack: (laneIndex: number, attackerId: string, defenderId: string) => void;
  onHandDrop: (event: DragEvent, targetInstanceId?: string) => void;
  onDragOverZone: (zone: string | null) => void;
  dragOverZone: string | null;
  dropHintActive?: boolean;
}) {
  function renderUnit(unit: BoardUnit) {
    const face = boardUnitToFace(unit);
    const legalAttacks =
      side === "player" ? attackActionsFor(legalActions, laneIndex, unit.instanceId) : [];
    const canAttack =
      side === "player" && inCampaign && !unit.summoningSickness && unit.currentDefense > 0;
    const isSelected = selectedAttackerId === unit.instanceId;
    const isTarget =
      side === "ai" &&
      inCampaign &&
      selectedAttackerId != null &&
      legalActions.some(
        (action) =>
          action.type === "attack" &&
          action.laneIndex === laneIndex &&
          action.defenderInstanceId === unit.instanceId &&
          action.attackerInstanceId === selectedAttackerId,
      );
    const isEventTarget =
      side === "ai" &&
      draggingHandIndex != null &&
      handCardCanDropOnTarget(legalActions, draggingHandIndex, laneIndex, unit.instanceId);
    const targetZoneId = `enemy-${unit.instanceId}`;

    let state: import("@/components/battle/battle-card").BattleCardState = "default";
    if (isSelected) state = "attacker";
    else if (isTarget || isEventTarget) state = "target";
    else if (canAttack && legalAttacks.length > 0) state = "playable";

    return (
      <div
        key={unit.instanceId}
        onDragOver={(event) => {
          if (!isEventTarget) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          onDragOverZone(targetZoneId);
        }}
        onDragLeave={() => {
          if (dragOverZone === targetZoneId) onDragOverZone(null);
        }}
        onDrop={(event) => {
          if (!isEventTarget) return;
          onHandDrop(event, unit.instanceId);
        }}
        className={`shrink-0 ${
          isEventTarget && dragOverZone === targetZoneId ? "rounded-lg ring-2 ring-red-400/70" : ""
        }`}
      >
        <BattleCard
          card={face}
          size="board"
          state={state}
          resting={side === "player" && unit.summoningSickness}
          showCost={false}
          onClick={() => {
            if (isTarget && selectedAttackerId) {
              onAttack(laneIndex, selectedAttackerId, unit.instanceId);
              return;
            }
            if (canAttack && legalAttacks.length > 0) {
              onSelectAttacker(isSelected ? null : unit.instanceId);
              return;
            }
            onInspect(face);
          }}
        />
      </div>
    );
  }

  const tint = side === "ai" ? "border-red-900/25 bg-red-950/5" : "border-sky-900/25 bg-sky-950/5";
  const emptySlots = Math.max(LANE_SLOT_COUNT - units.length, 0);

  return (
    <div className="flex flex-col items-center">
      <p className={`mb-1 text-[9px] uppercase tracking-[0.2em] sm:text-[10px] ${labelClass}`}>{label}</p>
      <div className={`flex items-start justify-center gap-2 rounded-xl border p-2 sm:gap-3 sm:p-3 ${tint}`}>
        {units.map(renderUnit)}
        {Array.from({ length: emptySlots }, (_, i) => (
          <div
            key={`empty-${i}`}
            className={`battle-slot-empty flex items-center justify-center rounded-lg border border-dashed ${
              dropHintActive
                ? "border-emerald-500/50 bg-emerald-950/10"
                : "border-neutral-800/60 bg-black/10"
            }`}
          >
            {dropHintActive && i === 0 ? <Plus size={16} className="text-emerald-400/70" /> : null}
          </div>
        ))}
      </div>
      {dropHintActive ? (
        <p className="mt-1 text-[9px] text-emerald-300/80">Drop here to deploy</p>
      ) : null}
    </div>
  );
}

function PileButton({
  icon,
  label,
  count,
  onClick,
  muted = false,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors hover:bg-neutral-900/60 ${
        muted ? "border-neutral-800 text-neutral-500" : "border-amber-900/40 text-amber-200/90"
      }`}
      title={`View ${label.toLowerCase()}`}
    >
      <div className="relative">
        <BattleCardBack size="md" count={count} />
      </div>
      <span className="flex items-center gap-0.5 text-[8px] uppercase tracking-wide">
        {icon}
        {label}
      </span>
    </button>
  );
}

/** Rotation/rise per card, relative to the hand's center card, for the fanned-hand arc. */
const FAN_ROTATE_STEP = 5;
const FAN_RISE_STEP = 7;
/** Size (rem) of the portal-rendered hover preview — fixed, not tied to the
 * mat's vh-driven card size, since it isn't laid out inside the mat at all. */
const HOVER_PREVIEW_WIDTH_REM = 15;
const HOVER_PREVIEW_SCALE = 1.55;
const HOVER_PREVIEW_HEIGHT_PX = HOVER_PREVIEW_WIDTH_REM * 16 * 1.4 * HOVER_PREVIEW_SCALE;
const HOVER_PREVIEW_WIDTH_PX = HOVER_PREVIEW_WIDTH_REM * 16 * HOVER_PREVIEW_SCALE;
const HOVER_PREVIEW_MARGIN_PX = 16;

/**
 * A bigger, fully un-clipped copy of the hovered hand card, rendered via a
 * portal straight onto document.body. This is deliberate, not a shortcut:
 * the hand row needs overflow-x-auto to scroll wide hands, and per the CSS
 * overflow spec that forces overflow-y to also compute to 'auto' — there is
 * no way to keep one axis scrollable and the other genuinely 'visible' on
 * the same element. Padding-based headroom on that element can approximate
 * enough room for *some* hover states, but it's a guess that breaks for
 * others (as seen: still clipped for some cards/hand sizes). Rendering the
 * preview outside that element entirely sidesteps the limitation instead of
 * fighting it.
 */
function HandHoverPreview({ face, anchorRect }: { face: BattleCardFace; anchorRect: DOMRect }) {
  if (typeof document === "undefined") return null;

  // Grow upward from the card's own top edge — the hand sits at the bottom
  // of the mat, so there's headroom above but not necessarily below.
  // Clamped so the preview can never render partly off any edge of the
  // window, regardless of where in the fan the hovered card sits.
  const centerX = anchorRect.left + anchorRect.width / 2;
  const halfWidth = HOVER_PREVIEW_WIDTH_PX / 2;
  const left = Math.min(
    Math.max(centerX, halfWidth + HOVER_PREVIEW_MARGIN_PX),
    window.innerWidth - halfWidth - HOVER_PREVIEW_MARGIN_PX,
  );
  const bottom = Math.max(anchorRect.top, HOVER_PREVIEW_HEIGHT_PX + HOVER_PREVIEW_MARGIN_PX);

  return createPortal(
    <div
      className="pointer-events-none fixed z-[200] drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
      style={{
        left,
        top: bottom,
        transform: `translate(-50%, -100%) scale(${HOVER_PREVIEW_SCALE})`,
        // Scale from the bottom edge (the anchored point), not the default
        // center — otherwise scaling up would push the bottom edge past the
        // position we just clamped into place.
        transformOrigin: "bottom center",
        ["--battle-card-width" as string]: `${HOVER_PREVIEW_WIDTH_REM}rem`,
      }}
    >
      <BattleCard card={face} size="board" state="default" />
    </div>,
    document.body,
  );
}

function HandFan({
  hand,
  cp,
  phase,
  isPlayerTurn,
  legalActions,
  selectedIndex,
  draggingIndex,
  onSelect,
  onInspect,
  onDragStart,
  onDragEnd,
}: {
  hand: CardSnapshot[];
  cp: number;
  phase: Phase;
  isPlayerTurn: boolean;
  legalActions: BattleAction[];
  selectedIndex: number | null;
  draggingIndex: number | null;
  onSelect: (index: number | null) => void;
  onInspect: (card: BattleCardFace) => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  function handleEnter(index: number) {
    setHoveredIndex(index);
    const el = cardRefs.current[index];
    setHoveredRect(el ? el.getBoundingClientRect() : null);
  }

  function handleLeave() {
    setHoveredIndex(null);
    setHoveredRect(null);
  }

  if (hand.length === 0) {
    return (
      <div className="battle-hand-row flex items-center justify-center">
        <p className="text-[10px] text-neutral-600">Empty hand</p>
      </div>
    );
  }

  const mid = (hand.length - 1) / 2;
  const hovered = hoveredIndex != null && draggingIndex == null ? hoveredIndex : null;

  return (
    // Generous side padding buffers the rotated edge cards' visual bounding
    // box (rotate() swings it wider than the card's own layout box) — without
    // it, the outermost cards get clipped by the scroll container, which
    // can't scroll into the negative space a rotated card swings into.
    <div
      className="battle-hand-row flex items-end justify-center overflow-x-auto px-10 sm:px-16"
      onMouseLeave={handleLeave}
    >
      {hand.map((card, index) => {
        const face = cardSnapshotToFace(card);
        const draggable = isPlayerTurn && phase === "logistics" && handIndexIsDraggable(legalActions, index);
        const affordable = card.cost <= cp;
        const playable = draggable && affordable;
        const selected = selectedIndex === index;
        const dragging = draggingIndex === index;
        const isHovered = hovered === index;
        const offset = index - mid;
        const rotate = offset * FAN_ROTATE_STEP;
        const rise = Math.abs(offset) * FAN_RISE_STEP;

        return (
          <div
            key={`${card.characterId}-${index}`}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            draggable={playable}
            onDragStart={(event) => {
              event.dataTransfer.setData(HAND_CARD_DRAG_MIME, String(index));
              event.dataTransfer.effectAllowed = "move";
              onDragStart(index);
              onSelect(index);
            }}
            onDragEnd={onDragEnd}
            onMouseEnter={() => handleEnter(index)}
            className={`-mx-3 shrink-0 transition-transform ${
              playable ? "cursor-grab active:cursor-grabbing" : ""
            } ${dragging ? "opacity-60" : ""}`}
            style={{
              // The first card can't have a negative left margin — that would
              // pull it before the scroll container's origin, which can't be
              // scrolled to (permanently clipping its left edge).
              marginLeft: index === 0 ? 0 : undefined,
              // Inline style.transform always beats a class-based :hover
              // transform (specificity), so the small in-place lift has to
              // be computed here rather than as a Tailwind hover: utility.
              transform: `rotate(${rotate}deg) translateY(${
                isHovered ? rise - 8 : selected ? rise - 14 : rise
              }px)`,
              transformOrigin: "bottom center",
              zIndex: selected || dragging ? 30 : index,
            }}
          >
            <BattleCard
              card={face}
              size="board"
              state={selected ? "selected" : playable ? "playable" : "default"}
              className={isHovered ? "ring-2 ring-amber-400/70" : ""}
              onClick={() => {
                if (playable) onSelect(selected ? null : index);
                else onInspect(face);
              }}
              onInspect={() => onInspect(face)}
            />
          </div>
        );
      })}

      {hovered != null && hoveredRect ? (
        <HandHoverPreview face={cardSnapshotToFace(hand[hovered])} anchorRect={hoveredRect} />
      ) : null}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled = false,
  variant = "neutral",
  outline = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "neutral" | "amber";
  outline?: boolean;
}) {
  const classes =
    variant === "amber"
      ? outline
        ? "border border-amber-700/60 bg-amber-950/30 text-amber-200 hover:bg-amber-900/40"
        : "border border-amber-600/60 bg-amber-900/50 text-amber-100 hover:bg-amber-800/50"
      : "bg-neutral-100 text-neutral-900 hover:bg-white";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[11px] font-medium disabled:opacity-50 ${classes}`}
    >
      {children}
    </button>
  );
}
