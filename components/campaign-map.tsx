"use client";

import type { CampaignTheme } from "@/lib/campaign-theme";

export function CampaignMap({
  theme,
  nodesUnlocked,
  colorPrimary,
  colorSecondary,
  className = "",
}: {
  theme: CampaignTheme;
  nodesUnlocked: string[];
  colorPrimary: string;
  colorSecondary: string;
  className?: string;
}) {
  const unlocked = new Set(nodesUnlocked);
  const nodeById = new Map(theme.nodes.map((node) => [node.id, node]));

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-background/80 ${className}`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="campaign-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`${colorPrimary}33`} />
            <stop offset="100%" stopColor={`${colorSecondary}22`} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#campaign-bg)" />

        {theme.edges.map(([from, to]) => {
          const a = nodeById.get(from);
          const b = nodeById.get(to);
          if (!a || !b) return null;
          const lit = unlocked.has(from) && unlocked.has(to);
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x * 100}
              y1={a.y * 100}
              x2={b.x * 100}
              y2={b.y * 100}
              stroke={lit ? colorPrimary : "#404040"}
              strokeWidth={lit ? 1.2 : 0.8}
              strokeDasharray={lit ? undefined : "2 2"}
              opacity={lit ? 0.9 : 0.45}
            />
          );
        })}

        {theme.nodes.map((node) => {
          const isUnlocked = unlocked.has(node.id);
          const cx = node.x * 100;
          const cy = node.y * 100;
          return (
            <g key={node.id}>
              <circle
                cx={cx}
                cy={cy}
                r={isUnlocked ? 4.2 : 3.2}
                fill={isUnlocked ? colorPrimary : "#262626"}
                stroke={isUnlocked ? colorSecondary : "#525252"}
                strokeWidth={0.8}
              />
              <text
                x={cx}
                y={cy + 7}
                textAnchor="middle"
                fontSize="3.2"
                fill={isUnlocked ? "#f5f5f5" : "#737373"}
              >
                {node.label}
              </text>
              <text
                x={cx}
                y={cy - 5.5}
                textAnchor="middle"
                fontSize="2.6"
                fill={isUnlocked ? colorSecondary : "#525252"}
              >
                {node.milestone}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
