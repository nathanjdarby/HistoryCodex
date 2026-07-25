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

export function nodeIdForMilestone(milestone: number) {
  return `m${milestone}`;
}

function nodeLabel(eraName: string, milestone: number, index: number, count: number): string {
  if (index === 0) return "Opening march";
  if (index === count - 1) return `${eraName}: Legacy`;
  if (count <= MILESTONE_LABELS.length) {
    return MILESTONE_LABELS[index] ?? `${milestone}%`;
  }
  return `${milestone}%`;
}

/** Lay nodes along a left-to-right path with a light zigzag so dense milestone sets stay readable. */
function nodePosition(index: number, count: number): { x: number; y: number } {
  const x = count === 1 ? 0.5 : 0.08 + (index / (count - 1)) * 0.84;
  const tier = Math.floor(index / 2);
  const row = index % 2;
  const y = 0.82 - tier * 0.2 - row * 0.1;
  return { x, y: Math.max(0.12, Math.min(0.88, y)) };
}

export function campaignThemeFromMilestones(eraName: string, milestones: number[]): CampaignTheme {
  const sorted = [...milestones].sort((a, b) => a - b);
  const nodes: CampaignNode[] = sorted.map((milestone, index) => {
    const { x, y } = nodePosition(index, sorted.length);
    return {
      id: nodeIdForMilestone(milestone),
      milestone,
      label: nodeLabel(eraName, milestone, index, sorted.length),
      x,
      y,
    };
  });

  const edges: [string, string][] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push([nodes[i]!.id, nodes[i + 1]!.id]);
  }

  return { nodes, edges };
}

export function defaultCampaignTheme(
  eraName: string,
  milestones: number[] = [25, 50, 75, 100],
): CampaignTheme {
  return campaignThemeFromMilestones(eraName, milestones);
}

export function themeMilestonePercents(theme: CampaignTheme): number[] {
  return theme.nodes.map((node) => node.milestone).sort((a, b) => a - b);
}

export function milestonesMatchTheme(theme: CampaignTheme, milestones: number[]): boolean {
  const expected = [...milestones].sort((a, b) => a - b);
  const current = themeMilestonePercents(theme);
  if (expected.length !== current.length) return false;
  return expected.every((value, index) => value === current[index]);
}
