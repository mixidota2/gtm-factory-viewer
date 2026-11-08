import pathlib,tempfile,unittest,json,subprocess
from check_all import run
def details(name):
 if name=='childcare':return {'source_exit_code':0,'lists':{k:{'http_status':200,'discovery':{'status':'no_new_matching_report_link_in_checked_list','new_candidate_count':0}} for k in ['gakudo','nursery']}}
 return {'receipts':[{'http_status':200},{'http_status':200}],'verified':{'claim_theme_equal':True,'years':[2021,2022,2023,2024,2025],'residential_locations':[1711608,1742401,1747413,1847062,1950261],'growth_2024_to_2025_percent':'5.6'}}
class AllSources(unittest.TestCase):
 def test_groups_continue_and_errors_are_retained(self):
  for fail in [None,'childcare','security','both','missing','timeout']:
   with self.subTest(fail=fail),tempfile.TemporaryDirectory() as td:
    p=pathlib.Path(td);html=p/'viewer';html.write_text('test only');calls=[]
    def runner(cmd,**kwargs):
     name='security' if 'security' in cmd[1] else 'childcare';calls.append(name);out=pathlib.Path(cmd[-1]);out.mkdir()
     if fail=='timeout' and name=='childcare':raise subprocess.TimeoutExpired(cmd,480)
     bad=fail in [name,'both'];status='review_required_or_failed' if bad else 'unchanged_within_checked_lists_sources_and_saved_viewer' if name=='childcare' else 'unchanged_within_checked_list_report_and_saved_viewer'
     if not(fail=='missing' and name=='childcare'):(out/'result.json').write_text(json.dumps(dict(status=status,issues=['test only'] if bad else [],publish_allowed=False,update_applied=False,**details(name))))
     return subprocess.CompletedProcess(cmd,3 if bad else 0,'','')
    self.assertEqual(run(html,p/'out',runner),0 if fail is None else 3);self.assertEqual(calls,['childcare','security']);r=json.loads((p/'out/result.json').read_text());self.assertEqual(len(r['groups']),2);self.assertFalse(r['publish_allowed'])
if __name__=='__main__':unittest.main()
