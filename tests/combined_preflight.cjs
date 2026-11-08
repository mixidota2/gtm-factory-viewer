const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
module.exports=function(candidate){
 require('./candidate_preflight.cjs')(path.join(__dirname,'fixtures/care-candidate.html'));
 const html=fs.readFileSync(candidate,'utf8');assert.equal(crypto.createHash('sha256').update(html).digest('hex'),'2a8a0dd50e5475db83dad8151d93fc2835738dfb885cea70f20e8cb97ab856ad','Combined candidate moved; regenerate and independently review expected content');
 const d=JSON.parse(html.match(/<script id="snapshot-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 const construction=d.claims[16],market=d.markets[4],security=d.claims.find(c=>c.claim_id==='theme-4-text');
 assert.equal(construction.text,market.summary);assert(market.text.includes(construction.text));assert(construction.text.includes('136件の回答'));assert(security.source_urls.some(u=>u.endsWith('r5keibigyougaikyou.pdf#page=6')));assert(!JSON.stringify(security).includes('印刷5頁'));
 require('child_process').execFileSync(process.execPath,[path.join(__dirname,'test_card.cjs'),candidate],{stdio:'inherit'});
 console.log('PASS combined fixed-content contract, construction displays, security sources');return html;
};
