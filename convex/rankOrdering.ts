import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

export function rankOrder(
  rank: {
    tier: number | null;
    subrank: number | null;
    unavailable?: boolean;
  } | null,
) {
  const tier = rank?.tier,
    subrank = rank?.subrank;
  const valid =
    !rank?.unavailable &&
    typeof tier === "number" &&
    Number.isInteger(tier) &&
    tier >= 1 &&
    tier <= 11 &&
    typeof subrank === "number" &&
    Number.isInteger(subrank) &&
    subrank >= 1 &&
    subrank <= 6;
  const score = valid ? tier * 10 + subrank : 0;
  // Both indexes are read descending, so unknown/missing ranks stay last in either direction.
  return { rankScore: score, rankReverse: score ? 200 - score : 0 };
}
export async function syncRankOrder(
  ctx: MutationCtx,
  twitchId: string,
  rank: Parameters<typeof rankOrder>[0],
) {
  const rows = await ctx.db
    .query("rankings")
    .withIndex("by_twitchId_and_period", (q) => q.eq("twitchId", twitchId))
    .take(4);
  for (const row of rows)
    await ctx.db.patch("rankings", row._id, rankOrder(rank));
}
// Optional index fields keep old rows valid; fill existing links in bounded batches after deployment.
export const backfill = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db
      .query("steamLinks")
      .withIndex("by_accountId")
      .paginate({ cursor, numItems: 50 });
    for (const link of page.page) await syncRankOrder(ctx, link.twitchId, link);
    if (!page.isDone)
      await ctx.scheduler.runAfter(0, internal.rankOrdering.backfill, {
        cursor: page.continueCursor,
      });
    return null;
  },
});
