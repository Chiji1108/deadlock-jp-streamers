import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { collectorStatus, metricFields, periodValidator } from "./model";

// All timestamps and day keys are Unix milliseconds. Durations use seconds.
export default defineSchema({
  streamers: defineTable({
    twitchId: v.string(),
    login: v.string(),
    displayName: v.string(),
    profileImageUrl: v.union(v.string(), v.null()),
    profileUpdatedAt: v.union(v.number(), v.null()),
    firstSeenAt: v.number(),
  }).index("by_twitchId", ["twitchId"]),
  streamerState: defineTable({
    twitchId: v.string(),
    isLive: v.boolean(),
    hasOpenSession: v.boolean(),
    sessionId: v.union(v.id("sessions"), v.null()),
    lastObservedAt: v.number(),
    lastSeenAt: v.number(),
    liveViewerCount: v.union(v.number(), v.null()),
    liveStartedAt: v.union(v.number(), v.null()),
    title: v.union(v.string(), v.null()),
    ...metricFields,
  })
    .index("by_twitchId", ["twitchId"])
    .index("by_isLive_and_lastSeenAt", ["isLive", "lastSeenAt"])
    .index("by_hasOpenSession_and_twitchId", ["hasOpenSession", "twitchId"]),
  sessions: defineTable({
    twitchId: v.string(),
    twitchStreamId: v.string(),
    title: v.string(),
    twitchStartedAt: v.number(),
    startedAt: v.number(),
    lastSeenAt: v.number(),
    endedAt: v.union(v.number(), v.null()),
    lastViewerCount: v.number(),
    ...metricFields,
  }).index("by_twitchId_and_startedAt", ["twitchId", "startedAt"]),
  daily: defineTable({
    twitchId: v.string(),
    day: v.number(),
    ...metricFields,
    // Fixed 24-element arrays, one observed duration for each JST hour. No raw minute rows.
    hours: v.array(v.number()),
  }).index("by_twitchId_and_day", ["twitchId", "day"]),
  rankings: defineTable({
    twitchId: v.string(),
    period: periodValidator,
    asOfDay: v.number(),
    isLive: v.boolean(),
    ...metricFields,
    averageViewers: v.number(),
    streamingDays: v.number(),
  })
    .index("by_twitchId_and_period", ["twitchId", "period"])
    .index("by_period_and_durationSeconds", ["period", "durationSeconds"])
    .index("by_period_and_averageViewers", ["period", "averageViewers"])
    .index("by_period_and_viewerSeconds", ["period", "viewerSeconds"])
    .index("by_period_and_peakViewers", ["period", "peakViewers"])
    .index("by_period_and_isLive_and_peakViewers", [
      "period",
      "isLive",
      "peakViewers",
    ])
    .index("by_period_and_isLive_and_durationSeconds", [
      "period",
      "isLive",
      "durationSeconds",
    ])
    .index("by_period_and_isLive_and_averageViewers", [
      "period",
      "isLive",
      "averageViewers",
    ])
    .index("by_period_and_isLive_and_viewerSeconds", [
      "period",
      "isLive",
      "viewerSeconds",
    ]),
  collector: defineTable({
    key: v.literal("twitch"),
    configured: v.boolean(),
    state: collectorStatus,
    message: v.union(v.string(), v.null()),
    runId: v.union(v.string(), v.null()),
    leaseUntil: v.number(),
    lastAttemptAt: v.union(v.number(), v.null()),
    lastCollectedAt: v.union(v.number(), v.null()),
    liveCount: v.number(),
    streamerCount: v.number(),
    totalDurationSeconds: v.number(),
    totalViewerSeconds: v.number(),
  }).index("by_key", ["key"]),
});
