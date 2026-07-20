"use client";

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Bot, Layers, MapPin, Plus, Trash2 } from "lucide-react";
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
import { PixelSprite } from "@/components/pixel-sprite";
import { clampImageFrame, imageFrameStyle } from "@/lib/image-frame";
import type { Archetype } from "@/lib/sprite/generateSprite";
import type { BattleAction, BoardUnit, CardSnapshot, Lane, MatchState, Phase } from "@/lib/battle/types";
import { hasUnificationAbility } from "@/lib/battle/abilities";

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
  influenceToCapture: number;
  locationDeckCount: number;
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
  selectedMonarchId: string | null;
  onSelectHand: (index: number | null) => void;
  onSelectAttacker: (instanceId: string | null) => void;
  onSelectMonarch: (instanceId: string | null) => void;
  onDeployLane: (laneIndex: number) => void;
  onPlayHandCard: (handIndex: number, laneIndex: number, targetInstanceId?: string) => void;
  onAttack: (laneIndex: number, attackerInstanceId: string, defenderInstanceId: string) => void;
  onEstablishInfluence: (laneIndex: number, unitInstanceId: string) => void;
  onUnification: (laneIndex: number, monarchInstanceId: string, targetInstanceId: string) => void;
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

function canEstablishInfluence(
  legalActions: BattleAction[],
  laneIndex: number,
  unitInstanceId: string,
) {
  return legalActions.some(
    (action) =>
      action.type === "establish_influence" &&
      action.laneIndex === laneIndex &&
      action.unitInstanceId === unitInstanceId,
  );
}

function canUnifyTarget(
  legalActions: BattleAction[],
  laneIndex: number,
  monarchInstanceId: string,
  targetInstanceId: string,
) {
  return legalActions.some(
    (action) =>
      action.type === "unification" &&
      action.laneIndex === laneIndex &&
      action.monarchInstanceId === monarchInstanceId &&
      action.targetInstanceId === targetInstanceId,
  );
}

