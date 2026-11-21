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
# A fixed, separately reviewed exact-pair exception list, never learned from input.
PROSE_FILE = pathlib.Path(__file__).with_name('reviewed-prose.json')
PROSE_FIELDS = frozenset({'title','summary','text','body','entry','read_scope','unread',
 'value_hypothesis','limits','judgment_change','source_coverage',
 'comparison','scope_text','world_coverage_statement','comparison_rules',
 'population','primary_read_scope','independent_verification_scope','unconfirmed',
 'observation_text','evidence_type','context','population_denominator','locator'})
def prose_pointer(pointer):
 if not isinstance(pointer,str) or not pointer.startswith('/') or '~' in re.sub(r'~[01]','',pointer):return False
 parts=[x.replace('~1','/').replace('~0','~') for x in pointer.split('/')[1:]]
 field=parts[-2] if len(parts)>1 and parts[-1].isdigit() else parts[-1]
 return field in PROSE_FIELDS

def load_reviewed_prose(path):
 if not path.exists():return {}
 def unique(pairs):
  obj={}
  for key,value in pairs:
   if key in obj:raise ValueError('Duplicate reviewed-prose JSON key')
   obj[key]=value
  return obj
 obj=json.loads(path.read_text(),object_pairs_hook=unique)
 if type(obj) is not dict or set(obj)!={'schema_version','baseline_sha256','entries'} or type(obj['schema_version']) is not int or obj['schema_version']!=1 or obj['baseline_sha256']!=BASE or type(obj['entries']) is not list:
  raise ValueError('Invalid reviewed-prose manifest')
 result={}
 for item in obj['entries']:
  if type(item) is not dict or set(item)!={'json_pointer','historical_hash','current_hash','review_id'}:raise ValueError('Invalid reviewed-prose entry')
  pointer=item['json_pointer']
  if not prose_pointer(pointer) or pointer in result:raise ValueError('Invalid/duplicate reviewed-prose pointer')
  if any(type(item[k]) is not str or re.fullmatch(r'[0-9a-f]{64}',item[k]) is None for k in ['historical_hash','current_hash']):raise ValueError('Invalid reviewed-prose hash')
  if item['historical_hash']==item['current_hash'] or type(item['review_id']) is not str or not item['review_id'].strip():raise ValueError('Invalid reviewed-prose review')
  result[pointer]=item
 return result

def approved_prose(pointer,previous,current,approvals):
 if pointer not in previous or pointer not in current:return None
 old,new=previous[pointer],current[pointer]
 if type(old) is not str or type(new) is not str or not prose_pointer(pointer):return None
 item=approvals.get(pointer)
 if not item or digest(old)!=item['historical_hash'] or digest(new)!=item['current_hash']:return None
 # Exact hashes alone cannot authorize changed numeric tokens or links.
 if re.findall(r'\d+(?:[,.]\d+)*',old)!=re.findall(r'\d+(?:[,.]\d+)*',new):return None
 if re.findall(r'https?://[^\s)<>]+',old)!=re.findall(r'https?://[^\s)<>]+',new):return None
 return item

def structure(value):
 if isinstance(value,dict):return ('dict',tuple((k,structure(v)) for k,v in sorted(value.items())))
 if isinstance(value,list):return ('list',tuple(structure(v) for v in value))
 return type(value).__name__

# Exact reviewed renderers for the water supplement, metadata search, observation focus, re-selection, explicit search links and overseas article focus. This is not a
# source or browser approval: source/dependency guards below and browser CI
# remain independent. Any other renderer change requires review again.
REVIEWED_SHELLS = {'39e050ef47e04eef141d849eb7f2598dc466e4b4cb169cf631241cb61936154d': 'yomiyasu-candidate-conditions-2026-11-21', 'ac9acebd2754fe9d3b37f5a9c069beb92369b096e4272427263387d83647becf': 'yomiyasu-dental-water-labels-2026-11-20', '48dd588fdd22cce7aa92611dc3638a930c602c00a3e318efe809c80af6ba469a': 'yomiyasu-whole-document-2026-11-18', '4caccec4e8650eb1338a199cb270265ba298a7244a0746230dc5488e611c5276': 'lighting-september-2026-candidate', '62523bf19bfd3cfde35da50dd02a426b7b29a93f8284bb4dccf93c522459a7c5': 'overseas-article-keyboard-focus', '90d34ded8e7118f156dc67a8e4bad72617b881b0d8326218476babeaec465fc2': 'explicit-search-permalinks', '3de84d1fb0dd30ebc7a266f5de476252ab53717da236ca3e8562acdea7de4fcc': 'observation-reselection', '14a2d69ea5f3f175165367fd2f777c1e344ac7742e304cdb0d537e327ffc7969': 'observation-keyboard-focus', 'f647232756893d45b6c4b466245289f64a00d3a58f02dc7f6da760c5a25c5c3b': 'observation-metadata-search', 'ceab931427f9de31a6e15907293e589021ea3a68009f2363ca7cc648cd9ec6c8': 'water-coastwise-supplement'}
PATTERN = rb'(<script id="snapshot-data" type="application/json">).*?(</script>)'
def outside_snapshot(raw):
 if len(re.findall(PATTERN, raw, flags=re.S)) != 1:
  raise ValueError('Expected exactly one snapshot block')
 return re.sub(PATTERN, lambda m: m[1]+b'SNAPSHOT'+m[2], raw, flags=re.S)
