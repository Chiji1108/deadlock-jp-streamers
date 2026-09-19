/// <reference types="vite/client" />
import type { FunctionReturnType } from "convex/server";
import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import { rankOrder } from "./rankOrdering";
const modules = import.meta.glob("./**/*.ts");
afterEach(() => vi.useRealTimers());
test("Initiate 1 through Eternus 6 order by tier then subrank, unknowns last", () => {
  expect(rankOrder({ tier: 1, subrank: 1 })).toEqual({
    rankScore: 11,
    rankReverse: 189,
  });
  expect(rankOrder({ tier: 11, subrank: 6 })).toEqual({
    rankScore: 116,
    rankReverse: 84,
  });
  for (const rank of [
    null,
    { tier: 0, subrank: 0 },
    { tier: null, subrank: null },
    { tier: 11, subrank: 6, unavailable: true },
  ])
    expect(rankOrder(rank)).toEqual({ rankScore: 0, rankReverse: 0 });
});
test("global rank pagination and LIVE filtering stay correct after backfill, refresh and unlink", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const linkIds = await t.run(async (ctx) => {
    const ids = [];
    const ranks = [
      { tier: 1, subrank: 1 },
      { tier: 11, subrank: 6 },
      { tier: 11, subrank: 5 },
      { tier: 0, subrank: 0 },
      null,
    ];
    for (let i = 0; i < ranks.length; i++) {
      const twitchId = String(i);
      await ctx.db.insert("streamers", {
        twitchId,
        login: twitchId,
        displayName: twitchId,
        profileImageUrl: null,
        profileUpdatedAt: null,
        firstSeenAt: 1,
      });
      await ctx.db.insert("rankings", {
        twitchId,
        period: "week",
        asOfDay: 1,
        isLive: i !== 1,
        durationSeconds: 100,
        viewerSeconds: 100,
        peakViewers: 1,
        averageViewers: 1,
        streamingDays: 1,
      });
      if (ranks[i])
        ids.push(
          await ctx.db.insert("steamLinks", {
            twitchId,
            accountId: i + 1,
            ...ranks[i]!,
            updatedAt: null,
            unavailable: false,
            nextRefreshAt: 0,
          }),
        );
    }
    return ids;
  });
  await t.mutation(internal.rankOrdering.backfill, { cursor: null });
  async function read(sort: "rank" | "rankAsc", liveOnly = false) {
    const ids: string[] = [];
    let cursor: string | null = null;
    for (;;) {
      const result: FunctionReturnType<typeof api.dashboard.ranking> =
        await t.query(api.dashboard.ranking, {
          period: "week",
          sort,
          liveOnly,
          paginationOpts: { numItems: 1, cursor },
        });
      ids.push(...result.page.map((r) => r.twitchId));
      if (result.isDone) return ids;
      cursor = result.continueCursor;
    }
  }
  expect((await read("rank")).slice(0, 3)).toEqual(["1", "2", "0"]);
  expect((await read("rankAsc")).slice(0, 3)).toEqual(["0", "2", "1"]);
  expect((await read("rank", true)).slice(0, 2)).toEqual(["2", "0"]);
  expect((await read("rankAsc", true)).slice(0, 2)).toEqual(["0", "2"]);
  await t.mutation(internal.steamLinks.save, {
    id: linkIds[0],
    attemptedAt: 10,
    result: { tier: 11, subrank: 6 },
  });
  expect((await read("rank", true))[0]).toBe("0");
  await t.mutation(internal.steamLinks.unlink, { twitchId: "0" });
  expect((await read("rankAsc"))[0]).toBe("2");
  await t.mutation(internal.steamLinks.save, {
    id: linkIds[2],
    attemptedAt: 11,
    result: null,
  });
  expect((await read("rankAsc"))[0]).toBe("1");
});
