# 需要地図

家計の支出、利用量、売り手の動きなどを、対象範囲と出典を確かめながら読む静的サイトです。

**公開URL:** https://mixidota2.github.io/gtm-factory-viewer/

## ファイルの入口

- `index.html`: 画面と埋め込みの `snapshot-data`。表示の修正や記事の更新は、このファイルの本文とデータの対応を確認します。
- `data/`: 調査資料の保存版と、記事から参照するデータ。各ディレクトリの README と出典情報で対象期間・確認範囲を確認します。
- `tests/`: 画面、記事の内容、操作と過去の比較用データの検査。
- `tools/demand/`: 学童・保育・機械警備の原典を照合する処理。[実行方法と確認範囲](tools/demand/README.md)を参照してください。

このリポジトリには `viewer/build.py` や `viewer/deploy-pages.sh` は含まれていません。画面の確認にはビルドを必要としません。リポジトリのルートで次を実行し、表示されたローカルURLを開きます。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

## 変更の検証

リポジトリのルートで実行します。最初の4つはブラウザや原典サイトへのアクセスを必要としません。

```sh
node tests/test_page_lifecycle.cjs
node tests/test_wait_for_route.cjs
node tests/browser.cjs --preflight-only
(cd tools/demand && python3 -m unittest test_all test_contract test_security_transport)
```

`--preflight-only` は記事と保存済みデータの検査です。実ブラウザの操作検証ではありません。`index.html` の全文ハッシュも確認するため、本文を変えると失敗します。内容の差分を独立に確認してから期待値を更新し、検査を削除して通さないでください。

画面を変更した場合は `node tests/browser.cjs` も実行します。Playwright、サンドボックスを利用できる Google Chrome、日本語を表示する Noto CJK フォントが必要です。インストール方法と実行順序は [ブラウザ検証ワークフロー](.github/workflows/browser.yml) にあります。検査は画面幅 360・390・768・1440 px の操作と表示を確認し、`browser-evidence/` に証拠を保存します。

原典の確認は [出典確認の手順](tools/demand/README.md)と [ワークフロー](.github/workflows/source-check.yml)に従います。この処理は本文の更新や公開を行いません。

## 反映の確認

PR の差分と、対象コミットで実行された検査を確認します。現在のワークフローは対象ファイルが変わった場合だけ動くため、文書だけの変更で実行されなかった検査を「成功」と扱わないでください。

マージ後は GitHub Pages の配信結果を確認します。サイトを変更した場合は、公開されたファイルが意図した版と一致することも確認してください。PR のマージだけで公開完了とは判断しません。
