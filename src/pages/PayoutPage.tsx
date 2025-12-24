import { PageScaffold } from './PageScaffold';

interface PayoutPageProps {
  description: string;
}

export function PayoutPage({ description }: PayoutPageProps) {
  return (
    <PageScaffold
      path="/payout"
      title="配当結果"
      description={description}
      summary="分配結果を確認するページの骨組みです。勝者ごとの獲得額とスタック更新を表示する領域を用意します。"
      checkpoints={[
        '配当内訳をカード/テーブル形式で表示するレイアウトを確保。',
        '次のハンド開始や再ハンドへの導線ボタンを配置。',
        'テーブルへ戻り、スタックが更新された状態を確認できるようにします。',
      ]}
      links={[
        { to: '/showdown', label: 'ショーダウンに戻る' },
        { to: '/table', label: 'テーブルへ戻る' },
      ]}
    />
  );
}
