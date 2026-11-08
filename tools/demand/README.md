# 需要地図の出典確認

学童・保育・機械警備の公式一覧と原典を取得し、保存した `index.html` の該当箇所と照合します。確認できない資料や変更された資料があれば、終了コード 3 と理由を保存します。本文の更新や公開は行いません。

Python 3 と Poppler の `pdftotext` を用意して、リポジトリのルートから実行します。出力先は実行ごとに新しいディレクトリを指定してください。

```sh
python3 tools/demand/check_all.py --html index.html --out source-evidence
```

PDF 全文はリポジトリに含めません。取得した PDF、一覧の HTML、抽出した原文のページテキストはローカルでの確認に使いますが、公開 CI の成果物には含めません。出典 URL、取得結果、ハッシュ、対象の数値、照合結果は保存します。

保存済みの学童・保育 PDF を照合するときは、ファイルを明示して実行します。登録済みハッシュと異なる資料を自動採用することはありません。

```sh
python3 tools/demand/demand-integrated/verify.py --html index.html --gakudo-pdf /path/to/gakudo.pdf --nursery-pdf /path/to/nursery.pdf --out saved-source-evidence
```

`manifest.json` は同梱する検証用ファイルの SHA-256 です。原典の URL と登録済みハッシュは各検証処理にも記載しています。調査範囲は各処理の対象となる一覧・資料・表に限られ、すべての新資料が存在しないことや、本文の全解釈を再検証したことを意味しません。
