import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { eraCampaigns, eras, userCampaignProgress } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { defaultCampaignTheme, nodeIdForMilestone, type CampaignTheme } from "@/lib/campaign-theme";

export async function ensureCampaignForEra(eraId: number) {
  const [existing] = await db.select().from(eraCampaigns).where(eq(eraCampaigns.eraId, eraId));
  if (existing) return existing;

  const [era] = await db.select().from(eras).where(eq(eras.id, eraId));
  if (!era) throw new ApiError(404, "Era not found");

  const [created] = await db
    .insert(eraCampaigns)
    .values({
      eraId,
      slug: era.slug,
      title: `${era.name} Campaign`,
      themeJson: JSON.stringify(defaultCampaignTheme(era.name)),
    })
    .returning();
  return created;
}

export async function getCampaignBySlug(slug: string) {
  const [campaign] = await db.select().from(eraCampaigns).where(eq(eraCampaigns.slug, slug));
  if (!campaign) return null;

  const [era] = await db.select().from(eras).where(eq(eras.id, campaign.eraId));
  if (!era) return null;

  return {
    ...campaign,
    era,
    theme: JSON.parse(campaign.themeJson) as CampaignTheme,
  };
}

export async function getUserCampaignProgress(userId: number, eraId: number) {
  const [row] = await db
    .select()
    .from(userCampaignProgress)
    .where(and(eq(userCampaignProgress.userId, userId), eq(userCampaignProgress.eraId, eraId)));

  const nodesUnlocked: string[] = row ? JSON.parse(row.nodesUnlocked) : [];
  return {
    nodesUnlocked,
    currentNode: row?.currentNode ?? null,
  };
}

export async function unlockCampaignMilestones(
  userId: number,
  eraId: number | null | undefined,
  milestones: number[],
) {
  if (eraId == null || milestones.length === 0) return { newlyUnlocked: [] as string[] };

  await ensureCampaignForEra(eraId);
  const progress = await getUserCampaignProgress(userId, eraId);
  const unlocked = new Set(progress.nodesUnlocked);
  const newlyUnlocked: string[] = [];

  for (const milestone of milestones) {
    const nodeId = nodeIdForMilestone(milestone);
    if (unlocked.has(nodeId)) continue;
    unlocked.add(nodeId);
    newlyUnlocked.push(nodeId);
  }

  if (newlyUnlocked.length === 0) return { newlyUnlocked };

  const allNodes = [...unlocked];
  const currentNode = allNodes.at(-1) ?? null;

  await db
    .insert(userCampaignProgress)
    .values({
      userId,
      eraId,
      nodesUnlocked: JSON.stringify(allNodes),
      currentNode,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userCampaignProgress.userId, userCampaignProgress.eraId],
      set: {
        nodesUnlocked: JSON.stringify(allNodes),
        currentNode,
        updatedAt: new Date(),
      },
    });

  return { newlyUnlocked };
}

export async function listCampaignsForUser(userId: number) {
  const allEras = await db.select().from(eras).orderBy(eras.startYear);
  for (const era of allEras) {
    await ensureCampaignForEra(era.id);
  }

  const campaigns = await db
    .select({
      id: eraCampaigns.id,
      slug: eraCampaigns.slug,
      title: eraCampaigns.title,
      eraId: eraCampaigns.eraId,
      eraName: eras.name,
      colorPrimary: eras.colorPrimary,
      colorSecondary: eras.colorSecondary,
    })
    .from(eraCampaigns)
    .innerJoin(eras, eq(eraCampaigns.eraId, eras.id))
    .orderBy(eras.startYear);

  const withProgress = await Promise.all(
    campaigns.map(async (campaign) => {
      const progress = await getUserCampaignProgress(userId, campaign.eraId);
      return { ...campaign, ...progress };
    }),
  );

  return withProgress;
}
