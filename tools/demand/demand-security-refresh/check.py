"""Read-only NPA list/report check. Changed reports require scope review."""
import pathlib,json,hashlib,urllib.request,urllib.parse,datetime,re,subprocess,decimal,argparse,unicodedata
from html.parser import HTMLParser
LIST='https://www.npa.go.jp/publications/statistics/safetylife/toukei.html'
REPORT='https://www.npa.go.jp/publications/statistics/safetylife/reiwa7keibigaikyo.pdf'
SHA='38ed1ff07881238a13963f808bb6193963b186b2b947c132c01c1cd1b0798d4a'
class Links(HTMLParser):
 def __init__(self):super().__init__();self.items=[];self.url=None;self.title=''
 def handle_starttag(self,t,a):
  if t=='a':self.url=dict(a).get('href');self.title=''
 def handle_data(self,s):
  if self.url:self.title+=s
 def handle_endtag(self,t):
  if t=='a' and self.url:self.items.append((urllib.parse.urljoin(LIST,self.url),self.title));self.url=None

def require_official_url(url):
 """Reject destinations before any request, including every redirect hop."""
 if any(ord(char) < 32 or ord(char) == 127 for char in url):
  raise ValueError('Control character in source URL')
 parsed=urllib.parse.urlsplit(url)
 if (parsed.scheme!='https' or parsed.hostname!='www.npa.go.jp'
     or parsed.port not in (None,443) or parsed.username is not None
     or parsed.password is not None):
  raise ValueError('Only the official HTTPS origin is allowed')

class OfficialRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  require_official_url(req.full_url)
  require_official_url(newurl)
  return super().redirect_request(req,fp,code,msg,headers,newurl)

def fetch(url):
 require_official_url(url)
 with urllib.request.build_opener(OfficialRedirect).open(url,timeout=45) as r:
  require_official_url(r.url)
  if r.status!=200:raise ValueError('Unexpected response status')
  raw=r.read(16*1024*1024+1)
  if len(raw)>16*1024*1024:raise ValueError('Response exceeds size limit')
  return raw,{'http_status':r.status,'final_url':r.url}

def run(html,out,fetcher=fetch):
 out.mkdir(parents=True,exist_ok=False);r={'status':'running','viewer_sha256':hashlib.sha256(html.read_bytes()).hexdigest(),'viewer_scope':'provided saved HTML; not live viewer retrieval','receipts':[],'issues':[],'update_applied':False,'publish_allowed':False}
 def save():(out/'result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
 def get(url,file):
  receipt={'url':url,'started_at':datetime.datetime.now(datetime.timezone.utc).isoformat()};r['receipts'].append(receipt);raw,meta=fetcher(url);receipt.update(meta,sha256=hashlib.sha256(raw).hexdigest(),finished_at=datetime.datetime.now(datetime.timezone.utc).isoformat());(out/file).write_bytes(raw)
  if receipt.get('http_status')!=200:raise ValueError('HTTP response not successful')
  return raw
 save()
 try:
  raw=get(LIST,'list.html');parser=Links();parser.feed(raw.decode());links=[{'url':u,'title':t} for u,t in parser.items if '警備業の概況' in ''.join(unicodedata.normalize('NFKC',t).split()) or ('keibi' in urllib.parse.urlsplit(u).path.lower() and urllib.parse.urlsplit(u).path.lower().endswith('.pdf'))];r['report_links']=links
  if not any(x['url']==REPORT for x in links):r['issues'].append('Registered report missing from official list')
  if any(x['url']!=REPORT for x in links):r['issues'].append('Unreviewed report link; period and comparability require review')
  pdf=get(REPORT,'report.pdf')
  if hashlib.sha256(pdf).hexdigest()!=SHA:r['issues'].append('Report bytes changed; definitions/tables/period must be reviewed before extraction')
  else:
   text=subprocess.check_output(['pdftotext','-f','8','-l','8','-layout',str(out/'report.pdf'),'-'],text=True,timeout=30);(out/'page8.txt').write_text(text);compact=''.join(text.split())
   if not all(v in compact for v in ['機械警備業務の対象施設数','各年末','Ｒ３Ｒ４Ｒ５Ｒ６Ｒ７','うち住宅数']):raise ValueError('Definition or year columns not verified')
   match=re.search(r'う\s*ち\s*住\s*宅\s*数\s+([\d, ]+)',text)
   values=[int(v.replace(',','')) for v in match[1].split()]
   if values!=[1711608,1742401,1747413,1847062,1950261]:raise ValueError('Reviewed row mapping differs')
   data=json.loads(re.search(rb'<script id="snapshot-data" type="application/json">(.*?)</script>',html.read_bytes(),re.S)[1]);claims=[c for c in data['claims'] if c['claim_id']=='theme-4-text'];themes=[t for t in data['themes'] if t['id']=='4']
   if len(claims)!=1 or len(themes)!=1:raise ValueError('Target not unique')
   c=claims[0];t=themes[0]
   if c['text']!=t['text'] or REPORT+'#page=8' not in c['source_urls'] or REPORT+'#page=8' not in t['source_urls']:raise ValueError('Claim/theme/source linkage differs')
   expected=['2025年末の1,950,261か所','2024年末の1,847,062か所','年末に警備対象となっている場所','世帯数や新規契約数ではありません']
   growth=(decimal.Decimal(values[-1])/values[-2]-1)*100;rounded=str(growth.quantize(decimal.Decimal('.1'),rounding=decimal.ROUND_HALF_UP))
   if not all(v in c['text'] for v in expected) or '約'+rounded+'%増' not in c['text']:raise ValueError('Published observation differs')
   r['verified']={'years':list(range(2021,2026)),'residential_locations':values,'growth_2024_to_2025_percent':rounded,'pdf_page':8,'printed_page':6,'unit':'各年末の機械警備対象施設のうち住宅数（か所）','claim_theme_equal':True,'2019_comparison':'Not reverified here; prior separate republished-report review remains necessary.'}
 except Exception as e:r['issues'].append(str(e))
 r['status']='unchanged_within_checked_list_report_and_saved_viewer' if not r['issues'] else 'review_required_or_failed';save();return 0 if not r['issues'] else 3
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--html',type=pathlib.Path,required=True);p.add_argument('--out',type=pathlib.Path,required=True);a=p.parse_args();raise SystemExit(run(a.html,a.out))
