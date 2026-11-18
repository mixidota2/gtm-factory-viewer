"""Exercise the font installer without network, sudo, or package installation."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('install_ci_fonts.sh').resolve()


class FontInstallerTest(unittest.TestCase):
    def run_installer(self, fail=''):
        with tempfile.TemporaryDirectory() as root:
            root = Path(root)
            bin_dir = root / 'bin'
            bin_dir.mkdir()
            commands = {
                'sudo': '#!/bin/bash\nexec "$@"\n',
                'timeout': '#!/bin/bash\nshift 3\nexec "$@"\n',
                'apt-get': '''#!/usr/bin/env python3
import os,sys,pathlib
args=sys.argv[1:]
phase='update' if 'update' in args else ('download' if '--download-only' in args else 'install')
with open(os.environ['FONT_TEST_LOG'],'a') as f: f.write(phase+' '+repr(args)+'\\n')
if os.environ.get('FONT_TEST_FAIL')==phase: sys.exit(42)
if phase=='download':
    archive=next(x.split('=',1)[1] for x in args if x.startswith('Dir::Cache::archives='))
    pathlib.Path(archive,'fonts-noto-cjk_test.deb').write_bytes(b'test-only')
''',
                'fc-cache': '#!/bin/bash\necho cache >> "$FONT_TEST_LOG"\n',
                'dpkg-query': '#!/bin/bash\necho "fonts-noto-cjk 1:20230817+repack1-3"\n',
            }
            for name, body in commands.items():
                target = bin_dir / name
                target.write_text(body)
                target.chmod(0o755)
            env = dict(os.environ, PATH=str(bin_dir)+':'+os.environ['PATH'],
                       FONT_TEST_LOG=str(root/'calls'), FONT_TEST_FAIL=fail)
            result = subprocess.run(['bash',str(SCRIPT)],cwd=root,env=env,capture_output=True,text=True)
            log = (root/'calls').read_text()
            evidence = root/'browser-evidence'
            self.assertIn('https://archive.ubuntu.com/ubuntu',(evidence/'font-source.sources').read_text())
            self.assertIn('Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg',(evidence/'font-source.sources').read_text())
            self.assertIn('Dir::Etc::sourceparts=-',log)
            self.assertNotIn('allow-unauthenticated',log)
            self.assertEqual(result.returncode,42 if fail else 0,result.stderr)
            return log, (evidence/'font-package.txt').exists()

    def test_success(self):
        log, complete = self.run_installer()
        self.assertTrue(complete)
        self.assertIn('--no-download',log)
        self.assertIn('--reinstall',log)
        self.assertIn('fonts-noto-cjk=1:20230817+repack1-3',log)
        self.assertIn('cache',log)

    def test_each_failed_stage_stops_before_font_success(self):
        for stage in ['update','download','install']:
            with self.subTest(stage=stage):
                log, complete = self.run_installer(stage)
                self.assertFalse(complete)
                self.assertNotIn('cache',log)
                if stage=='update': self.assertNotIn('download ',log)
                if stage=='download': self.assertNotIn('install ',log)


if __name__ == '__main__':
    unittest.main()
