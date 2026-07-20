"use client";

import { BattleCardInspect } from "@/components/battle/battle-card-inspect";
import type { BattleCardFace } from "@/components/battle/battle-card-face";
import { BattleMat } from "@/components/battle/battle-mat";
import { BattleChoiceModal } from "@/components/battle/battle-choice-modal";
import { BattleConfirmModal } from "@/components/battle/battle-confirm-modal";
import {
  AttackPreviewPanel,
  EstablishInfluencePreviewPanel,
} from "@/components/battle/battle-combat-preview";
import { resolveHandDropAction } from "@/components/battle/battle-drag";
import { locationReplacementNeedsConfirm } from "@/lib/battle/locations";
import { previewAttack, previewEstablishInfluence } from "@/lib/battle/preview";
import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import type { BattleAction, Phase } from "@/lib/battle/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

type ClientMatch = {
  id: number;
  status: string;
  phase: string;
  activePlayer: string;
  turnNumber: number;
  winner: string | null;
  state: import("@/lib/battle/types").MatchState;
  legalActions: BattleAction[];
  battleRules?: {
    influenceToCapture: number;
    locationsToWin: number;
    failedChronosDrawsToLose: number;
  };
};

type PendingConfirm =
  | {
      kind: "attack";
      action: Extract<BattleAction, { type: "attack" }>;
    }
  | {
      kind: "establish";
      action: Extract<BattleAction, { type: "establish_influence" }>;
    }
  | {
      kind: "location";
      action: Extract<BattleAction, { type: "play_location" }>;
    }
  | {
      kind: "unification";
      action: Extract<BattleAction, { type: "unification" }>;
    };

