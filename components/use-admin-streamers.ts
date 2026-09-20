"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminStreamerPages } from "@/lib/admin-streamer-pages";

export function useAdminStreamers(pageSize: number) {
  const convex = useConvex();
  const pages = useMemo(
    () =>
      new AdminStreamerPages(
        (args) => convex.query(api.admin.streamers, args),
        pageSize,
      ),
    [convex, pageSize],
  );
  const state = useSyncExternalStore(
    pages.subscribe,
    pages.getSnapshot,
    pages.getSnapshot,
  );
  useEffect(() => {
    void pages.refresh();
    return pages.cancel;
  }, [pages]);
  return {
    ...state,
    searchFor: pages.searchFor,
    refresh: pages.refresh,
    loadMore: pages.loadMore,
  };
}
