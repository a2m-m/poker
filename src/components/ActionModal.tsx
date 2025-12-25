import { useEffect, useMemo, useState } from 'react';
import { ActionAvailability, PlayerActionType } from '../domain/actions';
import { PlayerActionInput } from '../state/actions';
import styles from './ActionModal.module.css';
import { Button } from './Button';

type ActionModalProps = {
  open: boolean;
  playerName: string;
  positionLabel?: string;
  potSize: number;
  currentBet: number;
  callAmount: number;
  minBet: number;
  minRaiseTo: number | null;
  maxAmount: number;
  stack: number;
  availableActions: ActionAvailability[];
  onConfirm: (action: PlayerActionInput) => void;
  onClose: () => void;
};

const actionOrder: PlayerActionType[] = ['CHECK', 'CALL', 'BET', 'RAISE', 'FOLD', 'ALL_IN'];

const actionLabels: Record<PlayerActionType, string> = {
  CHECK: 'CHECK',
  CALL: 'CALL',
  BET: 'BET',
  RAISE: 'RAISE',
  FOLD: 'FOLD',
  ALL_IN: 'ALL IN',
};

const actionDescriptions: Record<PlayerActionType, string> = {
  CHECK: '現在の必要額が0のときのみ',
  CALL: '必要額を支払って継続',
  BET: '現在ベットが0のときのみ',
  RAISE: '現在ベットがあるときのみ',
  FOLD: 'このハンドを降りる',
  ALL_IN: '残スタックをすべて投入',
};

const formatNumber = (value: number) => value.toLocaleString();

const formatNumberOrDash = (value: number | null) => (value !== null ? value.toLocaleString() : '—');

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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
  stack,
  availableActions,
  onConfirm,
  onClose,
}: ActionModalProps) {
  const raiseBase = minRaiseTo ?? minBet;
  const defaultAction = useMemo(() => {
    const availabilityMap = new Map(availableActions.map((action) => [action.type, action]));
    const firstAvailable = actionOrder.find((type) => availabilityMap.get(type)?.available);
    if (callAmount === 0 && availabilityMap.get('CHECK')?.available) return 'CHECK';
    if (firstAvailable) return firstAvailable;
    return 'CALL';
  }, [availableActions, callAmount]);

  const [selectedAction, setSelectedAction] = useState<PlayerActionType>(defaultAction);
  const [amount, setAmount] = useState<number>(raiseBase);

  useEffect(() => {
    setSelectedAction(defaultAction);
    setAmount(clamp(raiseBase, minBet, maxAmount));
  }, [open, defaultAction, raiseBase, minBet, maxAmount]);

  useEffect(() => {
    if (selectedAction === 'BET' || selectedAction === 'RAISE') {
      const baseValue = selectedAction === 'BET' ? minBet : raiseBase;
      setAmount((current) => clamp(current, baseValue, maxAmount));
    }
  }, [selectedAction, minBet, raiseBase, maxAmount]);

  const availabilityMap = useMemo(() => new Map(availableActions.map((action) => [action.type, action])), [availableActions]);

  const requiresAmount = selectedAction === 'BET' || selectedAction === 'RAISE';
  const minValue = selectedAction === 'BET' ? minBet : raiseBase;

  const presets = useMemo(
    () => [
      { label: '最小', value: minValue },
      { label: '1/2ポット', value: clamp(Math.round(potSize / 2 / 100) * 100, minValue, maxAmount) },
      { label: 'ポット', value: clamp(Math.round(potSize / 100) * 100, minValue, maxAmount) },
      { label: '最大（ALL-IN）', value: maxAmount },
    ],
    [maxAmount, minValue, potSize],
  );

  if (!open) return null;

  const handleAmountChange = (value: number) => {
    const numericValue = Number.isNaN(value) ? minValue : value;
    const nextValue = clamp(numericValue, minValue, maxAmount);
    setAmount(nextValue);
  };

  const submit = () => {
    const availability = availabilityMap.get(selectedAction);
    if (!availability?.available) return;

    if (requiresAmount) {
      onConfirm({ type: selectedAction, amount });
    } else {
      onConfirm({ type: selectedAction });
    }
  };

  const selectedAvailability = availabilityMap.get(selectedAction);
  const confirmDisabled = !selectedAvailability?.available || (requiresAmount && (amount < minValue || amount > maxAmount));

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
            ポット合計 {formatNumber(potSize)} ／ 残りスタック {formatNumber(stack)} ／ 現在ベット {formatNumber(currentBet)}
          </p>
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
              <p className={styles.summaryValue}>{formatNumberOrDash(minRaiseTo)}</p>
            </div>
            <div>
              <p className={styles.summaryLabel}>残スタック</p>
              <p className={styles.summaryValue}>{formatNumber(stack)}</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionLabel}>アクション</p>
            <p className={styles.sectionHint}>灰色は条件未達のため選択不可</p>
          </div>
          <div className={styles.actionGrid}>
            {actionOrder.map((type) => {
              const availability = availabilityMap.get(type) ?? { available: false, reason: '入力不可', type };
              const disabled = !availability.available;
              const selected = selectedAction === type;
              return (
                <button
                  key={type}
                  type="button"
                  className={[styles.actionButton, selected ? styles.selected : '', disabled ? styles.disabled : ''].join(' ')}
                  onClick={() => setSelectedAction(type)}
                  disabled={disabled}
                >
                  <span className={styles.actionLabel}>{actionLabels[type]}</span>
                  <span className={styles.actionDescription}>
                    {disabled ? availability.reason : actionDescriptions[type]}
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
                {selectedAction === 'BET' ? 'ベット額を入力' : 'レイズ後の合計額を入力'}
              </p>
              <p className={styles.sectionHint}>入力は範囲内で丸められます（ALL-INは最大値を選択）</p>
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
                  範囲 {formatNumber(minValue)} 〜 {formatNumber(maxAmount)} （最小レイズ {formatNumberOrDash(minRaiseTo)}）
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
          <Button variant="primary" onClick={submit} disabled={confirmDisabled}>
            {actionLabels[selectedAction]} を確定
          </Button>
        </div>
      </div>
    </div>
  );
}
