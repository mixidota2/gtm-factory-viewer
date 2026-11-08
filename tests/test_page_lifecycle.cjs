// Execute the real post-care tail with a deterministic page double. No socket/browser.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/browser.cjs','utf8');
const start=source.indexOf("   assert(await page.locator('html').evaluate",source.indexOf('const careArticle='));
const end=source.indexOf('\n  }\n } finally',start);assert(start>0&&end>start);
async function exercise(inject){
 let closed=false;const visited=[],errors=[];
 const page={goto:async url=>{assert(!closed,'page used after close');visited.push(url);if(inject&&url.includes('construction'))errors.push('synthetic late page error');},close:async()=>{closed=true;},waitForFunction:async()=>{assert(!closed);},locator:s=>({evaluate:async()=>true,waitFor:async()=>{assert(!closed);},innerText:async()=>s.includes('theme-4')?'PDF6頁':'n=136'})};
 await vm.runInNewContext('(async()=>{'+source.slice(start,end)+'})()',{page,errors,waitForClaim:require('./wait_for_route.cjs').waitForClaim,assert:Object.assign((...args)=>assert(...args),{deepEqual:(a,b)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)))}),base:'test:',viewport:{width:100,height:100},console:{log(){}}});
 assert.equal(visited.length,2);assert(closed);return visited;
}
(async()=>{await exercise(false);await assert.rejects(()=>exercise(true),/synthetic late page error/);console.log('PASS real post-care tail: two cards before close; late errors rejected');})().catch(e=>{console.error(e);process.exitCode=1});
