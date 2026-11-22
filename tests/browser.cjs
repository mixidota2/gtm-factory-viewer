// Candidate browser regression: original fixture assertions + independent candidate checks first.
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const path=require('node:path');
const {waitForArticle,waitForClaim}=require('./wait_for_route.cjs');
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

const server = http.createServer(require('./static_server.cjs')(html));
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
   const freshness=await page.locator('.hero-note .meta').filter({hasText:'主要記事の内容を更新した日：'}).innerText();
   const proseUpdate=await page.locator('.hero-note .meta').filter({hasText:'文章を見直した日：'}).innerText();
   assert.ok(freshness.includes('主要記事の内容を更新した日：2026年10月28日（日本時間）'));
   assert.ok(freshness.includes('電子処方箋の9月分')&&freshness.includes('10月26日に確認したエアコン'));
   assert.ok(freshness.includes('この日に全記事を調べ直したわけではありません'));
   assert.ok(!freshness.includes('2026年11月18日'));
   assert.ok(proseUpdate.includes('文章を見直した日：2026年11月18日'));
   assert.ok(proseUpdate.includes('この日に全資料を調べ直したわけではありません'));
   assert.ok(proseUpdate.includes('資料の公表日、データの対象期間、確認した範囲は各記事'));
   assert.ok(!proseUpdate.includes('2026年10月28日'));
   assert.ok((await page.locator('.hero-note').innerText()).includes('海外4例も掲載しています。世界全体を代表する比較ではありません。'));
   assert.equal(await page.locator('#snapshot').innerText(),'主要記事の内容を更新した日：2026年10月28日（日本時間） · 文章を見直した日：2026年11月18日 · 資料の公表日と対象期間は各記事へ');

   assert.ok((await page.locator('#candidates .meta').innerText()).includes('海外パック旅行が2026年10月18〜19日、照明の月次支出・出荷が11月18日、宿泊料が11月2日'));
   assert.equal(await page.locator('.hero-note a[href="#candidates"]').innerText(),'調査を続ける候補5件を読む');
   await recordFonts(page,viewport.width);
   if(beforeFonts){await page.close();continue;}
   assert.equal(await page.locator('#card-results a.card').count(),18);
   for(const theme of data.themes){
    await page.locator(`[data-theme="${theme.id}"]`).click();
    assert.ok((await page.locator('#theme-detail').innerText()).includes(theme.title));
   }
   await page.locator('#search').fill('保険');
   assert.ok((await page.locator('#claim-results').innerText()).includes('掛け捨て保険'));
   await page.locator('#search').fill('zzzz-no-matching-memo');
   assert.equal(await page.locator('#card-results a.card').count(),0);
   assert.equal(await page.locator('#card-results .empty').innerText(),'条件に合う国内の調査記事はありません。検索語を変えるか、「すべてのテーマ」「すべての記事」を選んでください。');
   assert.equal(await page.locator('#global-results').innerText(),'検索語に合う海外記事はありません。検索語に合う個別の調査結果（観測）があれば、下に表示します。');
   await page.locator('#reset').click();
   assert.equal(await page.locator('#card-results a.card').count(),18);
   await page.locator('#search').fill('コーヒー');
   assert.ok((await page.locator('#claim-results').innerText()).includes('概要全文'));
   await page.locator('#reset').click();
   assert.equal(await page.locator('#comparison tbody tr').count(),11);
   assert.equal(await page.locator('#comparison tbody td').count(),33);
   assert.equal(await page.locator('#comparison > h2').innerText(),"同じ情報を入力し直す負担：建設・保育・ケアプラン");
   assert.equal(await page.getByRole('region',{name:'建設・保育・ケアプランの比較表'}).count(),1);
   assert.ok((await page.locator('#comparison tbody').innerText()).includes('今後の検証で比べること'));
   const compareDetail=page.locator('#comparison > details > summary');
   await compareDetail.click();
   assert.ok((await page.locator('#comparison > details .prose').innerText()).includes('対策の効果を示すランキングではありません。'));
   await compareDetail.click();
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

   assert.equal(await page.locator('[id^="claim-"][class="claim-evidence"]').count(),98);
   assert.equal(await page.locator('#main').evaluate(el=>new Set([...el.querySelectorAll('[id]')].map(n=>n.id)).size === el.querySelectorAll('[id]').length),true);
   assert.equal(await page.locator('#result-count').innerText(),'18記事のうち18記事を表示しています');
   assert.equal(await page.locator('#candidate-results article').count(),5);
   for(const [id,query,claim,limit,sourceCount] of [
    ['foreign-package-travel','代表的なフリープラン','45.6%','「利用量まで確かめられた伸び」には加えません',7],
    ['lighting','参加37社','2026年4〜8月','同じ範囲で購入量も増えたと確認できた項目には加えません',6],
    ['accommodation','宿泊条件を揃えて比較できる購入泊数','41,543円','成長項目への追加は見送っています',5]
   ]){
    await page.locator('#editorial-search').fill(query);
    assert.equal(await page.locator('#candidate-results article').count(),1);
    assert.equal(await page.locator('#candidate-count').innerText(),'調査候補5件のうち1件を表示しています');
    assert.equal(await page.locator('#candidate-results a[href="#candidate/'+id+'"]').last().innerText(), '調べた対象・期間・出典と、まだ分からないことを読む');
    await page.locator('#candidate-results h3 a[href="#candidate/'+id+'"]').click();
    await page.waitForFunction(expected=>location.hash==='#candidate/'+expected && document.querySelector('#main h1')?.textContent.includes(expected==='lighting'?'照明器具':expected==='accommodation'?'宿泊料':'海外パック旅行'),id);
    const body=await page.locator('#main').innerText();
    assert.equal(await page.locator('#main article.prose > p.meta').last().innerText(), 'この記事では、資料で確かめたことと、確かめられなかったことを分けています。支出や出荷が増えたというだけでは、利用量が増え続けているとは判断しません。');
    for(const text of ['調査候補：利用量が増えたかは未確認','二人以上世帯',id==='lighting'?'2025年10月〜2026年9月':'2025年9月〜2026年8月',claim,limit,id==='accommodation'?'家計調査・2020〜2024年':'家計調査・月次（2020〜2024年）'])assert.ok(body.includes(text),id+': '+text);

    if(id==='lighting'){
     for(const fact of ['1,293円','1,841円','42.4%','参加36社','同じ企業だけで集計し直した比較かどうかは確認できず','2026年11月18日'])assert.ok(body.includes(fact),fact);
    }
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
    for(const phrase of ['調査候補：利用量が増えたかは未確認','2025年9月〜2026年8月','3,693円','3,195円','15.6%','2026年6〜8月','782円','540円','44.8%','購入しなかった世帯も含む平均','2025年の支出は3,273円','2019年の3,446円','5.0%','月次表示値の合計です','その年の公表値を足して暦年で比べると','電子レンジは別品目','この品目全体の価格変化を表せません','購入数量を推定していません','組合せの変化は未確認','2026年11月4日','最新の家計対象月は2026年8月'])assert.ok(cookingText.includes(phrase),phrase);
    for(const url of ["https://www.e-stat.go.jp/stat-search/file-download?fileKind=1&statInfId=000040270651","https://www.e-stat.go.jp/stat-search/file-download?fileKind=1&statInfId=000040270650","https://www.e-stat.go.jp/stat-search/file-download?fileKind=1&statInfId=000040270649","https://www.stat.go.jp/data/kakei/kou2025/zuhyou/kouh2025.xlsx","https://www.stat.go.jp/data/cpi/2025/kaisetsu/pdf/4-61.pdf"])assert.ok(await page.locator('#main a').evaluateAll((links,url)=>links.some(a=>a.href===url),url),url);
    await page.locator('#main').getByText('候補一覧に戻る',{exact:true}).first().click();
    await page.waitForFunction(()=>!!document.querySelector('#candidate-results'));
    await page.locator('#reset').click();
    assert.equal(await page.locator('#candidate-results article').count(),5);
    assert.equal(await page.locator('#card-results a.card').count(),18);
   }
   console.log(`PASS candidate display/search/source links/back/reset at ${viewport.width}: overseas travel, lighting and accommodation remain candidates`);
   for(const entry of data.editorial.cross_industry_entries){
    await page.goto(base+'#overview');
    await page.locator('#overview a[href="#question/'+entry.id+'"]').click();
    await page.waitForFunction(title=>document.getElementById('question-detail')?.innerText.includes(title),entry.title);
    const question=page.locator('#question-detail');
    assert.equal(await question.locator(':scope > h2').textContent(),entry.title);
    assert.equal(await question.locator(':scope > p').first().textContent(),entry.entry);
    const sections=text=>[...text.matchAll(/^## (.+)$/gm)].map(m=>m[1]);
    assert.deepEqual(await question.locator(':scope > .prose h2').allTextContents(),sections(entry.body));
    assert.deepEqual(await question.locator(':scope > details .prose h2').allTextContents(),sections(entry.text));
    assert.equal(await question.locator(':scope > article.observation').count(),entry.observations.length);

   }
   await page.goto(base);
   await page.screenshot({path:`browser-evidence/home-${viewport.width}.png`,fullPage:true});
   for(const memo of data.markets){
    await page.goto(base+'#markets/'+memo.id);
    await page.waitForFunction(title=>document.getElementById('main').innerText.includes(title),memo.title);
    assert.ok((await page.locator('#main').innerText()).includes('この記事の出典と確認範囲'));
    assert.equal(await page.locator('#main').getByText('調査記事の一覧に戻る',{exact:true}).count(),2);
   }
   for(const id of ['es-hotel','uk-video','us-electricity','in-upi']){
    await page.goto(base+'#global/'+id);
    const globalTitle=data.editorial.cards.find(c=>c.id===id).title;
    await page.waitForFunction(({id,title})=>location.hash==='#global/'+id && document.querySelector('#main h1')?.textContent===title,{id,title:globalTitle});
    assert.ok(await page.locator('#main a[href^="http"]').count()>0);
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'main','overseas article owns keyboard focus');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('href')),'#global-library');
    await page.keyboard.press('Enter');
    await page.locator('#global-library').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'main');
    await page.goBack();
    await page.waitForFunction(({id,title})=>location.hash==='#global/'+id && document.querySelector('#main h1')?.textContent===title,{id,title:globalTitle});
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'main');
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
    assert.equal(await card.locator('dt:has-text("元資料の該当箇所") + dd').innerText(),expected.source_locator);
    for(const source of expected.source_urls)assert.ok(await card.locator('a').evaluateAll((links,url)=>links.some(a=>a.getAttribute('href')===url),source),id+': source');
   }
   console.log('PASS repaired observation topics, sources, values and certainty at '+viewport.width);

   // Same periods do not make broad water-transport sales and coastwise cargo the same scope.
   await page.goto(base+'#question/money-and-quantity');
   await page.waitForFunction(()=>document.querySelector('#question-detail')?.innerText.includes('水運の売上は増加'));
   const waterBody=await page.locator('#question-detail').innerText();
   for(const phrase of ['2024年8月〜2025年7月','2025年8月〜2026年7月','7.92%','0.54%','0.03%減','対象が違う','2026年6〜7月売上には速報','内航船舶輸送統計月報'])assert.ok(waterBody.includes(phrase),phrase);
   const water=page.locator('#question-detail .observation').filter({has:page.getByRole('heading',{name:'日本：水運売上と内航貨物（対象範囲は異なる）',exact:true})});
   assert.equal(await water.count(),1);
   await water.locator('details > summary').click();
   const waterValues=await water.innerText();
   for(const phrase of ['6907853','7455227','296482','298097','149309','149258','売上増のうち価格が占める分は未確認','2026-10-23','2026-10-28','2026-11-09'])assert.ok(waterValues.includes(phrase),phrase);
   assert.ok(!waterValues.includes('9.23'));
   assert.equal(await page.locator('#observations > details').count(),21);
   assert.equal(await page.locator('#observations > h2').innerText(),'21観測の対象・根拠・確認範囲');
   const waterCsvLink=page.locator('#question-detail a[href="https://mixidota2.github.io/gtm-factory-viewer/data/water-quantity/2026-11-09/monthly.csv"]');
   assert.equal(await waterCsvLink.count(),2); // body plus collapsed full-text copy
   assert.equal(await waterCsvLink.filter({visible:true}).count(),1);
   const csvHref=await waterCsvLink.first().getAttribute('href');
   const csvRoute=new URL(csvHref).pathname.replace(/^\/gtm-factory-viewer\//,'');
   const csvResponse=await page.request.get(new URL(csvRoute,base).href);
   assert.equal(csvResponse.status(),200,'monthly data link must resolve to an existing file');
   assert.match(csvResponse.headers()['content-type'],/^text\/csv/);
   assert.deepEqual(await csvResponse.body(),fs.readFileSync(path.join(__dirname,'..',csvRoute)),'download must preserve the reviewed CSV bytes');
   assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth),'water supplement must not overflow');
   await water.scrollIntoViewIfNeeded();
   await page.screenshot({path:`browser-evidence/water-quantity-${viewport.width}.png`});
   await page.goto(base);
   await page.locator('#editorial-search').fill('内航');
   const waterResult=page.locator('#observation-results a[href="#observation/jp-water-sales-coastwise-quantity"]');
   assert.equal(await waterResult.count(),1);
   await waterResult.click();
   await page.waitForFunction(()=>document.getElementById('observation-jp-water-sales-coastwise-quantity')?.open===true);
   await page.locator('#editorial-reset').click();
   assert.equal(await page.locator('#card-results a.card').count(),18);
   assert.equal(await page.locator('[data-theme]').count(),5);
   console.log('PASS water supplement, sources, monthly data link, search/route and unchanged theme/article counts at '+viewport.width);
   for(const query of ['jp-water-sales-coastwise-quantity','2026-11-09 000040521357']){
    await page.locator('#editorial-search').fill(query);
    const result=page.locator('#observation-results a[href="#observation/jp-water-sales-coastwise-quantity"]');
    assert.equal(await result.count(),1,'metadata search must find the original observation');
    await result.click();
    await page.waitForFunction(()=>document.getElementById('observation-jp-water-sales-coastwise-quantity')?.open===true);
    assert.ok((await page.locator('#observation-jp-water-sales-coastwise-quantity').innerText()).includes('2026-11-09'));
    await page.locator('#editorial-reset').click();
    assert.equal(await page.locator('#observation-results a').count(),0);
    assert.equal(await page.locator('#card-results a.card').count(),18);
   }
   console.log('PASS observation metadata search, original detail route and reset at '+viewport.width);
   // Keyboard navigation must continue at the selected observation, not at search results.
   await page.goto(base);
   await page.locator('#editorial-search').fill('2026-11-09 000040521357');
   const observationLink=page.locator('#observation-results a');
   await observationLink.focus();
   await page.keyboard.press('Enter');
   await page.waitForFunction(()=>document.activeElement===document.querySelector('#observation-jp-water-sales-coastwise-quantity > summary'));
   assert.equal(await page.locator('#observation-jp-water-sales-coastwise-quantity').getAttribute('open'),'');
   await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement.closest('details')?.id),'observation-jp-water-sales-coastwise-quantity');
   await page.goBack();
   await page.waitForFunction(()=>!location.hash);
   assert.equal(await page.locator('#editorial-search').inputValue(),'2026-11-09 000040521357');
   await page.goForward();
   await page.waitForFunction(()=>document.activeElement===document.querySelector('#observation-jp-water-sales-coastwise-quantity > summary'));
   await page.reload();
   await page.waitForFunction(()=>document.activeElement===document.querySelector('#observation-jp-water-sales-coastwise-quantity > summary'));
   console.log('PASS observation keyboard focus, in-detail Tab, Back/Forward and direct reload at '+viewport.width);
   // Same-hash re-selection must reopen a manually closed detail and refocus it.
   const observationSummary=page.locator('#observation-jp-water-sales-coastwise-quantity > summary');
   for(const method of ['keyboard','pointer']){
    await observationSummary.click();
    assert.equal(await page.locator('#observation-jp-water-sales-coastwise-quantity').getAttribute('open'),null);
    await page.locator('#editorial-search').fill('000040521357');
    if(method==='keyboard')await page.locator('#observation-results a').press('Enter');
    else await page.locator('#observation-results a').click();
    await page.waitForFunction(()=>document.activeElement===document.querySelector('#observation-jp-water-sales-coastwise-quantity > summary'));
    assert.equal(await page.locator('#observation-jp-water-sales-coastwise-quantity').getAttribute('open'),'');
    assert.equal(await page.locator('#editorial-search').inputValue(),'000040521357');
   }
   console.log('PASS same-observation keyboard/pointer re-selection reopens detail and preserves query at '+viewport.width);



   // Explicit permalinks reproduce filters, without putting each keystroke into the URL.
   await page.goto(base);
   await page.locator('#search').fill('ケアプラン');
   await page.locator('#filter').selectOption('2');
   await page.locator('#kind').selectOption('regular');
   assert.equal(new URL(page.url()).search,'');
   const expectedSearchCount=await page.locator('#card-results a.card').count();
   assert.ok(expectedSearchCount>0);
   await page.locator('[data-search-link="#library"]').click();
   assert.equal(new URL(page.url()).searchParams.get('q'),'ケアプラン');
   assert.equal(await page.locator('#search').inputValue(),'ケアプラン');
   assert.equal(await page.locator('#editorial-search').inputValue(),'ケアプラン');
   assert.equal(await page.locator('#filter').inputValue(),'2');
   assert.equal(await page.locator('#kind').inputValue(),'regular');
   assert.equal(await page.locator('#card-results a.card').count(),expectedSearchCount);
   await page.reload();
   assert.equal(await page.locator('#search').inputValue(),'ケアプラン');
   const sharedArticleTitle=await page.locator('#card-results a.card h3').first().innerText();
   await page.locator('#card-results a.card').first().click();
   await waitForArticle(page,sharedArticleTitle);
   await page.goBack();
   await page.locator('#search').waitFor({state:'visible'});
   assert.equal(await page.locator('#search').inputValue(),'ケアプラン');
   assert.equal(await page.locator('#filter').inputValue(),'2');
   assert.equal(await page.locator('#kind').inputValue(),'regular');
   await page.goForward();
   await waitForArticle(page,sharedArticleTitle);
   await page.goBack();
   await page.locator('#search').waitFor({state:'visible'});
   assert.equal(await page.locator('#card-results a.card').count(),expectedSearchCount);
   await page.locator('#reset').click();
   await page.locator('[data-search-link="#library"]').click();
   assert.equal(new URL(page.url()).search,'');
   assert.equal(await page.locator('#card-results a.card').count(),18);
   await page.goto(base+'?q=000040521357&filter=invalid&kind=invalid#questions');
   assert.equal(await page.locator('#global-results a').count(),0);
   assert.equal(await page.locator('#global-results').innerText(),'検索語に合う海外記事はありません。検索語に合う個別の調査結果（観測）があれば、下に表示します。');
   assert.equal(await page.locator('#filter').inputValue(),'all');
   assert.equal(await page.locator('#kind').inputValue(),'all');
   assert.equal(await page.locator('#observation-results a').count(),1);
   await page.locator('[data-search-link="#questions"]').click();
   assert.equal(new URL(page.url()).searchParams.get('filter'),null);
   assert.equal(new URL(page.url()).searchParams.get('kind'),null);
   assert.equal(await page.locator('#observation-results a').count(),1);
   console.log('PASS explicit search permalinks, filter/query reload, reset and invalid values at '+viewport.width);

   // Overview-only matches must link to the overview even when no article or theme claim matches.
   await page.goto(base);
   await page.locator('#search').fill('レンタカー');
   assert.equal(await page.locator('#card-results a.card').count(),0);
   assert.equal(await page.locator('#claim-results article').count(),0);
   assert.equal(await page.locator('#card-results .empty').innerText(),'条件に合う国内の調査記事はありません。概要には関連する記述があります。上のリンクから読めます。');
   const overviewOnly=page.locator('#claim-results').getByRole('link',{name:'検索語を含む概要全文を読む',exact:true});
   assert.equal(await overviewOnly.count(),1);
   await overviewOnly.click();
   await page.waitForFunction(()=>document.querySelector('#overview')?.open);
   assert.ok((await page.locator('#overview').innerText()).includes('レンタカー'));
   await page.locator('#reset').click();
   assert.equal(await page.locator('#card-results a.card').count(),18);

   await page.goto(base);
   for(const query of ['718,854','1,833,150','2026年8月速報']){
    await page.locator('#search').fill(query);
    assert.equal(await page.locator('#card-results a.card').count(),1);
    await page.locator('#card-results a[href="#markets/jp-merihari-consumption.md"]').click();
    await page.waitForFunction(()=>document.querySelector('#main h1')?.textContent.includes('2026年7月'));
    const article=await page.locator('#main').innerText();
    for(const phrase of ['追記：2026年8月','確認記録の日付：2026年10月23日。ここからは同日公表の速報','718,854','1,833,150','+2.3%','+3.7%','客数や実質利用量を測った値ではありません。','前月比ではありません','速報・丸め値','全34業種','元記事と既存4主張の確認状況は変更していません'])assert.ok(article.includes(phrase),phrase);
    assert.equal(await page.locator('#main details.claim-evidence').count(),6);
    assert.equal(await page.locator('#main a[href="https://www.stat.go.jp/data/mbss/kekka/pdf/m202608.pdf#page=4"]').count(),1);
    assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth));
    await page.screenshot({path:'browser-evidence/august-'+viewport.width+'.png',fullPage:true});
    await page.locator('#main').getByText('調査記事の一覧に戻る',{exact:true}).first().click();
    await page.locator('#reset').click();
    assert.equal(await page.locator('#card-results a.card').count(),18);
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
    for(const source of [...new Set(data.claims.filter(c=>c.claim_id.startsWith('jp-aircon-rebound-divergence-')).flatMap(c=>c.source_urls))])assert.ok(await page.locator('#main a').evaluateAll((links,url)=>links.some(a=>a.getAttribute('href')===url),source),source);
    assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth),'aircon article must not overflow');
    if(query==='エアコン')await page.screenshot({path:'browser-evidence/aircon-'+viewport.width+'.png',fullPage:true});
    await page.locator('#main').getByText('調査記事の一覧に戻る',{exact:true}).first().click();
    await page.locator('#reset').click();
    assert.equal(await page.locator('#card-results a.card').count(),18);
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
   assert.equal(await page.locator('#evidence-title').innerText(),"保育ICTと電子処方箋の導入率");
   assert.equal(await page.locator('.evidence > .section-head > p').innerText(),"保育ICTと電子処方箋の2例を掲載しています。対象となる施設と、割合を計算するときの分母が異なるため、どちらの導入が進んでいるかを比べる図ではありません。");
   const nurseryChart=page.locator('figure.chart').nth(0);
   const nurserySummary=nurseryChart.locator(':scope > details > summary');
   assert.equal(await nurserySummary.innerText(),"割合の計算方法・出典・確認範囲を読む");
   await nurserySummary.click();
   const nurseryFacts=await nurseryChart.innerText();
   assert.ok(nurseryFacts.includes("割合は有効回答の16,709施設に対するものです。問9①への回答が不明の施設も含みます。全国のすべての施設に対する割合ではありません。"));
   assert.ok(nurseryFacts.includes("同じ施設が複数の機能を導入した場合、それぞれの機能で数えます。数字は導入済みの割合です。導入率がどれだけ伸びたか、実際に使った割合、時間をどれだけ削減したかは示していません。"));
   const chart=page.locator('figure.chart').nth(1);
   assert.ok((await chart.innerText()).includes('2026年9月'));
   assert.deepEqual(await chart.locator('.bar-label strong').allTextContents(),['91.8%','32.2%','22.0%','12.1%']);
   await chart.locator(':scope > details > summary').click();
   const facts=await chart.innerText();
   assert.ok(facts.includes("2026年9月の最後の日曜日時点の状況です。施設の種類ごとに、オンライン資格確認を導入した施設を分母にしています。同じ施設を継続して追った結果でも、全医療機関を数えた結果でもありません。処方箋を実際に電子発行した割合でもありません。"));
   for(const phrase of ['2026年10月16日更新','26,717／83,069','55,874／60,866','1,738／7,910','7,291／60,271','F14:H14','48行672セル','進捗を示す3セルは空欄だった値が補われていました','表のすべてのセルに変更がなかったことは確認できません'])assert.ok(facts.includes(phrase),phrase);
   assert.equal(await chart.locator('a[href*="20261016_resources"]').count()>0,true);
   await chart.locator('figcaption a').click();
   await page.waitForFunction(()=>document.querySelector('#main h1')?.textContent.includes('紙の登録と比べるには何を見る？'));
   for(const query of ['電子処方箋','692,818','jp-e-prescription-clinic-lag-observation']){
    await page.goto(base);await page.locator('#search').fill(query);
    await page.locator('#card-results a[href="#markets/jp-e-prescription-clinic-lag.md"]').click();
    await page.waitForFunction(()=>document.querySelector('#main h1')?.textContent.includes('紙の登録と比べるには何を見る？'));
    const article=await page.locator('#main').innerText();
    for(const phrase of ['692,818件','15,294,344件','653,972件','14,102,630件','登録する主体も段階も異なり','同じ施設を固定して追った導入率ではありません','支払額','紙処方箋、引換番号付き紙、既存医療システム','全セル不変とはせず'])assert.ok(article.includes(phrase),phrase);
    assert.equal(await page.locator('#main details.claim-evidence').count(),4);
    for(const source of data.claims.find(c=>c.claim_id===epPrefix+'observation').source_urls)assert.ok(await page.locator('#main a').evaluateAll((links,url)=>links.some(a=>a.getAttribute('href')===url),source),source);
    assert.equal(await page.locator('#main a[href="#markets/jp-dental-ehr-rececon-gap.md"]').count()>0,true);
    assert.ok(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth));
    if(query==='電子処方箋')await page.screenshot({path:'browser-evidence/eprescription-'+viewport.width+'.png',fullPage:true});
    await page.locator('#main').getByText('調査記事の一覧に戻る',{exact:true}).first().click();
    await page.locator('#reset').click();assert.equal(await page.locator('#card-results a.card').count(),18);
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
   assert.equal(await page.locator('#card-results a.card').count(),18);
   assert.equal(await page.locator('#card-results a[href="#markets/jp-e-prescription-clinic-lag.md"]').count(),1);
   await page.goto(base+'#claim/'+epPrefix+'observation');
   const detail=page.locator('#claim-'+epPrefix+'observation');await detail.waitFor({state:'visible'});assert.equal(await detail.evaluate(el=>el.open),true);
   assert.ok((await detail.innerText()).includes('対象系列で、CSVとXLSXに保存された値を照合'));
   console.log('PASS September electronic-prescription card/chart/cells/sources/search/filter/back at '+viewport.width);

   assert.deepEqual(errors,[]);
   await page.goto(base+'#markets/jp-care-layers-not-one.md');
   const careTitle=data.markets.find(m=>m.id==='jp-care-layers-not-one.md').title;
   await waitForArticle(page,careTitle);
   const careArticle=await page.locator('#main').innerText();
   assert(careArticle.includes('同一施設での変化とは判断できません'));assert(!careArticle.includes('ただし、同じ施設を追跡した結果ではありません。'));
   assert(careArticle.includes('無回答は2.8%'));assert(careArticle.includes('パソコンによる介護ソフト'));
   assert(await page.locator('#main a[href*="R6_jittai_chousa_jigyousyo_shiryo2.pdf"]').count()>0);
   await page.locator('#main').getByText('調査記事の一覧に戻る',{exact:true}).first().click();
   await page.locator('#search').fill('介護');
   await page.locator('#card-results a[href="#markets/jp-care-layers-not-one.md"]').click();await waitForArticle(page,careTitle);
   for(const suffix of ['observation','interpretation','value_hypothesis','judgment_change']){
    await page.goto(base+'#claim/jp-care-layers-not-one-'+suffix);
    await waitForClaim(page,'jp-care-layers-not-one-'+suffix);
    const careCard=page.locator('#claim-jp-care-layers-not-one-'+suffix);await careCard.waitFor({state:'visible'});
    const cardText=await careCard.innerText();
    for(const phrase of ['公表資料編72頁の問15①の質問文・選択肢と集計値を確認しました。','2026-11-08','空欄の原調査票','問15②'])assert(cardText.includes(phrase));
    assert(await careCard.evaluate(el=>el.open));
   }
   assert(await page.locator('html').evaluate(el=>el.scrollWidth<=innerWidth));
   assert.deepEqual(errors,[]);
   for(const [claimId,expected] of [['theme-4-text','PDF6頁'],['jp-construction-apps-dont-stick-observation','n=136']]){
    await page.goto(base+'#claim/'+claimId);
    await waitForClaim(page,claimId);
    const card=page.locator('#claim-'+claimId);await card.waitFor({state:'visible'});
    assert((await card.innerText()).includes(expected));
   }
   assert.deepEqual(errors,[]);
   await page.close();
   console.log(`PASS protected Chromium ${viewport.width}x${viewport.height}: themes, insurance/overview search, reset, 17 memo routes, comparison, claims, 4 global articles, 3 questions, no console/page errors`);
  }
 } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});


