# 需要地図の作業入口

- まず [README.md](README.md) を読みます。リポジトリの構成や、手元で画面を開く方法、変更を検査して公開後に確認する方法が載っています。
- 記事や画面を変えるときは、`index.html` の本文と `snapshot-data` の対応を確かめ、`tests/` の検査を実行します。以前の版と比べるために残したファイルは、現在の画面で上書きしません。
- 学童・保育・機械警備の原典を照合するときは、[tools/demand/README.md](tools/demand/README.md) を読みます。取得した原典が登録時と異なっていても、登録済みのハッシュを自動では更新しません。
- 検査に必要な依存ソフトウェアの版と手順は、`.github/workflows/browser.yml` と `.github/workflows/source-check.yml` で確認します。これらの情報を別の文書へ複製しません。
