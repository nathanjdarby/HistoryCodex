type ReadingProgressBarProps = {
  progressPercent: number;
  milestones: number[];
  earnedMilestones?: number[];
};

export function ReadingProgressBar({
  progressPercent,
  milestones,
  earnedMilestones = [],
}: ReadingProgressBarProps) {
  const earned = new Set(earnedMilestones);

  return (
    <div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-raised">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${progressPercent}%` }}
        />
        {milestones.map((milestone) => {
          const reached = progressPercent >= milestone;
          const collected = earned.has(milestone);
          return (
            <span
              key={milestone}
              className={`absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                collected
                  ? "bg-emerald-300"
                  : reached
                    ? "bg-gold-bright"
                    : "bg-neutral-600"
              }`}
              style={{ left: `${milestone}%` }}
              title={
                collected
                  ? `${milestone}% milestone earned`
                  : reached
                    ? `${milestone}% reached`
                    : `${milestone}% milestone`
              }
            />
          );
        })}
      </div>

      <div className="relative mt-2 h-4">
        {milestones.map((milestone) => {
          const reached = progressPercent >= milestone;
          const collected = earned.has(milestone);
          return (
            <span
              key={milestone}
              className={`absolute top-0 -translate-x-1/2 text-[10px] font-medium tabular-nums ${
                collected
                  ? "text-emerald-400"
                  : reached
                    ? "text-gold"
                    : "text-subtle"
              }`}
              style={{ left: `${milestone}%` }}
            >
              {milestone}%
            </span>
          );
        })}
      </div>
    </div>
  );
}
