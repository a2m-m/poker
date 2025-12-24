import { PageScaffold } from './PageScaffold';

interface HomePageProps {
  description: string;
}

export function HomePage({ description }: HomePageProps) {
  return (
    <PageScaffold
      path="/"
      title="ホーム"
      description={description}
      summary="Poker Dealer App のルート入口です。セットアップやテーブル表示など、主要ページへの導線をまとめました。"
      checkpoints={[
        '「新規開始/再開/リセット」などトップの操作カードを配置する予定です。',
        '進行中のゲームがあれば次の手番へ遷移できる導線を置きます。',
        'デモ用のページリンクから各画面の骨組みを確認できます。',
      ]}
      links={[
        { to: '/setup', label: 'セットアップへ進む' },
        { to: '/table', label: 'テーブルを確認する' },
        { to: '/settings', label: '設定に移動' },
      ]}
      includeHomeLink={false}
      footnote="HashRouter で配信しているため、#/setup のように直接アクセス/リロードしても 404 になりません。"
    />
  );
}
