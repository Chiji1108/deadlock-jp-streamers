"use client";
import { DeadlockRank } from "./deadlock-rank";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { StreamingHoursHeatmap } from "./streaming-hours-heatmap";
import { api } from "@/convex/_generated/api";
import {
  Avatar,
  CollectionNotice,
  LoadingPanel,
  Metric,
  PeriodPicker,
  dateTime,
  number,
  periodLabels,
  useFilters,
  useFreshness,
  type Period,
} from "./dashboard-ui";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { LivePreview } from "./live-preview";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

export type StreamerData = NonNullable<
  FunctionReturnType<typeof api.dashboard.detail>
>;

export function StreamerDetail({ twitchId }: { twitchId: string }) {
  const { period, update } = useFilters();
  const data = useQuery(api.dashboard.detail, { twitchId, period });
  const fresh = useFreshness(data?.lastCollectedAt);
  if (data === undefined) return <LoadingPanel />;
  if (data === null)
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>
            <h1>配信者が見つかりません</h1>
          </EmptyTitle>
          <EmptyDescription>
            まだ観測していない配信者か、URLが異なる可能性があります。
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href="/">配信者ボードへ</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  return (
    <>
      <CollectionNotice />
      <StreamerDetailView
        data={data}
        fresh={fresh}
        onPeriodChange={(value) => update({ period: value })}
      />
    </>
  );
}

export function StreamerDetailView({
  data,
  fresh,
  onPeriodChange,
}: {
  data: StreamerData;
  fresh: boolean;
  onPeriodChange: (period: Period) => void;
}) {
  const { streamer, summary, period } = data;
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/?period=${period}`}>
            <ArrowLeft data-icon="inline-start" />
            配信者一覧
          </Link>
        </Button>
      </div>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            large
            name={streamer.displayName}
            url={streamer.profileImageUrl}
          />
          <div className="flex min-w-0 flex-col">
            <h1 className="break-all text-xl leading-6 font-semibold">
              {streamer.displayName}
            </h1>
            <span className="break-all text-sm leading-4 text-muted-foreground">
              @{streamer.login}
            </span>
          </div>
          <DeadlockRank rank={data.deadlockRank} />
        </div>
        <Button asChild variant="outline" size="sm">
          <a
            href={`https://www.twitch.tv/${encodeURIComponent(streamer.login)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Twitchで見る
            <ExternalLink data-icon="inline-end" />
          </a>
        </Button>
      </header>
      {fresh && data.live && (
        <LivePreview
          live={data.live}
          login={streamer.login}
          name={streamer.displayName}
        />
      )}
      <section className="flex flex-col gap-4" aria-labelledby="summary-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id="summary-title" className="text-base font-semibold">
              {period === "all" ? "累計" : periodLabels[period]}の集計
            </h2>
            <span className="text-xs text-muted-foreground">
              配信日数 {number(summary.streamingDays)}日
            </span>
          </div>
          <PeriodPicker period={period} onChange={onPeriodChange} />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric
            label="合計配信時間"
            value={number(summary.hoursStreamed, 1)}
            unit="時間"
          />
          <Metric
            label="平均視聴者"
            value={number(summary.averageViewers, 1)}
            unit="人"
          />
          <Metric
            label="ピーク視聴者"
            value={number(summary.peakViewers)}
            unit="人"
          />
          <Metric
            label="総視聴時間"
            value={number(summary.hoursWatched, 1)}
            unit="人時"
          />
        </div>
      </section>
      <div className="w-full min-w-0">
        <StreamingHoursHeatmap cells={data.heatmap} />
      </div>
      <section
        className="flex min-w-0 flex-col gap-3"
        aria-labelledby="sessions-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="sessions-title" className="text-base font-semibold">
            最近の配信
          </h2>
          <span className="text-xs text-muted-foreground">
            最新20件 · 観測した配信区間
          </span>
        </div>
        {data.recentSessions.length ? (
          <div className="min-w-0 rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>観測開始</TableHead>
                  <TableHead>タイトル</TableHead>
                  <TableHead className="text-right">配信時間</TableHead>
                  <TableHead className="text-right">平均視聴者</TableHead>
                  <TableHead className="text-right">ピーク視聴者</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs tabular-nums">
                        <span>{dateTime(session.startedAt)}</span>
                        <span className="text-muted-foreground">
                          {session.endedAt
                            ? `〜 ${dateTime(session.endedAt)}`
                            : fresh && data.isLive
                              ? "観測継続中"
                              : "最終観測時点"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="min-w-48 max-w-sm whitespace-normal break-words">
                        {session.title}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {number(session.hoursStreamed, 1)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {number(session.averageViewers, 1)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {number(session.peakViewers)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>まだ配信記録がありません</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}
