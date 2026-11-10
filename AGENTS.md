# 需要地図の作業入口

- このリポジトリの構成、ローカル表示、検証、反映確認は [README.md](README.md) を読む。
- 画面・記事の変更は `index.html` の本文と `snapshot-data` の対応を確認し、`tests/` の検査を使う。過去の比較用ファイルを現在の画面で上書きしない。
- 学童・保育・機械警備の原典照合は [tools/demand/README.md](tools/demand/README.md) を読む。取得した原典が変わった場合は、登録済みハッシュを自動で置き換えない。
- 検証環境の手順は `.github/workflows/browser.yml` と `.github/workflows/source-check.yml` を参照する。依存バージョンや手順を別の文書へ複製しない。
