import { useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import styles from './SettingsPage.module.css';

interface SettingsPageProps {
  description: string;
}

type DialogType = 'none' | 'discard' | 'reset';
type RoundingMode = 'floor' | 'ceil' | 'nearest';

export function SettingsPage({ description }: SettingsPageProps) {
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('floor');
  const [showBurnCards, setShowBurnCards] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [dialogType, setDialogType] = useState<DialogType>('none');
  const [lastSavedAt, setLastSavedAt] = useState('3分前');
  const [restorePreview, setRestorePreview] = useState('メインポット集計前のスナップショット');

  const roundingHint = useMemo(() => {
    switch (roundingMode) {
      case 'floor':
        return '端数は切り捨てで配当します。端数チップの扱いを明示することで、再現性の高い結果を得られます。';
      case 'ceil':
        return '端数は切り上げで配当します。短期イベントなどで端数を素早く処理したい場合に利用します。';
      case 'nearest':
        return '端数は最も近い値に丸め、同点の場合はボタンに近いプレイヤーへ付与します。ルールブックに沿った配当を想定しています。';
      default:
        return '';
    }
  }, [roundingMode]);

  const openDialog = (type: DialogType) => setDialogType(type);
  const closeDialog = () => setDialogType('none');

  const handleSave = () => {
    setLastSavedAt('たった今');
  };

  const handleRestore = () => {
    setRestorePreview('直近の保存データを仮復元しました（UIのみ）');
  };

  const handleConfirm = () => {
    if (dialogType === 'discard') {
      setLastSavedAt('保存データなし');
      setRestorePreview('破棄済み: 復元対象はありません');
    }
    if (dialogType === 'reset') {
      setRoundingMode('floor');
      setShowBurnCards(true);
      setAutoSaveEnabled(false);
      setLastSavedAt('初期状態');
      setRestorePreview('初期状態');
    }
    closeDialog();
  };

  const dialogCopy = {
    title:
      dialogType === 'reset'
        ? '全設定の初期化を実行しますか？'
        : '保存済みデータを破棄しますか？',
    message:
      dialogType === 'reset'
        ? '表示設定と保存済みのスナップショットをすべて初期状態に戻します。後続タスクで永続化を実装する前提のダミー動作です。'
        : 'ローカル保存のデモデータを削除します。復元ボタンでは取り戻せなくなります。',
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>設定</h2>
        <p className={styles.lead}>{description}</p>
        <p className={styles.note}>
          端数処理やバーンカード表示など、配当と見た目に関わるオプションをまとめています。保存/復元は後続タスクで本実装するため、ここでは導線と確認ダイアログの流れを固定します。
        </p>
      </div>

      <div className={styles.grid}>
        <Card
          eyebrow="Display & Payout"
          title="表示と端数の設定"
          description="ショーダウン時の丸め方やバーンカード表示の有無を事前に決めておく枠です。"
        >
          <div className={styles.cardBody}>
            <div className={styles.fieldGroup}>
              <p className={styles.fieldLabel}>端数処理</p>
              <div className={styles.radioGroup} role="radiogroup" aria-label="端数処理の選択">
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="rounding"
                    value="floor"
                    checked={roundingMode === 'floor'}
                    onChange={() => setRoundingMode('floor')}
                  />
                  <span className={styles.optionTitle}>切り捨て</span>
                  <span className={styles.optionHint}>余りはポットに残さず、手前の値に丸めます。</span>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="rounding"
                    value="nearest"
                    checked={roundingMode === 'nearest'}
                    onChange={() => setRoundingMode('nearest')}
                  />
                  <span className={styles.optionTitle}>四捨五入 + ボタン優先</span>
                  <span className={styles.optionHint}>同点時はボタンに近いプレイヤーへ端数を渡します。</span>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="rounding"
                    value="ceil"
                    checked={roundingMode === 'ceil'}
                    onChange={() => setRoundingMode('ceil')}
                  />
                  <span className={styles.optionTitle}>切り上げ</span>
                  <span className={styles.optionHint}>素早く場を進めたいときの簡易運用向けです。</span>
                </label>
              </div>
              <p className={styles.helper}>{roundingHint}</p>
            </div>

            <div className={styles.fieldGroup}>
              <p className={styles.fieldLabel}>表示オプション</p>
              <div className={styles.toggleRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={showBurnCards}
                    onChange={(event) => setShowBurnCards(event.target.checked)}
                  />
                  <span className={styles.checkboxText}>バーンカードを常に表示する</span>
                </label>
                <span className={styles.badge}>{showBurnCards ? '表示中' : '非表示'}</span>
              </div>
              <div className={styles.toggleRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(event) => setAutoSaveEnabled(event.target.checked)}
                  />
                  <span className={styles.checkboxText}>手番確定ごとにローカル保存する（デモ）</span>
                </label>
                <span className={styles.badge}>{autoSaveEnabled ? '保存ON' : '保存OFF'}</span>
              </div>
              <p className={styles.helper}>
                チェックボックスは UI 配置のデモです。後続タスクで永続化と同期処理を実装し、確認ダイアログ経由で危険操作を防ぎます。
              </p>
            </div>

            <div className={styles.statusRow}>
              <div className={styles.statusItem}>
                <p className={styles.statusLabel}>現在の端数設定</p>
                <p className={styles.statusValue}>{roundingMode === 'floor' ? '切り捨て' : roundingMode === 'ceil' ? '切り上げ' : '四捨五入'}</p>
              </div>
              <div className={styles.statusItem}>
                <p className={styles.statusLabel}>表示状態</p>
                <p className={styles.statusValue}>{showBurnCards ? 'バーンカードを表示' : 'バーンカードを省略'}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          eyebrow="Persistence"
          title="保存とリセット"
          description="ローカルストレージを想定した保存/復元の導線と、破棄時の確認ダイアログの振る舞いを示します。"
        >
          <div className={styles.cardBody}>
            <div className={styles.fieldGroup}>
              <p className={styles.fieldLabel}>保存/復元のシミュレーション</p>
              <div className={styles.inlineActions}>
                <Button variant="primary" onClick={handleSave}>
                  現在の設定を保存（ダミー）
                </Button>
                <Button variant="secondary" onClick={handleRestore}>
                  保存済みを復元（ダミー）
                </Button>
              </div>
              <p className={styles.helper}>保存キーや永続化タイミングは後続の「ローカル保存キー設計」タスクで確定します。</p>
              <div className={styles.statusList}>
                <div className={styles.statusItem}>
                  <p className={styles.statusLabel}>保存済み</p>
                  <p className={styles.statusValue}>{lastSavedAt}</p>
                </div>
                <div className={styles.statusItem}>
                  <p className={styles.statusLabel}>復元プレビュー</p>
                  <p className={styles.statusValue}>{restorePreview}</p>
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <p className={styles.fieldLabel}>危険操作</p>
              <p className={styles.helper}>
                保存データの破棄や全リセットは ConfirmDialog を経由させ、意図しない操作を防ぎます。テキストは後続で実際のハンド状態に合わせて調整します。
              </p>
              <div className={styles.dangerZone}>
                <Button variant="danger" onClick={() => openDialog('discard')}>
                  保存データを破棄
                </Button>
                <Button variant="undo" onClick={() => openDialog('reset')}>
                  表示設定を初期化
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={dialogType !== 'none'}
        title={dialogCopy.title}
        message={dialogCopy.message}
        tone="danger"
        confirmLabel="実行する"
        cancelLabel="やめておく"
        onConfirm={handleConfirm}
        onCancel={closeDialog}
      />
    </div>
  );
}
