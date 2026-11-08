// Hash navigation finishes after the click; wait for the destination, not the old page.
function articleReady(title) {
 const headings=Array.from(document.querySelectorAll('#main h1'));
 return headings.length===1 && headings[0].textContent===title;
}
function claimReady(id) {
 return document.getElementById('claim-'+id)?.open===true;
}
async function waitForArticle(page,title) { await page.waitForFunction(articleReady,title); }
async function waitForClaim(page,id) { await page.waitForFunction(claimReady,id); }
module.exports={articleReady,claimReady,waitForArticle,waitForClaim};
