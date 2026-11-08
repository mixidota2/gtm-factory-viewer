"""Independent source groups; no publication or schedules."""
import argparse,pathlib,json,subprocess,sys,datetime
ROOT=pathlib.Path(__file__).resolve().parent

TIMEOUTS={'childcare':420,'security':180}
def validate(name,child):
 if not isinstance(child,dict):raise ValueError('Result must be an object')
 for key,kind in [('status',str),('issues',list),('update_applied',bool),('publish_allowed',bool)]:
  if key not in child or type(child[key]) is not kind:raise ValueError('Missing or invalid result field: '+key)
 if not all(type(v) is str for v in child['issues']):raise ValueError('Invalid issues list')
 expected='unchanged_within_checked_lists_sources_and_saved_viewer' if name=='childcare' else 'unchanged_within_checked_list_report_and_saved_viewer'
 if child['status']!=expected or child['issues'] or child['update_applied'] or child['publish_allowed']:raise ValueError('Source group requires review or failed')
 if name=='childcare':
  if type(child.get('source_exit_code')) is not int or child['source_exit_code']!=0:raise ValueError('Missing/failed inner source result')
  if not isinstance(child.get('lists'),dict) or set(child['lists'])!={'gakudo','nursery'}:raise ValueError('Missing list results')
  for item in child['lists'].values():
   if not isinstance(item,dict) or type(item.get('http_status')) is not int or item['http_status']!=200:raise ValueError('List acquisition failed or absent')
   d=item.get('discovery')
   if not isinstance(d,dict) or d.get('status')!='no_new_matching_report_link_in_checked_list' or type(d.get('new_candidate_count')) is not int or d['new_candidate_count']!=0:raise ValueError('Unresolved list discovery')
 else:
  if not isinstance(child.get('receipts'),list) or len(child['receipts'])!=2:raise ValueError('Missing security receipts')
  for receipt in child['receipts']:
   if not isinstance(receipt,dict) or type(receipt.get('http_status')) is not int or receipt['http_status']!=200:raise ValueError('Security acquisition unconfirmed')
  v=child.get('verified')
  if not isinstance(v,dict) or v.get('claim_theme_equal') is not True or v.get('years')!=[2021,2022,2023,2024,2025] or v.get('residential_locations')!=[1711608,1742401,1747413,1847062,1950261] or v.get('growth_2024_to_2025_percent')!='5.6':raise ValueError('Missing or inconsistent verified security observation')

def run(html,out,runner=subprocess.run):
 out.mkdir(parents=True,exist_ok=False)
 report={'status':'running','groups':{},'issues':[],'update_applied':False,'publish_allowed':False}
 def save():
  tmp=out/'result.json.tmp';tmp.write_text(json.dumps(report,ensure_ascii=False,indent=2));tmp.replace(out/'result.json')
 save()
 for name,script in [('childcare','demand-integrated/check_current.py'),('security','demand-security-refresh/check.py')]:
  record={'started_at':datetime.datetime.now(datetime.timezone.utc).isoformat()};report['groups'][name]=record;save()
  try:
   completed=runner([sys.executable,str(ROOT/script),'--html',str(html.resolve()),'--out',str((out/name).resolve())],capture_output=True,text=True,timeout=TIMEOUTS[name])
   (out/(name+'.stdout.txt')).write_text(completed.stdout);(out/(name+'.stderr.txt')).write_text(completed.stderr)
   record['exit_code']=completed.returncode
   child=json.loads((out/name/'result.json').read_text());record['result']=child
   if type(completed.returncode) is not int or completed.returncode!=0:raise ValueError('Nonzero child process result')
   validate(name,child)
   record['status']='unchanged'
  except Exception as e:record.update(status='review_required_or_failed',error=str(e));report['issues'].append(name+': '+str(e))
  record['finished_at']=datetime.datetime.now(datetime.timezone.utc).isoformat();save()
 report['status']='unchanged_within_checked_sources_and_saved_viewer' if not report['issues'] else 'review_required_or_failed';save();return 0 if not report['issues'] else 3
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--html',required=True,type=pathlib.Path);p.add_argument('--out',required=True,type=pathlib.Path);a=p.parse_args();raise SystemExit(run(a.html,a.out))
