# Web管理画面

`/admin`（ローカルでは http://localhost:3000/admin）からClerkでログインします。管理画面へのリンクは公開ページに表示していないため、URLを直接開いてください。

## 操作

1. 配信者名で検索します（空欄で検索すると全員を表示）。
2. 「Steamを登録」または「変更」を押します。
3. 本人のSteamプロフィールの数値ID付きURL、SteamID64、SteamID3を入力し「保存」。
4. ランクは登録直後に取得され、以後約1時間ごとに更新されます。
5. 「解除」→「解除する」で紐付けのみ削除します。配信履歴は残ります。

カスタムURL `/id/名前` は非対応です。`/profiles/数値ID` を使ってください。

## 認証設定

Next.jsの `.env.local`（本番ではホスティング先）:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=Clerkの公開キー
CLERK_SECRET_KEY=Clerkの秘密キー
```

Convexの環境変数:

```
CLERK_JWT_ISSUER_DOMAIN=https://your-instance.clerk.accounts.dev
CLERK_ADMIN_USER_IDS=user_管理者のID
```

複数の管理者は `user_one,user_two` のようにカンマで区切ります。空欄では全員アクセス不可です。Clerkでログインできても、このリストにないアカウントは編集できません。管理者IDは認証済みのClerk subjectと照合し、issuerも確認します。メールアドレスやクライアントから渡された権限を信用しません。

現在の開発環境には `convex` JWTテンプレート（claims: `{"aud":"convex"}`）を設定済みです。別のClerk環境を作る場合は、ClerkのConvex integrationを有効化するか、このテンプレートを作成してください。インストール済みConvex SDKはどちらにも対応しています。

ClerkのキーはNext.jsだけで使用し、秘密キーをConvexやブラウザーへ渡しません。認証プロバイダーは管理画面だけで読み込みます。管理用の検索・登録・解除はすべてConvex側で権限を再確認します。

本番へ移す場合は本番用Clerkのキー・issuer・ユーザーIDをそれぞれ指定し、Next.jsとConvexを反映します。開発用のユーザーIDは本番とは別です。

## 動作確認

- 未ログインではログイン画面のみ。
- 一般アカウントでは「管理者権限がありません」。
- 指定した管理者では配信者の一覧、検索、登録・変更・解除。
- 公開ページはログイン不要。

[ClerkとConvexの公式ガイド](https://docs.convex.dev/auth/clerk)
