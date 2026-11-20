const fs=require('fs'),assert=require('assert/strict');
module.exports=function(candidate){
 const html=fs.readFileSync(candidate,'utf8'),d=JSON.parse(html.match(/<script id="snapshot-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 const id='jp-fastfood-customer-count';const m=d.markets.filter(x=>x.id===id+'.md');assert.equal(m.length,1);assert.equal(m[0].proxy_map,false);
 const c=d.claims.filter(x=>x.claim_id===id+'-observation');assert.equal(c.length,1);assert.equal(c[0].text,m[0].summary);
 const article=m[0].text;
 assert.equal(article.split('\n')[0],'# '+m[0].title);
 assert.equal(article.split('\n\n')[1],c[0].text);
 for(const phrase of ['52社・21,922店','3.0%増','全国市場全体','既存店だけの客数の増加率にはなりません','個票','2019年','2026年11月17日'])assert(article.includes(phrase),phrase);
 assert(article.includes('月ごとの比率をそのまま平均しても、期間全体の客数が何%増えたかは分かりません。'));
 const rows=article.split('\n').filter(row=>row.startsWith('|')&&!row.startsWith('| ---')).map(row=>row.slice(1,-1).split('|').map(x=>x.trim()));
 assert.deepEqual(rows,[
  ['2025年','前年の同じ期間からの増加率'],
  ['年間','3.0%'],['1〜3月','2.5%'],['4〜6月','2.2%'],['7〜9月','3.6%'],['10〜12月','3.5%'],
  ['2026年','前年の同じ月を100%とした客数'],
  ...['105.6%','104.9%','103.3%','106.9%','106.1%','102.2%','103.9%','103.7%','103.4%'].map((v,i)=>[(i+1)+'月',v]),
  ['指標','2025年（前年比）','2026年9月（前年同月比）'],
  ['売上','+7.5%','+9.7%'],['客数','+3.0%','+3.4%'],['客単価（客1人当たりの売上）','+4.4%','+6.1%'],['店舗数','+1.4%','+1.8%'],
 ]);
 assert.equal(fs.readFileSync(require('path').join(__dirname,'../data/fastfood-customer-count/README.md'),'utf8'),article);
 assert.equal(c[0].source_urls.length,2);c[0].source_urls.forEach(url=>assert(article.includes(url)));
 console.log('PASS fastfood scope, exact table values and labels, uniqueness, sources and article parity');
};
