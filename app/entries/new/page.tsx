"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { EntryDateFields } from "@/components/entry-date-fields";
import { emptyEntryDateForm, entryDateFormToPayload } from "@/lib/entry-dates";
import type { Era } from "@/lib/types";

async function fetchEras(): Promise<Era[]> {
  const res = await fetch("/api/eras");
  if (!res.ok) throw new Error("Failed to load eras");
  return res.json();
}

const kindOptions = [
  { value: "event", label: "Event" },
  { value: "person", label: "Person" },
  { value: "note", label: "Note" },
] as const;

function NewEntryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });

  const [form, setForm] = useState({
    kind: "event" as "event" | "person" | "note",
    title: "",
    summary: "",
    content: "",
    eraId: searchParams.get("eraId") ?? "",
    imageUrl: "",
  });
  const [dateForm, setDateForm] = useState(emptyEntryDateForm);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const datePayload = entryDateFormToPayload(dateForm);
      if ("error" in datePayload) throw new Error(datePayload.error);

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: form.kind,
          title: form.title,
          summary: form.summary || null,
          content: form.content || null,
          ...datePayload,
          eraId: form.eraId ? Number(form.eraId) : null,
          imageUrl: form.imageUrl || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create entry");
      }
      return res.json();
    },
    onSuccess: (entry) => router.push(`/entries/${entry.id}`),
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">New timeline entry</h1>
        <p className="text-sm text-muted">
          Log an event, a person, or a free-form note — anything worth cross-referencing later.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface/40 p-4 sm:grid-cols-2"
      >
        <label className="flex flex-col gap-1 text-sm">
          Kind
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })}
            className="rounded border border-border-strong bg-background px-2 py-1.5"
          >
            {kindOptions.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Era
          <select
            value={form.eraId}
            onChange={(e) => setForm({ ...form, eraId: e.target.value })}
            className="rounded border border-border-strong bg-background px-2 py-1.5"
          >
            <option value="">— None —</option>
            {eras?.map((era) => (
              <option key={era.id} value={era.id}>
                {era.name}
              </option>
            ))}
          </select>
        </label>

        <label className="col-span-full flex flex-col gap-1 text-sm">
          Title
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded border border-border-strong bg-background px-2 py-1.5"
          />
        </label>

        <EntryDateFields value={dateForm} onChange={setDateForm} />

        <label className="col-span-full flex flex-col gap-1 text-sm">
          Summary
          <input
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="One line for the timeline card"
            className="rounded border border-border-strong bg-background px-2 py-1.5"
          />
        </label>
        <label className="col-span-full flex flex-col gap-1 text-sm">
          Content
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={6}
            placeholder="Notes, quotes, context... this is your personal wiki page for the entry."
            className="rounded border border-border-strong bg-background px-2 py-1.5"
          />
        </label>
        <label className="col-span-full flex flex-col gap-1 text-sm">
          Image URL (optional)
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="rounded border border-border-strong bg-background px-2 py-1.5"
          />
        </label>

        {error && <p className="col-span-full text-sm text-red-400">{error}</p>}

        <div className="col-span-full flex justify-end">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50"
          >
            {createMutation.isPending ? "Saving..." : "Create entry"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewEntryPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading...</p>}>
      <NewEntryForm />
    </Suspense>
  );
}
