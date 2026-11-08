#!/usr/bin/env python3
"""One read-only run: official lists + official PDFs + saved-viewer validation."""
import argparse,datetime,hashlib,json,pathlib,urllib.request
from discover import LISTS,inspect
from resolve_known_review import resolve
from refresh import SameHost,refresh,fetch

def fetch_list(url):
 with urllib.request.build_opener(SameHost).open(url,timeout=45) as response:
  raw=response.read(8*1024*1024+1)
  if len(raw)>8*1024*1024:raise ValueError('Publication list exceeds size limit')
  if response.status!=200:raise ValueError('Publication list status is not 200')
  return raw,{'final_url':response.url,'http_status':response.status}
def run(html,out,provided=None,list_fetcher=fetch_list,pdf_fetcher=fetch):
 out.mkdir(parents=True,exist_ok=False)
 report={'status':'running','lists':{},'issues':[],'update_applied':False,'publish_allowed':False,'viewer_input':'saved HTML; live viewer retrieval is not part of this run'}
 def save():
  p=out/'result.json.tmp';p.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');p.replace(out/'result.json')
 save()
 for name,url in LISTS.items():
  record={'url':url,'started_at':datetime.datetime.now(datetime.timezone.utc).isoformat()};report['lists'][name]=record
  try:
   raw,meta=list_fetcher(url);record.update(meta,sha256=hashlib.sha256(raw).hexdigest());(out/(name+'-list.html')).write_bytes(raw)
   discovery=inspect(name,raw)
   if name=='nursery':discovery=resolve(discovery,out,list_fetcher,pdf_fetcher)
   record['discovery']=discovery
   if discovery['status']!='no_new_matching_report_link_in_checked_list':report['issues'].append(name+': '+discovery['status'])
  except Exception as e:record.update(status='failed',error=str(e));report['issues'].append(name+': publication-list acquisition/inspection failed')
  record['finished_at']=datetime.datetime.now(datetime.timezone.utc).isoformat();save()
 try:
  code=refresh(html,out/'sources',provided,pdf_fetcher);report['source_exit_code']=code
  if code:report['issues'].append('Official source acquisition/comparison requires review')
 except Exception as e:report['source_error']=str(e);report['issues'].append('Official source pipeline failed')
 report['status']='unchanged_within_checked_lists_sources_and_saved_viewer' if not report['issues'] else 'review_required_or_failed'
 report['limitations']='Listed-link absence is not proof no newer report exists elsewhere. Unreviewed links are never adopted. No live browser or publication check.';save();return 0 if not report['issues'] else 3
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--html',required=True,type=pathlib.Path);p.add_argument('--out',required=True,type=pathlib.Path);p.add_argument('--provided-directory',type=pathlib.Path);a=p.parse_args();raise SystemExit(run(a.html,a.out,a.provided_directory))
