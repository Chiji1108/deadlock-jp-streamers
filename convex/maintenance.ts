import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { refreshRankings } from "./ingestion";

// Advance dormant streamers' rolling windows even when they have not gone live.
// Bounded continuation mutations prevent an ever-growing all-streamer transaction.
export const refreshPeriods = internalMutation({
  args: { cursor: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("streamerState")
      .withIndex("by_twitchId")
      .paginate({ cursor: args.cursor ?? null, numItems: 8 });
    for (const state of page.page)
      await refreshRankings(
        ctx,
        state,
        Math.max(Date.now(), state.lastObservedAt),
      );
    if (!page.isDone)
      await ctx.scheduler.runAfter(0, internal.maintenance.refreshPeriods, {
        cursor: page.continueCursor,
      });
    return null;
  },
});

// Expiry updates indexed LIVE filters even if Twitch fails or credentials disappear.
// Keep the open session pointer so the next successful collection still verifies it.
export const expireLive = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const cutoff = Date.now() - 180_000;
    const stale = await ctx.db
      .query("streamerState")
      .withIndex("by_isLive_and_lastSeenAt", (q) =>
        q.eq("isLive", true).lt("lastSeenAt", cutoff),
      )
      .take(50);
    for (const state of stale) {
      await ctx.db.patch("streamerState", state._id, { isLive: false });
      const rankings = await ctx.db
        .query("rankings")
        .withIndex("by_twitchId_and_period", (q) =>
          q.eq("twitchId", state.twitchId),
        )
        .take(4);
      for (const row of rankings)
        await ctx.db.patch("rankings", row._id, { isLive: false });
    }
    if (stale.length) {
      const collector = await ctx.db
        .query("collector")
        .withIndex("by_key", (q) => q.eq("key", "twitch"))
        .unique();
      if (collector)
        await ctx.db.patch("collector", collector._id, {
          liveCount: Math.max(0, collector.liveCount - stale.length),
        });
    }
    if (stale.length === 50)
      await ctx.scheduler.runAfter(0, internal.maintenance.expireLive, {});
    return null;
  },
});
