"""Exercise real urllib redirect dispatch without sockets or network access."""
import importlib.util
import io
import json
import pathlib
import tempfile
import unittest
import urllib.error
import urllib.request
import urllib.response
from email.message import Message
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    'security_transport_target', ROOT / 'demand-security-refresh/check.py'
)
CHECK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECK)
BUILD_OPENER = urllib.request.build_opener
OFFICIAL = 'https://www.npa.go.jp/final.pdf'


class FakeTransport(urllib.request.BaseHandler):
    """Only the HTTP transport is replaced; redirect handling stays real."""
    handler_order = 100

    def __init__(self, responses):
        self.responses = responses
        self.seen = []

    def https_open(self, request):
        self.seen.append(request.full_url)
        code, location, body = self.responses.get(
            request.full_url, (200, None, b'outside response')
        )
        headers = Message()
        if location is not None:
            headers['Location'] = location
        response = urllib.response.addinfourl(
            io.BytesIO(body), headers, request.full_url, code
        )
        response.msg = 'OK' if code == 200 else 'Redirect or error'
        return response

    http_open = https_open

    def build_opener(self, *handlers):
        return BUILD_OPENER(urllib.request.ProxyHandler({}), self, *handlers)


class SecurityTransport(unittest.TestCase):
    def fetch_with(self, transport, url=CHECK.LIST):
        with patch.object(urllib.request, 'build_opener', transport.build_opener):
            return CHECK.fetch(url)

    def test_registered_origin_success_has_receipt(self):
        transport = FakeTransport({CHECK.LIST: (200, None, b'official')})
        raw, receipt = self.fetch_with(transport)
        self.assertEqual(raw, b'official')
        self.assertEqual(receipt, {'http_status': 200, 'final_url': CHECK.LIST})
        self.assertEqual(transport.seen, [CHECK.LIST])

    def test_all_supported_redirect_codes_stay_on_official_origin(self):
        for code in (301, 302, 303, 307, 308):
            with self.subTest(code=code):
                transport = FakeTransport({
                    CHECK.LIST: (code, '/final.pdf', b''),
                    OFFICIAL: (200, None, b'%PDF-fixture'),
                })
                raw, receipt = self.fetch_with(transport)
                self.assertEqual(raw, b'%PDF-fixture')
                self.assertEqual(receipt['final_url'], OFFICIAL)
                self.assertEqual(transport.seen, [CHECK.LIST, OFFICIAL])

    def test_invalid_redirects_are_rejected_before_destination_request(self):
        targets = (
            'https://other.invalid/report.pdf',
            '//other.invalid/report.pdf',
            'http://www.npa.go.jp/report.pdf',
            'https://www.npa.go.jp:444/report.pdf',
            'https://www.npa.go.jp.attacker.invalid/report.pdf',
            'https://user@www.npa.go.jp/report.pdf',
            'https://user:password@www.npa.go.jp/report.pdf',
        )
        for code in (301, 302, 303, 307, 308):
            for target in targets:
                with self.subTest(code=code, target=target):
                    transport = FakeTransport({CHECK.LIST: (code, target, b'')})
                    with self.assertRaises(ValueError):
                        self.fetch_with(transport)
                    self.assertEqual(transport.seen, [CHECK.LIST])

    def test_second_hop_is_checked_before_request(self):
        transport = FakeTransport({
            CHECK.LIST: (302, OFFICIAL, b''),
            OFFICIAL: (302, 'https://other.invalid/return-to-official', b''),
        })
        with self.assertRaises(ValueError):
            self.fetch_with(transport)
        self.assertEqual(transport.seen, [CHECK.LIST, OFFICIAL])

    def test_invalid_initial_url_never_reaches_transport(self):
        targets = (
            'https://other.invalid/report.pdf',
            'http://www.npa.go.jp/report.pdf',
            'https://www.npa.go.jp:444/report.pdf',
            'https://www.npa.go.jp:bad/report.pdf',
            'https://user@www.npa.go.jp/report.pdf',
            'https://www.npa.go.jp/\nreport.pdf',
        )
        for target in targets:
            with self.subTest(target=target):
                transport = FakeTransport({})
                with self.assertRaises(ValueError):
                    self.fetch_with(transport, target)
                self.assertEqual(transport.seen, [])

    def test_standard_https_port_is_allowed(self):
        target = 'https://www.npa.go.jp:443/report.pdf'
        transport = FakeTransport({target: (200, None, b'official')})
        self.assertEqual(self.fetch_with(transport, target)[0], b'official')

    def test_redirect_cycle_stops(self):
        transport = FakeTransport({CHECK.LIST: (302, CHECK.LIST, b'')})
        with self.assertRaises(urllib.error.HTTPError):
            self.fetch_with(transport)
        self.assertGreater(len(transport.seen), 1)
        self.assertLess(len(transport.seen), 12)
        self.assertEqual(set(transport.seen), {CHECK.LIST})

    def test_non_success_status_is_not_accepted(self):
        for code in (204, 404, 500):
            with self.subTest(code=code):
                transport = FakeTransport({CHECK.LIST: (code, None, b'not data')})
                with self.assertRaises((ValueError, urllib.error.HTTPError)):
                    self.fetch_with(transport)

    def test_oversized_body_is_rejected(self):
        transport = FakeTransport({CHECK.LIST: (200, None, b'x' * (16 * 1024 * 1024 + 1))})
        with self.assertRaisesRegex(ValueError, 'size limit'):
            self.fetch_with(transport)

    def test_run_records_redirect_failure_without_adopting_bytes(self):
        transport = FakeTransport({CHECK.LIST: (302, 'https://other.invalid/', b'')})
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            html = root / 'viewer.html'
            html.write_text('<html>input</html>')
            with patch.object(urllib.request, 'build_opener', transport.build_opener):
                code = CHECK.run(html, root / 'result')
            result = json.loads((root / 'result/result.json').read_text())
            self.assertEqual(code, 3)
            self.assertEqual(result['status'], 'review_required_or_failed')
            self.assertEqual(len(result['receipts']), 1)
            self.assertNotIn('verified', result)
            self.assertFalse(result['publish_allowed'])
            self.assertFalse(result['update_applied'])
            self.assertFalse((root / 'result/list.html').exists())
            self.assertEqual(transport.seen, [CHECK.LIST])


if __name__ == '__main__':
    unittest.main()
