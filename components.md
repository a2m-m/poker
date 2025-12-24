④ ページ、資材リスト（実装に必要な資材・仕様)

対象：design.md

⸻

1. ページ（画面）一覧と資材マッピング

P1. ホーム（/）

目的：新規開始 / 再開 / リセット
必要コンポーネント
	•	PrimaryButton（新規ゲーム開始）
	•	SecondaryButton（前回を再開）
	•	DangerButton（リセット）
	•	ConfirmDialog（上書き/削除確認）
	•	Toast（復帰/削除完了）

資材
	•	文言：後述「6. 文言リスト」

⸻

P2. セットアップ（/setup）

目的：プレイヤーとブラインドの設定
必要コンポーネント
	•	PlayerListEditor
	•	PlayerRow（名前/スタック/削除/席順移動）
	•	AddPlayerForm
	•	BlindsEditor（SB/BB入力）
	•	PrimaryButton（開始）
	•	InlineError（2人未満など）
	•	ConfirmDialog（開始時の注意や上書きが必要なら）

入力制約
	•	名前：1〜12文字（推奨）、空は不可、重複は許可（ただし警告表示推奨）
	•	スタック：整数、0以上（開始時は1以上推奨）
	•	SB/BB：整数、SB < BB（基本）、最低1

⸻

P3. テーブル（/table）※メイン

目的：進行状況の共有、手番と必要額の明示、アクション導線
必要コンポーネント（最重要）
	•	StatusBar
	•	表示：ハンド番号、ストリート、目標、現在ベット、コール必要額、最小レイズ、ボタン/SB/BB位置
	•	PotPanel
	•	PotTotal
	•	SidePotBreakdown（折りたたみ）
	•	PlayerRing or PlayerList
	•	PlayerCard（名前/残スタック/投入額/状態/必要額）
	•	RoleBadge（D/SB/BB）
	•	StateBadge（参加中/フォールド/オールイン）
	•	TurnPanel
	•	TurnTitle（手番：〇〇）
	•	RequiredLine（必要：コールY/フォールド）
	•	AvailableLine（可能：チェック/ベット/レイズ最小Z/オールイン最大A）
	•	ActionButtonBar
	•	PrimaryButton（アクション入力）
	•	SecondaryButton（ログ）
	•	SecondaryButton（設定）
	•	UndoButton（常設、目立つが誤爆防止あり）
	•	Toast（ストリート遷移/復帰/エラー）
	•	ConfirmDialog（Undoの連続誤操作防止は任意）

表示仕様（固定）
	•	各プレイヤーカードに 必要 n を必ず表示（参加中のみ）
	•	色だけに依存しない（状態は文字で必ず出す）

⸻

P4. アクション入力モーダル（Table上のModal）

目的：その手番プレイヤーの行動入力を正しく・安全に完了
必要コンポーネント
	•	ActionModal
	•	ContextSummary（現在ベット/コール必要/最小レイズ/残スタック）
	•	ActionButtonGrid
	•	ActionButton（チェック/コール/ベット/レイズ/フォールド/オールイン）
	•	DisabledReason（灰色ボタンに理由1行）
	•	BetSizePicker（ベット/レイズ時）
	•	PresetButtons：最小、1/2ポット、ポット、最大（=オールイン）
	•	Stepper（+/-）
	•	Keypad（任意）
	•	RangeHint（最小〜最大）
	•	PrimaryButton（確定）
	•	SecondaryButton（キャンセル）

入力制約（UIでガード）
	•	チェック：コール必要額=0のみ
	•	ベット：そのストリートの現在ベット=0のみ
	•	レイズ：現在ベット>0 かつ「レイズ可能」なときのみ
	•	金額：
	•	最小ベット：BB
	•	最小レイズ：③に従う（直前上げ幅以上）
	•	最大：残スタック（オールイン）
	•	「最小レイズ未満のオールイン」発生時：再オープンしない状態を反映し、以後のRAISE可否を制御

⸻

P5. ショーダウン（/showdown）

目的：ポット（メイン/サイド）ごとに勝者を選び配当確定
必要コンポーネント
	•	ShowdownPotList
	•	PotCard（メイン/サイドn、金額、eligibleプレイヤー表示）
	•	WinnerSelector（複数選択可、eligible外は選択不可）
	•	PrimaryButton（配当確定）
	•	InlineError（未選択など）
	•	ConfirmDialog（確定前確認）

仕様
	•	勝者選択はポット単位（v1必須）
	•	複数選択＝同点分配
	•	端数処理：ボタンに近い方（時計回り優先）

⸻

P6. 配当結果（/payout）

目的：獲得額内訳と更新後スタック提示→次ハンド
必要コンポーネント
	•	PayoutSummary
	•	PayoutRow（プレイヤー名、獲得額、内訳）
	•	StackTable（更新後スタック一覧）
	•	PrimaryButton（次のハンドへ）

⸻

P7. ログ/履歴（/log）

目的：直近の流れ把握、揉め防止
必要コンポーネント
	•	ActionLogList
	•	LogRow（時刻or順序、プレイヤー、アクション、金額）
	•	SecondaryButton（戻る）

⸻

P8. 設定（/settings）

