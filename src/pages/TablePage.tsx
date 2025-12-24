import { PageScaffold } from './PageScaffold';

interface TablePageProps {
  description: string;
}

export function TablePage({ description }: TablePageProps) {
  return (
    <PageScaffold
      path="/table"
      title="テーブル"
      description={description}
      summary="進行中のハンドを表示するメインビューの骨組みです。ステータスとプレイヤー表示のレイアウト枠を用意します。"
      checkpoints={[
        'StatusBar / Pot / Player リスト / ActionBar の表示位置を固定。',
        'ダミーの手番・必要額・可能アクションが視認できる配置を用意。',
        'ショーダウンやログへ遷移するボタンを Action 領域にまとめます。',
      ]}
      links={[
        { to: '/', label: 'ホームに戻る' },
        { to: '/showdown', label: 'ショーダウンへ遷移' },
        { to: '/log', label: 'ログを見る' },
      ]}
    />
  );
}
