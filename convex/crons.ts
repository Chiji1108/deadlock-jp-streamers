import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.interval(
  "Twitch Japanese Deadlock discovery",
  { minutes: 1 },
  internal.collector.collect,
  {},
);
crons.interval(
  "Expire unverified LIVE badges",
  { minutes: 1 },
  internal.maintenance.expireLive,
  {},
);
// JST date boundaries must roll over at exactly midnight.
crons.cron(
  "Refresh rolling JST ranking windows",
  // eslint-disable-next-line @convex-dev/no-top-of-hour-crons
  "0 15 * * *",
  internal.maintenance.refreshPeriods,
  {},
);
crons.interval(
  "Refresh linked Deadlock ranks",
  { minutes: 1 },
  internal.steamLinks.refreshDue,
  {},
);
crons.interval(
  "Complete rank ordering migration",
  { minutes: 1 },
  internal.rankOrdering.backfill,
  {},
);
export default crons;
