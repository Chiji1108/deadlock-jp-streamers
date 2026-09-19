import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  internalAction,
  type QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { steamAccountId, parseRank } from "./deadlock";
import schema from "./schema";
const HOUR = 3600000;

// Dashboard-only: internal functions cannot be invoked by an unauthenticated client.
export const link = internalMutation({
  args: { twitchId: v.string(), steamAccount: v.string() },
  returns: v.null(),
  handler: async (ctx, { twitchId, steamAccount }) => {
    const accountId = steamAccountId(steamAccount);
    const streamer = await ctx.db
      .query("streamers")
      .withIndex("by_twitchId", (q) => q.eq("twitchId", twitchId))
      .unique();
    if (!streamer)
      throw new ConvexError(
        "配信者が見つかりません。詳細ページのTwitch IDを指定してください",
      );
    const duplicate = await ctx.db
      .query("steamLinks")
      .withIndex("by_accountId", (q) => q.eq("accountId", accountId))
      .unique();
    if (duplicate && duplicate.twitchId !== twitchId)
      throw new ConvexError("このSteamアカウントは別の配信者に登録済みです");
    const old = await ctx.db
      .query("steamLinks")
      .withIndex("by_twitchId", (q) => q.eq("twitchId", twitchId))
      .unique();
    if (old) await ctx.db.delete("steamLinks", old._id);
    // A new document ID invalidates in-flight requests for an earlier association.
    const id = await ctx.db.insert("steamLinks", {
      twitchId,
      accountId,
      tier: null,
      subrank: null,
      updatedAt: null,
      unavailable: false,
      nextRefreshAt: Date.now() + HOUR,
    });
    await ctx.scheduler.runAfter(0, internal.steamLinks.refresh, { id });
    return null;
  },
});
export const unlink = internalMutation({
  args: { twitchId: v.string() },
  returns: v.null(),
  handler: async (ctx, { twitchId }) => {
    const row = await ctx.db
      .query("steamLinks")
      .withIndex("by_twitchId", (q) => q.eq("twitchId", twitchId))
      .unique();
    if (row) await ctx.db.delete("steamLinks", row._id);
    return null;
  },
});
export const refreshDue = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const rows = await ctx.db
      .query("steamLinks")
      .withIndex("by_nextRefreshAt", (q) => q.lte("nextRefreshAt", now))
      .take(10);
    for (const row of rows) {
      await ctx.db.patch("steamLinks", row._id, { nextRefreshAt: now + HOUR });
      await ctx.scheduler.runAfter(0, internal.steamLinks.refresh, {
        id: row._id,
      });
    }
    return null;
  },
});
export const get = internalQuery({
  args: { id: v.id("steamLinks") },
  returns: v.union(v.null(), schema.doc("steamLinks")),
  handler: (ctx, { id }) => ctx.db.get("steamLinks", id),
});
export const save = internalMutation({
  args: {
    id: v.id("steamLinks"),
    attemptedAt: v.number(),
    result: v.union(
      v.null(),
      v.object({ tier: v.number(), subrank: v.number() }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, { id, attemptedAt, result }) => {
    const row = await ctx.db.get("steamLinks", id);
    if (!row || (row.updatedAt !== null && row.updatedAt > attemptedAt))
      return null;
    // Clear old values on protected/unavailable results rather than exposing a stale badge.
    await ctx.db.patch("steamLinks", id, {
      tier: result?.tier ?? null,
      subrank: result?.subrank ?? null,
      updatedAt: attemptedAt,
      unavailable: result === null,
    });
    return null;
  },
});
export const refresh = internalAction({
  args: { id: v.id("steamLinks") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const row = await ctx.runQuery(internal.steamLinks.get, { id });
    if (!row) return null;
    const attemptedAt = Date.now();
    let result = null;
    try {
      const response = await fetch(
        `https://api.deadlock-api.com/v1/players/${row.accountId}/rank`,
        { signal: AbortSignal.timeout(15000) },
      );
      if (response.ok) result = parseRank(await response.json());
    } catch {
      /* Retried by the next scheduled refresh. */
    }
    await ctx.runMutation(internal.steamLinks.save, {
      id,
      attemptedAt,
      result,
    });
    return null;
  },
});
export async function rankForStreamer(ctx: QueryCtx, twitchId: string) {
  const row = await ctx.db
    .query("steamLinks")
    .withIndex("by_twitchId", (q) => q.eq("twitchId", twitchId))
    .unique();
  if (!row) return null;
  const { accountId, tier, subrank, updatedAt, unavailable } = row;
  return { accountId, tier, subrank, updatedAt, unavailable };
}
