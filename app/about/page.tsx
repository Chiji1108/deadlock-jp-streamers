import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
export const metadata: Metadata = { title: "データについて" };
export default function About() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 text-sm leading-7 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_p]:text-muted-foreground">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/">← 配信者一覧</Link>
      </Button>

      <h1 className="text-xl font-semibold">データについて</h1>
      <p>
        日本語でDeadlockを配信する人たちを、観測データから見つけるためのボードです。
      </p>
      <section>
        <h2>データの収集開始日</h2>
        <p>
          2026年9月19日（日本時間）からデータを収集しています。それ以前の配信履歴は含まれません。7日・30日・90日・累計のいずれも、収集開始後に観測できたデータを集計しています。
        </p>
      </section>
      <section>
        <h2>何を計測している？</h2>
        <p>
          Twitchで配信言語を日本語に設定し、Deadlockカテゴリで配信しているチャンネルが対象です。国籍による判定ではありません。約1分ごとに取得した情報をもとに、画面を自動更新します。
        </p>
      </section>
      <section>
        <h2>配信時間と視聴者数</h2>
        <p>
          このサービスが配信を発見した時点から計測します。観測と観測の間は、前回の視聴者数が続いたものとして計算します。平均視聴者数は「総視聴時間
          ÷ 配信時間」。ピーク視聴者数は、観測できた中での最大値です。
        </p>
        <p>
          「総視聴時間」は、視聴者数と配信時間を掛け合わせた値です。例えば10人が1時間視聴すると10人時になります。ユニーク視聴者数ではありません。
        </p>
      </section>
      <section>
        <h2>期間とグラフ</h2>
        <p>
          7日・30日・90日は、当日を含む日本時間の暦日です。累計はこのサービスによる計測開始以降の記録です。詳細のグラフと時間帯は直近90日間の観測を表示します。
        </p>
        <p>
          時間帯の濃淡は、その曜日・時間帯の経過時間に対する観測配信時間の割合です。今後の配信予定を表すものではありません。
        </p>
      </section>
      <section>
        <h2>データが途切れたとき</h2>
        <p>
          取得間隔が3分を超えた場合、空白の時間を推測で埋めません。新鮮な観測がない配信のLIVE表示も停止します。短時間のゲーム変更や配信の中断は、観測の間に起きると検知できない場合があります。
        </p>
      </section>
      <Separator />
      <p className="text-xs">
        本サービスはValve・Twitchとは関係のない非公式プロジェクトです。
      </p>
    </article>
  );
}
