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
  for raw,unchanged,label in [(self.baseline.read_bytes(),True,None),(self.current,False,'yomiyasu-domestic-reader-nav-2026-11-23')]:
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
    code,r=self.evaluate(raw);self.assertEqual(code,3);self.assertEqual(r['reviewed_renderer'],'yomiyasu-domestic-reader-nav-2026-11-23');self.assertTrue(any(x['target'].startswith('/') for x in r['issues']))
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

class ReviewedProse(unittest.TestCase):
 """Exact editorial exceptions cannot bless other edits or bypass source checks."""
 @classmethod
 def setUpClass(cls):
  ReviewedRenderer.setUpClass()
  cls.check=ReviewedRenderer.check;cls.baseline=ReviewedRenderer.baseline
  cls.current=cls.baseline.read_bytes()
 evaluate=ReviewedRenderer.evaluate
 def setUp(self):
  import copy
  self.data=self.check.snapshot(self.current)
  self.index=next(i for i,m in enumerate(self.data['markets']) if m['id']=='jp-gakudo-ict-halfway.md')
  self.pointer=f'/markets/{self.index}/title'
  self.old=self.data['markets'][self.index]['title'];self.new=self.old+'：確認範囲'
  self.item={'json_pointer':self.pointer,'historical_hash':self.check.digest(self.old),'current_hash':self.check.digest(self.new),'review_id':'independent-unit-test'}
 def manifest(self,entries):return {'schema_version':1,'baseline_sha256':self.check.BASE,'entries':entries}
 def raw(self,data):
  import re
  return re.sub(self.check.PATTERN,lambda m:m[1]+json.dumps(data,ensure_ascii=False).encode()+m[2],self.current,flags=re.S)
 def with_entries(self,data,entries,source_failure=None):
  with tempfile.TemporaryDirectory() as td:
   path=pathlib.Path(td)/'reviewed-prose.json';path.write_text(json.dumps(self.manifest(entries)))
   with patch.object(self.check,'PROSE_FILE',path):return self.evaluate(self.raw(data),source_failure)
 def test_exact_pair_passes_without_claiming_unchanged_or_publication(self):
  self.data['markets'][self.index]['title']=self.new
  code,r=self.with_entries(self.data,[self.item]);self.assertEqual(code,0)
  leaf=next(x for x in r['dependencies'] if x['json_pointer']==self.pointer)
  self.assertFalse(leaf['unchanged']);self.assertTrue(leaf['reviewed_prose']);self.assertEqual(leaf['review_id'],'independent-unit-test')
  self.assertEqual(r['status'],'unchanged_sources_and_exact_reviewed_prose_match')
  self.assertFalse(r['publish_allowed']);self.assertFalse(r['browser_render_verified']);self.assertFalse(r['update_applied'])
 def test_accidental_edit_unregistered_reversal_and_wrong_pair_fail(self):
  import copy
  for mode in ['one-character','reversal','old-hash','new-hash','other-pointer','no-entry']:
   data=copy.deepcopy(self.data);item=dict(self.item);data['markets'][self.index]['title']=self.new
   if mode=='one-character':data['markets'][self.index]['title']+='。'
   if mode=='reversal':data['markets'][self.index]['title']=self.old+'とは言えない'
   if mode=='old-hash':item['historical_hash']='0'*64
   if mode=='new-hash':item['current_hash']='0'*64
   if mode=='other-pointer':item['json_pointer']=self.pointer.replace('/title','/summary')
   with self.subTest(mode=mode):self.assertEqual(self.with_entries(data,[] if mode=='no-entry' else [item])[0],3)
 def test_missing_and_nonstring_values_never_approved(self):
  import copy
  for value in [None,3,True,{},[],'DELETE']:
   d=copy.deepcopy(self.data)
   if value=='DELETE':del d['markets'][self.index]['title']
   else:d['markets'][self.index]['title']=value
   with self.subTest(value=value):self.assertEqual(self.with_entries(d,[self.item])[0],3)
 def test_numeric_and_url_tokens_rejected_even_with_matching_pair(self):
  for old,new in [('対象は2024年です。','対象は2025年です。'),('出典 https://example.org/a','出典 https://example.org/b')]:
   item=dict(self.item,historical_hash=self.check.digest(old),current_hash=self.check.digest(new))
   self.assertIsNone(self.check.approved_prose(self.pointer,{self.pointer:old},{self.pointer:new},{self.pointer:item}))
 def test_invalid_manifests_fail_closed(self):
  import copy
  valid=self.manifest([self.item]);cases=[]
  for key,value in [('schema_version',True),('baseline_sha256','0'*64),('entries',{})]:
   d=copy.deepcopy(valid);d[key]=value;cases.append(d)
  d=copy.deepcopy(valid);d['entries']*=2;cases.append(d)
  for pointer in ['/claims/1/source_urls/0','/claims/1/status','/charts/1/rows/0/value']:
   d=copy.deepcopy(valid);d['entries'][0]['json_pointer']=pointer;cases.append(d)
  for d in cases:
   with tempfile.TemporaryDirectory() as td:
    p=pathlib.Path(td)/'reviewed-prose.json';p.write_text(json.dumps(d))
    with self.subTest(manifest=d),self.assertRaises(ValueError):self.check.load_reviewed_prose(p)
 def test_exact_primary_page_fixed_status_cannot_be_registered(self):
  item=dict(self.item,json_pointer='/claims/48/source_locators/1/exact_primary_page',
            historical_hash=self.check.digest('unread'),current_hash=self.check.digest('read'))
  with tempfile.TemporaryDirectory() as td:
   path=pathlib.Path(td)/'reviewed-prose.json';path.write_text(json.dumps(self.manifest([item])))
   with self.assertRaisesRegex(ValueError,'Invalid/duplicate reviewed-prose pointer'):
    self.check.load_reviewed_prose(path)
  self.assertIsNone(self.check.approved_prose(item['json_pointer'],
   {item['json_pointer']:'unread'},{item['json_pointer']:'read'},{item['json_pointer']:item}))
 def test_missing_manifest_preserves_strict_baseline(self):
  with tempfile.TemporaryDirectory() as td,patch.object(self.check,'PROSE_FILE',pathlib.Path(td)/'absent.json'):
   self.assertEqual(self.evaluate(self.current)[0],0)
   self.data['markets'][self.index]['title']=self.new
   self.assertEqual(self.evaluate(self.raw(self.data))[0],3)
 def test_sources_chart_linkage_and_empty_structure_still_fail(self):
  import copy
  self.data['markets'][self.index]['title']=self.new
  for name in self.check.ADAPTERS:
   with self.subTest(source=name):self.assertEqual(self.with_entries(self.data,[self.item],name)[0],3)
  for kind in ['chart','empty-container','duplicate-id','summary-only','unknown-shell']:
   d=copy.deepcopy(self.data);entries=[self.item]
   if kind=='chart':next(x for x in d['charts'] if x['id']=='jp-nursery-ict-halfway')['rows'][0]['value']+=1
   if kind=='empty-container':d['markets'][self.index]['extra']={}
   if kind=='duplicate-id':d['markets'].append(copy.deepcopy(d['markets'][self.index]))
   if kind=='summary-only':
    old=d['markets'][self.index]['summary'];new=old+' 補足。';d['markets'][self.index]['summary']=new
    entries.append(dict(self.item,json_pointer=f'/markets/{self.index}/summary',historical_hash=self.check.digest(old),current_hash=self.check.digest(new)))
   if kind=='unknown-shell':
    with patch.object(self,'current',self.current.replace(b'<style>',b'<style>/*unreviewed*/',1)):
     code,_=self.with_entries(d,entries)
   else:code,_=self.with_entries(d,entries)
   with self.subTest(kind=kind):self.assertEqual(code,3)
