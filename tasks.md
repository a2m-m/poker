# Poker Dealer App — タスクリスト（DoD付き）v1.0

このタスクリストは、以下のドキュメント（`docs/` 配下）を参照して開発を進めるための拠り所です。

- ① ルールブック：`docs/rulebook.md`
- ② 要件定義：`docs/specs.md`
- ③ デザイン要件定義：`docs/design.md`
- ④ ページ・資材リスト：`docs/components.md`
- ⑤ 仕様書：`docs/specification.md`

進め方（方針）：
**開発準備 → 画面/資材（外側） → 動き/ロジック（中身）** の順に、小さめタスクで進行します。

---

## ステップA：開発準備（環境・テスト・デプロイ）

| NO | タスク名 | タスク詳細 | 参照する資料 |
|---:|---|---|---|
| 1 | リポジトリ構成整理 | `docs/` に5ドキュメント配置、`src/` 構成方針（pages/components/domain）を決める。**DoD:** 5ファイルがリポジトリにあり、`src/` の方針がREADME等に1段落で明記されている。 | `docs/specification.md` / `docs/components.md` |
| 2 | フロント雛形作成 | Vite + React + TypeScriptで初期化、起動/ビルドスクリプト整備。**DoD:** `npm i`→`npm run dev`で表示、`npm run build`が成功。 | `docs/specification.md` |
| 3 | ルーティング方針決定 | GitHub Pages前提で `HashRouter`（推奨）など方式を固定。**DoD:** Pages上で直URLアクセス/リロードしても404にならない。 | `docs/specification.md` |
| 4 | UI基盤導入 | CSS方針（例：Tailwind or CSS Modules）決定。**DoD:** 基本レイアウト（カード/ボタン/余白）が1ページで確認できる。 | `docs/design.md` |
| 5 | フォーマッタ/リンタ | Prettier + ESLint導入、scripts整備。**DoD:** `npm run lint` と `npm run format` が成功、CIでも同じチェックが走る。 | `docs/specs.md` |
| 6 | テスト基盤導入 | Vitest（+ Testing Library）導入。**DoD:** `npm run test`でサンプルテストが1本以上通る。 | `docs/specs.md` / `docs/specification.md` |
| 7 | 型チェック/ビルドCI | Actionsで `lint → test → build` をPR/Pushで実行。**DoD:** GitHub Actionsが全ジョブグリーン。 | `docs/specs.md` |
| 8 | GitHub PagesデプロイCI | ActionsでPagesへ自動デプロイ。**DoD:** main更新でデプロイされ、公開URLでアプリが表示される。 | `docs/specification.md` |
| 9 | ローカル保存キー設計 | localStorageキー名・保存タイミングを定数化。**DoD:** `storageKeys` 等に集約され、ハードコードが残らない。 | `docs/specification.md` |
| 10 | エラーハンドリング方針 | 例外時にUndo/ログ導線を出す枠を用意。**DoD:** 想定外時に真っ白にならず、最低限の案内UIが出る。 | `docs/design.md` / `docs/specification.md` |

---

## ステップB：外側（ページ/コンポーネント）をダミーで作る

| NO | タスク名 | タスク詳細 | 参照する資料 |
|---:|---|---|---|
| 11 | ルート（ページ）骨組み | `/` `/setup` `/table` `/showdown` `/payout` `/log` `/settings` のページを作り遷移確認。**DoD:** 全ページに遷移でき、戻るも成立。 | `docs/design.md` / `docs/specification.md` |
| 12 | 共通UI：Button群 | `Primary/Secondary/Danger/Undo` 作成。**DoD:** 4種が統一され、disabled含め見た目確認できる。 | `docs/components.md` / `docs/design.md` |
| 13 | 共通UI：Dialog/Toast | `ConfirmDialog` と `Toast` 最低実装。**DoD:** 任意ページで表示/閉じるができ、再利用できるAPIになっている。 | `docs/components.md` / `docs/design.md` |
| 14 | ホーム画面（静的） | 「新規/再開/リセット」配置。**DoD:** クリックで遷移/確認ダイアログが出る（処理は仮でOK）。 | `docs/design.md` |
| 15 | セットアップ画面（静的） | プレイヤー編集UIを配置。**DoD:** 追加/削除/並べ替え/数値入力のUIが揃う（状態は仮でOK）。 | `docs/design.md` / `docs/components.md` |
| 16 | テーブル画面レイアウト | StatusBar/Pot/Player/Turn/ActionBar配置。**DoD:** ダミーで「手番/必要/可能」が確認できる。 | `docs/design.md` / `docs/components.md` |
| 17 | PlayerCard作成 | 名前/残高/投入/状態/必要額 + D/SB/BB。**DoD:** `参加中/フォールド/オールイン` と `必要 n` が文字で表示される。 | `docs/design.md` / `docs/components.md` |
| 18 | StatusBar作成 | ハンド#・ストリート・目標・現在ベット・コール必要額・最小レイズ。**DoD:** 固定領域に全項目が表示される。 | `docs/design.md` |
| 19 | TurnPanel作成 | `手番/必要/可能` の3行固定表示。**DoD:** 事務的文言で崩れず表示される。 | `docs/design.md` |
| 20 | ActionModal（見た目） | ボタン群＋ベット額UI見た目実装。**DoD:** 開閉でき、BET/RAISE時に金額UIが表示される。 | `docs/design.md` / `docs/components.md` |
| 21 | ログ画面（静的） | ログ一覧表示の器。**DoD:** 配列を渡すと一覧表示でき、戻るでtableへ戻れる。 | `docs/design.md` |
| 22 | ショーダウン画面（静的） | Potカード＋勝者選択UI。**DoD:** メイン/サイドのカードが並び、複数選択UIが見える。 | `docs/design.md` |
| 23 | 配当結果画面（静的） | 結果表示枠。**DoD:** 勝者/獲得額/更新後スタックがダミーで成立。 | `docs/design.md` |
| 24 | 設定画面（静的） | 端数/バーン表示、破棄/リセットUI。**DoD:** 危険操作はConfirmDialog経由で実行できる。 | `docs/design.md` |

