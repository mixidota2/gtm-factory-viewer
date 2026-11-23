const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.join(__dirname,'..','data','demand-archive','2026-11-07');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));
const seen=new Set();
assert.equal(catalog.files.length,catalog.file_count_excluding_catalog);
for(const entry of catalog.files){
 assert.equal(typeof entry.path,'string');
 assert(!path.isAbsolute(entry.path)&&!entry.path.split('/').includes('..'),'catalog path escapes archive');
 assert(!seen.has(entry.path),'duplicate catalog path');seen.add(entry.path);
 const bytes=fs.readFileSync(path.join(root,entry.path));
 assert.equal(bytes.length,entry.bytes,entry.path+' byte count');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.path+' hash');
 if(entry.editorial_previous_sha256!==undefined){
  assert.match(entry.editorial_previous_sha256,/^[0-9a-f]{64}$/);
  assert.equal(entry.editorial_revision_date,'2026-11-18');
 }
}
const coffee=catalog.files.find(e=>e.path==='artifacts/series/2026-10-16/coffee-05/report.md');
assert.deepEqual(coffee.editorial_later_revisions,[{
 date:'2026-11-23',previous_bytes:2824,previous_sha256:'44e59586b0623fc668a3b448036ff02230253247b98a992b573b17b4b4cdfea2'
}]);
assert.equal(coffee.editorial_previous_sha256,'a3c5f2cb13e79ff4865403fb074f39e00b35d6e380067a56933b806d5af886d4');
const archivedMethods=[
  [
    "historical/research-method.md",
    "3d07ca178a7362090ea521529fe1671b29abb98601e43e24b357027db8d54e09",
    {
      "date": "2026-11-23",
      "previous_bytes": 1107,
      "previous_sha256": "f51d0b7fa7e6c32ff761707bbfaf5f16d99f035e00dd2b0ecf845527b7d01bb3"
    }
  ],
  [
    "historical/interpretation-limitations.md",
    "d716ac646736f355535993f5808f47390d2a39039ca309d76c019b8b000fa44a",
    {
      "date": "2026-11-23",
      "previous_bytes": 2160,
      "previous_sha256": "0c7cfba66fff7878e5cda490143b00964e7e1afdc4e6066ed2a19c3bcc3eb286"
    }
  ]
];
for(const [file,originalHash,earlier] of archivedMethods){
 const entry=catalog.files.find(e=>e.path===file);
 assert.equal(entry.editorial_previous_sha256,originalHash);
 assert.deepEqual(entry.editorial_later_revisions,[earlier]);
}
const archivedPurchaseComparisons=[
  [
    "README.md",
    "dfd8e449d7d037c25341ec7772d6ae1ca2d0ef08c0901cb2dc01af33f9add0b4",
    {
      "date": "2026-11-23",
      "previous_bytes": 5208,
      "previous_sha256": "396e772bcdac358f029b2ef0c8d2f6153cfc656f4e07bb9e6e282ee837f5af61"
    }
  ],
  [
    "markets/lighting.md",
    "87af3dfa77498069ae52612926694ac1e84dbc25ea06a4fb925a09493046c671",
    {
      "date": "2026-11-23",
      "previous_bytes": 2403,
      "previous_sha256": "8944d4fc121fd4649fa4ab3543a1537b6eb30ef9e31ae31db413c66b7238df9f"
    }
  ],
  [
    "markets/foreign-package-travel.md",
    "b5cf3b62907c7eeb4c1f436bfbc9b24bb0e0dc9fb9e6d50fbce63c6d014d023f",
    {
      "date": "2026-11-23",
      "previous_bytes": 2929,
      "previous_sha256": "46a512d2bb99c4f111a19d3d4240076a41cafd417a6a392a0d656bc712630c9b"
    }
  ]
];
for(const [file,originalHash,earlier] of archivedPurchaseComparisons){
 const entry=catalog.files.find(e=>e.path===file);
 assert.equal(entry.editorial_previous_sha256,originalHash);
 assert.deepEqual(entry.editorial_later_revisions,[earlier]);
}
console.log('PASS archive catalog: '+seen.size+' unique paths, exact bytes and SHA-256');
