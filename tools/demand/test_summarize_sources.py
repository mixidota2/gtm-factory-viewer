import unittest
from summarize_sources import KNOWN_LANDING, LANDING_CHANGED, render


def failed(result, group='childcare'):
    return {'groups': {group: {'status': 'review_required_or_failed', 'exit_code': 3, 'result': result}}}


def source(name):
    return {
        'name': name, 'http_status': 200, 'source_changed': False, 'status': 'received',
        'sha256': 'a' * 64, 'registered_sha256': 'a' * 64,
    }


def scope_result(http_status):
    receipt = {'url': KNOWN_LANDING}
    if http_status is not None:
        receipt['http_status'] = http_status
    return {
        'source_exit_code': 0,
        'lists': {'nursery': {'discovery': {'records': [{
            'url': KNOWN_LANDING,
            'scope_review': {'status': 'review_required_or_failed', 'error': LANDING_CHANGED, 'receipts': [receipt]},
        }]}}},
    }


class SummaryTests(unittest.TestCase):
    def test_landing_changed_and_original_sources_match(self):
        refresh = {'sources': [source('gakudo'), source('nursery')]}
        out = render(failed(scope_result(200)), refresh, {})
        self.assertIn('原典PDFは一致。案内先の候補PDFは未確認', out)
        self.assertNotIn('接続・HTTP応答', out)
        self.assertNotIn(KNOWN_LANDING, out)

    def test_landing_changed_does_not_invent_pdf_match(self):
        refresh = {'sources': [source('gakudo'), source('gakudo')]}
        out = render(failed(scope_result(200)), refresh, {})
        self.assertIn('案内ページが変わりました', out)
        self.assertNotIn('原典PDFは一致', out)

    def test_failed_transport_is_not_landing_change(self):
        out = render(failed(scope_result(None)), {'sources': [source('gakudo'), source('nursery')]}, {})
        self.assertIn('接続・HTTP応答', out)
        self.assertNotIn('案内ページが変わりました', out)

    def test_security_distinguishes_unavailable_and_changed(self):
        out = render(failed({'receipts': [{'http_status': 200}, {'http_status': 503}]}, 'security'), {}, {})
        self.assertIn('公式一覧または原典PDFを取得できませんでした', out)
        out = render(failed({'issues': ['Report bytes changed; definitions/tables/period must be reviewed before extraction']}, 'security'), {}, {})
        self.assertIn('今回取得したPDFの内容が一致しません', out)

    def test_fixed_links_only_when_artifact_id_is_valid(self):
        env = {'GITHUB_REPOSITORY': 'mixidota2/gtm-factory-viewer', 'GITHUB_RUN_ID': '123', 'SOURCE_EVIDENCE_ID': '456'}
        self.assertIn('/actions/runs/123/artifacts/456)', render({}, {}, env))
        for invalid in ('', 'x', '123\n', '1)\n<script>'):
            self.assertNotIn('/artifacts/', render({}, {}, dict(env, SOURCE_EVIDENCE_ID=invalid)))

    def test_malformed_and_untrusted_text_do_not_escape_into_markdown(self):
        injection = ')](https://example.invalid/private)\n|::notice::'
        report = failed({'issues': [injection], 'lists': {'nursery': []}})
        out = render(report, {'sources': [{'name': [], 'status': injection}]}, {
            'GITHUB_REPOSITORY': injection, 'GITHUB_RUN_ID': '123', 'SOURCE_EVIDENCE_ID': '456',
        })
        self.assertNotIn('example.invalid', out)
        self.assertNotIn('::notice::', out)
        self.assertIn('結果が不足', out)
        self.assertIn('結果を取得できませんでした', render({'groups': []}, {}, {}))

    def test_success_requires_outer_successful_exit_code(self):
        r = {'groups': {'childcare': {'status': 'unchanged', 'exit_code': 0}, 'security': {'status': 'unchanged', 'exit_code': False}}}
        self.assertEqual(render(r, {}, {}).count('掲載内容を照合しました。'), 1)


if __name__ == '__main__':
    unittest.main()
