const assert=require('node:assert/strict'),vm=require('node:vm');
const {articleReady,claimReady,waitForArticle,waitForClaim}=require('./wait_for_route.cjs');
function evaluate(fn,arg,document) {
 return vm.runInNewContext('('+fn.toString()+')(arg)',{arg,document});
}
const title='介護の記事';
const documentWithHeadings=names=>({querySelectorAll:()=>names.map(textContent=>({textContent}))});
assert.equal(evaluate(articleReady,title,documentWithHeadings(['ホーム','概要','比較','調査'])),false);
assert.equal(evaluate(articleReady,title,documentWithHeadings([])),false);
assert.equal(evaluate(articleReady,title,documentWithHeadings(['別の記事'])),false);
assert.equal(evaluate(articleReady,title,documentWithHeadings([title,title])),false);
assert.equal(evaluate(articleReady,title,documentWithHeadings([title])),true);
for(const open of [undefined,false,true]) {
 assert.equal(evaluate(claimReady,'care',{getElementById:id=>id==='claim-care'&&open!==undefined?{open}:null}),open===true);
}
(async()=>{
 const calls=[];
 const page={waitForFunction:async(fn,arg)=>calls.push([fn,arg])};
 await waitForArticle(page,title);await waitForClaim(page,'care');
 assert.deepEqual(calls,[[articleReady,title],[claimReady,'care']]);
 console.log('PASS route readiness: stale/multiple headings rejected; destination heading and expanded claim required');
})().catch(e=>{console.error(e);process.exitCode=1});
