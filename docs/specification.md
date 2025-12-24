⑤ 仕様書（統合版）

対象：rulebook.md / specs.md / design.md / components.md
目的：この仕様書を拠り所に、後続の「AIコーディング用タスクリスト」を切れる状態にする

⸻

1. プロダクト概要

1.1 目的

物理トランプでテキサス・ホールデムを遊ぶ際、アプリが進行管理・チップ台帳・手番表示・サイドポット計算・配当反映を担い、迷いと計算ミスを削減する。

1.2 前提
	•	カードとチップのやり取りは物理
	•	アプリは「台帳（スタック）を正」とする
	•	デプロイ：GitHub Pages（静的ホスティング）
	•	v1は テキサス・ホールデム / ノーリミット固定
	•	役判定は自動化しない（ショーダウンで勝者を人間が選択）

⸻

2. スコープ

2.1 v1で実装する
	•	プレイヤー設定（名前/席順/初期スタック）
	•	SB/BB徴収、ボタン移動
	•	ストリート進行（Pre/Flop/Turn/River）
	•	アクション入力（チェック/ベット/コール/レイズ/フォールド/オールイン）
	•	ポット/投入額/残スタックの正確な計算
	•	オールイン時のサイドポット計算
	•	ショーダウン（ポット単位で勝者選択、同点分配）
	•	端数処理（ボタンに近い方へ）
	•	Undo（1手戻す）
	•	localStorageで再開

2.2 v1で実装しない
	•	カード入力、役判定の自動計算
	•	アカウント、オンライン対戦、統計、クラウド共有
	•	カメラ等による認識

⸻

3. 用語・定義
	•	スタック：各プレイヤー残高（アプリの持ち点）
	•	投入額（このストリート）：当該ストリート中に支払った合計
	•	現在ベット（currentBet）：当該ストリートの最高投入額
	•	コール必要額：max(0, currentBet - contribThisStreet[player])
	•	最小レイズ：直前上げ幅 lastRaiseSize 以上で上げる必要がある
	•	再オープン（reopen）：最小レイズ未満のオールインが入った場合、既に行動済みのプレイヤーが追加レイズできない状態（v1で実装）

⸻

4. 画面仕様（ルーティング/構成）

4.1 ルート
	•	/ ホーム
	•	/setup セットアップ
	•	/table テーブル
	•	/showdown ショーダウン
	•	/payout 配当結果
	•	/log ログ
	•	/settings 設定

4.2 UI文言トーン
	•	丁寧・事務的（「〜です」「〜できます」）
	•	ボタンは短く、数値は併記（例：コール 200）

⸻

5. テーブル画面（初心者配慮の固定要件）

5.1 常時表示（必須）
	•	状態バー：ハンド番号 / ストリート / 目標 / 現在ベット / コール必要額（手番基準）/ 最小レイズ（可能時）/ D・SB・BB位置
	•	手番エリア：
	•	手番：{name}
	•	必要：コール {y}（継続） / フォールド（終了）
	•	可能：{actions}（可能操作のみ列挙）
	•	各プレイヤーカード：
	•	名前、残スタック、投入額（このストリート）、状態（参加中/フォールド/オールイン）
	•	必要 n を文字で表示（参加中のみ）

5.2 アクションモーダル（必須）
	•	タイトル：手番：〇〇
	•	状況：現在ベット/コール必要/最小レイズ/残スタック
	•	ボタン：チェック コール Y ベット… レイズ… フォールド オールイン A
	•	押せないボタンは灰色 + 理由1行（例：チェック不可：コールが必要です（Y））

⸻

6. ドメインモデル（データ設計）

TypeScript想定（JSでも可）。

type PlayerId = string;
type PlayerState = 'ACTIVE' | 'FOLDED' | 'ALL_IN';
type Street = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN' | 'PAYOUT';

type Player = {
  id: PlayerId;
  name: string;
  seatIndex: number;   // 時計回り
  stack: number;       // 残高
  state: PlayerState;
};

