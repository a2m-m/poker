import { NavLink } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import styles from './TablePage.module.css';

interface TablePageProps {
  description: string;
}

type PlayerStub = {
  id: string;
  name: string;
  role?: 'D' | 'SB' | 'BB';
  stack: number;
  committed: number;
  status: '参加中' | 'フォールド' | 'オールイン';
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
  const turnPlayer = players.find((player) => player.id === 'p5');

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
        <div className={styles.statusGrid} aria-label="ステータス項目">
          <StatusItem label="ハンド" value="#12" />
          <StatusItem label="ストリート" value="ターン" />
          <StatusItem label="目標" value="全員の投入額を揃えます" emphasize />
          <StatusItem label="現在ベット" value="800" />
          <StatusItem label="コール必要額" value="400" highlight />
          <StatusItem label="最小レイズ" value="1,200" />
          <StatusItem label="ボタン" value="佐藤" badge="D" />
          <StatusItem label="ブラインド" value="鈴木 / 高橋" badge="SB / BB" />
        </div>
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
          <div className={styles.turnPanel}>
            <div className={styles.turnRow}>
              <span className={styles.turnLabel}>手番</span>
              <span className={styles.turnValue}>
                {turnPlayer?.name ?? '—'} <span className={styles.subtle}>（UTG）</span>
              </span>
            </div>
            <div className={styles.turnRow}>
              <span className={styles.turnLabel}>必要</span>
              <span className={styles.turnValue}>
                コール {turnPlayer?.needed.toLocaleString()}（継続）
              </span>
            </div>
            <div className={styles.turnRow}>
              <span className={styles.turnLabel}>可能</span>
              <span className={styles.turnValue}>
                チェック / レイズは 1,200 以上 / オールイン {turnPlayer?.stack.toLocaleString()}
              </span>
            </div>
          </div>
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
              <div
                key={player.id}
                className={`${styles.playerCard}${player.id === turnPlayer?.id ? ` ${styles.playerCardActive}` : ''}`}
              >
                <div className={styles.playerHeader}>
                  <div className={styles.playerNameRow}>
                    <span className={styles.playerName}>{player.name}</span>
                    {player.role && <span className={styles.roleBadge}>{player.role}</span>}
                  </div>
                  <span
                    className={`${styles.statusBadge} ${
                      player.status === 'フォールド'
                        ? styles.statusFold
                        : player.status === 'オールイン'
                          ? styles.statusAllIn
                          : styles.statusActive
                    }`}
                  >
                    {player.status}
                  </span>
                </div>
                <dl className={styles.playerMeta}>
                  <div>
                    <dt>残スタック</dt>
                    <dd>{player.stack.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>ストリート投入</dt>
                    <dd>{player.committed.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>必要額</dt>
                    <dd className={styles.neededValue}>
                      {player.needed > 0 ? `必要 ${player.needed.toLocaleString()}` : '—'}
                    </dd>
                  </div>
                </dl>
                {player.id === turnPlayer?.id && <p className={styles.turnHint}>このプレイヤーの手番です。</p>}
              </div>
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
              <Button variant="primary" block>
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
              モーダルの開閉や金額入力は後続タスクで実装予定です。先にレイアウトと導線のトーンを固定しています。
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

type StatusItemProps = {
  label: string;
  value: string;
  highlight?: boolean;
  emphasize?: boolean;
  badge?: string;
};

function StatusItem({ label, value, badge, highlight, emphasize }: StatusItemProps) {
  return (
    <div className={`${styles.statusItem}${highlight ? ` ${styles.statusItemHighlight}` : ''}`}>
      <p className={styles.statusLabel}>{label}</p>
      <div className={styles.statusValueRow}>
        <span className={`${styles.statusValue}${emphasize ? ` ${styles.statusValueEmphasis}` : ''}`}>
          {value}
        </span>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
    </div>
  );
}
