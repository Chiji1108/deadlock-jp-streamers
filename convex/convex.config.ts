import { defineApp } from "convex/server";
import { v } from "convex/values";
import aggregate from "@convex-dev/aggregate/convex.config";
const app = defineApp({
  env: {
    TWITCH_CLIENT_ID: v.optional(v.string()),
    TWITCH_CLIENT_SECRET: v.optional(v.string()),
  },
});
app.use(aggregate, { name: "duration" });
app.use(aggregate, { name: "watched" });
app.use(aggregate, { name: "activeDays" });
export default app;
