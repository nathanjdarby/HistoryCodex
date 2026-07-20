"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DisplayNameAs } from "@/lib/user-display-name";
import { displayNameOptions } from "@/lib/user-display-name";

export type UserProfileResponse = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  displayNameAs: DisplayNameAs;
  displayName: string;
  displayNameOptions: { value: DisplayNameAs; label: string }[];
};

async function fetchProfile(): Promise<UserProfileResponse> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

export function ProfileIdentityForm() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [displayNameAs, setDisplayNameAs] = useState<DisplayNameAs>("email");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
    setNickname(profile.nickname ?? "");
    setDisplayNameAs(profile.displayNameAs);
  }, [profile]);

  const previewOptions = useMemo(() => {
    return displayNameOptions({
      email: profile?.email ?? "",
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      nickname: nickname.trim() || null,
      displayNameAs,
    });
  }, [profile?.email, firstName, lastName, nickname, displayNameAs]);

  useEffect(() => {
    if (!previewOptions.some((option) => option.value === displayNameAs)) {
      setDisplayNameAs("email");
    }
  }, [previewOptions, displayNameAs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null,
          nickname: nickname.trim() || null,
          displayNameAs,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save profile");
      }
      return res.json() as Promise<UserProfileResponse>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setSavedMessage("Profile saved.");
      setError(null);
      window.setTimeout(() => setSavedMessage(null), 2500);
    },
    onError: (err: Error) => {
      setError(err.message);
      setSavedMessage(null);
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted">Loading profile…</p>;
  }

  return (
    <form
      className="app-panel space-y-4 p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        saveMutation.mutate();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">First name</span>
          <input
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            maxLength={80}
            className="app-input"
            placeholder="Optional"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Last name</span>
          <input
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            maxLength={80}
            className="app-input"
            placeholder="Optional"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Nickname</span>
        <input
          type="text"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          autoComplete="nickname"
          maxLength={40}
          className="app-input"
          placeholder="Optional — e.g. a handle or codex name"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Call me</span>
        <select
          value={displayNameAs}
          onChange={(event) => setDisplayNameAs(event.target.value as DisplayNameAs)}
          className="app-input"
        >
          {previewOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-subtle">
          This is how your name appears across HistoryCodex.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
        <p className="text-sm text-muted">
          Signed in as <span className="text-foreground">{profile?.email}</span>
        </p>
        <button type="submit" disabled={saveMutation.isPending} className="app-btn-primary ml-auto">
          {saveMutation.isPending ? "Saving…" : "Save profile"}
        </button>
      </div>

      {savedMessage ? (
        <p className="text-sm text-emerald-400">{savedMessage}</p>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </form>
  );
}
