import { PageScaffold } from './PageScaffold';

interface ShowdownPageProps {
  description: string;
}

export function ShowdownPage({ description }: ShowdownPageProps) {
  return (
    <PageScaffold
      path="/showdown"
      title="ショーダウン"
      description={description}
      summary="役比較や勝者選択を行う画面の骨組みです。Pot カードと勝者一覧を並べるスペースを確保します。"
      checkpoints={[
        'メイン/サイドポットごとのカードリストを並べる枠を追加。',
        'eligible プレイヤーのみ選択できる UI のプレースホルダーを配置。',
        '確定後に配当結果へ遷移する導線を備えます。',
      ]}
      links={[
        { to: '/table', label: 'テーブルに戻る' },
        { to: '/payout', label: '配当結果を確認' },
      ]}
    />
  );
}
