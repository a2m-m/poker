import { PageScaffold } from './PageScaffold';

interface SetupPageProps {
  description: string;
}

export function SetupPage({ description }: SetupPageProps) {
  return (
    <PageScaffold
      path="/setup"
      title="セットアップ"
      description={description}
      summary="プレイヤー編集やブラインド設定を準備するページの骨組みです。ダミー状態でも遷移テストに利用できます。"
      checkpoints={[
        'プレイヤーの追加・削除・並び替え用の入力UIを配置予定。',
        'ブラインド額やリバイ設定など、ゲーム設定項目のフォームを想定。',
        '「開始」操作で table へ遷移し、設定値を引き継ぐ導線を用意します。',
      ]}
      links={[
        { to: '/', label: 'ホームに戻る' },
        { to: '/table', label: 'テーブルへ遷移' },
      ]}
    />
  );
}
