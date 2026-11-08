// Offline arithmetic/display contract. Original source bytes are not redistributed.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../data/water-quantity/2026-11-09');
const id='jp-water-sales-coastwise-quantity';
function parse(csv){
 const lines=csv.trim().split(/\r?\n/),header=lines.shift().split(',');
 assert.deepEqual(header,['month','water_sales_million_yen','coastwise_tonnes_thousand','coastwise_tonne_km_million','sales_status','quantity_status','quantity_source_row']);
 const rows=lines.map(line=>{const cells=line.split(',');assert.equal(cells.length,header.length);return Object.fromEntries(header.map((k,i)=>[k,cells[i]]));});
 assert.equal(rows.length,24);
 assert.equal(new Set(rows.map(r=>r.month)).size,24);
 rows.forEach((r,i)=>{
  const month=`${2024+Math.floor((7+i)/12)}-${String((7+i)%12+1).padStart(2,'0')}`;
  assert.equal(r.month,month,'Months must be continuous and ordered');
  assert.equal(r.quantity_status,'monthly_report_final');
  assert.equal(r.sales_status,i>=22?'preliminary':'final');
  assert.equal(r.quantity_source_row,String(75+i));
  for(const key of header.slice(1,4)){assert.match(r[key],/^\d+$/);assert.ok(Number.isSafeInteger(+r[key])&&+r[key]>0);}
 });
 return rows;
}
function totals(rows){
 const keys=['water_sales_million_yen','coastwise_tonnes_thousand','coastwise_tonne_km_million'];
 return Object.fromEntries(keys.map(k=>{const previous=rows.slice(0,12).reduce((a,r)=>a+BigInt(r[k]),0n),current=rows.slice(12).reduce((a,r)=>a+BigInt(r[k]),0n);return [k,{previous:Number(previous),current:Number(current),growth_pct:Number((current-previous)*100n)/Number(previous)}];}));
}
function check(candidate=path.resolve(__dirname,'../index.html')){
 const csv=fs.readFileSync(path.join(root,'monthly.csv'),'utf8');
 const rows=parse(csv),actual=totals(rows);
 const summary=JSON.parse(fs.readFileSync(path.join(root,'summary.json'),'utf8'));
 const sources=JSON.parse(fs.readFileSync(path.join(root,'sources.json'),'utf8'));
 assert.equal(crypto.createHash('sha256').update(csv).digest('hex'),sources.monthly_csv_sha256);
 assert.deepEqual(summary.previous_period,['2024-08','2025-07']);assert.deepEqual(summary.current_period,['2025-08','2026-07']);
 assert.deepEqual(summary.quantity_preliminary_months,[]);assert.deepEqual(summary.sales_preliminary_months,['2026-06','2026-07']);
 const metrics={water_sales_million_yen:'sales_million_yen',coastwise_tonnes_thousand:'tonnes_thousand',coastwise_tonne_km_million:'tonne_km_million'};
 const expected={water_sales_million_yen:[6907853,7455227],coastwise_tonnes_thousand:[296482,298097],coastwise_tonne_km_million:[149309,149258]};
 for(const [key,m] of Object.entries(metrics)){
  assert.deepEqual([actual[key].previous,actual[key].current],expected[key]);
  assert.equal(actual[key].previous,Number(summary.metrics[m].previous_total));assert.equal(actual[key].current,Number(summary.metrics[m].current_total));
  assert.ok(Math.abs(actual[key].growth_pct-Number(summary.metrics[m].growth_pct))<1e-12);
 }
 assert.equal(sources.sources.length,2);
 assert.equal(sources.sources[0].publication_date,'2026-10-28');assert.equal(sources.sources[1].publication_date,'2026-10-23');
 assert.equal(sources.sources[0].source_sha256,'f12649d86e6ad2ca944c741b44683c21d3542ab679871ef03de2d2b3399852ad');
 sources.sources.forEach(s=>{assert.match(s.source_sha256,/^[a-f0-9]{64}$/);assert.match(s.url,/^https:\/\/(www\.e-stat\.go\.jp|www\.stat\.go\.jp)\//);});
 const html=fs.readFileSync(candidate,'utf8');
 const data=JSON.parse(html.match(/<script id="snapshot-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(data.themes.length,5);assert.equal(data.markets.length,17);assert.equal(data.claims.length,97);assert.equal(data.editorial.cards.length,4);
 const observation=data.editorial.observations.find(o=>o.id===id);assert.ok(observation);
 const q=data.editorial.cross_industry_entries.find(e=>e.id==='money-and-quantity');assert.ok(q.observations.includes(id));
 for(const text of [q.body,q.text,observation.observation_text]){assert.ok(text.includes('7.92%'));assert.ok(text.includes('0.54%'));assert.ok(text.includes('0.03%減'));assert.ok(!text.includes('9.23%'));}
 for(const text of [q.body,q.text]){assert.ok(text.includes('2024年8月〜2025年7月'));assert.ok(text.includes('2025年8月〜2026年7月'));assert.ok(text.includes('2026年6〜7月売上には速報'));assert.ok(text.includes('内航船舶輸送統計月報'));assert.ok(text.includes('対象が違う'));}
 assert.ok(observation.unconfirmed.includes('水運全体'));assert.ok(observation.unconfirmed.includes('価格寄与'));
 for(const [prefix,k] of [['water_sales','water_sales_million_yen'],['coastwise_weight','coastwise_tonnes_thousand'],['coastwise_tkm','coastwise_tonne_km_million']]){
  assert.equal(observation.values[prefix+'_previous'],actual[k].previous);assert.equal(observation.values[prefix+'_current'],actual[k].current);
  assert.equal(observation.values[prefix+'_growth_pct'],Number(actual[k].growth_pct.toFixed(2)));
 }
 assert.ok(html.includes("data.editorial.observations.forEach(o=>knownLocalRoutes.add('#observation/'+o.id));"));
 const waterOnly=JSON.stringify({observation,summary,sources,body:q.body.slice(q.body.indexOf('## 水運'),q.body.indexOf('## 支払額'))});
 assert.ok(!/\/workspace\/|analysis-snapshot|coastwise-202608|000040523908|148679|9\.2348/.test(waterOnly));
 // Boundary/fault checks reject missing, duplicated, shifted, wrong-unit and vintage inputs.
 assert.throws(()=>parse(csv.split(/\r?\n/).filter((_,i)=>i!==4).join('\n')));
 assert.throws(()=>parse(csv.replace('2024-09','2024-08')));
 assert.throws(()=>parse(csv.replace('2024-08','2024-07')));
 assert.throws(()=>parse(csv.replace('monthly_report_final','preliminary_estimate')));
 assert.throws(()=>parse(csv.replace('592127','NaN')));
 const changed=parse(csv.replace('11756','11756000'));assert.notEqual(totals(changed).coastwise_tonne_km_million.previous,149309);
 console.log('PASS water supplement: 24 months, 3 BigInt sums/rates, source metadata, scoped UI, 6 fault checks');
 return actual;
}
module.exports=check;
if(require.main===module)check(process.argv[2]);
