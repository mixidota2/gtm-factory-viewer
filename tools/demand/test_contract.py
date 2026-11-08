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

class ReviewedRenderer(unittest.TestCase):
 """Renderer recognition never waives original source/dependency validation."""
 @classmethod
 def setUpClass(cls):
  import importlib.util
  cls.root=pathlib.Path(__file__).resolve().parent
  spec=importlib.util.spec_from_file_location('care_renderer_contract',cls.root/'demand-integrated/verify.py')
  cls.check=importlib.util.module_from_spec(spec);spec.loader.exec_module(cls.check)
  cls.baseline=cls.root/'demand-recovered/care-integration/tests/fixtures/historical-index.html'
  cls.current=(cls.root.parent.parent/'index.html').read_bytes()
 def evaluate(self,raw,source_failure=None):
  import contextlib
  with tempfile.TemporaryDirectory() as td,contextlib.ExitStack() as stack:
   p=pathlib.Path(td);html=p/'index.html';html.write_bytes(raw)
   def fake(name):
    def run(pdf,html,out):
     out.mkdir();failed=name==source_failure
     evidence={'status':'changed_source_review_required' if failed else 'unchanged_source_and_claim' if name=='gakudo' else 'unchanged_source_values_match'}
     if name=='nursery':evidence['metrics']={k:{'percent':v} for k,v in zip(['any_adopt','four_all','contact','entry','planning','cashless'],['84.4','11.7','71.5','71.3','55.4','15.0'])}
     (out/'evidence.json').write_text(json.dumps(evidence));return 3 if failed else 0
    return run
   for name,adapter in self.check.ADAPTERS.items():stack.enter_context(patch.object(adapter,'run',fake(name)))
   code=self.check.run(html,self.baseline,{k:p/'unused.pdf' for k in self.check.ADAPTERS},p/'out')
   return code,json.loads((p/'out/integration.json').read_text())
 def test_historical_and_reviewed_renderer_remain_distinct(self):
  for raw,unchanged,label in [(self.baseline.read_bytes(),True,None),(self.current,False,'water-coastwise-supplement')]:
   with self.subTest(unchanged=unchanged):
    code,result=self.evaluate(raw);self.assertEqual(code,0);self.assertEqual(result['html_outside_snapshot_unchanged'],unchanged);self.assertEqual(result['reviewed_renderer'],label);self.assertFalse(result['browser_render_verified']);self.assertFalse(result['publish_allowed'])
 def test_unknown_style_code_and_label_fail(self):
  for old,new in [(b'<style>',b'<style>/* changed */'),(b'function inline(text){',b'function inline(text){/* changed */'),('日本の8観測'.encode(),'日本の9観測'.encode())]:
   with self.subTest(old=old):
    self.assertIn(old,self.current);code,r=self.evaluate(self.current.replace(old,new,1));self.assertEqual(code,3);self.assertTrue(any(x['target']=='HTML outside snapshot' for x in r['issues']))
 def test_dependency_text_chart_and_url_fail_with_reviewed_shell(self):
  import copy,re
  data=self.check.snapshot(self.current)
  for kind in ['text','chart','url']:
   changed=copy.deepcopy(data)
   if kind=='chart':next(c for c in changed['charts'] if c['id']=='jp-nursery-ict-halfway')['rows'][0]['value']+=1
   else:
    claim=next(c for c in changed['claims'] if c['claim_id']=='jp-gakudo-ict-halfway-observation')
    if kind=='text':claim['text']+=' changed'
    else:claim['source_urls'][0]='https://example.invalid/changed.pdf'
   raw=re.sub(self.check.PATTERN,lambda m:m[1]+json.dumps(changed,ensure_ascii=False).encode()+m[2],self.current,flags=re.S)
   with self.subTest(kind=kind):
    code,r=self.evaluate(raw);self.assertEqual(code,3);self.assertEqual(r['reviewed_renderer'],'water-coastwise-supplement');self.assertTrue(any(x['target'].startswith('/') for x in r['issues']))
 def test_adapter_failure_propagates_for_each_source(self):
  for name in self.check.ADAPTERS:
   with self.subTest(name=name):
    code,r=self.evaluate(self.current,name);self.assertEqual(code,3);self.assertTrue(any(x['target']==name for x in r['issues']))
 def test_changed_pdf_bytes_are_rejected_by_real_adapters(self):
  with tempfile.TemporaryDirectory() as td:
   p=pathlib.Path(td);pdf=p/'changed.pdf';pdf.write_bytes(b'%PDF-unregistered test bytes');html=p/'index.html';html.write_bytes(self.current)
   self.assertEqual(self.check.run(html,self.baseline,{k:pdf for k in self.check.ADAPTERS},p/'out'),3)
   r=json.loads((p/'out/integration.json').read_text());self.assertEqual(set(r['source_runs'].values()),{'changed_source_review_required'})
 def test_modified_historical_fixture_rejected(self):
  with tempfile.TemporaryDirectory() as td:
   p=pathlib.Path(td);base=p/'old.html';base.write_bytes(self.baseline.read_bytes()+b' ');html=p/'index.html';html.write_bytes(self.current)
   with self.assertRaisesRegex(ValueError,'Historical fixture differs'):self.check.run(html,base,{},p/'out')
 def test_missing_or_duplicate_snapshot_rejected(self):
  import re
  block=re.search(self.check.PATTERN,self.current,re.S)[0]
  for raw in [self.current.replace(block,b''),self.current+block]:
   with self.assertRaisesRegex(ValueError,'exactly one snapshot'):self.check.outside_snapshot(raw)
