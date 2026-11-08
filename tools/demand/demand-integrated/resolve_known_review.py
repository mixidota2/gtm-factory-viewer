"""Bind a prior scope decision to freshly fetched exact landing AND PDF bytes."""
import copy,hashlib,json,datetime
LANDING='https://www.cfa.go.jp/policies/hoiku/hoiku-dx'
REPORT='https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/20c04744-1b32-456d-99f1-f510aa191d61/6093ad2c/20250423_policies_hoiku_hoiku-dx_11.pdf'
HASHES={LANDING:'a68762784bf8af32904afac0cd453ff2d8a2ff881013c7309ffe84aa7126f41a',REPORT:'20901e704d045eb007eb3aa9f1fdb2af5e889671b55f8085e7c98ba62523349a'}
def resolve(discovery,out,list_fetcher,pdf_fetcher):
 r=copy.deepcopy(discovery)
 for item in r['records']:
  if item['url']!=LANDING or item['classification']!='unreviewed_possible_report':continue
  evidence={'status':'pending','replacement_accepted':False,'basis':'Prior cover and PDF4 scope review: municipal workflows/datasets/masters, not MURC facility adoption survey. Exact landing and report bytes required.','receipts':[]};item['scope_review']=evidence
  try:
   for filename,url,fetcher in [('review-landing.html',LANDING,list_fetcher),('review-report.pdf',REPORT,pdf_fetcher)]:
    receipt={'url':url,'started_at':datetime.datetime.now(datetime.timezone.utc).isoformat()};evidence['receipts'].append(receipt)
    raw,meta=fetcher(url);receipt.update(meta,sha256=hashlib.sha256(raw).hexdigest(),finished_at=datetime.datetime.now(datetime.timezone.utc).isoformat());(out/filename).write_bytes(raw)
    if receipt.get('http_status')!=200 or receipt['sha256']!=HASHES[url]:raise ValueError('Reviewed content changed or acquisition unconfirmed: '+url)
   item['classification']='reviewed_different_study_exact_content';evidence['status']='different_study_not_replacement'
  except Exception as e:evidence.update(status='review_required_or_failed',error=str(e))
  (out/'known-review.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2))
 pending=[i for i in r['records'] if i['classification']=='unreviewed_possible_report'];r['new_candidate_count']=len(pending)
 r['status']='unsupported_links_review_required' if any(i['classification']=='unsupported_link_review_required' for i in r['records']) else 'new_links_require_review' if pending else 'no_new_matching_report_link_in_checked_list' if r['registered_report_found'] else 'incomplete_list_review_required'
 return r
