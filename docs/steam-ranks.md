# Steam紐付けとDeadlockランク

通常の操作はWebの `/admin` から行えます。[管理画面の手順](./admin.md)を参照してください。以下は管理ダッシュボードから操作する場合の補助手順です。

Convexダッシュボードの **Functions** から実行します。管理権限のあるメンバー専用です。Data画面で直接書き換えず、以下の関数を使ってください。

## 登録・変更

`steamLinks:link` を選択し、引数を入力します。

```json
{
  "twitchId": "対象配信者のTwitch ID",
  "steamAccount": "対象のSteamID64または数値ID付きプロフィールURL"
}
```

`twitchId` はサイトの詳細ページ `/streamers/482411607` の数字部分です。本人のSteamアカウントを確認してから登録してください。

`steamAccount` はSteamID64、`[U:1:12345]` 形式、数値account ID、`https://steamcommunity.com/profiles/…` に対応。カスタムURL `/id/…` は非対応です。数字を文字列として入力してください。

同じ配信者に再実行すると紐付けを変更します。別の配信者に登録済みのSteamアカウントは拒否します。

## 解除

`steamLinks:unlink` に `{"twitchId":"対象配信者のTwitch ID"}` を渡します。表示も自動で消えます。

## 更新・表示

登録直後に取得し、以後約1時間ごとに更新します。1分に最大10件ずつ処理するため大量登録時には順番待ちが発生します。未紐付けの配信者にはバッジを表示しません。

取得中、取得不可、ランク未確定を区別します。APIエラー・保護対象では以前のランクを非表示にし、次回更新で再試行します。バッジからSteamプロフィールに移動できます。ホバー・キーボードフォーカスで最終確認時刻を表示します。

ランクはDeadlock APIが観測した直近のランクマッチに基づき、ゲーム画面の現在値と一致するとは限りません。期間フィルターには連動しません。

参照: https://api.deadlock-api.com/docs — `/v1/players/{account_id}/rank`、`/v1/assets/ranks`。
