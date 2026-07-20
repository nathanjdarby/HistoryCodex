"use client";

import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ChevronDown, ChevronRight, Pencil, Plus, RotateCcw, Trash2, UserCog } from "lucide-react";

type UserRole = "user" | "admin";

type AdminUser = {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
  pointsBalance: number;
  totalPointsEarned: number;
  booksFinished: number;
  booksTotal: number;
  booksReading: {
    id: number;
    title: string;
    author: string | null;
    currentPage: number;
    totalPages: number;
    status: "to_read" | "reading" | "finished";
  }[];
  cardsOwned: number;
};

type UserFormState = {
  email: string;
  password: string;
  role: UserRole;
  pointsBalance: string;
};

const emptyForm: UserFormState = {
  email: "",
  password: "",
  role: "user",
  pointsBalance: "0",
};

async function fetchUsers(): Promise<AdminUser[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function progressPct(currentPage: number, totalPages: number) {
  if (totalPages <= 0) return 0;
  return Math.min(100, Math.round((currentPage / totalPages) * 100));
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        email: form.email,
        role: form.role,
        pointsBalance: Number(form.pointsBalance),
        ...(form.password ? { password: form.password } : {}),
      };

      const res = await fetch(editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users", {
        method: editingUser ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setFormOpen(false);
      setEditingUser(null);
      setForm(emptyForm);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setExpandedId(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const resetMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}/reset`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to reset user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const sortedUsers = useMemo(
    () => [...(users ?? [])].sort((a, b) => a.email.localeCompare(b.email)),
    [users],
  );

  function openCreateForm() {
    setEditingUser(null);
    setForm(emptyForm);
    setError(null);
    setFormOpen(true);
  }

  function openEditForm(user: AdminUser) {
    setEditingUser(user);
    setForm({
      email: user.email,
      password: "",
      role: user.role,
      pointsBalance: String(user.pointsBalance),
    });
    setError(null);
    setFormOpen(true);
  }

  function promptDelete(user: AdminUser) {
    if (
      confirm(
        `Delete ${user.email}? This removes their books, cards, and points history.`,
      )
    ) {
      deleteMutation.mutate(user.id);
    }
  }

  function promptReset(user: AdminUser) {
    if (
      confirm(
        `Reset ${user.email}? This clears points, books, timeline entries, cards, and points history. The account will remain.`,
      )
    ) {
      resetMutation.mutate(user.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Users</h1>
          <p className="text-sm text-muted">
            Manage accounts, roles, and points. Expand a row to see what each player is reading and
            how they&apos;re progressing.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
        >
          <Plus size={16} />
          New user
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface/60 p-4 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 text-sm font-medium text-foreground">
            {editingUser ? `Edit ${editingUser.email}` : "Create user"}
          </h2>
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded border border-border-strong bg-background px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              type="password"
              required={!editingUser}
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingUser ? "Leave blank to keep current" : "Minimum 6 characters"}
              className="rounded border border-border-strong bg-background px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Role
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="rounded border border-border-strong bg-background px-2 py-1.5"
            >
              <option value="user">Player</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Points balance
            <input
              required
              type="number"
              min={0}
              value={form.pointsBalance}
              onChange={(e) => setForm({ ...form, pointsBalance: e.target.value })}
              className="rounded border border-border-strong bg-background px-2 py-1.5"
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-60"
            >
              {saveMutation.isPending ? "Saving…" : editingUser ? "Save changes" : "Create user"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingUser(null);
                setForm(emptyForm);
              }}
              className="rounded-md border border-border-strong px-3 py-2 text-sm text-foreground/80 hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-surface/80 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2" />
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Points</th>
              <th className="px-3 py-2">Reading</th>
              <th className="px-3 py-2">Books</th>
              <th className="px-3 py-2">Cards</th>
              <th className="px-3 py-2">Joined</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted">
                  Loading users…
                </td>
              </tr>
            )}
            {!isLoading && sortedUsers.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted">
                  No users yet.
                </td>
              </tr>
            )}
            {sortedUsers.map((user) => {
              const expanded = expandedId === user.id;
              return (
                <Fragment key={user.id}>
                  <tr className="border-b border-border/80 hover:bg-surface/40">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : user.id)}
                        className="rounded p-1 text-muted hover:bg-surface-raised hover:text-foreground"
                        aria-label={expanded ? "Collapse details" : "Expand details"}
                      >
                        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground">{user.email}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                          user.role === "admin"
                            ? "bg-accent/15 text-gold-bright"
                            : "bg-surface-raised text-foreground/80"
                        }`}
                      >
                        {user.role === "admin" ? <UserCog size={12} /> : null}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-gold-bright">{user.pointsBalance}</td>
                    <td className="px-3 py-2 text-foreground/80">{user.booksReading.length}</td>
                    <td className="px-3 py-2 text-foreground/80">
                      {user.booksTotal}
                      <span className="text-muted"> · {user.booksFinished} done</span>
                    </td>
                    <td className="px-3 py-2 text-foreground/80">{user.cardsOwned}</td>
                    <td className="px-3 py-2 text-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => promptReset(user)}
                          disabled={resetMutation.isPending}
                          className="rounded p-1.5 text-muted hover:bg-accent/15 hover:text-gold-bright disabled:opacity-50"
                          aria-label={`Reset ${user.email}`}
                          title="Reset account"
                        >
                          <RotateCcw size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditForm(user)}
                          className="rounded p-1.5 text-muted hover:bg-surface-raised hover:text-foreground"
                          aria-label={`Edit ${user.email}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => promptDelete(user)}
                          className="rounded p-1.5 text-muted hover:bg-red-950 hover:text-red-300"
                          aria-label={`Delete ${user.email}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="border-b border-border/80 bg-background/60">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="grid gap-4 lg:grid-cols-3">
                          <div className="rounded-lg border border-border bg-surface/40 p-3">
                            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
                              Points
                            </h3>
                            <dl className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between gap-3">
                                <dt className="text-muted">Balance</dt>
                                <dd className="font-mono text-gold-bright">{user.pointsBalance}</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt className="text-muted">Total earned</dt>
                                <dd className="font-mono text-foreground">{user.totalPointsEarned}</dd>
                              </div>
                            </dl>
                          </div>

                          <div className="rounded-lg border border-border bg-surface/40 p-3 lg:col-span-2">
                            <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                              <BookOpen size={12} />
                              Currently reading
                            </h3>
                            {user.booksReading.length === 0 ? (
                              <p className="mt-2 text-sm text-muted">Not reading any books right now.</p>
                            ) : (
                              <ul className="mt-3 space-y-3">
                                {user.booksReading.map((book) => {
                                  const pct = progressPct(book.currentPage, book.totalPages);
                                  return (
                                    <li key={book.id} className="space-y-1">
                                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <span className="font-medium text-foreground">{book.title}</span>
                                        <span className="text-xs text-muted">
                                          p. {book.currentPage} / {book.totalPages} ({pct}%)
                                        </span>
                                      </div>
                                      {book.author && (
                                        <p className="text-xs text-muted">by {book.author}</p>
                                      )}
                                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised">
                                        <div
                                          className="h-full rounded-full bg-accent"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
