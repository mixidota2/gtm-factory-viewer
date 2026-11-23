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
const archivedLateOctoberReports=[
  [
    "reports/daily-2026-10-29.md",
    "af6b27e707d00d0cf00ef2762ac6eff4177999e37d4fbb173015b7d290e11515",
    {
      "date": "2026-11-23",
      "previous_bytes": 1515,
      "previous_sha256": "c87dda6335040dbeaba99fea130e1d0f30bc50330d745d62b39dacd9f8ef0780"
    }
  ],
  [
    "reports/daily-2026-10-30.md",
    "37672e641a80c44c1a4cb164b69d9aa202e7cb2fed201e1282e5bfb6f6da08ae",
    {
      "date": "2026-11-23",
      "previous_bytes": 1654,
      "previous_sha256": "6a983df833fa3b1265458db6f0af6cc54988c77e39ed728ca9a7eb70ecde57c6"
    }
  ],
  [
    "reports/daily-2026-10-31.md",
    "5b542289b18f57dc47e6fbd88c5a1828165d2e2efd5740773e188af6c09b2dd9",
    {
      "date": "2026-11-23",
      "previous_bytes": 1829,
      "previous_sha256": "5e42e5749256c6256f019860c02b7e8abf730179d935c6acfe597e5f53932f56"
    }
  ]
];
for(const [file,originalHash,earlier] of archivedLateOctoberReports){
 const entry=catalog.files.find(e=>e.path===file);
 assert.equal(entry.editorial_previous_sha256,originalHash);
 assert.deepEqual(entry.editorial_later_revisions,[earlier]);
}
const archivedInstrumentsAndRepairs=[
  [
    "reports/2026-10-23.md",
    "966c06741f2aa4a2d0ba6b70caf2e8cdb1c67e9bf066278a0e3d746268666eb9",
    {
      "date": "2026-11-23",
      "previous_bytes": 3291,
      "previous_sha256": "8bbd1fc95089b666ebe7c937bf29d7748ea5395fe1c556223fd4cbc45d78af19"
    }
  ],
  [
    "reports/2026-10-24.md",
    "c2ad21e484b745b8b6e9ff0ce536da7eb16cc903341071d1300de48a4c80ce05",
    {
      "date": "2026-11-23",
      "previous_bytes": 3166,
      "previous_sha256": "e3f9bce78a38913a2dfae67ee1bd186214c424b0542b7da31fdb3c1ae4ecb5ed"
    }
  ]
];
for(const [file,originalHash,earlier] of archivedInstrumentsAndRepairs){
 const entry=catalog.files.find(e=>e.path===file);
 assert.equal(entry.editorial_previous_sha256,originalHash);
 assert.deepEqual(entry.editorial_later_revisions,[earlier]);
}
const archivedHighSchoolTutoring=[
  [
    "reports/2026-10-25.md",
    "9591aabe0a723b1907181ae17e1b92cd74762a8716f9d94b73613f8fa2bdf4a9",
    {
      "date": "2026-11-23",
      "previous_bytes": 4099,
      "previous_sha256": "af1554b4d434fafc6c2097e769a80fdd3b0a4bf984047b67c7dc98ebc52264f3"
    }
  ]
];
for(const [file,originalHash,earlier] of archivedHighSchoolTutoring){
 const entry=catalog.files.find(e=>e.path===file);
 assert.equal(entry.editorial_previous_sha256,originalHash);
 assert.deepEqual(entry.editorial_later_revisions,[earlier]);
}
const archivedSpending = [
  [
    "reports/daily-2026-10-28.md",
    "f23ef06a33c1fbae6215ffbb56a0f48ec0c0230d0c0e0fac35b4737c5968b806",
    {
      "date": "2026-11-24",
      "previous_bytes": 3550,
      "previous_sha256": "b8394bdd3132d2de42ddfe8bdccf403e48d9c53020e57f507ebe44d63d7720f0"
    },
    "31f49ff600654775685cef1a2b33a010f29a653c50412550704ae256fe2544e0"
  ],
  [
    "reports/daily-2026-11-01.md",
    "47a7c901a23cdb9ee76478dbda7a8f060890e85d31a1d8cec2a444fc7caec564",
    {
      "date": "2026-11-24",
      "previous_bytes": 2778,
      "previous_sha256": "bee5c93cda7eb082abf6e2c16d912399e761d39354bfe7af8d95b30057b9d5d0"
    },
    "bc6fd845118eafe25344da80f877710060a89c238d3021948175256666e2206a"
  ]
];
for(const [file,originalHash,previous,newHash] of archivedSpending){
 const entry=catalog.files.find(e=>e.path===file);
 assert.equal(entry.editorial_previous_sha256,originalHash);
 assert.deepEqual(entry.editorial_later_revisions,[previous]);
 assert.equal(entry.sha256,newHash);
}
const archivedMedicalReport=catalog.files.find(e=>e.path==='reports/daily-2026-10-27.md');
assert.equal(archivedMedicalReport.editorial_previous_sha256,'9ac32738245d72d9826e841afd785cf9a27231517229ccfd659fdb0dd2ab6eee');
assert.equal(archivedMedicalReport.editorial_previous_bytes,2334);
assert.deepEqual(archivedMedicalReport.editorial_later_revisions,[{
 date:'2026-11-24',previous_bytes:2355,previous_sha256:'89fa0a35e8c752ba77f248ad39059b7b975872014dabaa0cf365d486c9b5c208'
}]);
assert.equal(archivedMedicalReport.sha256,'285de7d15abf0cb7522580b043d72cc8f8a08926199d4b796c814b3888e582e0');
const archivedAirConditioning=catalog.files.find(e=>e.path==='reports/2026-10-26.md');
assert.equal(archivedAirConditioning.editorial_previous_sha256,'740640d6ae0ddca96294d44bf6cd454badb27cd3500a7052f43e946e8d0aa628');
assert.equal(archivedAirConditioning.editorial_previous_bytes,4802);
assert.deepEqual(archivedAirConditioning.editorial_later_revisions,[{
 date:'2026-11-24',previous_bytes:4844,previous_sha256:'a06e12a1334cec456dea02de67e5cb0a99e12b34894f04e511fac8085716f0ff'
}]);
assert.equal(archivedAirConditioning.sha256,'65a10c3dc4636f900ce0b3e943ebfc5c1fc3c8d69332abbab339add80498193b');
const archivedMicrowave=catalog.files.find(e=>e.path==='artifacts/series/2026-10-22/household/report-ja.md');
assert.equal(archivedMicrowave.editorial_previous_sha256,'bf61efdd71ab85a91db5e3f04437c9b30b34a62cc7ee16ddf93bb6491008e317');
assert.equal(archivedMicrowave.editorial_previous_bytes,7629);
assert.deepEqual(archivedMicrowave.editorial_later_revisions,[{
 date:'2026-11-24',previous_bytes:7635,previous_sha256:'b3efc1168394b314524c1ae2fe0d5281a87f7f87aa30ace23aaecf006bcfeb30'
}]);
assert.equal(archivedMicrowave.sha256,'2a7f47f0cf4b27f041cfaa90b62fac57cfc08bbaf3d9884c704bba34cfa38981');
const archivedTravelCpi=catalog.files.find(e=>e.path==='artifacts/series/2026-10-19/cpi05/report.md');
assert.equal(archivedTravelCpi.editorial_previous_sha256,'545c123ed89ff30332cf643da896b76e3fa2acdde216ff2c8f5233279df662e0');
assert.equal(archivedTravelCpi.editorial_previous_bytes,2358);
assert.deepEqual(archivedTravelCpi.editorial_later_revisions,[{
 date:'2026-11-24',previous_bytes:2373,previous_sha256:'b4c2722e0a34bf4c5f2afabded6eb1ece7703bfa0da6d390cb57decbfd70cfc7'
}]);
assert.equal(archivedTravelCpi.sha256,'d982f0bba262d92abe8801a256f3ee1866ac9fef375c943dde24d6ba2e12f294');
const archivedHousingOrders=catalog.files.find(e=>e.path==='artifacts/series/2026-10-29/sellers/expanded/report-ja.md');
assert.equal(archivedHousingOrders.editorial_previous_sha256,'92fdf30ed4d7a493a1151a8c8ddced0884db9bb6b855952546ade7db3e069fab');
assert.equal(archivedHousingOrders.editorial_previous_bytes,3647);
assert.deepEqual(archivedHousingOrders.editorial_later_revisions,[{
 date:'2026-11-24',previous_bytes:3650,previous_sha256:'7cd17b81322b82b0cd8e30d86bea04253b95fa84d4770f8416f0db131e9fc7b3'
}]);
assert.equal(archivedHousingOrders.sha256,'b9b378133b248c25b061d69232557f75b090cb6f1d0b605378a7b88dd5f3dd11');
console.log('PASS archive catalog: '+seen.size+' unique paths, exact bytes and SHA-256');
