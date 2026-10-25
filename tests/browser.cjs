const { chromium } = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const beforeFonts=process.argv.includes('--font-before');
const { createHash } = require('node:crypto');
const html = fs.readFileSync('index.html');
assert.equal(createHash('sha256').update(html).digest('hex'), 'fb8778912c44e5b13abf4246239746591a4bb075579827b4685cb105b70f686e');
const data = JSON.parse(html.toString().match(/<script id="snapshot-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.equal(data.markets.length,16);
assert.equal(data.claims.length,94);
assert.equal(data.editorial.observations.length,20);
assert.equal(createHash('sha256').update(JSON.stringify(data)).digest('hex'), "252454727553ace3f51b0df58f69b9af384f8cf08f71c0267ac830a6716b4997");


const sha256=value=>createHash('sha256').update(value).digest('hex');
assert.equal(sha256(JSON.stringify(data.claims.slice(0,92))), '13dc4876a04db44e90a785546e8015d9e41bddcc2f7caf3ee4469e659794aabd');
const restored=JSON.parse(JSON.stringify(data));
const target=restored.markets.find(m=>m.id==='jp-merihari-consumption.md');
const marker='\n## 追記：2026年8月の売り手側売上（速報・2026年10月23日公表）';
assert.equal(target.text.split(marker).length,2);
target.text=target.text.split(marker)[0];restored.claims=restored.claims.slice(0,92);
assert.equal(sha256(JSON.stringify(restored)), '3da87d0c2b0cc3bcf331b243487844e73b5428273a8d712b236f2785a4078c46');
assert.deepEqual(data.claims.slice(92).map(c=>c.claim_id),['jp-merihari-consumption-seller-2026-08-lodging','jp-merihari-consumption-seller-2026-08-restaurants']);
for(const c of data.claims.slice(92)){
 assert.deepEqual(c.source_urls,['https://www.stat.go.jp/data/mbss/kekka/pdf/m202608.pdf']);
 assert.deepEqual(c.source_locators[0].pdf_pages,[4]);
 assert.equal(c.verification.checked_this_pass,false);
 assert.equal(c.verification.inherited_targeted_audit,true);
 assert.deepEqual(c.periods,['2025年8月（前年同月比の比較対象）','2026年8月（速報）']);
}

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
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
   const page=await browser.newPage({viewport});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await page.goto(base);
   await recordFonts(page,viewport.width);
   if(beforeFonts){await page.close();continue;}
   assert.equal(await page.locator('#card-results a.card').count(),16);
   for(const theme of data.themes){
    await page.locator(`[data-theme="${theme.id}"]`).click();
    assert.ok((await page.locator('#theme-detail').innerText()).includes(theme.title));
   }
   await page.locator('#search').fill('保険');
   assert.ok((await page.locator('#claim-results').innerText()).includes('掛け捨て保険'));
   await page.locator('#search').fill('zzzz-no-matching-memo');
   assert.equal(await page.locator('#card-results a.card').count(),0);
   await page.locator('#reset').click();
   assert.equal(await page.locator('#card-results a.card').count(),16);
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

   assert.equal(await page.locator('[id^="claim-"][class="claim-evidence"]').count(),94);
   assert.equal(await page.locator('#main').evaluate(el=>new Set([...el.querySelectorAll('[id]')].map(n=>n.id)).size === el.querySelectorAll('[id]').length),true);
   assert.equal(await page.locator('#result-count').innerText(),'16記事のうち16記事を表示しています');
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
    assert.equal(await page.locator('#card-results a.card').count(),16);
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

   assert.deepEqual(errors,[]);
   await page.close();
   console.log(`PASS protected Chromium ${viewport.width}x${viewport.height}: themes, insurance/overview search, reset, 16 memo routes, comparison, claims, 4 global articles, 3 questions, no console/page errors`);
  }
 } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
