#!/usr/bin/env python3
"""Official publication-list discovery only. Never adopt URLs or change schedules."""
import argparse,datetime,hashlib,json,pathlib,unicodedata,urllib.parse
from html.parser import HTMLParser
from verify import ADAPTERS
LISTS={'gakudo':'https://www.cfa.go.jp/policies/kosodateshien/houkago-jidou','nursery':'https://www.cfa.go.jp/policies/hoiku'}
KNOWN_LANDING='https://www.murc.jp/library/survey_research_report/koukai_250515/'
class Links(HTMLParser):
 def __init__(self):super().__init__();self.items=[];self.href=None;self.parts=[]
 def handle_starttag(self,tag,attrs):
  if tag=='a':self.href=dict(attrs).get('href');self.parts=[]
 def handle_data(self,s):
  if self.href is not None:self.parts.append(s)
 def handle_endtag(self,tag):
  if tag=='a' and self.href is not None:self.items.append((self.href,''.join(self.parts).strip()));self.href=None

def inspect(name,raw):
 parser=Links();parser.feed(raw.decode('utf-8'));records=[];known=False
 for href,title in parser.items:
  url=urllib.parse.urljoin(LISTS[name],href);title=unicodedata.normalize('NFKC',title);normalized=''.join(title.split());upper=normalized.upper()
  if url==ADAPTERS[name].URL:known=True;kind='registered_report_link'
  elif name=='nursery' and url==KNOWN_LANDING:kind='registered_report_landing'
  elif (('DX' in upper or 'ICT' in upper) and ('調査' in normalized or '報告書' in normalized)):
   kind='unreviewed_possible_report'
  elif ('DX' in upper or 'ICT' in upper) and not href.startswith('#'):kind='related_material_not_established_as_update'
  else:continue
  if urllib.parse.urlsplit(url).scheme!='https':kind='unsupported_link_review_required'
  records.append({'title':title,'url':url,'classification':kind,'adopted':False,'scope_year_comparability':'not inferred from publication title'})
 candidates=[r for r in records if r['classification']=='unreviewed_possible_report']
 return {'name':name,'list_url':LISTS[name],'list_sha256':hashlib.sha256(raw).hexdigest(),'registered_report_found':known,'status':'unsupported_links_review_required' if any(r['classification']=='unsupported_link_review_required' for r in records) else 'new_links_require_review' if candidates else 'no_new_matching_report_link_in_checked_list' if known else 'incomplete_list_review_required','records':records,'new_candidate_count':len(candidates),'automatic_adoption':False,'publish_allowed':False,'limitations':'One designated official list only. Absence is not proof no newer report exists elsewhere. Related seminars/policies may need separate review; titles do not establish comparable survey scope.'}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--saved-list-directory',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=False)
 results=[]
 for name in LISTS:
  f=a.saved_list_directory/(name+'-list.html')
  try:
   r=inspect(name,f.read_bytes());r['capture_file']=str(f);r['file_mtime']=datetime.datetime.fromtimestamp(f.stat().st_mtime,datetime.timezone.utc).isoformat();r['retrieval_time_verified']=False
  except (OSError,ValueError) as e:
   r={'name':name,'list_url':LISTS[name],'status':'failed','error':str(e),'new_candidate_count':None,'automatic_adoption':False,'publish_allowed':False}
  results.append(r)
 (a.output/'discovery.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n');print(json.dumps([{'name':r['name'],'status':r['status'],'new_candidate_count':r['new_candidate_count']} for r in results]))

 raise SystemExit(0 if all(r['status']=='no_new_matching_report_link_in_checked_list' for r in results) else 3)