async function fetchMatch(id: string): Promise<ClientMatch> {
  const res = await fetch(`/api/matches/${id}`);
  if (!res.ok) throw new Error("Failed to load match");
  return res.json();
}

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [selectedMonarchId, setSelectedMonarchId] = useState<string | null>(null);
  const [inspectingCard, setInspectingCard] = useState<BattleCardFace | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: match, isLoading } = useQuery({
    queryKey: ["match", params.id],
    queryFn: () => fetchMatch(params.id),
    refetchInterval: false,
  });

  const actionMutation = useMutation({
    mutationFn: async (action: BattleAction) => {
      const res = await fetch(`/api/matches/${params.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Action failed");
      }
      return res.json() as Promise<ClientMatch>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["match", params.id], data);
      setSelectedHandIndex(null);
      setSelectedAttackerId(null);
      setSelectedMonarchId(null);
      setPendingConfirm(null);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading || !match) {
    return <p className="text-sm text-muted">Loading match…</p>;
  }

  const currentMatch = match;
  const state = currentMatch.state;
  const rules = currentMatch.battleRules ?? {
    influenceToCapture: DEFAULT_BATTLE_RULES.influenceToCapture,
    locationsToWin: DEFAULT_BATTLE_RULES.locationsToWin,
    failedChronosDrawsToLose: DEFAULT_BATTLE_RULES.failedChronosDrawsToLose,
  };
  const isPlayerTurn = currentMatch.activePlayer === "player" && currentMatch.status === "active";
  const lane = state.lanes[0];

  function submitAction(action: BattleAction) {
    actionMutation.mutate(action);
  }

  function playHandCard(handIndex: number, laneIndex: number, targetInstanceId?: string) {
    const action = resolveHandDropAction(currentMatch.legalActions, handIndex, laneIndex, targetInstanceId);
    if (!action) {
      setError("That card can't be played there.");
      return;
    }

    const card = state.player.hand[handIndex];
    if (
      action.type === "play_location" &&
      card?.cardType === "location" &&
      lane &&
      locationReplacementNeedsConfirm(lane)
    ) {
      setPendingConfirm({ kind: "location", action });
      return;
    }

    submitAction(action);
  }

  function requestAttack(laneIndex: number, attackerInstanceId: string, defenderInstanceId: string) {
    const action = {
      type: "attack" as const,
      laneIndex,
      attackerInstanceId,
      defenderInstanceId,
    };
    const preview = previewAttack(state, "player", laneIndex, attackerInstanceId, defenderInstanceId);
    if (!preview) {
      setError("Invalid attack.");
      return;
    }
    setPendingConfirm({ kind: "attack", action });
  }

  function requestEstablishInfluence(laneIndex: number, unitInstanceId: string) {
    const action = { type: "establish_influence" as const, laneIndex, unitInstanceId };
    if (!currentMatch.legalActions.some((a) => a.type === "establish_influence" && a.unitInstanceId === unitInstanceId)) {
      setError("Cannot establish Influence with this unit.");
      return;
    }
    setPendingConfirm({ kind: "establish", action });
  }

  function requestUnification(laneIndex: number, monarchInstanceId: string, targetInstanceId: string) {
    const action = {
      type: "unification" as const,
      laneIndex,
      monarchInstanceId,
      targetInstanceId,
    };
    setPendingConfirm({ kind: "unification", action });
  }

  function endPhase() {
    setSelectedAttackerId(null);
    setSelectedMonarchId(null);
    actionMutation.mutate({ type: "end_phase" });
  }

  const canPlaySelected =
    isPlayerTurn &&
    currentMatch.phase === "logistics" &&
    selectedHandIndex != null &&
    resolveHandDropAction(currentMatch.legalActions, selectedHandIndex, 0) != null;

  function resolveChoice(payload: { selectedIndex?: number; topIndices?: number[] }) {
    actionMutation.mutate({ type: "resolve_choice", ...payload });
  }

  const pendingChoice =
    isPlayerTurn && state.pendingChoice?.player === "player" ? state.pendingChoice : null;

  const exhaustionWarning =
    state.player.failedChronosDraws > 0
      ? `Historical Exhaustion: ${state.player.failedChronosDraws}/${rules.failedChronosDrawsToLose} failed draws`
      : null;

  const matchLabel = (
    <div className="flex min-w-0 items-center gap-2">
      <Link href="/play" className="shrink-0 text-xs text-muted hover:text-foreground/80">
        ← Play
      </Link>
      <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
        Match #{currentMatch.id}
      </h1>
    </div>
  );

  const statusBadge =
    currentMatch.status !== "active" ? (
      <div
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
          currentMatch.status === "won" ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"
        }`}
      >
        {currentMatch.status === "won" ? "Victory!" : "Defeat"}
      </div>
    ) : null;

  let confirmModal: React.ReactNode = null;
  if (pendingConfirm?.kind === "attack") {
    const preview = previewAttack(
      state,
      "player",
      pendingConfirm.action.laneIndex,
      pendingConfirm.action.attackerInstanceId,
      pendingConfirm.action.defenderInstanceId,
    );
    confirmModal = (
      <BattleConfirmModal
        title="Confirm attack"
        body={preview ? <AttackPreviewPanel preview={preview} /> : "Proceed with this attack?"}
        confirmLabel="Attack"
        onConfirm={() => submitAction(pendingConfirm.action)}
        onCancel={() => setPendingConfirm(null)}
        pending={actionMutation.isPending}
      />
    );
  } else if (pendingConfirm?.kind === "establish") {
    const preview = previewEstablishInfluence(
      state,
      "player",
      pendingConfirm.action.laneIndex,
      pendingConfirm.action.unitInstanceId,
      { ...DEFAULT_BATTLE_RULES, influenceToCapture: rules.influenceToCapture },
    );
    confirmModal = (
      <BattleConfirmModal
        title="Establish Influence"
        body={
          preview ? (
            <EstablishInfluencePreviewPanel preview={preview} />
          ) : (
            "Commit this unit to gain 1 Influence. It cannot attack this turn."
          )
        }
        confirmLabel="Commit unit"
        onConfirm={() => submitAction(pendingConfirm.action)}
        onCancel={() => setPendingConfirm(null)}
        pending={actionMutation.isPending}
      />
    );
  } else if (pendingConfirm?.kind === "location") {
    confirmModal = (
      <BattleConfirmModal
        title="Replace Location?"
        body="Replacing this Location will reset all Influence on the lane. Continue?"
        confirmLabel="Replace Location"
        onConfirm={() => submitAction(pendingConfirm.action)}
        onCancel={() => setPendingConfirm(null)}
        pending={actionMutation.isPending}
      />
    );
  } else if (pendingConfirm?.kind === "unification") {
    confirmModal = (
      <BattleConfirmModal
        title="Unification"
        body="Ready the chosen unit, clear commitment, and grant a temporary attack bonus until end of turn."
        confirmLabel="Unify"
        onConfirm={() => submitAction(pendingConfirm.action)}
        onCancel={() => setPendingConfirm(null)}
        pending={actionMutation.isPending}
      />
    );
  }

  return (
    <>
      {error ? (
        <div className="shrink-0 border-b border-red-900/60 bg-red-950/40 px-4 py-1.5 text-xs text-red-300 sm:px-6">
          {error}
        </div>
      ) : null}

      {exhaustionWarning ? (
        <div className="shrink-0 border-b border-amber-900/50 bg-amber-950/30 px-4 py-1.5 text-xs text-amber-200 sm:px-6">
          {exhaustionWarning}
        </div>
      ) : null}

      <div className="-my-6 mx-[calc(50%-50vw)] w-screen">
        <BattleMat
          matchLabel={matchLabel}
          statusBadge={statusBadge}
          lanes={state.lanes}
          phase={currentMatch.phase as Phase}
          turnNumber={currentMatch.turnNumber}
          cp={state.player.cp}
          cpCap={state.player.cpGrantedThisTurn}
          capturedLocations={state.player.capturedLocations}
          aiCapturedLocations={state.ai.capturedLocations}
          locationsToWin={rules.locationsToWin}
          influenceToCapture={rules.influenceToCapture}
          locationDeckCount={state.locationDeck.length}
          activePlayer={currentMatch.activePlayer}
          isPlayerTurn={isPlayerTurn}
          playerHand={state.player.hand}
          playerDeck={state.player.deck}
          playerDiscard={state.player.discard}
          aiHandCount={state.ai.hand.length}
          log={state.log}
          selectedHandIndex={selectedHandIndex}
          legalActions={currentMatch.legalActions}
          selectedAttackerId={selectedAttackerId}
          selectedMonarchId={selectedMonarchId}
          onSelectHand={setSelectedHandIndex}
          onSelectAttacker={setSelectedAttackerId}
          onSelectMonarch={setSelectedMonarchId}
          onDeployLane={() => {
            if (selectedHandIndex == null) return;
            playHandCard(selectedHandIndex, 0);
          }}
          onPlayHandCard={playHandCard}
          onAttack={requestAttack}
          onEstablishInfluence={requestEstablishInfluence}
          onUnification={requestUnification}
          onInspect={setInspectingCard}
          onEndPhase={endPhase}
          canPlaySelected={canPlaySelected}
          actionPending={actionMutation.isPending}
        />
      </div>

      {inspectingCard ? (
        <BattleCardInspect card={inspectingCard} onClose={() => setInspectingCard(null)} />
      ) : null}

      {pendingChoice ? (
        <BattleChoiceModal choice={pendingChoice} onConfirm={resolveChoice} />
      ) : null}

      {confirmModal}
    </>
  );
}
