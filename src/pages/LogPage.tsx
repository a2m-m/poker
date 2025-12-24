import { PageScaffold } from './PageScaffold';

interface LogPageProps {
  description: string;
}

export function LogPage({ description }: LogPageProps) {
  return (
    <PageScaffold
      path="/log"
      title="ログ"
      description={description}
      summary="アクション履歴を一覧するページの骨組みです。ストリーム表示やフィルタ導線のための枠を用意します。"
      checkpoints={[
        'ログ項目を並べるリスト/タイムラインのレイアウトを確保。',
        '手番やストリートで絞り込むフィルタ UI の配置場所を決めます。',
        'テーブルへ戻る導線を常設し、手番確認にすぐ戻れるようにします。',
      ]}
      links={[
        { to: '/table', label: 'テーブルへ戻る' },
        { to: '/settings', label: '設定に移動' },
      ]}
    />
  );
}