---

## ステップC：状態管理の器（中身の入れ物）

| NO | タスク名 | タスク詳細 | 参照する資料 |
|---:|---|---|---|
| 25 | 型定義（domain） | `Player/HandState/GameState` 等を定義。**DoD:** `tsc` が通り、主要型が1箇所に集約。 | `docs/specification.md` |
| 26 | 初期State生成 | `createNewGame(settings, players)` 作成。**DoD:** セットアップ値から `GameState` が生成され、table描画できる。 | `docs/specification.md` |
| 27 | 画面間でState共有 | Context/Zustand等で共有。**DoD:** setup→tableへ state 引継ぎ、更新がUIに反映される。 | `docs/specs.md` |
| 28 | “新規開始”配線 | ホーム→セットアップ→開始で生成→table。**DoD:** 2人以上で開始するとtableにプレイヤーが表示。 | `docs/specs.md` / `docs/specification.md` |
| 29 | “再開/保存”薄実装 | 復元枠だけ作る。**DoD:** 保存があると再開が出て、復元してtable表示できる。 | `docs/specification.md` |
| 30 | ActionLogの枠 | log保持＋表示接続。**DoD:** 何かの操作（仮）でログが増え、/logで見える。 | `docs/specification.md` / `docs/design.md` |
| 31 | Undoの枠 | Undo配線（仮）。**DoD:** Undoでログが減り、UIが部分的に戻る（完全復元は後続）。 | `docs/specification.md` |

---

## ステップD：ゲームエンジン（純関数）を積み上げる

| NO | タスク名 | タスク詳細 | 参照する資料 |
|---:|---|---|---|
| 32 | 位置計算ユーティリティ | D/SB/BB計算関数（2人分岐含む）。**DoD:** 2人/5人で表示が手動確認できる。 | `docs/rulebook.md` / `docs/specification.md` |
| 33 | 手番計算（ストリート開始） | UTG/ボタン左開始の計算。**DoD:** プリフロップはUTG、以降はボタン左開始になる。 | `docs/rulebook.md` / `docs/specification.md` |
| 34 | コール必要額計算 | `callNeeded` 実装＆表示接続。**DoD:** StatusBar/TurnPanel/PlayerCardの `必要` が連動して変化。 | `docs/design.md` / `docs/specification.md` |
| 35 | アクション可否判定 | `getAvailableActions(player)` 実装。**DoD:** ActionModalのボタン出し分けが仕様どおり。 | `docs/rulebook.md` / `docs/specification.md` / `docs/design.md` |
| 36 | 最小レイズ計算 | `minRaiseTo` 実装。**DoD:** 最小レイズ値が表示され、範囲外は確定不可。 | `docs/rulebook.md` / `docs/specification.md` |
| 37 | 支払い反映（単体） | `applyPayment` 実装。**DoD:** CALL等でスタック減・投入増・ポット増が一貫。 | `docs/specification.md` |
| 38 | 基本アクション適用 | CHECK/CALL/FOLD適用→次手番。**DoD:** 手番が進み、フォールド者は以後手番に来ない。 | `docs/rulebook.md` / `docs/specification.md` |
| 39 | BET/RAISE適用 | 金額制約込み反映。**DoD:** currentBet/lastRaiseSizeが更新され、他者のコール必要額が更新。 | `docs/rulebook.md` / `docs/specification.md` |
| 40 | オールイン適用 | ALL_IN反映＋再オープン判定。**DoD:** ALL_IN化し、必要に応じて reopenAllowed が変化。 | `docs/rulebook.md` / `docs/specification.md` |
| 41 | ストリート終了判定 | 終了条件判定→自動遷移。**DoD:** 条件でストリートが進み、投入額がリセットされる。 | `docs/rulebook.md` / `docs/specification.md` |
| 42 | ハンド終了判定 | 残り1人→配当、複数→ショーダウン。**DoD:** 状況に応じて `/payout` or `/showdown` に遷移する。 | `docs/rulebook.md` / `docs/specification.md` |

