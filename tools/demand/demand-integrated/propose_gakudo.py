#!/usr/bin/env python3
"""Local, fixed-scope draft patches. No publication or new-source approval."""
import argparse,copy,decimal,hashlib,json,pathlib,re
from verify import ADAPTERS,ROOT,BASE,snapshot,leaves
A=ADAPTERS['gakudo']
SPECS={'adoption':('事業所の',8404,5,1),'contact':('保護者連絡は',3288,5,1),'entry':('入退室管理は',3288,5,1),'absence':('欠席・遅刻の受付は',3288,5,1),'payment':('利用料・延長料の決済は',3288,5,1),'linked':('連携ありは',3288,5,1),'counter':('窓口提出は',5392,3,0),'online':('オンラインは',5392,3,0)}
def unique(items,key,value):
 found=[x for x in items if x.get(key)==value]
 if len(found)!=1:raise ValueError('Target is not unique: '+value)
 return found[0]
def plan(data,model):
 if model.get('source_url')!=A.URL or model.get('source_sha256')!=A.HASH:raise ValueError('Unverified source binding')
 if not isinstance(model.get('periods'),dict) or any(not isinstance(v,list) or any(type(n)!=int for n in v) for v in model['periods'].values()):raise ValueError('Ambiguous period representation')
 if model.get('periods')!={'office':[2024,9,2,9,20],'parents':[2024,2,16,3,4]}:raise ValueError('Period needs review')
 metrics=model['metrics']
 if set(metrics)!=set(SPECS):raise ValueError('Metric mapping differs')
 for key,(_,denom,page,places) in SPECS.items():
  m=metrics[key];n=m.get('numerator');p=m.get('percent')
  if type(n)!=int or not 0<=n<=denom or type(m.get('denominator'))!=int or m['denominator']!=denom or m.get('pdf_page')!=page:raise ValueError('Count, denominator or page ambiguous')
  if not isinstance(p,str) or not re.fullmatch(r'\d+\.\d' if places else r'\d+',p):raise ValueError('Percent format ambiguous')
  rounded=(decimal.Decimal(n)*100/denom).quantize(decimal.Decimal('0.1') if places else decimal.Decimal('1'),rounding=decimal.ROUND_HALF_UP)
  if rounded!=decimal.Decimal(p):raise ValueError('Count/percent mismatch')
 if metrics['adoption']['numerator']!=3288:raise ValueError('Changed adopted population requires denominator mapping review')
 result=copy.deepcopy(data);claim=unique(result['claims'],'claim_id',A.CLAIM);market=unique(result['markets'],'id','jp-gakudo-ict-halfway.md');old=claim['text'];new=old
 if market['summary']!=old or market['text'].count(old)!=1 or A.URL not in claim['source_urls'] or A.URL not in market['text']:raise ValueError('Linked fields or source diverge')
 changes=[]
 for key,(label,_,_,_) in SPECS.items():
  pattern=re.escape(label)+r'(\d+(?:\.\d+)?)%';matches=list(re.finditer(pattern,new))
  if len(matches)!=1:raise ValueError('Metric occurrence ambiguous: '+key)
  before=matches[0][1];after=metrics[key]['percent'];new=re.sub(pattern,lambda m:label+after+'%',new)
  if before!=after:changes.append({'metric':key,'before':before,'after':after})
 claim['text']=new;market['summary']=new;market['text']=market['text'].replace(old,new)
 # There is no gakudo chart in the saved public snapshot. Do not invent one.
 pending=[]
 if changes:
  for pointer,value in leaves(data):
   if isinstance(value,str) and any(word in value for word in ['学童','gakudo','保育']):pending.append({'pointer':pointer,'prior_sha256':hashlib.sha256(value.encode()).hexdigest(),'decision':'Editorial review required for interpretations, cautions, numerical comparisons and other mentions; not automatically rewritten.'})
 before=dict(leaves(data));after=dict(leaves(result));patches=[{'pointer':p,'before':v,'after':after[p]} for p,v in before.items() if v!=after[p]]
 return {'status':'unchanged_no_patch' if not patches else 'draft_patch_editorial_review_required','patches':patches,'metric_changes':changes,'unresolved_dependencies':pending,'publish_allowed':False,'map_updated':False,'scope':'Fixed periods and populations; three observation displays only. No gakudo chart exists in baseline.'}
def run(pdf,html,out):
 raw=html.read_bytes()
 if hashlib.sha256(raw).hexdigest()!=BASE:raise ValueError('Baseline moved; mapping review required')
 out.mkdir(parents=True,exist_ok=False)
 if A.run(pdf,html,out/'source-check'):raise ValueError('Changed/unverified source refused; no patch created')
 model=json.loads((out/'source-check/evidence.json').read_text());proposal=plan(snapshot(raw),model)
 proposal.update(source_sha256=model['source_sha256'],source_url=model['source_url'],baseline_sha256=BASE,periods=model['periods'])
 (out/'patch-proposal.json').write_text(json.dumps(proposal,ensure_ascii=False,indent=2)+'\n');return proposal
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--pdf',required=True,type=pathlib.Path);p.add_argument('--html',required=True,type=pathlib.Path);p.add_argument('--out',required=True,type=pathlib.Path);a=p.parse_args();run(a.pdf,a.html,a.out)