type SidePot = { amount: number; eligiblePlayerIds: PlayerId[]; };
type PotState = { main: number; sides: SidePot[]; };

type ActionType =
  | 'CHECK' | 'BET' | 'CALL' | 'RAISE' | 'FOLD' | 'ALL_IN'
  | 'ADVANCE_STREET' | 'START_HAND' | 'END_HAND';

type ActionLogEntry = {
  seq: number;
  type: ActionType;
  playerId?: PlayerId;
  amount?: number;     // BET/RAISE/CALL/ALL_IN時の支払額 or 到達額（実装で統一）
  street: Street;
  snapshot?: HandState; // Undo方式により利用
};

type GameSettings = {
  sb: number;
  bb: number;
  roundingRule: 'BUTTON_NEAR'; // v1固定
  burnCard: boolean;           // 表示/保存のみでも可
};

type HandState = {
  handNumber: number;
  dealerIndex: number;
  sbIndex: number;
  bbIndex: number;
  street: Street;

  currentTurnPlayerId: PlayerId;

  currentBet: number;
  lastRaiseSize: number;      // 最小レイズ計算用
  reopenAllowed: boolean;     // 最小レイズ未満オールインで false

  contribThisStreet: Record<PlayerId, number>; // ストリート投入
  pot: PotState;

  actionLog: ActionLogEntry[];
};

type GameState = {
  settings: GameSettings;
  players: Player[];
  hand: HandState;
};


⸻

7. コアロジック仕様（実装の拠り所）

7.1 位置計算（ボタン/SB/BB）
	•	毎ハンド、dealerIndex = (dealerIndex + 1) % activeSeats
	•	SB/BBはボタン左から順に割当
	•	ヘッズアップ（2人）：
	•	ボタンの人がSBを払い、プリフロップはボタンが先に行動
	•	フロップ以降は相手が先に行動

実装方針：getActivePlayerIdsInSeatOrder() を作り、人数で分岐する。

7.2 ストリートの手番開始
	•	プリフロップ：UTG（BBの左隣のアクティブ）
	•	フロップ以降：ボタン左から最初のアクティブ

7.3 アクション可否（UIとバリデーションの共通ルール）
	•	callNeeded = max(0, currentBet - contribThisStreet[p])
	•	CHECK：callNeeded == 0
	•	CALL：callNeeded > 0 かつ stack > 0
	•	BET：currentBet == 0
	•	RAISE：
	•	currentBet > 0
	•	reopenAllowed == true または「そのプレイヤーがまだこのストリートで未行動」（※簡易実装は reopenAllowed で一律制御でも可。正確にやるなら “既行動者のみ禁止” を追加）
	•	FOLD：常に可（ACTIVEのみ）
	•	ALL-IN：stack > 0

7.4 金額制約（ノーリミット）
	•	BET最小：BB
	•	RAISE最小：「到達ベット額」が currentBet + lastRaiseSize 以上
	•	最大：残スタックを超えない（オールインが上限）

7.5 支払い処理（共通）

プレイヤーが支払う額 pay を計算して
	•	players[p].stack -= pay
	•	contribThisStreet[p] += pay
	•	ポットへ加算（サイドポット生成は 7.6）
	•	stack==0 になったら state=ALL_IN

7.6 サイドポット生成（オールイン対応）

v1は「投入の累積（総投入）」を基に、アクション確定のたびに再計算する方式を推奨（バグりにくい）。

推奨データ：totalContribThisHand[player] を内部で持つ
（contribThisStreet だけだと複数ストリートで崩れるため）

再計算アルゴリズム（概念）
	1.	ACTIVE/FOLDED/ALL_IN問わず「このハンドで実際に出した総額」を集計
	2.	フォールドしたプレイヤーは eligibleから除外（ただしポット金額には含まれる）
	3.	総投入額の昇順で層（レイヤ）を作り、
	•	そのレイヤ分×対象人数 = ポット増分
	•	eligibleは「そのレイヤ以上を出していてフォールドしていない人」