---

## ステップE：サイドポット/ショーダウン/配当

| NO | タスク名 | タスク詳細 | 参照する資料 |
|---:|---|---|---|
| 43 | 総投入（累積）導入 | `totalContribThisHand`（内部）導入。**DoD:** ストリート跨ぎでも総投入が保持される。 | `docs/specification.md` |
| 44 | ポット再計算（純関数） | 総投入→main/sides/eligible再計算。**DoD:** 1回以上のALL-INでside potが生成され、eligibleが妥当。 | `docs/specification.md` / `docs/rulebook.md` |
| 45 | 内訳表示接続 | PotPanelにmain/side内訳表示。**DoD:** 内訳がUIに出て、折りたたみが機能する。 | `docs/design.md` / `docs/components.md` |
| 46 | ショーダウン制約 | eligible外を選択不可。**DoD:** side potで対象外プレイヤーを選べない。 | `docs/design.md` / `docs/specification.md` |
| 47 | 分配計算（端数含む） | distribute実装（同点・端数）。**DoD:** 同点分配でき、端数がボタン近い勝者へ付与。 | `docs/rulebook.md` / `docs/specification.md` |
| 48 | 配当結果反映 | 分配→スタック更新→payout表示。**DoD:** payout表示とスタックが一致する。 | `docs/design.md` / `docs/specification.md` |
| 49 | 次ハンド開始 | ボタン移動→SB/BB徴収→プリフロップ。**DoD:** 「次のハンドへ」で徴収・手番・表示が更新。 | `docs/rulebook.md` / `docs/specification.md` |

---

## ステップF：Undo/永続化（本実装）

| NO | タスク名 | タスク詳細 | 参照する資料 |
|---:|---|---|---|
| 50 | スナップショットUndo | 確定前HandState保存→Undo復元。**DoD:** 任意アクション→Undoで手番/ポット/投入/状態が完全復元。 | `docs/specification.md` |
| 51 | Undo対象拡張 | ストリート遷移/開始もUndo対象。**DoD:** 遷移直後でもUndoで前状態に戻れる。 | `docs/specification.md` |
| 52 | localStorage保存（本実装） | 保存/復元を一貫実装。**DoD:** リロード後も状態維持、再開導線が正しい。 | `docs/specification.md` |
| 53 | 再開導線仕上げ | 破損時の安全処理。**DoD:** 破損データでもクラッシュせず、リセット案内が出る。 | `docs/design.md` / `docs/specification.md` |

---

## ステップG：テスト・品質

| NO | タスク名 | タスク詳細 | 参照する資料 |
|---:|---|---|---|
| 54 | 位置計算テスト | D/SB/BBテスト作成。**DoD:** 2/3/5人ケースがunit testでパス。 | `docs/rulebook.md` / `docs/specification.md` |
| 55 | コール/最小レイズテスト | callNeeded/minRaiseToテスト。**DoD:** 複数パターンで期待値一致。 | `docs/rulebook.md` / `docs/specification.md` |
| 56 | 再オープン禁止テスト | 最小未満ALL-IN時の制約。**DoD:** “既行動者がレイズ不可”がテストで担保。 | `docs/rulebook.md` / `docs/specification.md` |
| 57 | サイドポットテスト | 複数ALL-INテスト。**DoD:** main/sides/eligibleが期待どおり。 | `docs/rulebook.md` / `docs/specification.md` |
| 58 | 分配/端数テスト | 同点＋端数テスト。**DoD:** 端数がボタン近い勝者に付与される。 | `docs/rulebook.md` / `docs/specification.md` |
| 59 | 主要画面スモークテスト | 遷移/モーダル/保存復元。**DoD:** 主要導線が落ちないUIテストが最低1本通る。 | `docs/design.md` / `docs/specs.md` |

---

## ステップH：デプロイ仕上げ・運用

| NO | タスク名 | タスク詳細 | 参照する資料 |
|---:|---|---|---|
| 60 | Pages本番動作確認 | 端末差分含め確認。**DoD:** Pagesで遷移/リロード/再開が問題なく、iPad Safariで崩れない。 | `docs/specification.md` / `docs/design.md` |
| 61 | 例外時導線の最終調整 | Undo/ログ/破棄導線の文言・UI最終化。**DoD:** 例外時でも復旧手段（Undo/破棄/ログ）が見つけられる。 | `docs/design.md` / `docs/specification.md` |
| 62 | README整備 | 起動・デプロイ・遊び方を短く。**DoD:** READMEだけで「開始→1ハンド進行」まで辿れる。 | `docs/specs.md` / `docs/design.md` |
