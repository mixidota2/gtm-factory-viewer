const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.argv[2],'utf8');
const data=JSON.parse(html.match(/<script id="snapshot-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const names=['const esc=','function link(','const claimLabels=','function locatorDetails(','function claimCard('];
const code=names.map(n=>{const lines=html.split('\n').filter(l=>l.startsWith(n));assert.equal(lines.length,1);return lines[0]}).join('\n');
const scope='公表資料編72頁の問15①の質問文・選択肢と集計値を確認しました。';
for(const claim of data.claims.filter(c=>c.claim_id.startsWith('jp-care-layers-not-one-'))){
 const context={claim};vm.createContext(context);const card=vm.runInContext(code+'\nclaimCard(claim,true)',context);
 assert(card.includes(scope),'New scope absent from rendered card: '+claim.claim_id);
 assert(card.includes('2026-11-08'));assert(card.includes('空欄の原調査票'));assert.equal(claim.verification.checked_this_pass,false);
 const hostile=structuredClone(claim);hostile.verification.read_scope+='<script>alert(1)</script>';context.claim=hostile;
 const escaped=vm.runInContext('claimCard(claim,true)',context);assert(escaped.includes('&lt;script&gt;'));assert(!escaped.includes('<script>'));
}
console.log('PASS actual claimCard: 4 limited scopes, dates, unknowns, escaping');
