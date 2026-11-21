# 需要地図

需要地図では、家計がいくら支出したか、サービスがどれだけ使われたか、売り手にどんな動きがあったかを調べられます。数字を読むときは、何を数えた数字なのかも確認できます。[公開中の需要地図を開く](https://mixidota2.github.io/gtm-factory-viewer/)。

## 記事を直すときに見るファイル

- `index.html` には画面と記事データ（`snapshot-data`）があります。記事を変えたら、本文、一覧の要約、図の注記、根拠欄が同じ対象と期間を指しているか確かめます。
- `data/` には保存した調査資料と、記事からダウンロードできるデータがあります。各資料の README と出典情報で、どの期間を集計し、どこまで確認したかが分かります。
- `tests/` では、記事の表示、画面の操作、保存したデータを検査します。学童・保育・機械警備の公表資料と記事を照合する手順は [tools/demand/](tools/demand/README.md) にあります。

## 手元で画面を開く

ビルドは不要です。リポジトリのルートで次のコマンドを実行し、ブラウザーで [http://127.0.0.1:8000](http://127.0.0.1:8000/) を開きます。このリポジトリには `viewer/build.py` と `viewer/deploy-pages.sh` はありません。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

## 変更を検査する

以下の検査はブラウザーや出典サイトを開かずに実行できます。ローカルHTTPの検査では、サーバーが返す月次CSVが元ファイルとバイト単位で一致することと、存在しないパスが404を返すことを確認します。

```sh
node tests/test_page_lifecycle.cjs
node tests/test_wait_for_route.cjs
node tests/test_static_server.cjs
node tests/browser.cjs --preflight-only
(cd tools/demand && python3 -m unittest test_all test_contract test_security_transport test_summarize_sources)
```

`--preflight-only` は保存済みの記事とデータを検査します。Chromeで実際に画面を操作する検査は含みません。本文を変えると `index.html` のハッシュも変わるため、以前のハッシュを期待する検査は失敗します。意図した箇所だけが変わったことを別途確かめてから、検査が使う期待値を更新してください。検査自体は削除しません。

- **画面や操作を変えた場合**は、`node tests/browser.cjs` も実行します。Playwright、サンドボックスが使える Google Chrome、日本語表示用の Noto CJK フォントが必要です。[ブラウザー検査の設定](.github/workflows/browser.yml)に導入手順があります。検査する画面幅は 360・390・768・1440 px で、結果は `browser-evidence/` に残ります。水運の記事に関連するCSV・出典・集計の変更でも、このワークフローが動きます。
- **出典と記事の数字を照らし合わせるとき**は、[出典を確認する手順](tools/demand/README.md)と[出典検査の設定](.github/workflows/source-check.yml)を参照してください。出典検査は記事を自動で修正せず、公開もしません。

## マージ前と公開後に確認する

1. マージ前に、プルリクエスト（PR）の差分を読み、そのコミットでどの検査が動き、どんな結果だったかを確認します。検査は変更したファイルに応じて起動します。文書だけの修正で検査が起動しなかった場合は、合格とは扱いません。
2. マージ後に、GitHub Pages の配信結果を確認します。サイトのファイルを変えた場合は、公開先からそのファイルを取得し、公開したいファイルと内容が一致することを確かめます。
