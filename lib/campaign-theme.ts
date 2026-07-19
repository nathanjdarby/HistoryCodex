export type CampaignNode = {
  id: string;
  milestone: number;
  label: string;
  x: number;
  y: number;
};

export type CampaignTheme = {
  nodes: CampaignNode[];
  edges: [string, string][];
};

const MILESTONE_LABELS = ["Opening march", "Deepening path", "Turning point", "Campaign complete"] as const;

export function defaultCampaignTheme(eraName: string): CampaignTheme {
  const nodes: CampaignNode[] = [25, 50, 75, 100].map((milestone, index) => ({
    id: `m${milestone}`,
    milestone,
    label: index === 3 ? `${eraName}: Legacy` : MILESTONE_LABELS[index] ?? `Milestone ${milestone}%`,
    x: 0.12 + index * 0.26,
    y: 0.78 - index * 0.18,
  }));

  return {
    nodes,
    edges: [
      ["m25", "m50"],
      ["m50", "m75"],
      ["m75", "m100"],
    ],
  };
}

export function nodeIdForMilestone(milestone: number) {
  return `m${milestone}`;
}