def run(html,baseline,pdfs,out):
 out.mkdir(parents=True,exist_ok=False);raw=html.read_bytes();base=baseline.read_bytes()
 if hashlib.sha256(base).hexdigest()!=BASE:raise ValueError('Historical fixture differs')
 data=snapshot(raw);old=snapshot(base);states={};issues=[]
 approvals=load_reviewed_prose(PROSE_FILE)
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
 def selected_shapes(d):
  return {f'/{section}/{i}':structure(obj) for section in ['markets','claims','charts','themes'] for i,obj in enumerate(d[section]) if any(k in json.dumps(obj,ensure_ascii=False) for k in keys)}
 old_shapes=selected_shapes(old);new_shapes=selected_shapes(data)
 for pointer in sorted(set(old_shapes)|set(new_shapes)):
  if old_shapes.get(pointer)!=new_shapes.get(pointer):issues.append({'target':pointer,'reason':'Related object structure/type differs','decision':'Review keys, array order/length and leaf types; prose approval cannot waive structure.'})
 identities_valid=True
 for section,key in [('markets','id'),('claims','claim_id'),('charts','id')]:
  ids=[obj.get(key) for obj in data[section]]
  if any(type(x) is not str for x in ids) or len(set(ids))!=len(ids):
   identities_valid=False;issues.append({'target':section,'reason':'Missing/duplicate object identity','decision':'Restore unique identities.'})
 for section,key,required in [('markets','id',['jp-gakudo-ict-halfway.md','jp-nursery-ict-halfway.md']),('claims','claim_id',['jp-gakudo-ict-halfway-observation','jp-nursery-ict-halfway-observation']),('charts','id',['jp-nursery-ict-halfway'])]:
  if any(sum(obj.get(key)==value for obj in data[section])!=1 for value in required):
   identities_valid=False;issues.append({'target':section,'reason':'Required related identity missing or duplicated','decision':'Restore required related identities.'})
 previous=select(old);current=select(data);dependencies=[];reviewed_changes=[]
 for pointer in sorted(set(previous)|set(current)):
  equal=pointer in previous and pointer in current and type(previous[pointer]) is type(current[pointer]) and previous[pointer]==current[pointer]
  approval=None if equal else approved_prose(pointer,previous,current,approvals)
  dependency={'json_pointer':pointer,'historical_hash':digest(previous.get(pointer)),'current_hash':digest(current.get(pointer)),'unchanged':equal,'reviewed_prose':bool(approval),'evidence_status':'unchanged inherited text/data, not newly source-verified' if equal else 'exact reviewed prose pair; not newly source-verified' if approval else 'unreviewed change'}
  if approval:dependency['review_id']=approval['review_id'];reviewed_changes.append(dict(approval))
  dependencies.append(dependency)
  if not equal and not approval:issues.append({'target':pointer,'reason':'Related display/source differs from historical fixture','decision':'Review text, comparison, denominator, dates and source linkage; no automatic rewrite.'})
 if identities_valid and all(s.get('status') in ['unchanged_source_and_claim','unchanged_source_values_match'] for s in states.values()):
  for name in ADAPTERS:
   stem=f'jp-{name}-ict-halfway';claim=next(c for c in data['claims'] if c['claim_id']==stem+'-observation');market=next(m for m in data['markets'] if m['id']==stem+'.md')
   if market['summary']!=claim['text'] or market['text'].count(claim['text'])!=1 or ADAPTERS[name].URL not in market['text']:issues.append({'target':stem,'reason':'Article/summary/claim/source linkage mismatch','decision':'Align observation displays and source.'})
  chart=next(c for c in data['charts'] if c['id']=='jp-nursery-ict-halfway');metric_keys=['any_adopt','four_all','contact','entry','planning','cashless'];expected=[float(states['nursery']['metrics'][k]['percent']) for k in metric_keys]
  if [r['value'] for r in chart['rows']]!=expected:issues.append({'target':'nursery chart','reason':'Chart values differ from source','decision':'Review chart rows with original table columns.'})
 report={'status':('unchanged_sources_and_exact_reviewed_prose_match' if reviewed_changes else ('unchanged_sources_data_and_html_match' if outside_equal else 'unchanged_sources_data_and_reviewed_html_match')) if not issues else 'editorial_review_required','html_outside_snapshot_unchanged':outside_equal,'html_outside_snapshot_sha256':outside_sha256,'reviewed_renderer':reviewed_shell,'browser_render_verified':False,'source_runs':{k:s.get('status') for k,s in states.items()},'viewer_sha256':hashlib.sha256(raw).hexdigest(),'dependencies':dependencies,'reviewed_prose_changes':reviewed_changes,'issues':issues,'publish_allowed':False,'update_applied':False,'scope':'Static data and exact outside-snapshot HTML comparison to the historical fixture or a specifically reviewed renderer hash only; no actual browser/render result verified. Related-object and keyword dependency inventory is not exhaustive semantic analysis. Exact fixture comparison and registered prose pairs do not newly validate inherited interpretations. Prose approval requires the fixed historical hash, pointer, current hash, string type and preserved numeric/link tokens; it never waives adapters or display linkage.'}
 (out/'integration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');return 0 if not issues else 3
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--html',type=pathlib.Path,required=True);p.add_argument('--out',type=pathlib.Path,required=True);p.add_argument('--gakudo-pdf',type=pathlib.Path,required=True);p.add_argument('--nursery-pdf',type=pathlib.Path,required=True);a=p.parse_args();raise SystemExit(run(a.html,ROOT/'demand-recovered/care-integration/tests/fixtures/historical-index.html',{'gakudo':a.gakudo_pdf,'nursery':a.nursery_pdf},a.out))
