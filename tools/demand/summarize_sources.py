"""Render a fixed-vocabulary CI summary. Never change verification decisions."""
import argparse
import json
import os
from pathlib import Path
import re


def obj(value):
    return value if isinstance(value, dict) else {}


def entries(value):
    return value if isinstance(value, list) else []


def read(path):
    try:
        return obj(json.loads(path.read_text(encoding='utf-8')))
    except (OSError, ValueError, RecursionError):
        return {}


def http_ok(record):
    return type(record.get('http_status')) is int and record['http_status'] == 200


def originals_match(result, refresh):
    rows = [obj(x) for x in entries(refresh.get('sources'))]
    return (
        type(result.get('source_exit_code')) is int and result['source_exit_code'] == 0
        and len(rows) == 2 and {r.get('name') for r in rows if isinstance(r.get('name'), str)} == {'gakudo', 'nursery'}
        and all(
            http_ok(r) and r.get('status') == 'received' and r.get('source_changed') is False
            and isinstance(r.get('sha256'), str) and re.fullmatch('[0-9a-f]{64}', r['sha256'])
            and r['sha256'] == r.get('registered_sha256') for r in rows
        )
    )


KNOWN_LANDING = 'https://www.cfa.go.jp/policies/hoiku/hoiku-dx'
LANDING_CHANGED = 'Reviewed content changed or acquisition unconfirmed: ' + KNOWN_LANDING


def childcare_status(result, refresh):
    lists = obj(result.get('lists'))
    if any(obj(lists.get(k)).get('status') == 'failed' and not http_ok(obj(lists.get(k)))
           for k in ('gakudo', 'nursery')):
        return '公式一覧を取得できませんでした。接続・HTTP応答を確認してください。'
    discovery = obj(obj(lists.get('nursery')).get('discovery'))
    scope = [
        obj(r.get('scope_review')) for r in map(obj, entries(discovery.get('records')))
        if r.get('url') == KNOWN_LANDING
    ]
    if len(scope) == 1 and scope[0].get('status') == 'review_required_or_failed':
        receipts = [obj(r) for r in entries(scope[0].get('receipts'))]
        if (len(receipts) == 1 and receipts[0].get('url') == KNOWN_LANDING
                and http_ok(receipts[0])
                and scope[0].get('error') == LANDING_CHANGED):
            if originals_match(result, refresh):
                return '保育の案内ページが変わりました。登録済みの学童・保育の原典PDFは一致。案内先の候補PDFは未確認です。'
            return '保育の案内ページが変わりました。案内先の候補PDFは未確認です。'
        if receipts and any(not http_ok(r) for r in receipts):
            return '保育の案内ページまたは候補PDFを取得できませんでした。接続・HTTP応答を確認してください。'
    if any(obj(r).get('status') == 'failed' for r in entries(refresh.get('sources'))):
        return '登録済みの原典PDFを取得できませんでした。接続・HTTP応答を確認してください。'
    if any(obj(r).get('source_changed') is True for r in entries(refresh.get('sources'))):
        return '登録済みの原典PDFと、今回取得したPDFの内容が一致しません。'
    if discovery.get('status') == 'new_links_require_review':
        return '保育の公式一覧に、まだ確認していないリンクがあります。'
    return '出典または掲載内容の照合に失敗したか、結果が不足しています。'


def security_status(result):
    receipts = entries(result.get('receipts'))
    if receipts and any(not http_ok(obj(r)) for r in receipts):
        return '公式一覧または原典PDFを取得できませんでした。接続・HTTP応答を確認してください。'
    issues = entries(result.get('issues'))
    if 'Report bytes changed; definitions/tables/period must be reviewed before extraction' in issues:
        return '登録済みの原典PDFと、今回取得したPDFの内容が一致しません。'
    if ('Registered report missing from official list' in issues
            or 'Unreviewed report link; period and comparability require review' in issues):
        return '公式一覧の資料リンクが変わりました。'
    return '出典または掲載内容の照合に失敗したか、結果が不足しています。'


def render(report, refresh, env):
    groups = obj(report.get('groups'))
    lines = ['## 需要地図の出典検証', '', '| 検証グループ | 結果 |', '| --- | --- |']
    for key, name in (('childcare', '学童・保育'), ('security', '機械警備')):
        record = obj(groups.get(key))
        result = obj(record.get('result'))
        if record.get('status') == 'unchanged' and type(record.get('exit_code')) is int and record['exit_code'] == 0:
            reason = '確認対象の公式一覧・原典と掲載内容を照合しました。'
        elif not result:
            reason = '結果を取得できませんでした。ジョブのログと成果物を確認してください。'
        elif key == 'childcare':
            reason = childcare_status(result, refresh)
        else:
            reason = security_status(result)
        lines.append(f'| {name} | {reason} |')
    artifact, run = env.get('SOURCE_EVIDENCE_ID', ''), env.get('GITHUB_RUN_ID', '')
    repository = env.get('GITHUB_REPOSITORY', '')
    if (re.fullmatch('[0-9]{1,20}', artifact) and re.fullmatch('[0-9]{1,20}', run)
            and repository == 'mixidota2/gtm-factory-viewer'):
        lines += ['', f'[出典検証の詳細（source-evidence）](https://github.com/{repository}/actions/runs/{run}/artifacts/{artifact})']
    else:
        lines += ['', '詳細は、この実行のログと成果物欄で確認できます。']
    lines += ['', 'この要約は検証結果を表示するだけで、合否や公開の判定は変えません。', '']
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', required=True, type=Path, help='検証結果を保存したディレクトリ')
    args = parser.parse_args()
    with Path(os.environ['GITHUB_STEP_SUMMARY']).open('a', encoding='utf-8') as summary:
        summary.write(render(read(args.out / 'result.json'),
                             read(args.out / 'childcare' / 'sources' / 'refresh.json'), os.environ))


if __name__ == '__main__':
    main()
