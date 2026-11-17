const fs=require('fs'),assert=require('assert/strict');
module.exports=function(candidate){
 const html=fs.readFileSync(candidate,'utf8'),d=JSON.parse(html.match(/<script id="snapshot-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 const id='jp-fastfood-customer-count';const m=d.markets.filter(x=>x.id===id+'.md');assert.equal(m.length,1);assert.equal(m[0].proxy_map,false);
 const c=d.claims.filter(x=>x.claim_id===id+'-observation');assert.equal(c.length,1);assert.equal(c[0].text,m[0].summary);
 for(const phrase of ['52社・21,922店','3.0%増','2.5%、2.2%、3.6%、3.5%','105.6%、104.9%、103.3%、106.9%、106.1%、102.2%、103.9%、103.7%、103.4%','全国市場全体','既存店の成長率にはできません','単純平均','個票'])assert(m[0].text.includes(phrase),phrase);
 assert.equal(fs.readFileSync(require('path').join(__dirname,'../data/fastfood-customer-count/README.md'),'utf8'),m[0].text);
 assert.equal(c[0].source_urls.length,2);c[0].source_urls.forEach(url=>assert(m[0].text.includes(url)));
 console.log('PASS fastfood scope, values, uniqueness, sources and article parity');
};
