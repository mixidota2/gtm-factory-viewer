#!/usr/bin/env python3
"""Fetch official sources once, bind receipts, compare optional research captures, verify locally."""
import argparse,datetime,hashlib,json,pathlib,urllib.request,urllib.parse
from verify import ADAPTERS,ROOT,run
LIMIT=16*1024*1024
class SameHost(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  if urllib.parse.urlsplit(newurl).scheme!='https' or urllib.parse.urlsplit(newurl).hostname!=urllib.parse.urlsplit(req.full_url).hostname:raise ValueError('Cross-host or insecure redirect refused')
  return super().redirect_request(req,fp,code,msg,headers,newurl)
def fetch(url):
 with urllib.request.build_opener(SameHost).open(url,timeout=45) as response:
  raw=response.read(LIMIT+1)
  if len(raw)>LIMIT or not raw.startswith(b'%PDF-'):raise ValueError('Unexpected PDF response or size')
  return raw,{'final_url':response.url,'http_status':response.status,'etag':response.headers.get('ETag'),'last_modified':response.headers.get('Last-Modified')}
def refresh(html,out,provided=None,fetcher=fetch):
 out.mkdir(parents=True,exist_ok=False);records=[];pdfs={};issues=[]
 report={'sources':records,'issues':issues,'status':'running','update_applied':False,'publish_allowed':False,'viewer_input':'provided saved HTML; not fetched by this operation','research_capture_comparison':'not supplied'}
 def save():(out/'refresh.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 save()
 for name,adapter in ADAPTERS.items():
  record={'name':name,'url':adapter.URL,'started_at':datetime.datetime.now(datetime.timezone.utc).isoformat()};records.append(record)
  try:
   raw,meta=fetcher(adapter.URL)
   if len(raw)>LIMIT or not raw.startswith(b'%PDF-'):raise ValueError('Unexpected PDF bytes')
   sha=hashlib.sha256(raw).hexdigest();path=out/(name+'.pdf');path.write_bytes(raw);pdfs[name]=path
   record.update(**meta,sha256=sha,bytes=len(raw),registered_sha256=adapter.HASH,source_changed=sha!=adapter.HASH,status='received')
  except Exception as e:record.update(status='failed',error=str(e));issues.append(name+': official acquisition failed; no cached fallback')
  record['finished_at']=datetime.datetime.now(datetime.timezone.utc).isoformat();save()
 if provided:
  report['research_capture_comparison']='pending'
  try:
   receipts=json.loads((provided/'receipts.json').read_text());checks=[]
   for name,adapter in ADAPTERS.items():
    matches=[x for x in receipts if x.get('url')==adapter.URL]
    if len(matches)!=1:raise ValueError(name+': expected one matching research receipt')
    rec=matches[0];filename=rec['file'];p=(provided/filename).resolve()
    if p.parent!=provided.resolve():raise ValueError('Research receipt path must be a direct local file')
    sha=hashlib.sha256(p.read_bytes()).hexdigest()
    if sha!=rec['sha256']:raise ValueError(name+': research receipt/bytes mismatch')
    fresh=next(x for x in records if x['name']==name);equal=sha==fresh.get('sha256');checks.append({'name':name,'provided_sha256':sha,'fresh_sha256':fresh.get('sha256'),'equal':equal})
    if not equal:issues.append(name+': supplied research capture differs from fresh official response; review acquisition times and source version')
   report['research_capture_comparison']=checks
  except Exception as e:issues.append(str(e));report['research_capture_comparison']='failed'
 if len(pdfs)==len(ADAPTERS):
  try:
   code=run(html,ROOT/'demand-recovered/care-integration/tests/fixtures/historical-index.html',pdfs,out/'integration');report['integration_exit_code']=code
   if code:issues.append('Source/content/dependent-display review required')
  except Exception as e:issues.append('Integration failed: '+str(e))
 else:report['integration_not_run']='Both fresh sources required; no cached substitution'
 report['status']='unchanged_official_sources_verified' if not issues else 'review_required_or_failed';save();return 0 if not issues else 3
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--html',type=pathlib.Path,required=True);p.add_argument('--out',type=pathlib.Path,required=True);p.add_argument('--provided-directory',type=pathlib.Path);a=p.parse_args();raise SystemExit(refresh(a.html,a.out,a.provided_directory))
