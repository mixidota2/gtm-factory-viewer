# 需要地図

家計の支出、サービスの利用量、売り手の動きを、数字が何を数えているか確かめながら読めるサイトです。[公開中の需要地図を開く](https://mixidota2.github.io/gtm-factory-viewer/)。

## 記事や画面を編集する

- `index.html` に画面と記事データ（`snapshot-data`）があります。記事を直すときは、本文だけでなく一覧の要約、図の注記、根拠欄が同じ対象・期間を指しているか確認します。
- `data/` には調査資料の保存版と、記事からダウンロードできるデータがあります。それぞれの README と出典情報で、集計期間と確認した範囲を調べられます。
- `tests/` は、記事の表示、操作、保存済みデータを検査します。学童・保育・機械警備の公表資料を確認する処理は [tools/demand/](tools/demand/README.md) にあります。

ビルドは不要です。リポジトリのルートからサーバーを起動し、ブラウザーで [http://127.0.0.1:8000](http://127.0.0.1:8000/) を開きます。このリポジトリには `viewer/build.py` と `viewer/deploy-pages.sh` はありません。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

## 変更を検査する

次のコマンドは、ブラウザーや出典サイトを開かずに実行できます。ローカルHTTPの検査では、月次CSVを元ファイルとバイト単位で照合し、存在しないパスが404を返すことも確認します。

```sh
node tests/test_page_lifecycle.cjs
node tests/test_wait_for_route.cjs
node tests/test_static_server.cjs
node tests/browser.cjs --preflight-only
(cd tools/demand && python3 -m unittest test_all test_contract test_security_transport test_summarize_sources)
```

`--preflight-only` は保存済みの記事とデータの検査です。Chromeで画面を操作する検査とは別です。本文を更新すると `index.html` のハッシュが変わるため、旧版の期待値では失敗します。意図した箇所だけが変わったと別途確認してから期待値を更新してください。検査は削除しません。

- **画面や操作を変えたとき：** `node tests/browser.cjs` も実行します。Playwright、サンドボックスが使える Google Chrome、日本語表示用の Noto CJK フォントが必要です。[ブラウザー検査の設定](.github/workflows/browser.yml)に導入手順があります。検査は画面幅 360・390・768・1440 px を対象とし、結果を `browser-evidence/` に残します。水運の記事に関連するCSV・出典・集計の変更も、このワークフローの対象です。
- **出典と記事の数字を照らし合わせるとき：** [出典を確認する手順](tools/demand/README.md)と[出典検査の設定](.github/workflows/source-check.yml)を参照してください。出典検査は記事を自動修正せず、公開も行いません。

## 公開を確認する

1. マージする前に、PRの差分と、そのコミットで実際に動いた検査を確認します。変更対象に応じて実行されるため、文書だけを直して検査が起動しなかった場合は、合格とは扱いません。
2. マージした後に、GitHub Pages の配信結果を確認します。サイトのファイルを変えた場合は、公開先から取得したファイルが意図した版と一致するところまで確かめます。
