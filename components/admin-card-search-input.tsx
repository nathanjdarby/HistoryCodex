"use client";

import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function AdminCardSearchInput({
  value,
  onChange,
  placeholder = "Search name, era, ability, seed…",
  className = "",
}: Props) {
  return (
    <div className={`relative min-w-[12rem] flex-1 ${className}`}>
      <Search
        size={15}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-border-strong bg-surface py-1.5 pl-8 pr-8 text-sm text-foreground outline-none placeholder:text-subtle focus:border-accent"
        aria-label="Search cards"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
