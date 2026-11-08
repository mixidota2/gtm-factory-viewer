import pathlib,json,tempfile,unittest,subprocess,sys,time
from unittest.mock import patch
from check_all import run
from test_all import details
class Contract(unittest.TestCase):
 def test_missing_issues_and_inner_failure_rejected(self):
  for mode in ['missing','inner']:
   with tempfile.TemporaryDirectory() as td:
    p=pathlib.Path(td);calls=[]
    def runner(cmd,**kw):
     name='security' if 'security' in cmd[1] else 'childcare';calls.append(name);o=pathlib.Path(cmd[-1]);o.mkdir();r={'status':'unchanged_within_checked_list_report_and_saved_viewer' if name=='security' else 'unchanged_within_checked_lists_sources_and_saved_viewer','issues':[],'update_applied':False,'publish_allowed':False}
     r.update(details(name))
     if name=='childcare':
      r['source_exit_code']=3 if mode=='inner' else 0
      if mode=='missing':del r['issues']
     (o/'result.json').write_text(json.dumps(r));return subprocess.CompletedProcess(cmd,0,'','')
    self.assertEqual(run(p/'index.html',p/'out',runner),3);self.assertEqual(calls,['childcare','security']);r=json.loads((p/'out/result.json').read_text());self.assertEqual(r['groups']['childcare']['status'],'review_required_or_failed');self.assertEqual(r['groups']['security']['status'],'unchanged')
 def test_timeout_budget(self):
  with tempfile.TemporaryDirectory() as td:
   p=pathlib.Path(td);limits=[]
   def runner(cmd,**kw):limits.append(kw['timeout']);raise subprocess.TimeoutExpired(cmd,kw['timeout'])
   self.assertEqual(run(p/'index.html',p/'out',runner),3);self.assertLessEqual(sum(limits),600);self.assertEqual(len(limits),2);self.assertEqual(json.loads((p/'out/result.json').read_text())['status'],'review_required_or_failed')

 def test_real_short_timeout_still_finalizes_both_groups(self):
  with tempfile.TemporaryDirectory() as td,patch('check_all.TIMEOUTS',{'childcare':0.05,'security':0.05}):
   p=pathlib.Path(td);calls=[];start=time.monotonic()
   def runner(cmd,**kw):
    calls.append(cmd);return subprocess.run([sys.executable,'-c','import time;time.sleep(5)'],**kw)
   self.assertEqual(run(p/'index.html',p/'out',runner),3);self.assertEqual(len(calls),2);self.assertLess(time.monotonic()-start,3)
   r=json.loads((p/'out/result.json').read_text());self.assertEqual(len(r['issues']),2)