function canSelectAsMonarch(
  legalActions: BattleAction[],
  laneIndex: number,
  monarchInstanceId: string,
) {
  return legalActions.some(
    (action) =>
      action.type === "unification" &&
      action.laneIndex === laneIndex &&
      action.monarchInstanceId === monarchInstanceId,
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
  influenceToCapture,
  locationDeckCount,
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
  selectedMonarchId,
  onSelectHand,
  onSelectAttacker,
  onSelectMonarch,
  onDeployLane,
  onPlayHandCard,
  onAttack,
  onEstablishInfluence,
  onUnification,
  onInspect,
  onEndPhase,
  canPlaySelected,
  actionPending,
}: Props) {
  const [pileView, setPileView] = useState<"deck" | "discard" | null>(null);
  const [draggingHandIndex, setDraggingHandIndex] = useState<number | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [locationHoverRect, setLocationHoverRect] = useState<DOMRect | null>(null);
  const locationCardRef = useRef<HTMLDivElement>(null);
  const fieldHoverEnabled = draggingHandIndex == null;
  const lane = lanes[0];

  useEffect(() => {
    if (!fieldHoverEnabled) setLocationHoverRect(null);
  }, [fieldHoverEnabled]);

  const laneIndex = 0;
  const activeDragIndex = draggingHandIndex ?? selectedHandIndex;
  const canDeploy =
    isPlayerTurn &&
    phase === "logistics" &&
    activeDragIndex != null &&
    handIndexIsDraggable(legalActions, activeDragIndex);
  const laneAcceptsHandDrop =
    activeDragIndex != null && handCardCanDropOnLane(legalActions, activeDragIndex, laneIndex);
  const inCampaign = isPlayerTurn && phase === "campaign";
  const inLogistics = isPlayerTurn && phase === "logistics";

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
      <div className="battle-mat-fullbleed battle-mat relative flex h-[calc(100vh-var(--app-chrome-offset))] flex-col overflow-y-auto">
        {lane.location ? <LocationBackdrop location={lane.location} /> : null}
        <div className="battle-mat-texture pointer-events-none absolute inset-0 z-[1]" />

        <div className="relative z-[2] flex min-h-0 flex-1 flex-col">
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
                    p === phase ? "bg-accent text-accent-foreground" : "bg-neutral-900/80 text-neutral-500"
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
          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-x-auto px-3 py-2 sm:gap-3 sm:py-4">
            {/* Shared location deck — both players' Location cards, pooled
                and shuffled once at setup, auto-feeding the lane as each
                current one is captured. Parked on the left, vertically
                centered on the battlefield, out of the way of play. */}
            <div className="absolute left-2 top-1/2 z-[1] -translate-y-1/2 sm:left-4">
              <LocationDeckPile count={locationDeckCount} />
            </div>

            <SlotRow
              label="Enemy"
              labelClass="text-red-300/70"
              units={lane.aiUnits}
              side="ai"
              laneIndex={laneIndex}
              legalActions={legalActions}
              draggingHandIndex={draggingHandIndex}
              selectedAttackerId={selectedAttackerId}
              selectedMonarchId={selectedMonarchId}
              inCampaign={inCampaign}
              inLogistics={inLogistics}
              onInspect={onInspect}
              onSelectAttacker={onSelectAttacker}
              onSelectMonarch={onSelectMonarch}
              onAttack={onAttack}
              onEstablishInfluence={onEstablishInfluence}
              onUnification={onUnification}
              onHandDrop={handleHandDrop}
              onDragOverZone={setDragOverZone}
              dragOverZone={dragOverZone}
            />

            {/* Center seam — the location card, influence track, and phase
                actions sit as a panel interrupting a glowing divider line,
                echoing a physical mat's centerline. */}
            <div className="relative flex w-full items-center justify-center py-1">
              <div className="battle-lane-divider absolute inset-x-6 top-1/2 -z-10 -translate-y-1/2 sm:inset-x-12" />
              <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-accent/35 bg-[#0c0a08]/95 px-3 py-2 shadow-xl sm:gap-4 sm:px-5 sm:py-3">
                {lane.location ? (
                  <div
                    ref={locationCardRef}
                    onMouseEnter={() => {
                      if (!fieldHoverEnabled) return;
                      setLocationHoverRect(locationCardRef.current?.getBoundingClientRect() ?? null);
                    }}
                    onMouseLeave={() => setLocationHoverRect(null)}
                  >
                    <BattleCard
                      card={cardSnapshotToFace(lane.location)}
                      size="board"
                      showCost={false}
                      showCombat={false}
                      onClick={() => onInspect(cardSnapshotToFace(lane.location!))}
                      className={locationHoverRect ? "ring-2 ring-amber-400/70" : ""}
                    />
                  </div>
                ) : (
                  <div className="battle-play-card flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-950/50 p-1 text-center">
                    <p className="text-[8px] text-neutral-500">Location deck empty</p>
                  </div>
                )}

                <div className="flex flex-col items-center gap-2">
                  <InfluenceTrack
                    player={lane.playerInfluence}
                    ai={lane.aiInfluence}
                    toCapture={influenceToCapture}
                  />
                  {canDeploy && lane.location && !laneAcceptsHandDrop ? (
                    <button
                      type="button"
                      onClick={() => onDeployLane(laneIndex)}
                      className="w-full rounded border border-dashed border-accent/40 bg-accent/10 px-2 py-0.5 text-[9px] text-gold-bright hover:bg-accent/10"
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
                selectedMonarchId={selectedMonarchId}
                inCampaign={inCampaign}
                inLogistics={inLogistics}
                onInspect={onInspect}
                onSelectAttacker={onSelectAttacker}
                onSelectMonarch={onSelectMonarch}
                onAttack={onAttack}
                onEstablishInfluence={onEstablishInfluence}
                onUnification={onUnification}
                onHandDrop={handleHandDrop}
                onDragOverZone={setDragOverZone}
                dragOverZone={dragOverZone}
                dropHintActive={laneAcceptsHandDrop}
              />
            </div>

            {inCampaign || inLogistics || draggingHandIndex != null ? (
              <p className="truncate text-center text-[10px] text-neutral-500">
                {draggingHandIndex != null && phase === "logistics"
                  ? "Release on the lane to play the card"
                  : null}
                {draggingHandIndex != null && phase === "logistics" && (inCampaign || inLogistics)
                  ? " · "
                  : null}
                {inLogistics && selectedMonarchId
                  ? "Tap a friendly unit to unify"
                  : inLogistics
                    ? "Tap a ready unit to establish Influence, or a Monarch to unify"
                    : null}
                {inLogistics && inCampaign ? " · " : null}
                {inCampaign ? "Tap your unit, then a highlighted enemy" : null}
              </p>
            ) : null}

            {fieldHoverEnabled && locationHoverRect && lane.location ? (
              <CardHoverPreview
                face={cardSnapshotToFace(lane.location)}
                anchorRect={locationHoverRect}
                placement="below"
              />
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
  const frameStyle = imageFrame ? imageFrameStyle(imageFrame) : undefined;
  const era = {
    colorPrimary: location.eraColorPrimary,
    colorSecondary: location.eraColorSecondary,
  };

  return (
    <div
      key={location.characterId}
      className="battle-location-backdrop pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="battle-location-backdrop-art absolute inset-0">
        {location.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={location.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            style={frameStyle}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center overflow-hidden">
            <div className="scale-[3.5] sm:scale-[4]">
              <PixelSprite
                seed={location.seed}
                era={era}
                rarity={location.rarity}
                archetype={location.archetype as Archetype | null}
                size={320}
              />
            </div>
          </div>
        )}
      </div>

      <div
        className="absolute inset-0 opacity-40 mix-blend-multiply"
        style={{
          background: `linear-gradient(145deg, ${era.colorPrimary}bb 0%, ${era.colorSecondary}88 55%, #0c0a08 100%)`,
        }}
      />

      <div className="battle-location-backdrop-scrim absolute inset-0" />
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
      <span className="whitespace-nowrap font-mono text-[11px] text-gold-bright">{cp} CP</span>
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
  selectedMonarchId,
  inCampaign,
  inLogistics,
  onInspect,
  onSelectAttacker,
  onSelectMonarch,
  onAttack,
  onEstablishInfluence,
  onUnification,
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
  selectedMonarchId: string | null;
  inCampaign: boolean;
  inLogistics: boolean;
  onInspect: (card: BattleCardFace) => void;
  onSelectAttacker: (id: string | null) => void;
  onSelectMonarch: (id: string | null) => void;
  onAttack: (laneIndex: number, attackerId: string, defenderId: string) => void;
  onEstablishInfluence: (laneIndex: number, unitInstanceId: string) => void;
  onUnification: (laneIndex: number, monarchInstanceId: string, targetInstanceId: string) => void;
  onHandDrop: (event: DragEvent, targetInstanceId?: string) => void;
  onDragOverZone: (zone: string | null) => void;
  dragOverZone: string | null;
  dropHintActive?: boolean;
}) {
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const unitRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const fieldHoverEnabled = draggingHandIndex == null;
  const hoverPlacement = side === "ai" ? "below" : "above";

  useEffect(() => {
    if (!fieldHoverEnabled) clearUnitHover();
  }, [fieldHoverEnabled]);

  function clearUnitHover() {
    setHoveredUnitId(null);
    setHoveredRect(null);
  }

  function handleUnitEnter(instanceId: string) {
    if (!fieldHoverEnabled) return;
    setHoveredUnitId(instanceId);
    setHoveredRect(unitRefs.current.get(instanceId)?.getBoundingClientRect() ?? null);
  }

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

    const canEstablish =
      side === "player" &&
      inLogistics &&
      canEstablishInfluence(legalActions, laneIndex, unit.instanceId);
    const isMonarchSelected = selectedMonarchId === unit.instanceId;
    const canBeMonarch =
      side === "player" &&
      inLogistics &&
      hasUnificationAbility({ abilityName: unit.abilityName } as CardSnapshot) &&
      canSelectAsMonarch(legalActions, laneIndex, unit.instanceId);
    const isUnifyTarget =
      side === "player" &&
      inLogistics &&
      selectedMonarchId != null &&
      canUnifyTarget(legalActions, laneIndex, selectedMonarchId, unit.instanceId);
    const isCommitted = side === "player" && unit.isCommitted;

    let state: import("@/components/battle/battle-card").BattleCardState = "default";
    if (isSelected) state = "attacker";
    else if (isMonarchSelected) state = "selected";
    else if (isTarget || isEventTarget || isUnifyTarget) state = "target";
    else if ((canAttack && legalAttacks.length > 0) || canEstablish || canBeMonarch) state = "playable";

    const isHovered = fieldHoverEnabled && hoveredUnitId === unit.instanceId;

    return (
      <div
        key={unit.instanceId}
        ref={(el) => {
          if (el) unitRefs.current.set(unit.instanceId, el);
          else unitRefs.current.delete(unit.instanceId);
        }}
        onMouseEnter={() => handleUnitEnter(unit.instanceId)}
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
        className={`shrink-0 ${side === "ai" ? "[transform:rotate(180deg)]" : ""} ${
          isEventTarget && dragOverZone === targetZoneId ? "rounded-lg ring-2 ring-red-400/70" : ""
        }`}
      >
        <BattleCard
          card={face}
          size="board"
          state={state}
          resting={side === "player" && (unit.summoningSickness || isCommitted)}
          showCost={false}
          className={isHovered ? "ring-2 ring-amber-400/70" : ""}
          onClick={() => {
            if (isTarget && selectedAttackerId) {
              onAttack(laneIndex, selectedAttackerId, unit.instanceId);
              return;
            }
            if (isUnifyTarget && selectedMonarchId) {
              onUnification(laneIndex, selectedMonarchId, unit.instanceId);
              return;
            }
            if (canAttack && legalAttacks.length > 0) {
              onSelectAttacker(isSelected ? null : unit.instanceId);
              onSelectMonarch(null);
              return;
            }
            if (canBeMonarch) {
              onSelectMonarch(isMonarchSelected ? null : unit.instanceId);
              onSelectAttacker(null);
              return;
            }
            if (canEstablish) {
              onEstablishInfluence(laneIndex, unit.instanceId);
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
      <div
        className={`flex items-start justify-center gap-2 rounded-xl border p-2 sm:gap-3 sm:p-3 ${tint}`}
        onMouseLeave={fieldHoverEnabled ? clearUnitHover : undefined}
      >
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

      {fieldHoverEnabled && hoveredUnitId && hoveredRect ? (
        <CardHoverPreview
          face={boardUnitToFace(units.find((unit) => unit.instanceId === hoveredUnitId)!)}
          anchorRect={hoveredRect}
          placement={hoverPlacement}
        />
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
        muted ? "border-neutral-800 text-neutral-500" : "border-accent/35 text-gold-bright/90"
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

/** The shared, shuffled Location deck both players' Location cards were
 * pooled into at setup. Purely a display of what's left to come — not
 * clickable/inspectable, since a shuffled deck's remaining order isn't
 * something either player should be able to page through. */
function LocationDeckPile({ count }: { count: number }) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-lg border border-emerald-800/40 px-2 py-1.5 text-emerald-200/80"
      title={`${count} Location${count === 1 ? "" : "s"} left in the location deck`}
    >
      <BattleCardBack size="md" count={count} />
      <span className="flex items-center gap-0.5 text-[8px] uppercase tracking-wide">
        <MapPin size={11} />
        Locations
      </span>
    </div>
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
 * A bigger, fully un-clipped copy of the hovered card, rendered via a portal
 * straight onto document.body (see HandFan comment for why).
 */
function CardHoverPreview({
  face,
  anchorRect,
  placement,
}: {
  face: BattleCardFace;
  anchorRect: DOMRect;
  placement: "above" | "below";
}) {
  if (typeof document === "undefined") return null;

  const centerX = anchorRect.left + anchorRect.width / 2;
  const halfWidth = HOVER_PREVIEW_WIDTH_PX / 2;
  const left = Math.min(
    Math.max(centerX, halfWidth + HOVER_PREVIEW_MARGIN_PX),
    window.innerWidth - halfWidth - HOVER_PREVIEW_MARGIN_PX,
  );

  const style =
    placement === "above"
      ? {
          left,
          top: Math.max(anchorRect.top, HOVER_PREVIEW_HEIGHT_PX + HOVER_PREVIEW_MARGIN_PX),
          transform: `translate(-50%, -100%) scale(${HOVER_PREVIEW_SCALE})`,
          transformOrigin: "bottom center" as const,
        }
      : {
          left,
          top: Math.min(
            anchorRect.bottom + HOVER_PREVIEW_MARGIN_PX,
            window.innerHeight - HOVER_PREVIEW_HEIGHT_PX - HOVER_PREVIEW_MARGIN_PX,
          ),
          transform: `translate(-50%, 0) scale(${HOVER_PREVIEW_SCALE})`,
          transformOrigin: "top center" as const,
        };

  return createPortal(
    <div
      className="pointer-events-none fixed z-[200] drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
      style={{
        ...style,
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

  useEffect(() => {
    if (hoveredIndex != null && hoveredIndex >= hand.length) {
      setHoveredIndex(null);
      setHoveredRect(null);
    }
  }, [hand.length, hoveredIndex]);

  function handleEnter(index: number) {
    if (index < 0 || index >= hand.length || !hand[index]) return;
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
  const hovered =
    hoveredIndex != null && draggingIndex == null && hoveredIndex < hand.length && hand[hoveredIndex]
      ? hoveredIndex
      : null;
  const hoveredCard = hovered != null ? hand[hovered] : null;

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
        if (!card) return null;
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

      {hoveredCard && hoveredRect ? (
        <CardHoverPreview
          face={cardSnapshotToFace(hoveredCard)}
          anchorRect={hoveredRect}
          placement="above"
        />
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
        ? "border border-accent/50 bg-accent/10 text-gold-bright hover:bg-accent/15"
        : "border border-accent/60 bg-accent/15 text-foreground hover:bg-accent/20"
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