これにより、複数回オールイン・複数サイドでも安定して整合する。

※実装を簡単にするなら「サイドポットはショーダウン直前に確定計算」でも可。ただしUI内訳表示のため、確定タイミングを決めて一貫させる。

7.7 ストリート終了条件と遷移

ストリートは、以下を満たしたら終了：
	•	フォールド/オールインを除くアクティブ全員が、contribThisStreet が揃っている（= currentBet に到達している）
	•	かつ未行動者がいない（初回ベット後の一周を担保）

遷移時：
	•	contribThisStreet を全員 0 にリセット
	•	currentBet=0、lastRaiseSize=bb（または直近ルールに合わせる）
	•	次ストリートの手番開始プレイヤーを設定
	•	トースト：ストリートが{street}に進みました

7.8 ハンド終了
	•	残存（フォールドしていない）プレイヤーが1人：即終了→配当へ
	•	リバー終了後に複数残存：ショーダウンへ

7.9 ショーダウン（ポット単位勝者選択）
	•	各ポット（メイン/サイド）に対し
	•	eligible（フォールドしていない & 当該ポット参加条件を満たす）から勝者を1人以上選択
	•	複数選択＝同点分配

7.10 分配と端数処理
	•	分配は整数チップ単位
	•	端数は **ボタンに近い方（時計回り優先）**へ付与
	•	同点勝者が複数のとき、席順でボタンに近い勝者へ余りを配る

⸻

8. Undo（1手戻す）仕様

推奨方式（堅牢）
	•	各アクション確定前に HandState スナップショットをログに保持し、Undoで復元
	•	actionLogEntry.snapshot = deepCopy(handStateBefore)
	•	Undoは「最後のログを1つpopして snapshot を復元」
	•	復元対象：手番、ストリート、ポット、投入、プレイヤー状態、reopenAllowed 等すべて

⸻

9. 永続化（再開）仕様
	•	保存先：localStorage
	•	キー：
	•	poker_dealer_v1_game_state
	•	保存タイミング：アクション確定ごと、設定変更ごと
	•	起動時：
	•	保存があれば「前回を再開」を表示
	•	復元後トースト：状態を復元しました

⸻

10. エラー/例外（UI上の扱い）
	•	不正入力（範囲外、禁止操作）は「押せない＋理由表示」で予防
	•	それでも整合性が壊れた場合（想定外）：
	•	直近ログ導線表示
	•	Undoを強調
	•	「このハンドを破棄してやり直し」：
	•	現在ハンドを破棄し、同じボタン位置のまま新ハンド開始（またはボタン進めない、で固定）

⸻

11. 受け入れ条件（最低限のテスト観点）
	•	5人で開始し、SB/BB/Dがハンドごとに正しく回る
	•	プリフロップの最初の手番がUTGになる
	•	コール必要額/最小レイズが常に正しく表示され、不正ボタンが押せない
	•	オールインでサイドポットが発生しても、eligible制約つきで分配できる
	•	残り1人で即終了し、勝者にポットが反映される
	•	Undoで直近1手を戻して整合性が保たれる
	•	リロード後に状態が復元される

⸻

12. 実装・デプロイ前提（GitHub Pages）
	•	SPAの場合は 404対策（404.html or HashRouter 等）を採用
	•	ルーティング方式はどちらかに統一：
	•	方式A：Hash Router（GitHub Pagesで簡単）
	•	方式B：404リダイレクト（History API）

⸻

この⑤は「何を作るか／どう動くか／何を正とするか／どこまで自動化するか（しないか）」を固定した“拠り所”です。
次のタスクリスト作成では、この仕様書の章立て（画面/コアロジック/永続化/Undo/テスト）をそのままチケット単位に割っていけば、AIコーディングが迷いにくくなります。
