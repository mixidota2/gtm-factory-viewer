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

// Read/share only recognized search parameters; links are explicit, never auto-written.
const searchStart=html.indexOf('function readSearchState(search){');
const searchEnd=html.indexOf('const state={theme:',searchStart);
assert.ok(searchStart>=0&&searchEnd>searchStart);
const shareState={query:'',filter:'all',kind:'all'};
const shareContext=vm.createContext({URLSearchParams,data:{themes:[{id:'3'}]},state:shareState,location:{pathname:'/gtm-factory-viewer/'}});
vm.runInContext(html.slice(searchStart,searchEnd),shareContext);
const restore=s=>JSON.parse(JSON.stringify(shareContext.readSearchState(s)));
assert.deepEqual(restore(''),{query:'',filter:'all',kind:'all'});
assert.deepEqual(restore('?q=%E4%BF%9D%E9%99%BA&filter=3&kind=regular'),{query:'保険',filter:'3',kind:'regular'});
assert.deepEqual(restore('?q=test&filter=invalid&kind=invalid'),{query:'test',filter:'all',kind:'all'});
shareState.query='保険 & <script> + # 日本';shareState.filter='3';shareState.kind='regular';
const shared=shareContext.searchPermalink('#library');
assert.ok(shared.startsWith('/gtm-factory-viewer/?'));
assert.ok(shared.endsWith('#library'));
assert.equal(new URL(shared,'https://example.test').searchParams.get('q'),shareState.query);
assert.deepEqual(restore(new URL(shared,'https://example.test').search),shareState);
shareState.query='';shareState.filter='all';shareState.kind='all';
assert.equal(shareContext.searchPermalink('#questions'),'/gtm-factory-viewer/#questions');
console.log('PASS actual search permalink helpers: Unicode/special characters, recognized filters, invalid/default values and clean reset');

// Overseas routes must move focus to the freshly rendered article, like other readers.
const globalStart=html.indexOf('function renderGlobal(id){');
const globalEnd=html.indexOf('const candidateUpdates',globalStart);
assert.ok(globalStart>=0&&globalEnd>globalStart);
for(const id of ['example','missing']){
 const main={innerHTML:'',focus(options){assert.equal(options.preventScroll,true);this.focused=true;}};
 const doc={title:'',getElementById:key=>{assert.equal(key,'main');return main;}};
 const ctx=vm.createContext({document:doc,window:{scrollTo:(x,y)=>assert.deepEqual([x,y],[0,0])},editorial:{cards:[{id:'example',title:'Example',entry:'Entry',observations:[],body:'Body',text:'Text'}],world_coverage_statement:'Scope'},esc:String,questionLinks:()=>'',markdown:s=>s,route:''});
 vm.runInContext(html.slice(globalStart,globalEnd),ctx);
 ctx.renderGlobal(id);
 assert.equal(main.focused,true);
 assert.equal(ctx.route,'memo');
 assert.ok(main.innerHTML.includes(id==='example'?'Example':'記事が見つかりません'));
}
console.log('PASS overseas reader focuses main for known and missing articles');
