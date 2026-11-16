const assert=require('node:assert/strict'),http=require('node:http');
const fs=require('node:fs'),path=require('node:path');
const handler=require('./static_server.cjs');
const root=path.resolve(__dirname,'..');
(async()=>{
 const html=Buffer.from('<!doctype html><title>Fixture</title>');
 const server=http.createServer(handler(html,root));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base=`http://127.0.0.1:${server.address().port}`;
  for(const route of ['/','/index.html']){
   const response=await fetch(base+route);assert.equal(response.status,200);
   assert.match(response.headers.get('content-type'),/^text\/html/);
   assert.deepEqual(Buffer.from(await response.arrayBuffer()),html);
  }
  const route='/data/water-quantity/2026-11-09/monthly.csv';
  const response=await fetch(base+route);assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),/^text\/csv/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),fs.readFileSync(path.join(root,route)));
  for(const route of ['/missing.csv','/tests/browser.cjs','/data/water-quantity/2026-11-09/missing.csv']){
   const response=await fetch(base+route);assert.equal(response.status,404);
   assert.equal(await response.text(),'Not found');
  }
  console.log('PASS real HTTP: HTML routes, exact CSV bytes/type, missing/private paths return 404');
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
