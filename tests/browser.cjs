const { chromium } = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const beforeFonts=process.argv.includes('--font-before');
const { createHash } = require('node:crypto');
const html = fs.readFileSync('index.html');
assert.equal(createHash('sha256').update(html).digest('hex'), '301d309c50ad1f66d3eacbe9f46ed5ee1c6260f0b397ae739c9c1179e99e390b');
const data = JSON.parse(html.toString().match(/<script id="snapshot-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.equal(data.markets.length,16);
assert.equal(data.claims.length,92);

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
   assert.equal(await page.locator('[id^="claim-"][class="claim-evidence"]').count(),92);
   assert.equal(await page.locator('#main').evaluate(el=>new Set([...el.querySelectorAll('[id]')].map(n=>n.id)).size === el.querySelectorAll('[id]').length),true);
   assert.equal(await page.locator('#result-count').innerText(),'16記事のうち16記事を表示しています');
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
   assert.deepEqual(errors,[]);
   await page.close();
   console.log(`PASS protected Chromium ${viewport.width}x${viewport.height}: themes, insurance/overview search, reset, 16 memo routes, comparison, claims, 4 global articles, 3 questions, no console/page errors`);
  }
 } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
