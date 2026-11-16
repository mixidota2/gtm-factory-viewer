// Exercise the actual renderer with saved public observations; no network needed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const editorial=JSON.parse(html.match(/<script id="snapshot-data" type="application\/json">([\s\S]*?)<\/script>/)[1]).editorial;
const start=html.indexOf('function drawEditorialSearch(q){'),end=html.indexOf('function editorialHome()',start);
assert.ok(start>=0&&end>start);
const nodes=Object.fromEntries(['global-count','global-results','observation-results','editorial-search'].map(id=>[id,{}]));
const state={query:''};
const context=vm.createContext({editorial,state,document:{getElementById:id=>nodes[id]},esc:s=>String(s),globalCard:c=>c.id});
vm.runInContext(html.slice(start,end),context);
function search(query){state.query=query;context.q=query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);vm.runInContext('drawEditorialSearch(q)',context);return [...nodes['observation-results'].innerHTML.matchAll(/href="#observation\/([^"]+)"/g)].map(m=>m[1]);}
const water='jp-water-sales-coastwise-quantity';
for(const query of [water,'2026-11-09','2026-10-28','000040521357','001610306.pdf','Sheet1!A75:E98',water+' 2026-11-09','ｊｐ－ｗａｔｅｒ－ｓａｌｅｓ－ｃｏａｓｔｗｉｓｅ－ｑｕａｎｔｉｔｙ'])assert.ok(search(query).includes(water),query);
assert.deepEqual(search(water),[water]);
assert.deepEqual(search(water+' no-such-metadata-token'),[]);
assert.deepEqual(search(''),[]);
assert.deepEqual(search('undefined'),[]);
assert.equal(nodes['editorial-search'].value,'undefined');
console.log('PASS actual observation search: ID, source/verification dates, source/method URLs, locator, AND/fullwidth, empty/no-match');

// Exercise the actual same-observation click handler without changing browser globals.
const navStart=html.indexOf("document.addEventListener('click',e=>{");
const navEnd=html.indexOf("window.addEventListener('hashchange',render);",navStart);
assert.ok(navStart>=0&&navEnd>navStart);
let handler,renders=0,prevented=0;
vm.runInNewContext(html.slice(navStart,navEnd),{document:{addEventListener:(type,fn)=>{assert.equal(type,'click');handler=fn;}},location:{hash:'#observation/'+water},render:()=>renders++});
const anchor={getAttribute:()=> '#observation/'+water,hasAttribute:()=>false,target:''};
function activate(extra={},link=anchor){handler({button:0,target:{closest:()=>link},preventDefault:()=>prevented++,...extra});}
activate();assert.equal(renders,1);assert.equal(prevented,1);
for(const extra of [{button:1},{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{defaultPrevented:true}])activate(extra);
for(const link of [null,{...anchor,target:'_blank'},{...anchor,hasAttribute:()=>true},{...anchor,getAttribute:()=> '#observation/other'}])activate({},link);
assert.equal(renders,1);assert.equal(prevented,1);
activate({}, {...anchor,target:'_self'});assert.equal(renders,2);assert.equal(prevented,2);
console.log('PASS actual observation re-selection handler: same route, modified/default-prevented clicks, new tab and download preserved');
