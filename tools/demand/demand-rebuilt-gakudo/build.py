#!/usr/bin/env python3
"""New implementation built from recovered PDF; not a restoration of old code."""
import argparse,hashlib,json,pathlib,re,subprocess,decimal
HASH='5bb7a9c99758cbd7193f3dab2d3fa04ca82cb7d0cd5a772ef81b2adec4327339'
URL='https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/69799c33-85cb-44f6-8c70-08ed3a292ab5/0bdcddd8/20250307_policies_kosodateshien_houkago-jidou_58.pdf'
CLAIM='jp-gakudo-ict-halfway-observation'
def require(c,m):
 if not c:raise ValueError(m)
def sha(b):return hashlib.sha256(b).hexdigest()
def field(pattern,text):
 m=re.search(pattern,text);require(m is not None,'Source field missing: '+pattern);return m

def run(pdf,html,out):
 raw=pdf.read_bytes();viewer=html.read_bytes();out.mkdir(parents=True,exist_ok=False)
 report={'implementation':'new reconstruction from recovered source; not old code recovery','source_url':URL,'source_sha256':sha(raw),'registered_source_sha256':HASH,'viewer_sha256':sha(viewer),'claim_id':CLAIM,'publish_allowed':False,'update_applied':False}
 def save(): (out/'evidence.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 (out/'source.pdf').write_bytes(raw)
 if sha(raw)!=HASH:
  report.update(status='changed_source_review_required',candidate_created=False,reason='Changed bytes require origin, table, period and methodology review before using this adapter');save();return 3
 try:
  pages={n:subprocess.check_output(['pdftotext','-f',str(n),'-l',str(n),'-layout',str(out/'source.pdf'),'-'],text=True,timeout=30) for n in [2,3,5]}
  for n,t in pages.items():(out/f'page-{n}.txt').write_text(t)
  p=pages[5];p3=pages[3];periods=re.findall(r'令和６年([０-９0-9]+)月([０-９0-9]+)日から令和６年([０-９0-9]+)月([０-９0-9]+)日',pages[2]);require(len(periods)==3,'Survey period mapping differs')
  parent_period,_,office_period=[[int(v) for v in x] for x in periods]
  respondents=int(field(r'回答数([\d,]+)件',p)[1].replace(',',''));parents=int(field(r'総回答数([\d,]+)件',p3)[1].replace(',',''));municipalities=int(field(r'抽出(\d+)自治体',p3)[1]);metrics={}
  def row(key,label,text,denom,page,places=1,office=True):
   m=field(re.escape(label)+r'\s+([\d,]+)'+('事業所' if office else '')+r'\s+([\d.]+)%',text);n=int(m[1].replace(',',''));calculated=decimal.Decimal(n)*100/decimal.Decimal(denom);rounded=calculated.quantize(decimal.Decimal('0.1') if places else decimal.Decimal('1'),rounding=decimal.ROUND_HALF_UP);require(rounded==decimal.Decimal(m[2]),key+' count/percent mismatch');metrics[key]={'numerator':n,'denominator':denom,'percent':str(rounded),'source_label':label,'pdf_page':page};return n
  adopted=row('adoption','有り',p,respondents,5)
  for key,label in [('contact','保護者への連絡'),('entry','入退室の記録・管理'),('absence','保護者からの欠席・遅刻の受付'),('payment','利用料・延長料の決済'),('linked','連携している')]:row(key,label,p,adopted,5)
  row('counter','窓口提出',p3,parents,3,0,False);row('online','オンライン',p3,parents,3,0,False)
  require('（MA）N=3,288' in p and '（SA）N=3,288' in p and '（SA）N=5,392' in p3,'Response-mode anchors differ')
  value=lambda k:metrics[k]['percent']
  om,od,em,ed=office_period;pm,pd,qm,qd=parent_period;require(om==em,'Cross-month office period requires formatting review')
  text=f'2024年{om}月{od}〜{ed}日のオンライン調査では、回答した{respondents:,}事業所の{value("adoption")}%（{adopted:,}事業所）が、業務を支援する情報機器・ソフト（ICT）を導入していました。\n\n導入済み{adopted:,}事業所に、使える機能を複数選んでもらった結果では、保護者連絡は{value("contact")}%、入退室管理は{value("entry")}%、欠席・遅刻の受付は{value("absence")}%、利用料・延長料の決済は{value("payment")}%でした。\n\n自治体システムとの連携も、同じ{adopted:,}事業所を対象に尋ねています。こちらは一つを選ぶ形式で、連携ありは{value("linked")}%でした。\n\n別の保護者調査は2024年{pm}月{pd}日〜{qm}月{qd}日に実施されました。抽出した{municipalities}自治体で、学童を利用中・利用予定の保護者{parents:,}人に申込方法を一つ選んでもらったところ、窓口提出は{value("counter")}%、オンラインは{value("online")}%でした。'
  snapshot=json.loads(field(r'<script id="snapshot-data" type="application/json">(.*?)</script>',viewer.decode())[1]);claims=[c for c in snapshot['claims'] if c['claim_id']==CLAIM];require(len(claims)==1,'Claim must be unique');claim=claims[0];require(URL in claim['source_urls'],'Claim/source binding differs')
  matched=claim['text'].strip()==text.strip();report.update(status='unchanged_source_and_claim' if matched else 'claim_difference_review_required',candidate_created=True,metrics=metrics,periods={'office':[2024,*office_period],'parents':[2024,*parent_period]},source_changed=False,claim_text_equal=matched,existing_claim_text=claim['text'],candidate_text=text,limitations=['Only selected pages/rows were parsed; not whole-document review.','Response bias, causal effects and editorial interpretation are not reverified.','Changed source bytes are held, never automatically promoted.'])
  (out/'candidate.txt').write_text(text+'\n');save();return 0 if matched else 3
 except Exception as e:
  report.update(status='failed',candidate_created=False,error=str(e));save();raise
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--pdf',type=pathlib.Path,required=True);p.add_argument('--html',type=pathlib.Path,required=True);p.add_argument('--out',type=pathlib.Path,required=True);a=p.parse_args();raise SystemExit(run(a.pdf,a.html,a.out))
