import { PageScaffold } from './PageScaffold';

interface SettingsPageProps {
  description: string;
}

export function SettingsPage({ description }: SettingsPageProps) {
  return (
    <PageScaffold
      path="/settings"
      title="設定"
      description={description}
      summary="保存/復元や表示設定を扱うページの骨組みです。安全な破棄/リセット導線もここにまとめます。"
      checkpoints={[
        'localStorage の保存/復元ボタンと状態表示の配置を想定。',
        '端数処理やバーン表示など外観設定のトグル UI を設けます。',
        '危険操作は ConfirmDialog を経由して実行する導線を固定します。',
      ]}
      links={[
        { to: '/', label: 'ホームに戻る' },
        { to: '/log', label: 'ログを確認' },
      ]}
    />
  );
}
