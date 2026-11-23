const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = function checkSourceDocumentation() {
  const root = path.resolve(__dirname, '..');
  const docs = fs.readFileSync(path.join(root, 'tools/demand/README.md'), 'utf8');
  const single = docs.split('## 手元のPDFだけを使う場合\n')[1]?.split('## GitHub Actions の結果を読む')[0];
  assert.ok(single, 'The existing-PDF check needs its own scope section');
  const check = (text) => {
    assert.ok(text.includes('公表元の一覧は取り直さず、機械警備も対象外です。'));
    assert.ok(text.includes('`integration.json`'));
    assert.ok(text.includes('ブラウザーで画面を開いたり操作したりする検査ではありません。'));
  };
  check(single);
  for (const phrase of ['公表元の一覧は取り直さず、機械警備も対象外です。', '`integration.json`', 'ブラウザーで画面を開いたり操作したりする検査ではありません。']) {
    assert.throws(() => check(single.replace(phrase, '確認済み')));
  }
  for (const file of ['tools/demand/check_all.py', 'tools/demand/demand-integrated/verify.py']) {
    assert.ok(docs.includes(`python3 ${file} --html index.html`));
    assert.ok(fs.statSync(path.join(root, file)).isFile());
  }
  assert.ok(docs.includes('一方の検査が失敗しても、もう一方は実行します。'));
  console.log('PASS source documentation distinguishes live and saved-PDF scope and result files');
};
