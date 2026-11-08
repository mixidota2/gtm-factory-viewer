#!/usr/bin/env python3
"""Transactional local patch proposal. Not a source-approval or publishing tool."""
import argparse,copy,hashlib,json,pathlib,re
from verify import ADAPTERS,ROOT,BASE,snapshot,leaves
SPECS=[('any_adopt','何らかの保育ICTを導入した施設は'),('four_any','補助対象の4機能を一つ以上導入した施設は'),('four_all','4機能すべてを導入した施設は'),('contact','保護者連絡が'),('entry','登降園管理が'),('planning','計画・記録が'),('cashless','キャッシュレス決済が'),('any_use','何らかの機能を活用している割合は'),('all_use','4機能すべてを活用している割合は')]
LOCATORS={'any_adopt':(104,1),'four_any':(104,2),'four_all':(104,3),'contact':(106,3),'entry':(106,1),'planning':(106,6),'cashless':(106,8),'any_use':(108,1),'all_use':(108,3)}
def plan(data,model):
 if model.get('source_url')!=ADAPTERS['nursery'].URL or model.get('source_sha256')!=ADAPTERS['nursery'].HASH:raise ValueError('Unverified source binding; changed source requires review')
 if not isinstance(model.get('period'),list) or any(type(v)!=int for v in model['period']):raise ValueError('Ambiguous period representation')
 if model.get('period')!=[2024,9,11,2024,10,25]:raise ValueError('Changed or ambiguous period requires a new reviewed mapping')
 metrics=model['metrics']
 if set(metrics)!={k for k,_ in SPECS}:raise ValueError('Metric set differs')
 for key,_ in SPECS:
  m=metrics[key]
  if (m.get('pdf_page'),m.get('table_column_1based'))!=LOCATORS[key] or m.get('numerator') is not None or m.get('method')!='published percentage; no reverse-counted numerator':raise ValueError('Population/table mapping or measurement method requires review')
  if type(m.get('denominator'))!=int or m.get('denominator')!=16709 or not re.fullmatch(r'\d+\.\d+',m.get('percent','')) or not 0<=float(m['percent'])<=100:raise ValueError('Ambiguous denominator/value')
 result=copy.deepcopy(data);claim=next(c for c in result['claims'] if c['claim_id']=='jp-nursery-ict-halfway-observation');market=next(m for m in result['markets'] if m['id']=='jp-nursery-ict-halfway.md');chart=next(c for c in result['charts'] if c['id']=='jp-nursery-ict-halfway');old=claim['text'];new=old
 if market['summary']!=old or market['text'].count(old)!=1:raise ValueError('Linked observation displays already diverge')
 if ADAPTERS['nursery'].URL not in claim['source_urls'] or ADAPTERS['nursery'].URL not in market['text']:raise ValueError('Source linkage ambiguous')
 changes=[]
 for key,label in SPECS:
  pattern=re.escape(label)+r'(\d+\.\d+)%';matches=list(re.finditer(pattern,new))
  if len(matches)!=1:raise ValueError('Named metric is not unique: '+key)
  before=matches[0][1];after=metrics[key]['percent']
  new=re.sub(pattern,lambda m:label+after+'%',new)
  if before!=after:changes.append({'metric':key,'before':before,'after':after})
 claim['text']=new;market['summary']=new;market['text']=market['text'].replace(old,new)
 chart_keys=['any_adopt','four_all','contact','entry','planning','cashless']
 if len(chart['rows'])!=len(chart_keys):raise ValueError('Chart mapping differs')
 for row,key in zip(chart['rows'],chart_keys):row['value']=float(metrics[key]['percent'])
 # Only the observation and its six chart rows are mapped. Everything else needs explicit review.
 pending=[]
 if changes:
  for pointer,text in leaves(data):
   if isinstance(text,str) and any(x in text for x in ['保育','nursery','学童']):pending.append({'pointer':pointer,'prior_sha256':hashlib.sha256(text.encode()).hexdigest(),'decision':'Review numerical mentions, comparison, interpretation, cautions and source locators before applying this patch.'})
 patches=[]
 before=dict(leaves(data));after=dict(leaves(result))
 for p in before:
  if before[p]!=after[p]:patches.append({'pointer':p,'before':before[p],'after':after[p]})
 return {'status':'unchanged_no_patch' if not patches else 'draft_patch_editorial_review_required','patches':patches,'metric_changes':changes,'unresolved_dependencies':pending,'publish_allowed':False,'map_updated':False}
def run(pdf,html,out):
 raw=html.read_bytes()
 if hashlib.sha256(raw).hexdigest()!=BASE:raise ValueError('Baseline moved; mapping review required')
 out.mkdir(parents=True,exist_ok=False)
 # Regenerate evidence from actual bytes. Caller-provided approved flags or metrics are not accepted.
 code=ADAPTERS['nursery'].run(pdf,html,out/'source-check')
 if code:raise ValueError('Unverified/changed source refused; no patch created')
 model=json.loads((out/'source-check/evidence.json').read_text());proposal=plan(snapshot(raw),model)
 proposal.update(source_sha256=model['source_sha256'],source_url=model['source_url'],baseline_sha256=BASE,period=model['period'])
 (out/'patch-proposal.json').write_text(json.dumps(proposal,ensure_ascii=False,indent=2)+'\n');return proposal
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--pdf',required=True,type=pathlib.Path);p.add_argument('--html',required=True,type=pathlib.Path);p.add_argument('--out',required=True,type=pathlib.Path);a=p.parse_args();run(a.pdf,a.html,a.out)
