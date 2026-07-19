"use client";

import { BattleCardInspect } from "@/components/battle/battle-card-inspect";
import type { BattleCardFace } from "@/components/battle/battle-card-face";
import { BattleMat } from "@/components/battle/battle-mat";
import { BattleChoiceModal } from "@/components/battle/battle-choice-modal";
import { resolveHandDropAction } from "@/components/battle/battle-drag";
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
  const [inspectingCard, setInspectingCard] = useState<BattleCardFace | null>(null);
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
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading || !match) {
    return <p className="text-sm text-neutral-500">Loading match…</p>;
  }

  const state = match.state;
  const isPlayerTurn = match.activePlayer === "player" && match.status === "active";

  function playHandCard(handIndex: number, laneIndex: number, targetInstanceId?: string) {
    const action = resolveHandDropAction(match.legalActions, handIndex, laneIndex, targetInstanceId);
    if (!action) {
      setError("That card can't be played there.");
      return;
    }
    actionMutation.mutate(action);
  }

  function attack(laneIndex: number, attackerInstanceId: string, defenderInstanceId: string) {
    actionMutation.mutate({ type: "attack", laneIndex, attackerInstanceId, defenderInstanceId });
  }

  function endPhase() {
    setSelectedAttackerId(null);
    actionMutation.mutate({ type: "end_phase" });
  }

  const canPlaySelected =
    isPlayerTurn &&
    match.phase === "logistics" &&
    selectedHandIndex != null &&
    resolveHandDropAction(match.legalActions, selectedHandIndex, 0) != null;

  function resolveChoice(payload: { selectedIndex?: number; topIndices?: number[] }) {
    actionMutation.mutate({ type: "resolve_choice", ...payload });
  }

  const pendingChoice =
    isPlayerTurn && state.pendingChoice?.player === "player" ? state.pendingChoice : null;
  const canRedrawOpening =
    match.phase === "opening" &&
    match.legalActions.some((action) => action.type === "redraw_opening_hand");

  const matchLabel = (
    <div className="flex min-w-0 items-center gap-2">
      <Link href="/play" className="shrink-0 text-xs text-neutral-500 hover:text-neutral-300">
        ← Play
      </Link>
      <h1 className="truncate text-sm font-semibold text-neutral-100 sm:text-base">
        Match #{match.id}
      </h1>
    </div>
  );

  const statusBadge =
    match.status !== "active" ? (
      <div
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
          match.status === "won" ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"
        }`}
      >
        {match.status === "won" ? "Victory!" : "Defeat"}
      </div>
    ) : null;

  return (
    <>
      {error ? (
        <div className="shrink-0 border-b border-red-900/60 bg-red-950/40 px-4 py-1.5 text-xs text-red-300 sm:px-6">
          {error}
        </div>
      ) : null}

      {canRedrawOpening ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-800/50 bg-amber-950/30 px-4 py-2 sm:px-6">
          <p className="text-xs text-amber-100/90">
            Your opening hand has no location card. Redraw until you draw one to begin the match.
          </p>
          <button
            type="button"
            onClick={() => actionMutation.mutate({ type: "redraw_opening_hand" })}
            disabled={actionMutation.isPending}
            className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-amber-600 disabled:opacity-50"
          >
            Redraw opening hand
          </button>
        </div>
      ) : null}

      {/* Full-bleed breakout: escapes the site shell's max-w-7xl/px-4/py-6
          wrapper so the mat can use the whole screen, per design request. */}
      <div className="-my-6 mx-[calc(50%-50vw)] w-screen">
        <BattleMat
          matchLabel={matchLabel}
          statusBadge={statusBadge}
          lanes={state.lanes}
          phase={match.phase as Phase}
          turnNumber={match.turnNumber}
          cp={state.player.cp}
          cpCap={state.player.cpGrantedThisTurn}
          capturedLocations={state.player.capturedLocations}
          aiCapturedLocations={state.ai.capturedLocations}
          locationsToWin={3}
          activePlayer={match.activePlayer}
          isPlayerTurn={isPlayerTurn}
          playerHand={state.player.hand}
          playerDeck={state.player.deck}
          playerDiscard={state.player.discard}
          aiHandCount={state.ai.hand.length}
          log={state.log}
          selectedHandIndex={selectedHandIndex}
          legalActions={match.legalActions}
          selectedAttackerId={selectedAttackerId}
          onSelectHand={setSelectedHandIndex}
          onSelectAttacker={setSelectedAttackerId}
          onDeployLane={() => {
            if (selectedHandIndex == null) return;
            playHandCard(selectedHandIndex, 0);
          }}
          onPlayHandCard={playHandCard}
          onAttack={attack}
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
    </>
  );
}
