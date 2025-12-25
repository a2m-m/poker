import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { createNewGame, type PlayerSetup } from '../domain/game';
import { type GameSettings } from '../domain/types';
import { useGameState } from '../state/GameStateContext';
import styles from './SetupPage.module.css';

interface SetupPageProps {
  description: string;
}

type PlayerDraft = {
  id: string;
  name: string;
  stack: number;
};

export function SetupPage({ description }: SetupPageProps) {
  const navigate = useNavigate();
  const { setGameState } = useGameState();
  const [players, setPlayers] = useState<PlayerDraft[]>([
    { id: 'p1', name: '佐藤', stack: 20000 },
    { id: 'p2', name: '鈴木', stack: 20000 },
    { id: 'p3', name: '高橋', stack: 15000 },
  ]);
  const [sb, setSb] = useState(100);
  const [bb, setBb] = useState(200);
  const [ante, setAnte] = useState(0);
  const [newName, setNewName] = useState('田中');
  const [newStack, setNewStack] = useState(15000);
  const [inlineMessage, setInlineMessage] = useState('開始すると現在の設定がテーブルに反映されます。');

  const canStart = players.length >= 2;

  const handleAddPlayer = () => {
    if (!newName.trim()) return;
    const id = `p-${Date.now()}`;
    setPlayers((prev) => [...prev, { id, name: newName.trim(), stack: Math.max(0, newStack) }]);
    setNewName('');
    setNewStack(10000);
  };

  const handleRemove = (id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  };

  const handleNameChange = (id: string, value: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name: value } : p)));
  };

  const handleStackChange = (id: string, value: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, stack: Math.max(0, value) } : p)));
  };

  const move = (index: number, delta: number) => {
    setPlayers((prev) => {
      const next = [...prev];
      const targetIndex = index + delta;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleStart = () => {
    if (!canStart) {
      setInlineMessage('2人未満のため開始できません。プレイヤーを追加してください。');
      return;
    }

    const playerSetups: PlayerSetup[] = players.map((player, index) => ({
      id: player.id || `player-${index + 1}`,
      name: player.name.trim() || `プレイヤー${index + 1}`,
      stack: Math.max(0, player.stack),
    }));

    const settings: GameSettings = {
      sb: Math.max(0, sb),
      bb: Math.max(0, bb),
      roundingRule: 'BUTTON_NEAR',
      burnCard: true,
    };

    const gameState = createNewGame(settings, playerSetups);
    setGameState(gameState);
    setInlineMessage('現在の設定からゲーム状態を生成し、テーブル画面に反映しました。');
    navigate('/table');
  };

  const summaryText = useMemo(
    () => `現在 ${players.length} 人。SB ${sb.toLocaleString()} / BB ${bb.toLocaleString()} / アンティ ${ante.toLocaleString()}`,
    [players.length, sb, bb, ante],
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>セットアップ</h2>
        <p className={styles.lead}>{description}</p>
        <p className={styles.note}>プレイヤー編集とブラインド設定の入力枠を仮配置しています。保存や検証は後続で実装します。</p>
      </div>

      <div className={styles.grid}>
        <Card
          eyebrow="Players"
          title="プレイヤー編集"
          description="名前、初期スタック、席順の編集を行います。ドラッグの代わりに上下ボタンで並び替えを確認できます。"
        >
          <div className={styles.cardBody}>
            <div className={styles.statusRow}>
              <span className={styles.badge}>
                <span className={styles.numberBadge}>{players.length}</span>
                人参加予定
              </span>
              <p className={styles.hint}>時計回りの席順で上から順に表示しています。</p>
            </div>

            <div className={styles.playerList} aria-label="プレイヤー一覧">
              {players.map((player, index) => (
                <div key={player.id} className={styles.playerRow}>
                  <div className={styles.playerInputs}>
                    <label className={styles.label}>
                      名前
                      <input
                        className={styles.input}
                        type="text"
                        value={player.name}
                        maxLength={12}
                        onChange={(e) => handleNameChange(player.id, e.target.value)}
                      />
                    </label>
                    <label className={styles.label}>
                      初期スタック
                      <input
                        className={`${styles.input} ${styles.stackInput}`}
                        type="number"
                        min={0}
                        value={player.stack}
                        onChange={(e) => handleStackChange(player.id, Number(e.target.value))}
                      />
                    </label>
                  </div>
                  <div className={styles.playerActions}>
                    <div className={styles.reorderButtons}>
                      <Button
                        variant="secondary"
                        className={styles.inlineButton}
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label={`${player.name} を1つ上へ移動`}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="secondary"
                        className={styles.inlineButton}
                        onClick={() => move(index, 1)}
                        disabled={index === players.length - 1}
                        aria-label={`${player.name} を1つ下へ移動`}
                      >
                        ↓
                      </Button>
                    </div>
                    <Button
                      variant="danger"
                      className={styles.inlineButton}
                      onClick={() => handleRemove(player.id)}
                      aria-label={`${player.name} を削除`}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.addRow}>
              <label className={styles.label}>
                プレイヤー追加
                <input
                  className={styles.input}
                  type="text"
                  value={newName}
                  placeholder="名前を入力"
                  maxLength={12}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </label>
              <label className={styles.label}>
                スタック
                <input
                  className={`${styles.input} ${styles.stackInput}`}
                  type="number"
                  min={0}
                  value={newStack}
                  onChange={(e) => setNewStack(Number(e.target.value))}
                />
              </label>
              <Button variant="primary" onClick={handleAddPlayer} disabled={!newName.trim()}>
                末尾に追加
              </Button>
            </div>
            <p className={styles.note}>削除と並び替えは即時反映されます。保存や重複名チェックは今後のタスクで行います。</p>
          </div>
        </Card>

        <Card
          eyebrow="Blinds"
          title="ブラインドと設定"
          description="SB/BB やアンティを指定する枠です。数値入力の UI のみを仮配置しています。"
        >
          <div className={styles.cardBody}>
            <p className={styles.sectionDescription}>
              SB &lt; BB を推奨し、整数で入力します。設定値の検証や反映は後続タスクで実装します。
            </p>
            <div className={styles.fieldGrid}>
              <label className={styles.label}>
                スモールブラインド
                <input
                  className={`${styles.input} ${styles.stackInput}`}
                  type="number"
                  min={0}
                  value={sb}
                  onChange={(e) => setSb(Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                ビッグブラインド
                <input
                  className={`${styles.input} ${styles.stackInput}`}
                  type="number"
                  min={0}
                  value={bb}
                  onChange={(e) => setBb(Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                アンティ（任意）
                <input
                  className={`${styles.input} ${styles.stackInput}`}
                  type="number"
                  min={0}
                  value={ante}
                  onChange={(e) => setAnte(Number(e.target.value))}
                />
              </label>
            </div>
            <p className={styles.note}>後続で localStorage への保存や、開始時に GameState を生成する処理につなぎます。</p>
          </div>
        </Card>
      </div>

      <Card eyebrow="Start" title="開始の確認" description="人数とブラインドの準備が整ったらテーブルへ進みます。">
        <div className={styles.footer}>
          <p className={styles.sectionDescription}>現在の入力をもとに GameState を生成し、/table に反映します。</p>
          <p className={styles.sectionTitle}>{summaryText}</p>
          <Button variant="primary" onClick={handleStart} disabled={!canStart}>
            テーブルを開く
          </Button>
          {!canStart && <p className={styles.inlineError}>2人以上になるまで開始できません。</p>}
          <p className={styles.note}>{inlineMessage}</p>
        </div>
      </Card>
    </div>
  );
}
