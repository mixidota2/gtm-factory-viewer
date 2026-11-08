// Candidate browser regression: original fixture assertions + independent candidate checks first.
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const path=require('node:path');
const html=Buffer.from(require('./combined_preflight.cjs')(path.resolve(process.argv.slice(2).find(a=>!a.startsWith('--')) || path.join(__dirname,'../index.html'))));
if(process.argv.includes('--preflight-only'))process.exit(0);
const {chromium}=require('playwright');
const data=JSON.parse(html.toString().match(/<script id="snapshot-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const epPrefix='jp-e-prescription-clinic-lag-';
const ep=data.markets.find(m=>m.id==='jp-e-prescription-clinic-lag.md');assert.ok(ep);
const beforeFonts=process.argv.includes('--font-before');
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
   assert.equal(await page.locator('.hero-note a[href="#candidates"]').innerText(),'調査を続ける候補5件を読む');
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
   assert.equal(await page.locator('#candidate-results article').count(),5);
   for(const [id,query,claim,limit,sourceCount] of [
    ['foreign-package-travel','代表的なフリープラン','45.6%','「利用量まで確かめられた伸び」には加えません',7],
    ['lighting','参加37社','2026年4〜8月','同じ範囲で購入量も増えたと確認できた項目には加えません',5],
    ['accommodation','宿泊条件を揃えて比較できる購入泊数','41,543円','成長項目への追加は見送っています',5]
   ]){
    await page.locator('#editorial-search').fill(query);
    assert.equal(await page.locator('#candidate-results article').count(),1);
    assert.equal(await page.locator('#candidate-count').innerText(),'候補5件のうち1件を表示しています');
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
    assert.equal(await page.locator('#candidate-results article').count(),5);
   }
   await page.locator('#search').fill('zzzz-no-candidate');
   assert.equal(await page.locator('#candidate-results article').count(),0);
   await page.locator('#reset').click();
   assert.equal(await page.locator('#candidate-results article').count(),5);
   // Cooking appliances remain a spending candidate, not a growth theme or regular article.
   await page.goto(base);
   for(const query of ['炊事用電気器具','3,693','3,273','000040270649']){
    await page.locator('#search').fill(query);
    assert.equal(await page.locator('#candidate-results a[href="#candidate/cooking-appliances"]').count(),2);
    await page.locator('#candidate-results a[href="#candidate/cooking-appliances"]').first().click();
    await page.waitForFunction(()=>document.querySelector('#main h1')?.textContent.includes('炊事用電気器具'));
    const cookingText=await page.locator('#main').innerText();
    for(const phrase of ['候補・利用量の増加は未確認','2025年9月〜2026年8月','3,693円','3,195円','15.6%','2026年6〜8月','782円','540円','44.8%','購入しなかった世帯も含む平均','2025年は3,273円','2019年の3,446円','5.0%','暦年の月次表示値を合計','電子レンジは別品目','この品目全体の価格変化を表せません','購入数量を推定していません','組合せの変化は未確認','2026年11月4日','最新の家計対象月は2026年8月'])assert.ok(cookingText.includes(phrase),phrase);
    for(const url of ["https://www.e-stat.go.jp/stat-search/file-download?fileKind=1&statInfId=000040270651","https://www.e-stat.go.jp/stat-search/file-download?fileKind=1&statInfId=000040270650","https://www.e-stat.go.jp/stat-search/file-download?fileKind=1&statInfId=000040270649","https://www.stat.go.jp/data/kakei/kou2025/zuhyou/kouh2025.xlsx","https://www.stat.go.jp/data/cpi/2025/kaisetsu/pdf/4-61.pdf"])assert.ok(await page.locator('#main a').evaluateAll((links,url)=>links.some(a=>a.href===url),url),url);
    await page.locator('#main').getByText('候補一覧に戻る',{exact:true}).first().click();
    await page.waitForFunction(()=>!!document.querySelector('#candidate-results'));
    await page.locator('#reset').click();
    assert.equal(await page.locator('#candidate-results article').count(),5);
    assert.equal(await page.locator('#card-results a.card').count(),17);
   }
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
    assert.equal(await page.locator('#candidate-results article').count(),5);
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
   await page.goto(base+'#markets/jp-care-layers-not-one.md');
   await page.locator('#main h1').waitFor();
   const careArticle=await page.locator('#main').innerText();
   assert(careArticle.includes('同一施設での変化とは判断できません'));assert(!careArticle.includes('ただし、同じ施設を追跡した結果ではありません。'));
   assert(careArticle.includes('無回答は2.8%'));assert(careArticle.includes('パソコンによる介護ソフト'));
   assert(await page.locator('#main a[href*="R6_jittai_chousa_jigyousyo_shiryo2.pdf"]').count()>0);
   await page.locator('#main').getByText('記事一覧に戻る',{exact:true}).first().click();
   await page.locator('#search').fill('介護');
   await page.locator('#card-results a[href="#markets/jp-care-layers-not-one.md"]').click();await page.locator('#main h1').waitFor();
   for(const suffix of ['observation','interpretation','value_hypothesis','judgment_change']){
    await page.goto(base+'#claim/jp-care-layers-not-one-'+suffix);
    const careCard=page.locator('#claim-jp-care-layers-not-one-'+suffix);await careCard.waitFor({state:'visible'});
    const cardText=await careCard.innerText();
    for(const phrase of ['公表資料編72頁の問15①の質問文・選択肢と集計値を確認しました。','2026-11-08','空欄の原調査票','問15②'])assert(cardText.includes(phrase));
    assert(await careCard.evaluate(el=>el.open));
   }
   assert(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth));
   assert.deepEqual(errors,[]);
   for(const [claimId,expected] of [['theme-4-text','PDF6頁'],['jp-construction-apps-dont-stick-observation','n=136']]){
    await page.goto(base+'#claim/'+claimId);
    const card=page.locator('#claim-'+claimId);await card.waitFor({state:'visible'});
    assert((await card.innerText()).includes(expected));
   }
   assert.deepEqual(errors,[]);
   await page.close();
   console.log(`PASS protected Chromium ${viewport.width}x${viewport.height}: themes, insurance/overview search, reset, 17 memo routes, comparison, claims, 4 global articles, 3 questions, no console/page errors`);
  }
 } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});

