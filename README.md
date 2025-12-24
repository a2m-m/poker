# Poker Dealer App

ポーカーディーラー支援アプリのリポジトリです。要件や設計は `docs/` 配下にまとめています（ルールブックや仕様書など5点）。

## src構成方針

フロントエンドは Vite + React + TypeScript を想定し、画面エントリは `src/pages/`、再利用UIやレイアウトは `src/components/`、ドメインロジック・型定義・状態管理の土台は `src/domain/` に置く三層構造とします。各層間は props と型で疎結合に保ち、UIと計算ロジックを明確に分離します。

## 開発のはじめ方

```bash
npm install
npm run dev   # ローカルで動作確認（http://localhost:5173）
npm run build # 本番ビルド
```

## デプロイ

`main` ブランチへの push をトリガーに、`.github/workflows/deploy.yml` がビルド成果物を GitHub Pages に自動デプロイします。ページはリポジトリ名に合わせて `/poker/` 配下に配置されるため、Vite の `base` も同じパスに設定しています。

## ルーティング方針

GitHub Pages へのデプロイを想定し、サーバー側での 404 ハンドリングに依存しないよう `HashRouter` を採用しています。`/#/table` のようにハッシュ付きの URL になるため、直リンクやリロードでも安全に各ページへ遷移できます。
