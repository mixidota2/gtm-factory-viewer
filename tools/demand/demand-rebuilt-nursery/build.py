#!/usr/bin/env python3
"""New, bounded nursery adapter; not recovered historical implementation."""
import argparse,hashlib,json,pathlib,re,subprocess,unicodedata
HASH='146fc1448caa825a090c56f97b871fd65c5ae93b4a3b5c9f8b0c69ab70c0cf17'
URL='https://www.murc.jp/wp-content/uploads/2025/05/koukai_250515_01.pdf'
CLAIM='jp-nursery-ict-halfway-observation'
def require(c,m):
 if not c:raise ValueError(m)
def find(pattern,text):
 m=re.search(pattern,text,re.S);require(m is not None,'Missing source/claim field: '+pattern);return m

def run(pdf,html,out):
 raw=pdf.read_bytes();h=html.read_bytes();out.mkdir(parents=True,exist_ok=False)
 r={'implementation':'new nursery adapter','source_url':URL,'source_sha256':hashlib.sha256(raw).hexdigest(),'viewer_sha256':hashlib.sha256(h).hexdigest(),'claim_id':CLAIM,'candidate_created':False,'update_applied':False,'publish_allowed':False}
 def save():(out/'evidence.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
 (out/'source.pdf').write_bytes(raw)
 if r['source_sha256']!=HASH:r.update(status='changed_source_review_required');save();return 3
 try:
  pages={n:unicodedata.normalize('NFKC',subprocess.check_output(['pdftotext','-f',str(n),'-l',str(n),'-layout',str(out/'source.pdf'),'-'],text=True,timeout=30)) for n in [25,104,106,108]}
  for n,t in pages.items():(out/f'page-{n}.txt').write_text(t)
  compact=re.sub(r'\s+','',pages[25]);period=find(r'(2024)年(\d+)月(\d+)日\(水\)~(2024)年(\d+)月(\d+)日\(月\)',compact);dates=[int(x) for x in period.groups()]
  n=int(find(r'有効回収数:([\d,]+)件',compact)[1].replace(',',''));require('「活動中」と回答した施設を有効回答' in compact,'Active population anchor missing')
  rows={}
  for page,figure,width in [(104,102,4),(106,104,10),(108,106,4)]:
   t=pages[page];require(f'図表 {figure}' in t,'Figure anchor differs');m=find(r'\n\s*全体\s+([\d,]+)\s+([^\n]+)',t);require(int(m[1].replace(',',''))==n,'Table denominator differs');values=m[2].split();require(len(values)==width and all(re.fullmatch(r'\d+\.\d+',v) for v in values),'Table row schema differs');rows[page]=values
  require('問 91の回答が不明の施設を含む' in pages[104] and '問 91の回答が不明の施設を含む' in pages[106],'Missing-response scope differs')
  specs=[('any_adopt',104,0,'何らかの保育ICTを導入した施設は'),('four_any',104,1,'補助対象の4機能を一つ以上導入した施設は'),('four_all',104,2,'4機能すべてを導入した施設は'),('contact',106,2,'保護者連絡が'),('entry',106,0,'登降園管理が'),('planning',106,5,'計画・記録が'),('cashless',106,7,'キャッシュレス決済が'),('any_use',108,0,'何らかの機能を活用している割合は'),('all_use',108,2,'4機能すべてを活用している割合は')]
  metrics={key:{'percent':rows[p][col],'numerator':None,'denominator':n,'pdf_page':p,'table_column_1based':col+1,'method':'published percentage; no reverse-counted numerator'} for key,p,col,label in specs}
  data=json.loads(find(r'<script id="snapshot-data" type="application/json">(.*?)</script>',h.decode())[1]);cs=[c for c in data['claims'] if c['claim_id']==CLAIM];require(len(cs)==1,'Claim is not unique');claim=cs[0];require(URL in claim['source_urls'],'Source binding differs')
  comparisons=[{'key':key,'source_percent':metrics[key]['percent'],'existing_percent':find(re.escape(label)+r'([\d.]+)%',claim['text'])[1]} for key,p,col,label in specs]
  r.update(metrics=metrics,period=dates,comparison=comparisons,source_changed=False)
  require(all(x['source_percent']==x['existing_percent'] for x in comparisons),'Percentage mismatch: review required; candidate refused')
  y,m,d,y2,m2,d2=dates;require(f'{y}年{m}月{d}日〜{m2}月{d2}日' in claim['text'] and f'{n:,}施設' in claim['text'],'Claim period/population differs')
  val=lambda k:metrics[k]['percent']
  text=f'{y}年{m}月{d}日〜{y2}年{m2}月{d2}日の調査では、活動中の認可保育所等{n:,}施設が有効回答でした。何らかのICT導入は{val("any_adopt")}%、4機能のいずれかは{val("four_any")}%、4機能すべては{val("four_all")}%。機能別導入は保護者連絡{val("contact")}%、登降園管理{val("entry")}%、計画・記録{val("planning")}%、キャッシュレス決済{val("cashless")}%です。問9①の不明回答施設も分母に含みます。別設問の問9②では何らかの機能の活用{val("any_use")}%、4機能すべての活用{val("all_use")}%。導入と活用は別集計で、日常利用頻度や増加率を示す値ではありません。'
  r.update(status='unchanged_source_values_match',candidate_created=True,candidate_text=text,limitations=['Newly drafted bounded observation, not byte-identical old prose.','No publication month inferred from retrieval date.','Only designated tables; no whole-report or causal verification.']);(out/'candidate.txt').write_text(text+'\n');save();return 0
 except Exception as e:r.update(status='failed',error=str(e));save();raise
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--pdf',type=pathlib.Path,required=True);p.add_argument('--html',type=pathlib.Path,required=True);p.add_argument('--out',type=pathlib.Path,required=True);a=p.parse_args();raise SystemExit(run(a.pdf,a.html,a.out))
