import { useEffect, useMemo, useState } from 'react';
import styles from './ActionModal.module.css';
import { Button } from './Button';

type ActionType = 'check' | 'call' | 'bet' | 'raise' | 'fold' | 'allIn';

interface ActionModalProps {
  open: boolean;
  playerName: string;
  positionLabel?: string;
  potSize: number;
  currentBet: number;
  callAmount: number;
  minBet: number;
  minRaiseTo: number;
  maxAmount: number;
  onClose: () => void;
}

const actionLabels: Record<ActionType, string> = {
  check: 'CHECK',
  call: 'CALL',
  bet: 'BET',
  raise: 'RAISE',
  fold: 'FOLD',
  allIn: 'ALL IN',
};

const actionDescriptions: Record<ActionType, string> = {
  check: '現在の必要額が0のときのみ',
  call: '必要額を支払って継続',
  bet: '現在ベットが0のときのみ',
  raise: '現在ベットがあるときのみ',
  fold: 'このハンドを降りる',
  allIn: '残スタックをすべて投入',
};

function formatNumber(value: number) {
  return value.toLocaleString();
}

export function ActionModal({
  open,
  playerName,
  positionLabel,
  potSize,
  currentBet,
  callAmount,
  minBet,
  minRaiseTo,
  maxAmount,
  onClose,
}: ActionModalProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType>(callAmount === 0 ? 'check' : 'call');
  const [amount, setAmount] = useState<number>(minRaiseTo);

  useEffect(() => {
    const defaultAction: ActionType = callAmount === 0 ? 'check' : 'call';
    setSelectedAction(defaultAction);
    setAmount(minRaiseTo);
  }, [open, callAmount, minRaiseTo]);

  useEffect(() => {
    if (selectedAction === 'bet' || selectedAction === 'raise') {
      const baseValue = selectedAction === 'bet' ? minBet : minRaiseTo;
      setAmount((current) => Math.min(Math.max(current, baseValue), maxAmount));
    }
  }, [selectedAction, minBet, minRaiseTo, maxAmount]);

  const requiresAmount = selectedAction === 'bet' || selectedAction === 'raise';
  const minValue = selectedAction === 'bet' ? minBet : minRaiseTo;

  const presets = useMemo(
    () => [
      { label: '最小', value: minValue },
      { label: '1/2ポット', value: Math.max(minValue, Math.round(potSize / 2 / 100) * 100) },
      { label: 'ポット', value: Math.max(minValue, Math.round(potSize / 100) * 100) },
      { label: '最大（ALL-IN）', value: maxAmount },
    ],
    [maxAmount, minValue, potSize],
  );

  const actions: { type: ActionType; label: string; disabled?: boolean; reason?: string }[] = [
    { type: 'check', label: actionLabels.check, disabled: callAmount > 0, reason: 'コール必要額が0のときのみ' },
    { type: 'call', label: actionLabels.call },
    { type: 'bet', label: actionLabels.bet, disabled: currentBet > 0, reason: '現在ベットが0のときのみ' },
    { type: 'raise', label: actionLabels.raise, disabled: currentBet === 0, reason: '現在ベットがあるときのみ' },
    { type: 'fold', label: actionLabels.fold },
    { type: 'allIn', label: actionLabels.allIn },
  ];

  if (!open) return null;

  const handleAmountChange = (value: number) => {
    const nextValue = Math.min(Math.max(value, minValue), maxAmount);
    setAmount(nextValue);
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <p className={styles.overline}>アクション入力</p>
          <div className={styles.titleRow}>
            <h2 id="action-modal-title" className={styles.title}>
              {playerName}
            </h2>
            {positionLabel && <span className={styles.positionBadge}>{positionLabel}</span>}
          </div>
          <p className={styles.subtitle}>
            残りスタック {formatNumber(maxAmount)} ／ 現在ベット {formatNumber(currentBet)} ／ コール必要{' '}
            {formatNumber(callAmount)}
          </p>
        </div>

        <div className={styles.summaryGrid} aria-label="現在の状況">
          <div>
            <p className={styles.summaryLabel}>現在ベット</p>
            <p className={styles.summaryValue}>{formatNumber(currentBet)}</p>
          </div>
          <div>
            <p className={styles.summaryLabel}>コール必要額</p>
            <p className={styles.summaryValue}>{formatNumber(callAmount)}</p>
          </div>
          <div>
            <p className={styles.summaryLabel}>最小レイズ</p>
            <p className={styles.summaryValue}>{formatNumber(minRaiseTo)}</p>
          </div>
          <div>
            <p className={styles.summaryLabel}>ポット合計</p>
            <p className={styles.summaryValue}>{formatNumber(potSize)}</p>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionLabel}>アクション</p>
            <p className={styles.sectionHint}>灰色は条件未達のため選択不可</p>
          </div>
          <div className={styles.actionGrid}>
            {actions.map((action) => {
              const disabled = action.disabled ?? false;
              const selected = selectedAction === action.type;
              return (
                <button
                  key={action.type}
                  type="button"
                  className={[
                    styles.actionButton,
                    selected ? styles.selected : '',
                    disabled ? styles.disabled : '',
                  ].join(' ')}
                  onClick={() => setSelectedAction(action.type)}
                  disabled={disabled}
                >
                  <span className={styles.actionLabel}>{action.label}</span>
                  <span className={styles.actionDescription}>
                    {disabled ? action.reason : actionDescriptions[action.type]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {requiresAmount && (
          <div className={styles.section}>
            <div className={styles.sectionHeading}>
              <p className={styles.sectionLabel}>
                {selectedAction === 'bet' ? 'ベット額を入力' : 'レイズ後の合計額を入力'}
              </p>
              <p className={styles.sectionHint}>入力は範囲内で丸められます</p>
            </div>
            <div className={styles.amountRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="amount" className={styles.inputLabel}>
                  金額
                </label>
                <div className={styles.amountControl}>
                  <button
                    type="button"
                    className={styles.stepper}
                    onClick={() => handleAmountChange(amount - 100)}
                    aria-label="100減らす"
                  >
                    −
                  </button>
                  <input
                    id="amount"
                    type="number"
                    min={minValue}
                    max={maxAmount}
                    value={amount}
                    onChange={(event) => handleAmountChange(Number(event.target.value))}
                  />
                  <button
                    type="button"
                    className={styles.stepper}
                    onClick={() => handleAmountChange(amount + 100)}
                    aria-label="100増やす"
                  >
                    ＋
                  </button>
                </div>
                <p className={styles.rangeHint}>
                  範囲 {formatNumber(minValue)} 〜 {formatNumber(maxAmount)} （最小レイズ {formatNumber(minRaiseTo)}）
                </p>
              </div>
              <div className={styles.presets}>
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => handleAmountChange(preset.value)}
                  >
                    {preset.label} {formatNumber(preset.value)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="primary">{actionLabels[selectedAction]} を確定</Button>
        </div>
      </div>
    </div>
  );
}
