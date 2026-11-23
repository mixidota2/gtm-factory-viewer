const fs = require('node:fs'),path = require('node:path'),vm = require('node:vm'),a = require('node:assert/strict');
function renderHome(html){
 const snapshot = html.match(/<script id="snapshot-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
 const start = html.indexOf('const data=JSON.parse('), end=html.indexOf('function readSearchState(');
 const first = html.indexOf('function home(){'), last=html.indexOf('function render(){',first);
 a.ok(start>=0&&end>start&&first>end&&last>first);
 const main={};
 const noop=()=>'',ctx={document:{getElementById:id=>id==='main'?main:id==='snapshot-data'?{textContent:snapshot}:{addEventListener:noop},querySelectorAll:()=>[]}};
 Object.assign(ctx,{drawTheme:noop,drawQuestion:noop,drawCards:noop,candidateUpdates:[],editorialHome:noop,candidateHome:noop,themeButton:noop,chart:noop,comparison:noop,claimCard:noop,state:{query:'',filter:'all',kind:'all'}});
 vm.runInNewContext(html.slice(start,end)+html.slice(first,last)+"\nhome();",ctx);
 return main.innerHTML;
}
function overviewIn(home){
 const output=home.match(/<details class="overview" id="overview">[\s\S]*?<div class="prose">([\s\S]*?)<\/div><\/details>/);
 a.ok(output,'rendered overview exists');return output[1];
}
function verify(candidate){
 const root=path.dirname(candidate);
 const html=fs.readFileSync(candidate,'utf8');
 const overview=overviewIn(renderHome(html));
 const prefix='data/demand-archive/2026-11-07/historical/';
 const site='https://mixidota2.github.io/gtm-factory-viewer/';
 const links=[['research-method.md','需要研究の読み方'],['interpretation-limitations.md','需要分析で区別するもの']];
 const anchor=([name,label])=>'<a href="'+site+prefix+name+'" target="_blank" rel="noopener noreferrer">'+label+'</a>';
 const entry=' <p>2026年10月時点の調査資料：'+anchor(links[0])+'、'+anchor(links[1])+'。</p>';
 const navigation = content => {
  a.ok(content.endsWith(entry));
  for(const link of links) a.equal(content.split(anchor(link)).length-1,1);
 };
 navigation(overview);
 a.throws(()=>navigation(overview.replace('2026年10月時点の調査資料','現在の調査結果')));
 a.throws(()=>navigation(overview.replace('research-method.md','research-method-v2.md')));
 for(const [file] of links) a.ok(fs.readFileSync(path.join(root,prefix,file),'utf8').startsWith('> 歴史的な研究記録です。現在の需要を確認した資料ではありません。'));
 const methods = fs.readFileSync(path.join(root,prefix,links[0][0]),'utf8');
 const limits = fs.readFileSync(path.join(root,prefix,links[1][0]),'utf8');
 const methodClaims = [
  ['ある時点の値が高いだけでは、どれだけ伸びたかは分からない。','ある時点の値が高いと、どれだけ伸びたかが分かる。'],
  ['制度変更だけで支出や利用が増えたとは言えない。','制度変更だけで支出や利用が増えたと言える。'],
  ['需要の拡大が続いているとは判断しない。','需要の拡大が続いていると判断する。'],
 ];
 const limitsClaims = [
  ['全国で導入率が変わったとは判断しない。','全国で導入率が変わったと判断する。'],
  ['売上額や利用者数を直接測った数字ではない。','売上額や利用者数を直接測った数字だ。'],
  ['同じ世帯の支出全体をネット分とそれ以外に分けた値として、ネット分の比率を扱わない。','同じ世帯の支出全体をネット分とそれ以外に分けた値として、ネット分の比率を扱う。'],
 ];
 for(const [record,claims] of [[methods,methodClaims],[limits,limitsClaims]]){
  const check=content=>{for(const [correct] of claims){a.ok(content.includes(correct),correct);}};
  check(record);
  for(const [correct,bad] of claims){a.throws(()=>check(record.replace(correct,bad)));}
 }
 console.log('PASS rendered historical overview links, scope/date banner, two navigation and six interpretation mutations');
 return {overview,entry};
};
module.exports=verify;
module.exports.renderHome=renderHome;
