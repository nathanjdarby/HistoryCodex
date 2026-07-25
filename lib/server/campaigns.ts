import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { eraCampaigns, eras, userCampaignProgress } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import {
  campaignThemeFromMilestones,
  milestonesMatchTheme,
  nodeIdForMilestone,
  type CampaignTheme,
} from "@/lib/campaign-theme";
import { getGameRules } from "@/lib/server/game-rules";

/** Admin staging bucket — not a playable historical era. */
const SKIP_ERA_SLUGS = new Set(["to-organise"]);

function parseCampaignTheme(themeJson: string): CampaignTheme {
  const theme = JSON.parse(themeJson) as CampaignTheme;
  if (!Array.isArray(theme?.nodes)) {
    throw new Error("Invalid campaign theme");
  }
  return theme;
}

async function reconcileCampaignThemeRecord(
  campaign: typeof eraCampaigns.$inferSelect,
  eraName: string,
  milestones: number[],
) {
  const theme = JSON.parse(campaign.themeJson) as CampaignTheme;
  if (milestonesMatchTheme(theme, milestones)) return campaign;

  const nextTheme = campaignThemeFromMilestones(eraName, milestones);
  const [updated] = await db
    .update(eraCampaigns)
    .set({ themeJson: JSON.stringify(nextTheme) })
    .where(eq(eraCampaigns.id, campaign.id))
    .returning();
  return updated ?? campaign;
}

export async function syncAllCampaignThemes(milestones: number[]) {
  const rows = await db
    .select({
      campaign: eraCampaigns,
      eraName: eras.name,
    })
    .from(eraCampaigns)
    .innerJoin(eras, eq(eraCampaigns.eraId, eras.id));

  await Promise.all(
    rows.map(({ campaign, eraName }) => reconcileCampaignThemeRecord(campaign, eraName, milestones)),
  );
}

export async function ensureCampaignForEra(eraId: number) {
  const [era] = await db.select().from(eras).where(eq(eras.id, eraId));
  if (!era) throw new ApiError(404, "Era not found");
  if (SKIP_ERA_SLUGS.has(era.slug)) {
    throw new ApiError(400, "Campaigns are not created for staging eras");
  }

  const rules = await getGameRules();
  const [existing] = await db.select().from(eraCampaigns).where(eq(eraCampaigns.eraId, eraId));
  if (existing) {
    if (existing.slug !== era.slug) {
      const [reslugged] = await db
        .update(eraCampaigns)
        .set({ slug: era.slug })
        .where(eq(eraCampaigns.id, existing.id))
        .returning();
      return reconcileCampaignThemeRecord(reslugged ?? existing, era.name, rules.milestones);
    }
    return reconcileCampaignThemeRecord(existing, era.name, rules.milestones);
  }

  const theme = campaignThemeFromMilestones(era.name, rules.milestones);
  const [created] = await db
    .insert(eraCampaigns)
    .values({
      eraId,
      slug: era.slug,
      title: `${era.name} Campaign`,
      themeJson: JSON.stringify(theme),
    })
    .returning();
  return created;
}

export async function getCampaignBySlug(slug: string) {
  if (SKIP_ERA_SLUGS.has(slug)) return null;

  let [campaign] = await db.select().from(eraCampaigns).where(eq(eraCampaigns.slug, slug));

  if (!campaign) {
    const [era] = await db.select().from(eras).where(eq(eras.slug, slug));
    if (!era || SKIP_ERA_SLUGS.has(era.slug)) return null;
    campaign = await ensureCampaignForEra(era.id);
  }

  const [era] = await db.select().from(eras).where(eq(eras.id, campaign.eraId));
  if (!era) return null;

  const rules = await getGameRules();
  const synced = await reconcileCampaignThemeRecord(campaign, era.name, rules.milestones);

  return {
    ...synced,
    era,
    theme: parseCampaignTheme(synced.themeJson),
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

async function ensureMissingCampaigns() {
  const [allEras, existing] = await Promise.all([
    db.select({ id: eras.id, slug: eras.slug }).from(eras),
    db.select({ eraId: eraCampaigns.eraId }).from(eraCampaigns),
  ]);

  const coveredEraIds = new Set(existing.map((row) => row.eraId));
  const missing = allEras.filter(
    (era) => !coveredEraIds.has(era.id) && !SKIP_ERA_SLUGS.has(era.slug),
  );

  if (missing.length === 0) return;

  await Promise.all(missing.map((era) => ensureCampaignForEra(era.id)));
}

export async function listCampaignsForUser(userId: number) {
  await ensureMissingCampaigns();

  const campaigns = await db
    .select({
      id: eraCampaigns.id,
      slug: eraCampaigns.slug,
      title: eraCampaigns.title,
      eraId: eraCampaigns.eraId,
      eraName: eras.name,
      colorPrimary: eras.colorPrimary,
      colorSecondary: eras.colorSecondary,
      themeJson: eraCampaigns.themeJson,
    })
    .from(eraCampaigns)
    .innerJoin(eras, eq(eraCampaigns.eraId, eras.id))
    .where(ne(eras.slug, "to-organise"))
    .orderBy(eras.startYear);

  const withProgress = await Promise.all(
    campaigns.map(async (campaign) => {
      const progress = await getUserCampaignProgress(userId, campaign.eraId);
      const { themeJson, ...rest } = campaign;
      return {
        ...rest,
        ...progress,
        theme: parseCampaignTheme(themeJson),
      };
    }),
  );

  return withProgress;
}
