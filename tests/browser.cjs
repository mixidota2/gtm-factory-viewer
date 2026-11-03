const { chromium } = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const beforeFonts=process.argv.includes('--font-before');
const { createHash } = require('node:crypto');
const html = fs.readFileSync('index.html');
assert.equal(createHash('sha256').update(html).digest('hex'), 'c1b8f80e485a0aacc491f6416c79a991c989f9965607e7222e5ac2cf6362bf04');
const data = JSON.parse(html.toString().match(/<script id="snapshot-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.equal(data.markets.length,17);
assert.equal(data.claims.length,97);
assert.equal(data.editorial.observations.length,20);
assert.equal(createHash('sha256').update(JSON.stringify(data)).digest('hex'), "9982cb2eb35902e59eb4476fb3a92d1ce15f7e0d2f4ea2ee99e55448e7c59644");


// Pin the reviewed Japanese rewrite, normalizing only the legacy electronic-prescription scope below.
const previousScope={"market":{"id":"jp-e-prescription-clinic-lag.md","title":"電子処方箋を導入した施設の割合は約11か月で上昇。発行件数は別に確認","summary":"電子処方箋を導入した施設の割合は、薬局で85.9%から91.4%、医科診療所で22.5%から31.2%、病院で16.1%から21.4%、歯科で6.4%から11.5%へ上がりました。\n\n2026年8月に登録された件数は、電子処方箋が約65万件、引換番号付きの紙処方箋が約1,410万件でした。","text":"# 電子処方箋を導入した施設の割合は約11か月で上昇。発行件数は別に確認\n\n分類：施設導入増・登録利用\n\n## 対象と期間\n\n2025年9月と2026年8月を比較しています。導入率の分母は、保険資格をオンラインで確認する仕組みを導入した施設です。すべての医療機関・薬局を分母にしているわけではありません。\n\n## 調査で分かったこと\n\n電子処方箋を導入した施設の割合は、薬局で85.9%から91.4%、医科診療所で22.5%から31.2%、病院で16.1%から21.4%、歯科で6.4%から11.5%へ上がりました。\n\n2026年8月に登録された件数は、電子処方箋が約65万件、引換番号付きの紙処方箋が約1,410万件でした。\n\n## この結果から言えること\n\n電子処方箋を導入した施設の割合は、時系列で増えています。ただし、導入率と処方箋の登録件数は、数えているものが違います。導入率を全医療機関の割合とは読めず、2種類の登録件数から全処方箋に占める電子処方箋の割合も出せません。登録された2種類が、すべての処方箋を網羅しているとは限らないためです。\n\n## 役立つ可能性と、まだ未確認のこと\n\n転記の負担や重複投薬のリスクを減らす効果は、今回の2種類の登録件数だけでは測れません。\n\n## 利用する人・費用を払う人・現在の手段\n\n利用する人：医療機関・薬局の職員、患者\n\n費用を払う人：医療機関・薬局等が候補。実際の支払主体、支援制度と自己負担の内訳・額は未確認\n\n現在の手段：紙処方箋、引換番号付き紙、既存医療システム\n\n## 分からないこと・別に考えられる理由\n\n診療科・施設規模別の利用状況、システム改修費、補助後の自己負担額、患者が得た利点は未確認です。重複投薬などの警告が出た件数を、健康被害が減った件数とは数えません。\n\n## 次に確かめたいこと\n\n同じ施設群について、すべての処方箋の件数、電子で発行した件数、運用にかかる時間と費用を追います。導入が増えても電子発行が増えず、負担も減っていなければ、導入の効果についての評価を見直します。\n\n## 出典\n\n（一次・ダッシュボード）デジタル庁「電子処方箋の導入状況に関するダッシュボード」（最終更新2026年9月11日。施設別導入・利活用の入口）https://www.digital.go.jp/resources/govdashboard/electronic-prescription\n\n（一次・データ）同ページ配布「データテーブル（ZIP）」（2026年9月11日更新。全国・施設種別の月次導入率、電子/引換番号つき紙の登録数、調剤結果登録率など）https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/42e67f07-4d20-46e7-8774-eb5493db76dd/582a374c/20260911_resources_govdashboard_electronic_prescription_table.zip\n\n（一次・案内）厚生労働省「電子処方箋導入スターターキット」（医科診療所向け Vol.1.2、令和8年8月26日改訂。薬局導入90.3%・調剤結果登録85.4%などの提示）https://www.mhlw.go.jp/content/11120000/001716303.pdf\n\n（一次・政策経緯）厚生労働省「電子処方箋の普及・活用拡大に向けた対応状況」（令和7年9月時点の普及整理。薬局先行・医療機関は低め、という当時の整理）https://www.mhlw.go.jp/content/11121000/001569995.pdf\n\n（関連メモ）jp-dental-ehr-rececon-gap.md\n\n## 確認状況\n\n以前の数値監査では、公式の入口ページへアクセスし、保存メモの値を確認しています。過去のデータを収録したZIPファイル内の表・セルは再照合していません。原典の該当セルの再確認と、全ページの読了は未完了です。\n","proxy_map":false},"chart":{"id":"jp-e-prescription-clinic-lag","title":"電子処方箋を導入した施設の割合","context":"2026年8月時点。各施設種別で、保険資格をオンラインで確認する仕組みを導入した施設が分母です。実際に電子処方箋を発行した割合ではありません。","rows":[{"label":"薬局","value":91.4},{"label":"医科診療所","value":31.2},{"label":"病院","value":21.4},{"label":"歯科","value":11.5}],"memo":"jp-e-prescription-clinic-lag.md"},"claims":[{"claim_id":"jp-e-prescription-clinic-lag-observation","text":"電子処方箋を導入した施設の割合は、薬局で85.9%から91.4%、医科診療所で22.5%から31.2%、病院で16.1%から21.4%、歯科で6.4%から11.5%へ上がりました。\n\n2026年8月に登録された件数は、電子処方箋が約65万件、引換番号付きの紙処方箋が約1,410万件でした。","kind":"observed_with_stated_scope","source_urls":["https://www.digital.go.jp/resources/govdashboard/electronic-prescription","https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/42e67f07-4d20-46e7-8774-eb5493db76dd/582a374c/20260911_resources_govdashboard_electronic_prescription_table.zip","https://www.mhlw.go.jp/content/11120000/001716303.pdf","https://www.mhlw.go.jp/content/11121000/001569995.pdf"],"source_relation":"supports_observation_with_scope","verification":{"checked_this_pass":false,"inherited_targeted_audit":false,"read_scope":"入口ページのアクセスと保存メモの値を確認。歴史ZIPの表・セルは今回再照合していない。","unread":"原典の該当箇所および全ページ。URLや頁アンカーの存在は読了の証拠ではない。"},"source_locators":{"dataset":"20260911_resources_govdashboard_electronic_prescription_table.zip; facility adoption Sep2025/Aug2026, registration Aug2026","worksheet_cell":"unread"}},{"claim_id":"jp-e-prescription-clinic-lag-interpretation","text":"電子処方箋を導入した施設の割合は、時系列で増えています。ただし、導入率と処方箋の登録件数は、数えているものが違います。導入率を全医療機関の割合とは読めず、2種類の登録件数から全処方箋に占める電子処方箋の割合も出せません。登録された2種類が、すべての処方箋を網羅しているとは限らないためです。","kind":"limited_inference","source_urls":["https://www.digital.go.jp/resources/govdashboard/electronic-prescription","https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/42e67f07-4d20-46e7-8774-eb5493db76dd/582a374c/20260911_resources_govdashboard_electronic_prescription_table.zip","https://www.mhlw.go.jp/content/11120000/001716303.pdf","https://www.mhlw.go.jp/content/11121000/001569995.pdf"],"source_relation":"context_only; does_not_establish_hypothesis_or_test_outcome","verification":{"checked_this_pass":false,"inherited_targeted_audit":false,"read_scope":"入口ページのアクセスと保存メモの値を確認。歴史ZIPの表・セルは今回再照合していない。","unread":"原典の該当箇所および全ページ。URLや頁アンカーの存在は読了の証拠ではない。"},"source_locators":{"dataset":"20260911_resources_govdashboard_electronic_prescription_table.zip; facility adoption Sep2025/Aug2026, registration Aug2026","worksheet_cell":"unread"}},{"claim_id":"jp-e-prescription-clinic-lag-value_hypothesis","text":"転記の負担や重複投薬のリスクを減らす効果は、今回の2種類の登録件数だけでは測れません。","kind":"hypothesis","source_urls":["https://www.digital.go.jp/resources/govdashboard/electronic-prescription","https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/42e67f07-4d20-46e7-8774-eb5493db76dd/582a374c/20260911_resources_govdashboard_electronic_prescription_table.zip","https://www.mhlw.go.jp/content/11120000/001716303.pdf","https://www.mhlw.go.jp/content/11121000/001569995.pdf"],"source_relation":"context_only; does_not_establish_hypothesis_or_test_outcome","verification":{"checked_this_pass":false,"inherited_targeted_audit":false,"read_scope":"入口ページのアクセスと保存メモの値を確認。歴史ZIPの表・セルは今回再照合していない。","unread":"原典の該当箇所および全ページ。URLや頁アンカーの存在は読了の証拠ではない。"},"source_locators":{"dataset":"20260911_resources_govdashboard_electronic_prescription_table.zip; facility adoption Sep2025/Aug2026, registration Aug2026","worksheet_cell":"unread"}},{"claim_id":"jp-e-prescription-clinic-lag-judgment_change","text":"同じ施設群について、すべての処方箋の件数、電子で発行した件数、運用にかかる時間と費用を追います。導入が増えても電子発行が増えず、負担も減っていなければ、導入の効果についての評価を見直します。","kind":"test_plan","source_urls":["https://www.digital.go.jp/resources/govdashboard/electronic-prescription","https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/42e67f07-4d20-46e7-8774-eb5493db76dd/582a374c/20260911_resources_govdashboard_electronic_prescription_table.zip","https://www.mhlw.go.jp/content/11120000/001716303.pdf","https://www.mhlw.go.jp/content/11121000/001569995.pdf"],"source_relation":"context_only; does_not_establish_hypothesis_or_test_outcome","verification":{"checked_this_pass":false,"inherited_targeted_audit":false,"read_scope":"入口ページのアクセスと保存メモの値を確認。歴史ZIPの表・セルは今回再照合していない。","unread":"原典の該当箇所および全ページ。URLや頁アンカーの存在は読了の証拠ではない。"},"source_locators":{"dataset":"20260911_resources_govdashboard_electronic_prescription_table.zip; facility adoption Sep2025/Aug2026, registration Aug2026","worksheet_cell":"unread"}}]};
const preservationData=JSON.parse(JSON.stringify(data));
preservationData.markets=preservationData.markets.map(x=>x.id===previousScope.market.id?previousScope.market:x);
preservationData.charts=preservationData.charts.map(x=>x.id===previousScope.chart.id?previousScope.chart:x);
preservationData.claims=preservationData.claims.map(x=>previousScope.claims.find(c=>c.claim_id===x.claim_id)||x);
assert.equal(createHash('sha256').update(JSON.stringify(preservationData)).digest('hex'),'c9462c9edd71ad6a7b7009382147b08b7faebc4aed5961cc205773938d255b02');
const sha256=value=>createHash('sha256').update(value).digest('hex');
assert.equal(sha256(JSON.stringify(preservationData.claims.slice(0,92))), 'a878814cc93d3ef91e46d72543f80139647ecb82023df6e8eca6697b0cb0b7b8');
const restored=JSON.parse(JSON.stringify(preservationData));
restored.markets=restored.markets.slice(0,16);
const target=restored.markets.find(m=>m.id==='jp-merihari-consumption.md');
const marker='\n## 追記：2026年8月の売り手側売上（速報・2026年10月23日公表）';
assert.equal(target.text.split(marker).length,2);
target.text=target.text.split(marker)[0];restored.claims=restored.claims.slice(0,92);
assert.equal(sha256(JSON.stringify(restored)), '682b9451028712a417e03040c0f50b1de6343c9dce5b3fbd6d6b77c85f26e946');
assert.deepEqual(data.claims.slice(92,94).map(c=>c.claim_id),['jp-merihari-consumption-seller-2026-08-lodging','jp-merihari-consumption-seller-2026-08-restaurants']);
for(const c of data.claims.slice(92,94)){
 assert.deepEqual(c.source_urls,['https://www.stat.go.jp/data/mbss/kekka/pdf/m202608.pdf']);
 assert.deepEqual(c.source_locators[0].pdf_pages,[4]);
 assert.equal(c.verification.checked_this_pass,false);
 assert.equal(c.verification.inherited_targeted_audit,true);
 assert.deepEqual(c.periods,['2025年8月（前年同月比の比較対象）','2026年8月（速報）']);
}


// Pin the rewritten 16-market/94-claim subset, including the August addendum.
const prior=JSON.parse(JSON.stringify(preservationData));prior.markets=prior.markets.slice(0,16);prior.claims=prior.claims.slice(0,94);
assert.equal(sha256(JSON.stringify(prior)), 'ddbf2cedeaf37815df6df7fdbb9f9438ba8f21863a42fc4969359431a2120ef6');
assert.equal(sha256(JSON.stringify(preservationData.claims.slice(0,94))), 'aa51f32c85101215b678be4e6f5a0343e34e30ba5ba4e428258f7027c1043f50');
assert.equal(sha256(JSON.stringify(preservationData.markets.slice(0,16))), '6b849e85d055d1682eba0eb98d30f52c98e26383431ad49937ae65e3de3b41e4');
const aircon=data.markets.find(m=>m.id==='jp-aircon-rebound-divergence.md');
assert.equal(aircon.proxy_map,false);
assert.ok(aircon.title.includes('持続成長未確認の候補')&&aircon.summary.includes('持続成長未確認の候補'));
assert.ok(!data.themes.some(t=>t.memos.includes(aircon.id)));
assert.deepEqual(data.claims.slice(94).map(c=>c.claim_id),['household','shipments','retail'].map(s=>'jp-aircon-rebound-divergence-'+s));


const epPrefix='jp-e-prescription-clinic-lag-';
assert.equal(sha256(JSON.stringify(data.markets.filter(x=>x.id!=='jp-e-prescription-clinic-lag.md'))),'ffed7c6c9d8afc06a8a292c7cadca54ebad9664716acfd2e9892442f5d513cea');
assert.equal(sha256(JSON.stringify(data.claims.filter(x=>!x.claim_id.startsWith(epPrefix)))),'e8e11c8d1c7423aae8c30692ca2b7873068acb2769579a430f644f266460ff19');
assert.equal(sha256(JSON.stringify(data.editorial)),'4869c19b288a609196c8aa2835bdb86ba43f2d1cc90c2d3664c90bc9e776c612');
assert.deepEqual(data.claims.filter(x=>x.claim_id.startsWith(epPrefix)).map(x=>x.claim_id),previousScope.claims.map(x=>x.claim_id));
const ep=data.markets.find(x=>x.id==='jp-e-prescription-clinic-lag.md');
const epChart=data.charts.find(x=>x.memo===ep.id);
assert.deepEqual(epChart.rows.map(r=>r.value),[91.8,32.2,22,12.1]);
for(const [a,b,p] of [[26717,83069,32.2],[55874,60866,91.8],[1738,7910,22],[7291,60271,12.1]])assert.equal(Number((a/b*100).toFixed(1)),p);
for(const stale of ['91.4%','31.2%','21.4%','11.5%','約11か月','ZIPの数値照合は未完了','原表の分子・分母による再計算は未確認'])assert.ok(!JSON.stringify({ep,epChart,claims:data.claims.filter(x=>x.claim_id.startsWith(epPrefix))}).includes(stale));
assert.ok(ep.text.includes('医療機関・薬局の職員、患者'));
assert.ok(ep.text.includes('実際の支払主体、支援制度と自己負担の内訳・額は未確認'));
assert.ok(ep.text.includes('jp-dental-ehr-rececon-gap.md'));

// Keep topic, source, denominator and verification certainty attached to the same observation ID.
function assertObservationMapping(data){const map=new Map(data.editorial.observations.map(o=>[o.id,o]));const law=map.get('jp-law-concerns'),reuse=map.get('jp-reuse-intent'),food=map.get('jp-food-effects');for(const [o,label,keys,host]of [[law,'生成AI',['accuracy_pct','security_confidentiality_pct'],'www.nichibenren.or.jp'],[reuse,'中古',['smartphone_etc_pct','expensive_bag_pct'],'about.mercari.com'],[food,'シフト',['felt_any_effect_pct'],'www.hotpepper.jp']]){assert.ok(o.label.includes(label));assert.deepEqual(Object.keys(o.values),keys);assert.deepEqual(Object.values(o.values),o.id==='jp-law-concerns'?[68.1,63.2]:o.id==='jp-reuse-intent'?[51.7,51.2]:[89.3]);assert.ok(o.source_urls.every(u=>new URL(u).hostname===host));assert.ok(o.observation_text.includes(String(Object.values(o.values)[0])));assert.equal(o.verification_as_of,'2026-11-03');}assert.equal(law.period,'既存要約：2026年3月23日〜4月27日（今回未確認）');assert.equal(reuse.period,'既存要約：2026年5月20〜21日（今回未確認）');assert.ok(law.population.includes('223件'));assert.ok(reuse.population.includes('1,040人'));assert.ok(food.population.includes('1,029人')&&food.population.includes('103人'));for(const o of [law,reuse]){assert.equal(o.source_publication_date,'未確認');assert.equal(o.source_locator,'未確認');assert.ok(o.period.includes('既存要約')&&o.period.includes('未確認'));assert.ok(o.primary_read_scope.includes('取得できず'));assert.ok(o.independent_verification_scope.includes('照合できておらず'));}assert.equal(food.period,'2024年3月8〜12日');assert.ok(food.source_publication_date.startsWith('2024-06-03'));assert.ok(food.primary_read_scope.includes('今回は画像による視覚確認をしていません'));assert.ok(food.primary_read_scope.includes('以前の確認記録'));assert.ok(food.independent_verification_scope.includes('103人、効果実感89.3%'));const full=data.editorial.cross_industry_entries[2].text;for(const o of [law,reuse,food]){const at=full.indexOf('### '+o.label+'\n');assert.ok(at>=0);const end=full.indexOf('\n### ',at+4),section=full.slice(at,end<0?undefined:end);for(const key of ['observation_text','period','population','source_publication_date','primary_read_scope','independent_verification_scope','unconfirmed','source_locator'])assert.ok(section.includes(o[key]),o.id+'.'+key);for(const url of o.source_urls)assert.ok(section.includes(url),o.id+'.url');}}
assertObservationMapping(data);
for(const mutate of [
 x=>x.editorial.observations.find(o=>o.id==='jp-law-concerns').label='日本：中古購入',
 x=>x.editorial.observations.find(o=>o.id==='jp-law-concerns').source_publication_date='2026-07-14',
 x=>x.editorial.observations.find(o=>o.id==='jp-food-effects').primary_read_scope='今回は画像で確認済み',
 x=>x.editorial.observations.find(o=>o.id==='jp-reuse-intent').source_urls=x.editorial.observations.find(o=>o.id==='jp-food-effects').source_urls,
 x=>x.editorial.cross_industry_entries[2].text=x.editorial.cross_industry_entries[2].text.replace('103人、効果実感89.3%','999人')
]){const invalid=JSON.parse(JSON.stringify(data));mutate(invalid);assert.throws(()=>assertObservationMapping(invalid));}

async function recordFonts(page, width) {
 const sample='需要の変化を読む。支出、利用時間、導入状況。あいうえおアイウエオ';
 await page.evaluate(text=>{
  const node=document.createElement('p');node.id='font-evidence-probe';node.textContent=text;
  node.style.cssText='font:inherit;font-size:24px;background:white;color:black;padding:16px;';
  document.querySelector('.hero').prepend(node);
 },sample);
 await page.evaluate(()=>document.fonts.ready);
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('DOM.enable');
 await cdp.send('CSS.enable');
 const {root}=await cdp.send('DOM.getDocument');
 const records=[];
 for(const selector of ['.hero h1','#font-evidence-probe']){
  const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});
  const {fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
  records.push({selector,cssFamily:await page.locator(selector).evaluate(n=>getComputedStyle(n).fontFamily),fonts});
 }
 const coverage=records[1].fonts.map(font=>{
  const charset=execFileSync('fc-match',['-f','%{charset}',font.familyName],{encoding:'utf8'}).trim();
  const ranges=charset.split(/\s+/).map(x=>x.split('-').map(n=>parseInt(n,16)));
  const missing=[...new Set(sample)].filter(c=>!ranges.some(([a,b=a])=>c.codePointAt(0)>=a&&c.codePointAt(0)<=b));
  return {family:font.familyName,glyphCount:font.glyphCount,charset,missing};
 });
 const phase=beforeFonts?'before':'after';
 const evidence={phase,viewportWidth:width,chrome:await page.context().browser().version(),sample,records,coverage,japaneseFonts:execFileSync('fc-list',[':lang=ja','family','file'],{encoding:'utf8'})};
 fs.writeFileSync(`browser-evidence/fonts-${phase}-${width}.json`,JSON.stringify(evidence,null,2));
 console.log('FONT EVIDENCE '+JSON.stringify({phase,width,records,coverage:coverage.map(({charset,...x})=>x),japaneseFonts:evidence.japaneseFonts}));
 await page.screenshot({path:`browser-evidence/font-${phase}-${width}.png`});
 await cdp.detach();
 await page.locator('#font-evidence-probe').evaluate(n=>n.remove());
 if(!beforeFonts){
  assert.ok(coverage.some(f=>f.glyphCount>0&&f.missing.length===0&&/Noto.*CJK/.test(f.family)),'Chrome must use a CJK font covering the Japanese sample');
 }
}

const server = http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/`;
 let browser;
 try {
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',headless:true,chromiumSandbox:true});
  fs.mkdirSync('browser-evidence',{recursive:true});
  for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:768,height:1024},{width:360,height:800}]){
   const page=await browser.newPage({viewport});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await page.goto(base);
   const freshness=await page.locator('.hero-note .meta').innerText();
   assert.ok(freshness.includes('主要記事の更新日：2026年10月28日（日本時間）'));
   assert.ok(freshness.includes('全記事をこの日に再調査したものではありません'));
   assert.ok(freshness.includes('資料の公表日・データの対象期間・確認範囲は各記事'));
   assert.equal(await page.locator('#snapshot').innerText(),'主要記事の更新日：2026年10月28日（日本時間） · 資料の公表日・対象期間は各記事に記載');

   assert.ok((await page.locator('#candidates .meta').innerText()).includes('海外パック旅行・照明が2026年10月18〜19日、宿泊料が11月2日'));
   assert.equal(await page.locator('.hero-note a[href="#candidates"]').innerText(),'調査を続ける候補4件を読む');
   await recordFonts(page,viewport.width);
   if(beforeFonts){await page.close();continue;}
   assert.equal(await page.locator('#card-results a.card').count(),17);
   for(const theme of data.themes){
    await page.locator(`[data-theme="${theme.id}"]`).click();
    assert.ok((await page.locator('#theme-detail').innerText()).includes(theme.title));
   }
   await page.locator('#search').fill('保険');
   assert.ok((await page.locator('#claim-results').innerText()).includes('掛け捨て保険'));
   await page.locator('#search').fill('zzzz-no-matching-memo');
   assert.equal(await page.locator('#card-results a.card').count(),0);
   await page.locator('#reset').click();
   assert.equal(await page.locator('#card-results a.card').count(),17);
   await page.locator('#search').fill('コーヒー');
   assert.ok((await page.locator('#claim-results').innerText()).includes('概要全文'));
   await page.locator('#reset').click();
   assert.equal(await page.locator('#comparison tbody tr').count(),11);
   assert.equal(await page.locator('#comparison tbody td').count(),33);
   if(viewport.width===390){
    const region=page.locator('#comparison .table-scroll');
    await region.scrollIntoViewIfNeeded();
    assert.ok(await page.locator('#comparison-scroll-hint').isVisible());
    await page.screenshot({path:'browser-evidence/comparison-390-left.png'});
    await region.hover();
    await page.mouse.wheel(10000,0);
    await page.waitForFunction(()=>{const el=document.querySelector('#comparison .table-scroll');return el.scrollLeft>0&&Math.abs(el.scrollWidth-el.clientWidth-el.scrollLeft)<=2;});
    const metrics=await region.evaluate(el=>{const r=el.getBoundingClientRect();const cell=el.querySelector('thead th:last-child').getBoundingClientRect();return {scrollLeft:el.scrollLeft,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,lastColumnRight:cell.right,regionRight:r.right,pageScrollWidth:document.documentElement.scrollWidth,viewport:innerWidth};});
    assert.ok(metrics.scrollWidth>metrics.clientWidth);
    assert.ok(metrics.lastColumnRight<=metrics.regionRight+2);
    assert.ok(metrics.pageScrollWidth<=metrics.viewport,'page must not overflow horizontally');
    fs.writeFileSync('browser-evidence/comparison-scroll-390.json',JSON.stringify(metrics,null,2));
    await page.screenshot({path:'browser-evidence/comparison-390-right.png'});
    console.log('PASS comparison actual horizontal wheel scroll: '+JSON.stringify(metrics));
   }

   assert.equal(await page.locator('[id^="claim-"][class="claim-evidence"]').count(),97);
   assert.equal(await page.locator('#main').evaluate(el=>new Set([...el.querySelectorAll('[id]')].map(n=>n.id)).size === el.querySelectorAll('[id]').length),true);
   assert.equal(await page.locator('#result-count').innerText(),'17記事のうち17記事を表示しています');
   assert.equal(await page.locator('#candidate-results article').count(),4);
   for(const [id,query,claim,limit,sourceCount] of [
    ['foreign-package-travel','代表的なフリープラン','45.6%','「利用量まで確かめられた伸び」には加えません',7],
    ['lighting','参加37社','2026年4〜8月','同じ範囲で購入量も増えたと確認できた項目には加えません',5],
    ['accommodation','宿泊条件を揃えて比較できる購入泊数','41,543円','成長項目への追加は見送っています',5]
   ]){
    await page.locator('#editorial-search').fill(query);
    assert.equal(await page.locator('#candidate-results article').count(),1);
    assert.equal(await page.locator('#candidate-count').innerText(),'候補4件のうち1件を表示しています');
    await page.locator('#candidate-results h3 a[href="#candidate/'+id+'"]').click();
    await page.waitForFunction(expected=>location.hash==='#candidate/'+expected && document.querySelector('#main h1')?.textContent.includes(expected==='lighting'?'照明器具':expected==='accommodation'?'宿泊料':'海外パック旅行'),id);
    const body=await page.locator('#main').innerText();
    for(const text of ['候補・利用量の増加は未確認','二人以上世帯','2025年9月〜2026年8月',claim,limit,id==='accommodation'?'家計調査・2020〜2024年':'家計調査・月次（2020〜2024年）'])assert.ok(body.includes(text),id+': '+text);

    if(id==='accommodation'){
     for(const caveat of ['どの条件なら合算できるかは未確認','速報・確報の表示が異なる','親族宅での宿泊','帰宅した時期','有料宿泊の泊数が増えた、あるいは滞在が短くなったとは判断しません'])assert.ok(body.includes(caveat),caveat);
     assert.equal(await page.locator('#main a[href="https://www.mlit.go.jp/kankocho/content/001858808.pdf"]').count(),1);
    }
    assert.equal(await page.locator('#main a[href^="http"]').count(),sourceCount);
    assert.equal(await page.locator('#main a[href="https://www.e-stat.go.jp/stat-search/file-download?fileKind=1&statInfId=000040270650"]').count(),1);
    assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth),'candidate article must not overflow page');
    await page.screenshot({path:`browser-evidence/candidate-${id}-${viewport.width}.png`,fullPage:true});
    await page.locator('#main aside a[href="#candidates"]').click();
    await page.waitForFunction(()=>!!document.getElementById('candidate-results'));
    await page.locator('#reset').click();
    assert.equal(await page.locator('#candidate-results article').count(),4);
   }
   await page.locator('#search').fill('zzzz-no-candidate');
   assert.equal(await page.locator('#candidate-results article').count(),0);
   await page.locator('#reset').click();
   assert.equal(await page.locator('#candidate-results article').count(),4);
   console.log(`PASS candidate display/search/source links/back/reset at ${viewport.width}: overseas travel, lighting and accommodation remain candidates`);
   for(const entry of data.editorial.cross_industry_entries){
    await page.goto(base+'#overview');
    await page.locator('#overview a[href="#question/'+entry.id+'"]').click();
    await page.waitForFunction(title=>document.getElementById('question-detail')?.innerText.includes(title),entry.title);
   }
   await page.goto(base);
   await page.screenshot({path:`browser-evidence/home-${viewport.width}.png`,fullPage:true});
   for(const memo of data.markets){
    await page.goto(base+'#markets/'+memo.id);
    await page.waitForFunction(title=>document.getElementById('main').innerText.includes(title),memo.title);
    assert.ok((await page.locator('#main').innerText()).includes('出典・検証状況'));
    assert.equal(await page.locator('#main').getByText('記事一覧に戻る',{exact:true}).count(),2);
   }
   for(const id of ['es-hotel','uk-video','us-electricity','in-upi']){
    await page.goto(base+'#global/'+id);
    await page.waitForFunction(()=>document.getElementById('main').innerText.includes('海外'));
    assert.ok(await page.locator('#main a[href^="http"]').count()>0);
   }
   for(const id of ['money-and-quantity','use-and-adoption','felt-value']){
    await page.goto(base+'#question/'+id);
    await page.waitForFunction(()=>document.getElementById('question-detail')?.innerText.length>0);
   }


   // Read each repaired observation card, including the expanded numeric detail, at every viewport.
   await page.goto(base+'#question/felt-value');
   for(const [id,title] of [['jp-law-concerns','日本：生成AIの正確性と機密への懸念'],['jp-reuse-intent','日本：中古購入と保証への意向'],['jp-food-effects','日本：シフト・勤怠ツールの効果実感']]){
    const expected=data.editorial.observations.find(o=>o.id===id);
    const card=page.locator('#question-detail .observation').filter({has:page.getByRole('heading',{name:title,exact:true})});
    assert.equal(await card.count(),1);
    await card.locator('details > summary').click();
    const text=await card.innerText();
    for(const value of Object.values(expected.values))assert.ok(text.includes(String(value)),id+': '+value);
    assert.ok(text.includes(expected.period),id+': period');
    assert.ok(text.includes(expected.primary_read_scope),id+': read scope');
    assert.equal(await card.locator('dt:has-text("原典公表日") + dd').innerText(),expected.source_publication_date);
    assert.equal(await card.locator('dt:has-text("原典内の位置") + dd').innerText(),expected.source_locator);
    for(const source of expected.source_urls)assert.ok(await card.locator('a').evaluateAll((links,url)=>links.some(a=>a.getAttribute('href')===url),source),id+': source');
   }
   console.log('PASS repaired observation topics, sources, values and certainty at '+viewport.width);

   // Overview-only matches must link to the overview even when no article or theme claim matches.
   await page.goto(base);
   await page.locator('#search').fill('レンタカー');
   assert.equal(await page.locator('#card-results a.card').count(),0);
   assert.equal(await page.locator('#claim-results article').count(),0);
   assert.equal(await page.locator('#card-results .empty').innerText(),'関連する個別の記事はありません。上のリンクから、概要の詳しい説明を読めます。');
   const overviewOnly=page.locator('#claim-results').getByRole('link',{name:'検索語を含む概要全文を読む',exact:true});
   assert.equal(await overviewOnly.count(),1);
   await overviewOnly.click();
   await page.waitForFunction(()=>document.querySelector('#overview')?.open);
   assert.ok((await page.locator('#overview').innerText()).includes('レンタカー'));
   await page.locator('#reset').click();
   assert.equal(await page.locator('#card-results a.card').count(),17);

   await page.goto(base);
   for(const query of ['718,854','1,833,150','2026年8月速報']){
    await page.locator('#search').fill(query);
    assert.equal(await page.locator('#card-results a.card').count(),1);
    await page.locator('#card-results a[href="#markets/jp-merihari-consumption.md"]').click();
    await page.waitForFunction(()=>document.querySelector('#main h1')?.textContent.includes('2026年7月'));
    const article=await page.locator('#main').innerText();
    for(const phrase of ['追記：2026年8月','2026年10月23日公表','718,854','1,833,150','+2.3%','+3.7%','客数や実質利用量を測った値ではありません。','前月比ではありません','速報・丸め値','全34業種','元記事と既存4主張の確認状況は変更していません'])assert.ok(article.includes(phrase),phrase);
    assert.equal(await page.locator('#main details.claim-evidence').count(),6);
    assert.equal(await page.locator('#main a[href="https://www.stat.go.jp/data/mbss/kekka/pdf/m202608.pdf#page=4"]').count(),1);
    assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth));
    await page.screenshot({path:'browser-evidence/august-'+viewport.width+'.png',fullPage:true});
    await page.locator('#main').getByText('記事一覧に戻る',{exact:true}).first().click();
    await page.locator('#reset').click();
    assert.equal(await page.locator('#card-results a.card').count(),17);
   }
   for(const id of ['lodging','restaurants']){
    await page.goto(base+'#claim/jp-merihari-consumption-seller-2026-08-'+id);
    const detail=page.locator('#claim-jp-merihari-consumption-seller-2026-08-'+id);
    await detail.waitFor({state:'visible'});
    assert.equal(await detail.evaluate(el=>el.open),true);
    assert.ok((await detail.innerText()).includes('2026年10月23日に保存した独立確認の記録'));
    assert.ok(await detail.locator('a[href="https://www.stat.go.jp/data/mbss/kekka/pdf/m202608.pdf"]').count()>0);
   }
   console.log('PASS dated August addendum, source, search, article/back/reset and claim navigation at '+viewport.width);


   await page.goto(base);
   for(const query of ['エアコン','19,324','POS受注売上','jp-aircon-rebound-divergence.md','jp-aircon-rebound-divergence-household']){
    await page.locator('#search').fill(query);
    assert.equal(await page.locator('#card-results a[href="#markets/jp-aircon-rebound-divergence.md"]').count(),1);
    await page.locator('#card-results a[href="#markets/jp-aircon-rebound-divergence.md"]').click();
    await page.waitForFunction(()=>document.querySelector('#main h1')?.textContent.includes('エアコン'));
    const body=await page.locator('#main').innerText();
    for(const phrase of ['持続成長未確認の候補','2026年10月26日','19,324円','15,528円','0.108台から0.125台','0.053台から0.045台','0.001台単位','標本誤差・信頼区間は未検証','732.3万台','91.5万台','64.7%','35.3%減','この数字が在庫増を証明しているわけでもありません','持続成長の一覧へは昇格しません'])assert.ok(body.includes(phrase),phrase);
    assert.equal(await page.locator('#main details.claim-evidence').count(),3);
    for(const source of [...new Set(data.claims.slice(94).flatMap(c=>c.source_urls))])assert.ok(await page.locator('#main a').evaluateAll((links,url)=>links.some(a=>a.getAttribute('href')===url),source),source);
    assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth),'aircon article must not overflow');
    if(query==='エアコン')await page.screenshot({path:'browser-evidence/aircon-'+viewport.width+'.png',fullPage:true});
    await page.locator('#main').getByText('記事一覧に戻る',{exact:true}).first().click();
    await page.locator('#reset').click();
    assert.equal(await page.locator('#card-results a.card').count(),17);
    assert.equal(await page.locator('#candidate-results article').count(),4);
   }
   for(const slug of ['household','shipments','retail']){
    const id='jp-aircon-rebound-divergence-'+slug;
    await page.goto(base+'#claim/'+id);
    const detail=page.locator('#claim-'+id);await detail.waitFor({state:'visible'});
    assert.equal(await detail.evaluate(el=>el.open),true);
    assert.ok((await detail.innerText()).includes('2026年10月26日の確認済み原稿'));
   }
   console.log('PASS aircon candidate/article and claim-ID search/sources/back/reset at '+viewport.width);


   await page.goto(base);
   const chart=page.locator('figure.chart').nth(1);
   assert.ok((await chart.innerText()).includes('2026年9月'));
   assert.deepEqual(await chart.locator('.bar-label strong').allTextContents(),['91.8%','32.2%','22.0%','12.1%']);
   await chart.locator(':scope > details > summary').click();
   const facts=await chart.innerText();
   for(const phrase of ['2026年10月16日更新','26,717／83,069','55,874／60,866','1,738／7,910','7,291／60,271','F14:H14','48行672セル','空欄から補完'])assert.ok(facts.includes(phrase),phrase);
   assert.equal(await chart.locator('a[href*="20261016_resources"]').count()>0,true);
   await chart.locator('figcaption a').click();
   await page.waitForFunction(()=>document.querySelector('#main h1')?.textContent.includes('9月の電子登録'));
   for(const query of ['電子処方箋','692,818','jp-e-prescription-clinic-lag-observation']){
    await page.goto(base);await page.locator('#search').fill(query);
    await page.locator('#card-results a[href="#markets/jp-e-prescription-clinic-lag.md"]').click();
    await page.waitForFunction(()=>document.querySelector('#main h1')?.textContent.includes('9月の電子登録'));
    const article=await page.locator('#main').innerText();
    for(const phrase of ['692,818件','15,294,344件','653,972件','14,102,630件','登録する主体も段階も異なり','同じ施設を固定して追った導入率ではありません','支払額','紙処方箋、引換番号付き紙、既存医療システム','全セル不変とはせず'])assert.ok(article.includes(phrase),phrase);
    assert.equal(await page.locator('#main details.claim-evidence').count(),4);
    for(const source of data.claims.find(c=>c.claim_id===epPrefix+'observation').source_urls)assert.ok(await page.locator('#main a').evaluateAll((links,url)=>links.some(a=>a.getAttribute('href')===url),source),source);
    assert.equal(await page.locator('#main a[href="#markets/jp-dental-ehr-rececon-gap.md"]').count()>0,true);
    assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth));
    if(query==='電子処方箋')await page.screenshot({path:'browser-evidence/eprescription-'+viewport.width+'.png',fullPage:true});
    await page.locator('#main').getByText('記事一覧に戻る',{exact:true}).first().click();
    await page.locator('#reset').click();assert.equal(await page.locator('#card-results a.card').count(),17);
   }
   // Electronic prescription has no theme membership in the preserved snapshot.
   assert.equal(data.themes.some(t=>t.memos.includes(ep.id)),false);
   const phoneId='jp-phone-daily-stack.md';
   const phoneTheme=data.themes.find(t=>t.memos.includes(phoneId));assert.ok(phoneTheme);
   await page.locator('#filter').selectOption(phoneTheme.id);
   assert.equal(await page.locator('#card-results a[href="#markets/jp-e-prescription-clinic-lag.md"]').count(),0);
   assert.equal(await page.locator('#card-results a[href="#markets/jp-phone-daily-stack.md"]').count(),1);
   assert.deepEqual((await page.locator('#card-results a.card').evaluateAll(links=>links.map(a=>a.getAttribute('href')))).sort(),phoneTheme.memos.map(id=>'#markets/'+id).sort());
   await page.locator('#reset').click();
   assert.equal(await page.locator('#filter').inputValue(),'all');
   assert.equal(await page.locator('#card-results a.card').count(),17);
   assert.equal(await page.locator('#card-results a[href="#markets/jp-e-prescription-clinic-lag.md"]').count(),1);
   await page.goto(base+'#claim/'+epPrefix+'observation');
   const detail=page.locator('#claim-'+epPrefix+'observation');await detail.waitFor({state:'visible'});assert.equal(await detail.evaluate(el=>el.open),true);
   assert.ok((await detail.innerText()).includes('対象系列で、CSVとXLSXに保存された値を照合'));
   console.log('PASS September electronic-prescription card/chart/cells/sources/search/filter/back at '+viewport.width);

   assert.deepEqual(errors,[]);
   await page.close();
   console.log(`PASS protected Chromium ${viewport.width}x${viewport.height}: themes, insurance/overview search, reset, 17 memo routes, comparison, claims, 4 global articles, 3 questions, no console/page errors`);
  }
 } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});

