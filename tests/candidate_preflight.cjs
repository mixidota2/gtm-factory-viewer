const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
module.exports=function(candidate){
 const repo=path.resolve(__dirname,'fixtures'),base=fs.readFileSync(path.join(repo,'historical-index.html'),'utf8'),html=fs.readFileSync(candidate,'utf8');
 // Execute all original historical/static assertions against original bytes, without starting a browser.
 const originalTest=fs.readFileSync(path.join(repo,'historical-browser.cjs'),'utf8');
 const boundary=originalTest.indexOf('async function recordFonts(');assert(boundary>0);
 const fixtureRequire=name=>name==='playwright'?{}:name==='node:fs'?{...fs,readFileSync:(p,...args)=>fs.readFileSync(p==='index.html'?path.join(repo,'historical-index.html'):p,...args)}:require(name);
 vm.runInNewContext(originalTest.slice(0,boundary),{require:fixtureRequire,process,console,Buffer,URL},{filename:'historical-static-tests.cjs'});
 const split=s=>{const m=s.match(/(<script id="snapshot-data" type="application\/json">)([\s\S]*?)(<\/script>)/);assert(m);return {data:JSON.parse(m[2]),outside:s.replace(m[2],'SNAPSHOT')}};
 const a=split(base),b=split(html);assert.equal(a.outside,b.outside);
 const differences=[];function walk(x,y,p=''){if(JSON.stringify(x)===JSON.stringify(y))return;if(x&&y&&typeof x==='object'&&typeof y==='object'&&!Array.isArray(x)&&!Array.isArray(y)){for(const k of new Set([...Object.keys(x),...Object.keys(y)]))walk(x[k],y[k],p+'/'+k)}else differences.push(p)}
 const mid='jp-care-layers-not-one.md',prefix='jp-care-layers-not-one-';
 for(const key of Object.keys(a.data))if(!['markets','claims'].includes(key))assert.deepEqual(b.data[key],a.data[key]);
 assert.equal(b.data.markets.length,17);assert.equal(b.data.claims.length,97);
 a.data.markets.forEach((x,i)=>{assert.equal(b.data.markets[i].id,x.id);walk(x,b.data.markets[i],'/market/'+x.id)});
 a.data.claims.forEach((x,i)=>{assert.equal(b.data.claims[i].claim_id,x.claim_id);walk(x,b.data.claims[i],'/claim/'+x.claim_id)});
 const expected=['/market/'+mid+'/summary','/market/'+mid+'/text','/claim/'+prefix+'observation/text','/claim/'+prefix+'observation/source_urls','/claim/'+prefix+'observation/source_locators'];
 for(const suffix of ['observation','interpretation','value_hypothesis','judgment_change'])for(const field of ['read_scope','unread','prior_unread','supplemental_scope_review'])expected.push('/claim/'+prefix+suffix+'/verification/'+field);
 assert.deepEqual(differences.sort(),expected.sort());
 const market=b.data.markets.find(x=>x.id===mid),claim=b.data.claims.find(x=>x.claim_id===prefix+'observation');assert.equal(market.summary,claim.text);assert(market.text.includes(claim.text));
 assert(!JSON.stringify(b.data).includes('ただし、同じ施設を追跡した結果ではありません。'));
 for(const expectedText of ['同一施設での変化とは判断できません','76.4%','82.8%','72.2%','65.6%','パソコンによる介護ソフト','無回答は2.8%'])assert(claim.text.includes(expectedText));
 const url='https://www.kaigo-center.or.jp/content/files/report/R6_jittai_chousa_jigyousyo_shiryo2.pdf';assert(claim.source_urls.includes(url));assert(market.text.includes(url));assert.deepEqual(claim.source_locators.at(-1).pdf_pages,[72]);
 execFileSync(process.execPath,[path.join(__dirname,'test_card.cjs'),candidate],{stdio:'inherit'});
 console.log('PASS original historical assertions + candidate independent expectations + 21-path allowlist');return html;
};
if(require.main===module)module.exports(path.resolve(process.argv[2]));
