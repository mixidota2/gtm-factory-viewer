#!/usr/bin/env python3
"""Read-only integration check; no map rewrite or publication."""
import argparse,hashlib,importlib.util,json,pathlib,re,subprocess
BASE='ae8a1d8cc0758b5252ec3885b52819bcabfc7d8a7561ac51438770dd65415f32'
ROOT=pathlib.Path(__file__).resolve().parent.parent
def load(name):
 spec=importlib.util.spec_from_file_location(name,ROOT/f'demand-rebuilt-{name}/build.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
ADAPTERS={k:load(k) for k in ['gakudo','nursery']}
def snapshot(raw):return json.loads(re.search(rb'<script id="snapshot-data" type="application/json">(.*?)</script>',raw,re.S)[1])
def leaves(x,path=''):
 if isinstance(x,dict):
  for k,v in x.items():yield from leaves(v,path+'/'+k.replace('~','~0').replace('/','~1'))
 elif isinstance(x,list):
  for i,v in enumerate(x):yield from leaves(v,path+'/'+str(i))
 else:yield path,x
def digest(v):return hashlib.sha256(json.dumps(v,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
# Exact reviewed renderer for the water/coastwise supplement. This is not a
# source or browser approval: source/dependency guards below and browser CI
# remain independent. Any other renderer change requires review again.
REVIEWED_SHELLS = {'ceab931427f9de31a6e15907293e589021ea3a68009f2363ca7cc648cd9ec6c8': 'water-coastwise-supplement'}
PATTERN = rb'(<script id="snapshot-data" type="application/json">).*?(</script>)'
def outside_snapshot(raw):
 if len(re.findall(PATTERN, raw, flags=re.S)) != 1:
  raise ValueError('Expected exactly one snapshot block')
 return re.sub(PATTERN, lambda m: m[1]+b'SNAPSHOT'+m[2], raw, flags=re.S)
def run(html,baseline,pdfs,out):
 out.mkdir(parents=True,exist_ok=False);raw=html.read_bytes();base=baseline.read_bytes()
 if hashlib.sha256(base).hexdigest()!=BASE:raise ValueError('Historical fixture differs')
 data=snapshot(raw);old=snapshot(base);states={};issues=[]
 outside=outside_snapshot(raw);outside_equal=outside==outside_snapshot(base)
 outside_sha256=hashlib.sha256(outside).hexdigest();reviewed_shell=REVIEWED_SHELLS.get(outside_sha256)
 if not outside_equal and reviewed_shell is None:issues.append({'target':'HTML outside snapshot','reason':'Markup/style/rendering code differs from fixed baseline','decision':'Review code and run actual browser checks; data agreement alone is insufficient.'})
 for name,adapter in ADAPTERS.items():
  try:
   code=adapter.run(pdfs[name],html,out/name);states[name]=json.loads((out/name/'evidence.json').read_text());
   if code:issues.append({'target':name,'reason':states[name]['status'],'decision':'Review original source, period, denominator and named observation; do not reuse old interpretation.'})
  except (ValueError,OSError,subprocess.SubprocessError) as e:states[name]={'status':'failed','error':str(e)};issues.append({'target':name,'reason':str(e),'decision':'Resolve source/claim mismatch before integration.'})
 # Collect every leaf of related objects, plus incidental keyword/URL references elsewhere.
 keys=['jp-gakudo-ict-halfway','jp-nursery-ict-halfway','学童','保育',ADAPTERS['gakudo'].URL,ADAPTERS['nursery'].URL]
 def select(d):
  found={}
  for section in ['markets','claims','charts','themes']:
   for i,obj in enumerate(d[section]):
    if any(k in json.dumps(obj,ensure_ascii=False) for k in keys):found.update(leaves(obj,f'/{section}/{i}'))
  for p,v in leaves(d):
   if isinstance(v,str) and any(k in v for k in keys):found[p]=v
  return found
 previous=select(old);current=select(data);dependencies=[]
 for pointer in sorted(set(previous)|set(current)):
  equal=pointer in previous and pointer in current and previous[pointer]==current[pointer]
  dependencies.append({'json_pointer':pointer,'historical_hash':digest(previous.get(pointer)),'current_hash':digest(current.get(pointer)),'unchanged':equal,'evidence_status':'unchanged inherited text/data, not newly source-verified'})
  if not equal:issues.append({'target':pointer,'reason':'Related display/source differs from historical fixture','decision':'Review text, comparison, denominator, dates and source linkage; no automatic rewrite.'})
 if all(s.get('status') in ['unchanged_source_and_claim','unchanged_source_values_match'] for s in states.values()):
  for name in ADAPTERS:
   stem=f'jp-{name}-ict-halfway';claim=next(c for c in data['claims'] if c['claim_id']==stem+'-observation');market=next(m for m in data['markets'] if m['id']==stem+'.md')
   if market['summary']!=claim['text'] or market['text'].count(claim['text'])!=1 or ADAPTERS[name].URL not in market['text']:issues.append({'target':stem,'reason':'Article/summary/claim/source linkage mismatch','decision':'Align observation displays and source.'})
  chart=next(c for c in data['charts'] if c['id']=='jp-nursery-ict-halfway');metric_keys=['any_adopt','four_all','contact','entry','planning','cashless'];expected=[float(states['nursery']['metrics'][k]['percent']) for k in metric_keys]
  if [r['value'] for r in chart['rows']]!=expected:issues.append({'target':'nursery chart','reason':'Chart values differ from source','decision':'Review chart rows with original table columns.'})
 report={'status':('unchanged_sources_data_and_html_match' if outside_equal else 'unchanged_sources_data_and_reviewed_html_match') if not issues else 'editorial_review_required','html_outside_snapshot_unchanged':outside_equal,'html_outside_snapshot_sha256':outside_sha256,'reviewed_renderer':reviewed_shell,'browser_render_verified':False,'source_runs':{k:s.get('status') for k,s in states.items()},'viewer_sha256':hashlib.sha256(raw).hexdigest(),'dependencies':dependencies,'issues':issues,'publish_allowed':False,'update_applied':False,'scope':'Static data and exact outside-snapshot HTML comparison to the historical fixture or a specifically reviewed renderer hash only; no actual browser/render result verified. Related-object and keyword dependency inventory is not exhaustive semantic analysis. Exact fixture comparison does not newly validate inherited interpretations.'}
 (out/'integration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');return 0 if not issues else 3
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--html',type=pathlib.Path,required=True);p.add_argument('--out',type=pathlib.Path,required=True);p.add_argument('--gakudo-pdf',type=pathlib.Path,required=True);p.add_argument('--nursery-pdf',type=pathlib.Path,required=True);a=p.parse_args();raise SystemExit(run(a.html,ROOT/'demand-recovered/care-integration/tests/fixtures/historical-index.html',{'gakudo':a.gakudo_pdf,'nursery':a.nursery_pdf},a.out))
