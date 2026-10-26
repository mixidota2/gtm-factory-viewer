const { chromium } = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const beforeFonts=process.argv.includes('--font-before');
const { createHash } = require('node:crypto');
const html = fs.readFileSync('index.html');
assert.equal(createHash('sha256').update(html).digest('hex'), '255b1fc3917930ef0ca8aad91ecf1cb1ac64f4648b35c3ac00767266ef8d7e34');
const data = JSON.parse(html.toString().match(/<script id="snapshot-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.equal(data.markets.length,17);
assert.equal(data.claims.length,97);
assert.equal(data.editorial.observations.length,20);
assert.equal(createHash('sha256').update(JSON.stringify(data)).digest('hex'), "06a3cfcdce6f0fe29937918ad0c0fe12a33464a24973f46a0a5c076e7dd31fb0");


// Restore only the sanctioned electronic-prescription scope before prior-version assertions.
const previousScope={"market":{"id":"jp-e-prescription-clinic-lag.md","title":"電子処方箋を導入した施設の割合は約11か月で上昇。発行件数は別に確認","summary":"電子処方箋を導入した施設の割合は、薬局で85.9%から91.4%、医科診療所で22.5%から31.2%、病院で16.1%から21.4%、歯科で6.4%から11.5%へ上がりました。\n\n2026年8月に登録された件数は、電子処方箋が約65万件、引換番号付きの紙処方箋が約1,410万件でした。","text":"# 電子処方箋を導入した施設の割合は約11か月で上昇。発行件数は別に確認\n\n分類：施設導入増・登録利用\n\n## 対象と期間\n\n2025年9月と2026年8月を比較しています。導入率の分母は、保険資格をオンラインで確認する仕組みを導入した施設です。すべての医療機関・薬局を分母にしているわけではありません。\n\n## 調査で分かったこと\n\n電子処方箋を導入した施設の割合は、薬局で85.9%から91.4%、医科診療所で22.5%から31.2%、病院で16.1%から21.4%、歯科で6.4%から11.5%へ上がりました。\n\n2026年8月に登録された件数は、電子処方箋が約65万件、引換番号付きの紙処方箋が約1,410万件でした。\n\n## この結果から言えること\n\n電子処方箋を導入した施設の割合は、時系列で増えています。ただし、導入率と処方箋の登録件数は、数えているものが違います。導入率を全医療機関の割合とは読めず、2種類の登録件数から全処方箋に占める電子処方箋の割合も出せません。登録された2種類が、すべての処方箋を網羅しているとは限らないためです。\n\n## 役立つ可能性と、まだ未確認のこと\n\n転記の負担や重複投薬のリスクを減らす効果は、今回の2種類の登録件数だけでは測れません。\n\n## 利用する人・費用を払う人・現在の手段\n\n利用する人：医療機関・薬局の職員、患者\n\n費用を払う人：医療機関・薬局等が候補。実際の支払主体、支援制度と自己負担の内訳・額は未確認\n\n現在の手段：紙処方箋、引換番号付き紙、既存医療システム\n\n## 分からないこと・別に考えられる理由\n\n診療科・施設規模別の利用状況、システム改修費、補助後の自己負担額、患者が得た利点は未確認です。重複投薬などの警告が出た件数を、健康被害が減った件数とは数えません。\n\n## 次に確かめたいこと\n\n同じ施設群について、すべての処方箋の件数、電子で発行した件数、運用にかかる時間と費用を追います。導入が増えても電子発行が増えず、負担も減っていなければ、導入の効果についての評価を見直します。\n\n## 出典\n\n（一次・ダッシュボード）デジタル庁「電子処方箋の導入状況に関するダッシュボード」（最終更新2026年9月11日。施設別導入・利活用の入口）https://www.digital.go.jp/resources/govdashboard/electronic-prescription\n\n（一次・データ）同ページ配布「データテーブル（ZIP）」（2026年9月11日更新。全国・施設種別の月次導入率、電子/引換番号つき紙の登録数、調剤結果登録率など）https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/42e67f07-4d20-46e7-8774-eb5493db76dd/582a374c/20260911_resources_govdashboard_electronic_prescription_table.zip\n\n（一次・案内）厚生労働省「電子処方箋導入スターターキット」（医科診療所向け Vol.1.2、令和8年8月26日改訂。薬局導入90.3%・調剤結果登録85.4%などの提示）https://www.mhlw.go.jp/content/11120000/001716303.pdf\n\n（一次・政策経緯）厚生労働省「電子処方箋の普及・活用拡大に向けた対応状況」（令和7年9月時点の普及整理。薬局先行・医療機関は低め、という当時の整理）https://www.mhlw.go.jp/content/11121000/001569995.pdf\n\n（関連メモ）jp-dental-ehr-rececon-gap.md\n\n## 確認状況\n\n以前の数値監査では、公式の入口ページへアクセスし、保存メモの値を確認しています。過去のデータを収録したZIPファイル内の表・セルは再照合していません。原典の該当セルの再確認と、全ページの読了は未完了です。\n","proxy_map":false},"chart":{"id":"jp-e-prescription-clinic-lag","title":"電子処方箋を導入した施設の割合","context":"2026年8月時点。各施設種別で、保険資格をオンラインで確認する仕組みを導入した施設が分母です。実際に電子処方箋を発行した割合ではありません。","rows":[{"label":"薬局","value":91.4},{"label":"医科診療所","value":31.2},{"label":"病院","value":21.4},{"label":"歯科","value":11.5}],"memo":"jp-e-prescription-clinic-lag.md"},"claims":[{"claim_id":"jp-e-prescription-clinic-lag-observation","text":"電子処方箋を導入した施設の割合は、薬局で85.9%から91.4%、医科診療所で22.5%から31.2%、病院で16.1%から21.4%、歯科で6.4%から11.5%へ上がりました。\n\n2026年8月に登録された件数は、電子処方箋が約65万件、引換番号付きの紙処方箋が約1,410万件でした。","kind":"observed_with_stated_scope","source_urls":["https://www.digital.go.jp/resources/govdashboard/electronic-prescription","https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/42e67f07-4d20-46e7-8774-eb5493db76dd/582a374c/20260911_resources_govdashboard_electronic_prescription_table.zip","https://www.mhlw.go.jp/content/11120000/001716303.pdf","https://www.mhlw.go.jp/content/11121000/001569995.pdf"],"source_relation":"supports_observation_with_scope","verification":{"checked_this_pass":false,"inherited_targeted_audit":false,"read_scope":"入口ページのアクセスと保存メモの値を確認。歴史ZIPの表・セルは今回再照合していない。","unread":"原典の該当箇所および全ページ。URLや頁アンカーの存在は読了の証拠ではない。"},"source_locators":{"dataset":"20260911_resources_govdashboard_electronic_prescription_table.zip; facility adoption Sep2025/Aug2026, registration Aug2026","worksheet_cell":"unread"}},{"claim_id":"jp-e-prescription-clinic-lag-interpretation","text":"電子処方箋を導入した施設の割合は、時系列で増えています。ただし、導入率と処方箋の登録件数は、数えているものが違います。導入率を全医療機関の割合とは読めず、2種類の登録件数から全処方箋に占める電子処方箋の割合も出せません。登録された2種類が、すべての処方箋を網羅しているとは限らないためです。","kind":"limited_inference","source_urls":["https://www.digital.go.jp/resources/govdashboard/electronic-prescription","https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/42e67f07-4d20-46e7-8774-eb5493db76dd/582a374c/20260911_resources_govdashboard_electronic_prescription_table.zip","https://www.mhlw.go.jp/content/11120000/001716303.pdf","https://www.mhlw.go.jp/content/11121000/001569995.pdf"],"source_relation":"context_only; does_not_establish_hypothesis_or_test_outcome","verification":{"checked_this_pass":false,"inherited_targeted_audit":false,"read_scope":"入口ページのアクセスと保存メモの値を確認。歴史ZIPの表・セルは今回再照合していない。","unread":"原典の該当箇所および全ページ。URLや頁アンカーの存在は読了の証拠ではない。"},"source_locators":{"dataset":"20260911_resources_govdashboard_electronic_prescription_table.zip; facility adoption Sep2025/Aug2026, registration Aug2026","worksheet_cell":"unread"}},{"claim_id":"jp-e-prescription-clinic-lag-value_hypothesis","text":"転記の負担や重複投薬のリスクを減らす効果は、今回の2種類の登録件数だけでは測れません。","kind":"hypothesis","source_urls":["https://www.digital.go.jp/resources/govdashboard/electronic-prescription","https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/42e67f07-4d20-46e7-8774-eb5493db76dd/582a374c/20260911_resources_govdashboard_electronic_prescription_table.zip","https://www.mhlw.go.jp/content/11120000/001716303.pdf","https://www.mhlw.go.jp/content/11121000/001569995.pdf"],"source_relation":"context_only; does_not_establish_hypothesis_or_test_outcome","verification":{"checked_this_pass":false,"inherited_targeted_audit":false,"read_scope":"入口ページのアクセスと保存メモの値を確認。歴史ZIPの表・セルは今回再照合していない。","unread":"原典の該当箇所および全ページ。URLや頁アンカーの存在は読了の証拠ではない。"},"source_locators":{"dataset":"20260911_resources_govdashboard_electronic_prescription_table.zip; facility adoption Sep2025/Aug2026, registration Aug2026","worksheet_cell":"unread"}},{"claim_id":"jp-e-prescription-clinic-lag-judgment_change","text":"同じ施設群について、すべての処方箋の件数、電子で発行した件数、運用にかかる時間と費用を追います。導入が増えても電子発行が増えず、負担も減っていなければ、導入の効果についての評価を見直します。","kind":"test_plan","source_urls":["https://www.digital.go.jp/resources/govdashboard/electronic-prescription","https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/42e67f07-4d20-46e7-8774-eb5493db76dd/582a374c/20260911_resources_govdashboard_electronic_prescription_table.zip","https://www.mhlw.go.jp/content/11120000/001716303.pdf","https://www.mhlw.go.jp/content/11121000/001569995.pdf"],"source_relation":"context_only; does_not_establish_hypothesis_or_test_outcome","verification":{"checked_this_pass":false,"inherited_targeted_audit":false,"read_scope":"入口ページのアクセスと保存メモの値を確認。歴史ZIPの表・セルは今回再照合していない。","unread":"原典の該当箇所および全ページ。URLや頁アンカーの存在は読了の証拠ではない。"},"source_locators":{"dataset":"20260911_resources_govdashboard_electronic_prescription_table.zip; facility adoption Sep2025/Aug2026, registration Aug2026","worksheet_cell":"unread"}}]};
const preservationData=JSON.parse(JSON.stringify(data));
preservationData.markets=preservationData.markets.map(x=>x.id===previousScope.market.id?previousScope.market:x);
preservationData.charts=preservationData.charts.map(x=>x.id===previousScope.chart.id?previousScope.chart:x);
preservationData.claims=preservationData.claims.map(x=>previousScope.claims.find(c=>c.claim_id===x.claim_id)||x);
assert.equal(createHash('sha256').update(JSON.stringify(preservationData)).digest('hex'),'28847b6dce05fbbb3f0e1cf5eb5fbeffbeebe587fc6cb225e57faad507aab335');
const sha256=value=>createHash('sha256').update(value).digest('hex');
assert.equal(sha256(JSON.stringify(preservationData.claims.slice(0,92))), '13dc4876a04db44e90a785546e8015d9e41bddcc2f7caf3ee4469e659794aabd');
const restored=JSON.parse(JSON.stringify(preservationData));
restored.markets=restored.markets.slice(0,16);
const target=restored.markets.find(m=>m.id==='jp-merihari-consumption.md');
const marker='\n## 追記：2026年8月の売り手側売上（速報・2026年10月23日公表）';
assert.equal(target.text.split(marker).length,2);
target.text=target.text.split(marker)[0];restored.claims=restored.claims.slice(0,92);
assert.equal(sha256(JSON.stringify(restored)), '3da87d0c2b0cc3bcf331b243487844e73b5428273a8d712b236f2785a4078c46');
assert.deepEqual(data.claims.slice(92,94).map(c=>c.claim_id),['jp-merihari-consumption-seller-2026-08-lodging','jp-merihari-consumption-seller-2026-08-restaurants']);
for(const c of data.claims.slice(92,94)){
 assert.deepEqual(c.source_urls,['https://www.stat.go.jp/data/mbss/kekka/pdf/m202608.pdf']);
 assert.deepEqual(c.source_locators[0].pdf_pages,[4]);
 assert.equal(c.verification.checked_this_pass,false);
 assert.equal(c.verification.inherited_targeted_audit,true);
 assert.deepEqual(c.periods,['2025年8月（前年同月比の比較対象）','2026年8月（速報）']);
}


// Preserve the complete prior 16-market/94-claim snapshot, including the August addendum.
const prior=JSON.parse(JSON.stringify(preservationData));prior.markets=prior.markets.slice(0,16);prior.claims=prior.claims.slice(0,94);
assert.equal(sha256(JSON.stringify(prior)), '252454727553ace3f51b0df58f69b9af384f8cf08f71c0267ac830a6716b4997');
assert.equal(sha256(JSON.stringify(preservationData.claims.slice(0,94))), 'cb62fbd42647c0c04c2809115b01ddbeb8b58617b0b8daf04676f34a99e0cdc5');
assert.equal(sha256(JSON.stringify(preservationData.markets.slice(0,16))), '7d3cf7d71d9ff33d8b569e03f5304a0baf975fb49a3cfad5305953df4106e969');
const aircon=data.markets.find(m=>m.id==='jp-aircon-rebound-divergence.md');
assert.equal(aircon.proxy_map,false);
assert.ok(aircon.title.includes('持続成長未確認の候補')&&aircon.summary.includes('持続成長未確認の候補'));
assert.ok(!data.themes.some(t=>t.memos.includes(aircon.id)));
assert.deepEqual(data.claims.slice(94).map(c=>c.claim_id),['household','shipments','retail'].map(s=>'jp-aircon-rebound-divergence-'+s));


const epPrefix='jp-e-prescription-clinic-lag-';
assert.equal(sha256(JSON.stringify(data.markets.filter(x=>x.id!=='jp-e-prescription-clinic-lag.md'))),'72071558cd79dacfdc829d6b362f384f9bfdd3d6858e5e939ef26dcb76c8877f');
assert.equal(sha256(JSON.stringify(data.claims.filter(x=>!x.claim_id.startsWith(epPrefix)))),'797ca2af91afe7655ea65ec277bc854fc1e00e7c29127e2159db2c12a3f6874e');
assert.equal(sha256(JSON.stringify(data.editorial)),'b63a6fef7db1e01d2acbc81edf34ac412be797b91b3bb566ccab8473b0f33596');
assert.deepEqual(data.claims.filter(x=>x.claim_id.startsWith(epPrefix)).map(x=>x.claim_id),previousScope.claims.map(x=>x.claim_id));
const ep=data.markets.find(x=>x.id==='jp-e-prescription-clinic-lag.md');
const epChart=data.charts.find(x=>x.memo===ep.id);
assert.deepEqual(epChart.rows.map(r=>r.value),[91.8,32.2,22,12.1]);
for(const [a,b,p] of [[26717,83069,32.2],[55874,60866,91.8],[1738,7910,22],[7291,60271,12.1]])assert.equal(Number((a/b*100).toFixed(1)),p);
for(const stale of ['91.4%','31.2%','21.4%','11.5%','約11か月','ZIPの数値照合は未完了','原表の分子・分母による再計算は未確認'])assert.ok(!JSON.stringify({ep,epChart,claims:data.claims.filter(x=>x.claim_id.startsWith(epPrefix))}).includes(stale));
assert.ok(ep.text.includes('医療機関・薬局の職員、患者'));
assert.ok(ep.text.includes('実際の支払主体、支援制度と自己負担の内訳・額は未確認'));
assert.ok(ep.text.includes('jp-dental-ehr-rececon-gap.md'));
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
   assert.equal(await page.locator('#candidate-results article').count(),2);
   for(const [id,query,claim,limit,sourceCount] of [
    ['foreign-package-travel','代表的なフリープラン','45.6%','「利用量まで確かめられた伸び」には加えません',7],
    ['lighting','参加37社','2026年4〜8月','同じ範囲で量の増加まで確認した項目には加えません',5]
   ]){
    await page.locator('#editorial-search').fill(query);
    assert.equal(await page.locator('#candidate-results article').count(),1);
    assert.equal(await page.locator('#candidate-count').innerText(),'候補2件のうち1件を表示しています');
    await page.locator('#candidate-results h3 a[href="#candidate/'+id+'"]').click();
    await page.waitForFunction(expected=>location.hash==='#candidate/'+expected && document.querySelector('#main h1')?.textContent.includes(expected==='lighting'?'照明器具':'海外パック旅行'),id);
    const body=await page.locator('#main').innerText();
    for(const text of ['候補・利用量の増加は未確認','二人以上世帯','2025年9月〜2026年8月',claim,limit,'家計調査・月次（2020〜2024年）'])assert.ok(body.includes(text),id+': '+text);
    assert.equal(await page.locator('#main a[href^="http"]').count(),sourceCount);
    assert.equal(await page.locator('#main a[href="https://www.e-stat.go.jp/stat-search/file-download?fileKind=1&statInfId=000040270650"]').count(),1);
    assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth),'candidate article must not overflow page');
    await page.screenshot({path:`browser-evidence/candidate-${id}-${viewport.width}.png`,fullPage:true});
    await page.locator('#main aside a[href="#candidates"]').click();
    await page.waitForFunction(()=>!!document.getElementById('candidate-results'));
    await page.locator('#reset').click();
    assert.equal(await page.locator('#candidate-results article').count(),2);
   }
   await page.locator('#search').fill('zzzz-no-candidate');
   assert.equal(await page.locator('#candidate-results article').count(),0);
   await page.locator('#reset').click();
   assert.equal(await page.locator('#candidate-results article').count(),2);
   console.log(`PASS candidate display/search/source links/back/reset at ${viewport.width}: overseas travel and lighting remain candidates`);
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

   await page.goto(base);
   for(const query of ['718,854','1,833,150','2026年8月速報']){
    await page.locator('#search').fill(query);
    assert.equal(await page.locator('#card-results a.card').count(),1);
    await page.locator('#card-results a[href="#markets/jp-merihari-consumption.md"]').click();
    await page.waitForFunction(()=>document.querySelector('#main h1')?.textContent.includes('2026年7月'));
    const article=await page.locator('#main').innerText();
    for(const phrase of ['追記：2026年8月','2026年10月23日公表','718,854','1,833,150','+2.3%','+3.7%','客数・実質利用量ではありません','前月比ではありません','速報・丸め値','全34業種','元記事と既存4主張の確認状況は変更していません'])assert.ok(article.includes(phrase),phrase);
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
    assert.ok((await detail.innerText()).includes('2026年10月23日の保存済み独立確認記録を継承'));
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
    for(const phrase of ['持続成長未確認の候補','2026年10月26日','19,324円','15,528円','0.108台から0.125台','0.053台から0.045台','0.001台単位','標本誤差・信頼区間は未検証','732.3万台','91.5万台','64.7%','35.3%減','在庫増を証明した数字でもありません','持続成長の一覧へは昇格しません'])assert.ok(body.includes(phrase),phrase);
    assert.equal(await page.locator('#main details.claim-evidence').count(),3);
    for(const source of [...new Set(data.claims.slice(94).flatMap(c=>c.source_urls))])assert.ok(await page.locator('#main a').evaluateAll((links,url)=>links.some(a=>a.getAttribute('href')===url),source),source);
    assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth),'aircon article must not overflow');
    if(query==='エアコン')await page.screenshot({path:'browser-evidence/aircon-'+viewport.width+'.png',fullPage:true});
    await page.locator('#main').getByText('記事一覧に戻る',{exact:true}).first().click();
    await page.locator('#reset').click();
    assert.equal(await page.locator('#card-results a.card').count(),17);
    assert.equal(await page.locator('#candidate-results article').count(),2);
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
    for(const phrase of ['692,818件','15,294,344件','653,972件','14,102,630件','登録する主体と段階が違い','同じ施設を固定して追った導入率ではありません','支払額','紙処方箋、引換番号付き紙、既存医療システム','全セル不変とはせず'])assert.ok(article.includes(phrase),phrase);
    assert.equal(await page.locator('#main details.claim-evidence').count(),4);
    for(const source of data.claims.find(c=>c.claim_id===epPrefix+'observation').source_urls)assert.ok(await page.locator('#main a').evaluateAll((links,url)=>links.some(a=>a.getAttribute('href')===url),source),source);
    assert.equal(await page.locator('#main a[href="#markets/jp-dental-ehr-rececon-gap.md"]').count()>0,true);
    assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth));
    if(query==='電子処方箋')await page.screenshot({path:'browser-evidence/eprescription-'+viewport.width+'.png',fullPage:true});
    await page.locator('#main').getByText('記事一覧に戻る',{exact:true}).first().click();
    await page.locator('#reset').click();assert.equal(await page.locator('#card-results a.card').count(),17);
   }
   const epTheme=data.themes.find(t=>t.memos.includes(ep.id));assert.ok(epTheme);
   await page.locator('#filter').selectOption(epTheme.id);
   assert.equal(await page.locator('#card-results a[href="#markets/jp-e-prescription-clinic-lag.md"]').count(),1);
   await page.locator('#reset').click();assert.equal(await page.locator('#card-results a.card').count(),17);
   await page.goto(base+'#claim/'+epPrefix+'observation');
   const detail=page.locator('#claim-'+epPrefix+'observation');await detail.waitFor({state:'visible'});assert.equal(await detail.evaluate(el=>el.open),true);
   assert.ok((await detail.innerText()).includes('対象系列をCSVとXLSX保存値で照合'));
   console.log('PASS September electronic-prescription card/chart/cells/sources/search/filter/back at '+viewport.width);

   assert.deepEqual(errors,[]);
   await page.close();
   console.log(`PASS protected Chromium ${viewport.width}x${viewport.height}: themes, insurance/overview search, reset, 17 memo routes, comparison, claims, 4 global articles, 3 questions, no console/page errors`);
  }
 } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
