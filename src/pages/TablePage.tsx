import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ActionModal } from '../components/ActionModal';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PlayerCard, type PlayerRole, type PlayerStatus } from '../components/PlayerCard';
import { StatusBar } from '../components/StatusBar';
import { TurnPanel } from '../components/TurnPanel';
import styles from './TablePage.module.css';

interface TablePageProps {
  description: string;
}

type PlayerStub = {
  id: string;
  name: string;
  role?: PlayerRole;
  stack: number;
  committed: number;
  status: PlayerStatus;
  needed: number;
};

const players: PlayerStub[] = [
  { id: 'p1', name: '佐藤', role: 'D', stack: 18500, committed: 400, needed: 0, status: '参加中' },
  { id: 'p2', name: '鈴木', role: 'SB', stack: 19600, committed: 200, needed: 600, status: '参加中' },
  { id: 'p3', name: '高橋', role: 'BB', stack: 17300, committed: 800, needed: 0, status: '参加中' },
  { id: 'p4', name: '田中', stack: 12000, committed: 800, needed: 0, status: 'オールイン' },
  { id: 'p5', name: '伊藤', stack: 9600, committed: 400, needed: 400, status: '参加中' },
];

export function TablePage({ description }: TablePageProps) {
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const turnPlayer = players.find((player) => player.id === 'p5');
  const minRaiseDisplay = 1200;
  const currentBet = 800;
  const turnPlayerName = turnPlayer?.name ?? '—';
  const requiredText = turnPlayer
    ? `コール ${turnPlayer.needed.toLocaleString()}（継続）`
    : 'コール 0（継続）';
  const availableText = turnPlayer
    ? `チェック / レイズは ${minRaiseDisplay.toLocaleString()} 以上 / オールイン ${turnPlayer.stack.toLocaleString()}`
    : 'チェック / レイズ / オールイン';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>/table</p>
          <h2 className={styles.title}>テーブル</h2>
        </div>
        <p className={styles.lead}>{description}</p>
        <p className={styles.note}>
          状態バー / ポット表示 / プレイヤーリスト / 手番エリアを配置したレイアウトデモです。まだロジックは持たせず、
          「手番・必要・可能」の表示位置とアクションボタンのまとまりを固定しています。
        </p>
      </header>

      <Card
        eyebrow="Status Bar"
        title="ステータスバー"
        description="ハンド進行中に常時表示するステータスの配置サンプルです。"
      >
        <StatusBar
          handNumber={12}
          street="ターン"
          goal="全員の投入額を揃えます"
          currentBet={800}
          callNeeded={400}
          minRaise={1200}
          buttonPlayer="佐藤"
          smallBlindPlayer="鈴木"
          bigBlindPlayer="高橋"
        />
      </Card>

      <div className={styles.topGrid}>
        <Card
          eyebrow="Pot"
          title="ポット表示"
          description="合計と内訳をまとめた中央エリアの想定です。折りたたみ可能なリストを置く余白を確保しています。"
        >
          <div className={styles.potSummary}>
            <div>
              <p className={styles.potLabel}>ポット合計</p>
              <p className={styles.potTotal}>5,200</p>
            </div>
            <div className={styles.potBreakdown}>
              <span className={styles.badge}>Main</span>
              <span className={styles.potDetail}>メイン 3,200</span>
              <span className={styles.potDetail}>サイド1 2,000</span>
              <span className={styles.toggleHint}>（内訳の折りたたみ想定）</span>
            </div>
          </div>
        </Card>

        <Card
          eyebrow="Turn"
          title="手番エリア"
          description="「手番 / 必要 / 可能」を3行で固定表示する領域です。ボタンとは分けて目視しやすくしています。"
        >
          <TurnPanel
            turnPlayer={turnPlayerName}
            positionLabel="UTG"
            requiredText={requiredText}
            availableText={availableText}
          />
        </Card>
      </div>

      <div className={styles.mainGrid}>
        <Card
          eyebrow="Players"
          title="プレイヤー表示"
          description="席順に並べたプレイヤーカードのダミーです。必要額やD/SB/BBバッジの表示場所を確認できます。"
        >
          <div className={styles.playerList} aria-label="プレイヤー一覧">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                name={player.name}
                role={player.role}
                stack={player.stack}
                committed={player.committed}
                needed={player.needed}
                status={player.status}
                isActive={player.id === turnPlayer?.id}
                turnNote={player.id === turnPlayer?.id ? 'このプレイヤーの手番です。' : undefined}
              />
            ))}
          </div>
        </Card>

        <Card
          eyebrow="Actions"
          title="アクション入力の枠"
          description="ボタン群と導線をまとめるアクションバーの配置例です。実処理は後続で接続します。"
        >
          <div className={styles.actionStack}>
            <div className={styles.actionButtons}>
              <Button variant="primary" block onClick={() => setActionModalOpen(true)}>
                アクションを入力（モーダル想定）
              </Button>
              <Button variant="undo" block>
                Undo（直前を取り消す）
              </Button>
            </div>
            <div className={styles.secondaryActions}>
              <Button variant="secondary">ログを確認</Button>
              <Button variant="secondary">ショーダウンへ</Button>
              <Button variant="danger">設定 / リセット</Button>
            </div>
            <div className={styles.navLinks}>
              <NavLink to="/log" className={styles.textLink}>
                /log に移動して履歴を一覧
              </NavLink>
              <NavLink to="/showdown" className={styles.textLink}>
                /showdown で勝者選択を確認
              </NavLink>
            </div>
            <p className={styles.actionNote}>
              モーダルを開くとアクション候補とベット/レイズ時の金額入力UIが表示されます。ここでは見た目と導線のみを
              固定しています。
            </p>
          </div>
        </Card>
      </div>

      <ActionModal
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        playerName={turnPlayerName}
        positionLabel="UTG"
        potSize={5200}
        currentBet={currentBet}
        callAmount={turnPlayer?.needed ?? 0}
        minBet={400}
        minRaiseTo={minRaiseDisplay}
        maxAmount={turnPlayer?.stack ?? 0}
      />
    </div>
  );
}
