// Serve the actual downloadable dataset, not the HTML app at every URL.
const fs=require('node:fs'),path=require('node:path');
const csvPath='/data/water-quantity/2026-11-09/monthly.csv';
module.exports=function(html,root=path.resolve(__dirname,'..')){
 return (req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/'||pathname==='/index.html'){
   res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return;
  }
  if(pathname===csvPath){
   try{
    const bytes=fs.readFileSync(path.join(root,csvPath));
    res.setHeader('Content-Type','text/csv; charset=utf-8');res.end(bytes);return;
   }catch(error){if(error.code!=='ENOENT')throw error;}
  }
  res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');
 };
};