目的：端数/バーン/破棄/リセットなど運用設定
必要コンポーネント
	•	SettingRow（端数処理：表示のみでもOK）
	•	Toggle（バーン：やる/やらない ※v1は表示/保存だけでも可）
	•	DangerButton（このハンドを破棄してやり直し）
	•	DangerButton（ゲームリセット）
	•	ConfirmDialog

⸻

2. 共通コンポーネント資材（コンポーネントカタログ）
	•	Buttons：PrimaryButton, SecondaryButton, DangerButton, UndoButton
	•	Feedback：Toast, InlineError
	•	Dialog：ConfirmDialog
	•	Layout：Card, SectionHeader, Divider
	•	Table elements：StackTable, LogList
	•	Badges：RoleBadge(D/SB/BB), StateBadge(参加中/フォールド/オールイン)

⸻

3. アイコン・バッジ資材

3.1 ロールバッジ
	•	D（Dealer Button）
	•	SB
	•	BB

3.2 状態バッジ（文字固定）
	•	参加中
	•	フォールド
	•	オールイン

3.3 ストリート表示（文字固定）
	•	プリフロップ
	•	フロップ
	•	ターン
	•	リバー
	•	ショーダウン

⸻

4. データ構造（型）資材リスト（実装用）

TypeScript想定（JSでも可）。最低限必要な型。

4.1 基本
	•	PlayerId: string
	•	PlayerState = 'ACTIVE' | 'FOLDED' | 'ALL_IN'
	•	Street = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN' | 'PAYOUT'
	•	ActionType = 'CHECK' | 'BET' | 'CALL' | 'RAISE' | 'FOLD' | 'ALL_IN' | 'ADVANCE_STREET' | 'START_HAND' | 'END_HAND'

4.2 Player
	•	Player
	•	id: PlayerId
	•	name: string
	•	seatIndex: number
	•	stack: number
	•	state: PlayerState

4.3 Pot
	•	SidePot
	•	amount: number
	•	eligiblePlayerIds: PlayerId[]
	•	PotState
	•	main: number
	•	sides: SidePot[]

4.4 HandState（Undo用にログ含む）
	•	HandState
	•	handNumber: number
	•	dealerIndex: number
	•	sbIndex: number
	•	bbIndex: number
	•	street: Street
	•	currentTurnPlayerId: PlayerId
	•	currentBet: number
	•	lastRaiseSize: number（最小レイズ計算）
	•	contribThisStreet: Record<PlayerId, number>
	•	pot: PotState
	•	actionLog: ActionLogEntry[]
	•	reopenAllowed: boolean（最小レイズ未満オールインでfalseになり得る）

4.5 Log
	•	ActionLogEntry
	•	seq: number
	•	playerId?: PlayerId
	•	type: ActionType
	•	amount?: number
	•	street: Street
	•	snapshotRef?: string（Undo方式による）

4.6 GameSettings
	•	GameSettings
	•	sb: number
	•	bb: number
	•	roundingRule: 'BUTTON_NEAR'（v1固定）
	•	burnCard: boolean（表示/保存のみでも可）

⸻

5. ローカル保存（永続化）資材
	•	保存先：localStorage
	•	キー例：
	•	poker_dealer_v1_game_state
	•	poker_dealer_v1_settings
	•	保存タイミング：
	•	アクション確定ごと
	•	設定変更ごと
	•	復元：
	•	ホームの「前回を再開」可否判定に利用
	•	復元後、トースト：状態を復元しました

⸻

6. 文言リスト（固定テキスト資材）

※砕けない、事務的トーンで統一

6.1 状態バー
	•	ハンド：#{n}
	•	ストリート：{streetLabel}
	•	目標：全員の投入額を揃えます
	•	現在ベット：{x}
	•	コール必要額：{y}
	•	最小レイズ：{z} / 最小レイズ：—

6.2 手番エリア
	•	手番：{name}
	•	必要：コール {y}（継続） / フォールド（終了）
	•	可能：{actions}（例：チェック / レイズ（最小 400） / オールイン（最大 3150））

6.3 アクションボタン
	•	チェック
	•	コール {y}
	•	ベット…
	•	レイズ…
	•	フォールド
	•	オールイン {a}

6.4 無効理由（例）
	•	チェック不可：コールが必要です（{y}）
	•	ベット不可：既にベットがあります
	•	レイズ不可：最小レイズ未満のオールインにより再オープンしていません
	•	確定不可：入力額が範囲外です（最小 {min} / 最大 {max}）

6.5 確認ダイアログ
	•	タイトル：確認
	•	本文例：
	•	ゲームをリセットします。よろしいですか？
	•	現在のハンドを破棄してやり直します。よろしいですか？
	•	ボタン：
	•	実行 / キャンセル

6.6 トースト
	•	ストリートが{streetLabel}に進みました
	•	状態を復元しました
	•	配当を確定しました

⸻

7. 画面ごとの“実装チケット”粒度（最小セット）
	•	T1：セットアップ画面（P2）
	•	T2：テーブル基本表示（P3：StatusBar/PotPanel/PlayerCard/TurnPanel）
	•	T3：アクションモーダル（P4：ガード込み）
	•	T4：進行ロジック（手番/ストリート遷移/終了条件）
	•	T5：サイドポット計算 + ショーダウン（P5）
	•	T6：配当結果（P6）
	•	T7：Undo（ログ方式 or スナップショット方式）
	•	T8：localStorage永続化 + 再開（P1）

⸻
