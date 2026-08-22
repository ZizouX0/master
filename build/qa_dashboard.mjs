import { chromium } from 'playwright';
const url='file:///home/user/master/deliverables/tools/dashboard.html';
const b=await chromium.launch({executablePath:process.env.CHROME});
const out={external:[]};
async function probe(w,h,phone){
  const p=await b.newPage({viewport:{width:w,height:h}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('request',r=>{const u=r.url(); if(!u.startsWith('file:')&&!u.startsWith('data:')) out.external.push(u);});
  await p.goto(url,{waitUntil:'load'}); await p.waitForTimeout(600);
  const base=await p.evaluate(()=>({
    tableVisible:getComputedStyle(document.querySelector('table')).display!=='none',
    cardsVisible:getComputedStyle(document.querySelector('#cards')).display!=='none',
    drawerBtn:getComputedStyle(document.querySelector('#drawerBtn')).display!=='none',
    hScroll:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    scrollW:document.documentElement.scrollWidth, clientW:document.documentElement.clientWidth,
    smallTargets:[...document.querySelectorAll('button,select,input')]
      .filter(e=>e.offsetParent!==null&&e.getBoundingClientRect().height<44).length,
  }));
  let extra={};
  if(!phone){
    const before=await p.textContent('#count');
    await p.selectOption('#fPath','A'); await p.waitForTimeout(200);
    const after=await p.textContent('#count');
    await p.selectOption('#fPath',''); await p.waitForTimeout(150);
    await p.click('th[data-k="_fee"]'); await p.waitForTimeout(200);
    const asc=await p.$$eval('#tbody tr td:nth-child(6)',e=>e.slice(0,2).map(x=>x.textContent.trim()));
    await p.click('#tbody tr:first-child'); await p.waitForTimeout(300);
    extra={filterWorks:before!==after,
      sortWorks:!asc.some(v=>v==='—'||v.toUpperCase().startsWith('TBC')),
      detailOpens:await p.evaluate(()=>document.querySelector('#detail').classList.contains('open')),
      detailFields:await p.evaluate(()=>document.querySelectorAll('#sheet .kv .k').length)};
  } else {
    await p.click('#drawerBtn'); await p.waitForTimeout(250);
    const dOpen=await p.evaluate(()=>document.querySelector('#drawer').classList.contains('open'));
    const before=await p.textContent('#count');
    await p.selectOption('#fPath2','G'); await p.waitForTimeout(250);
    const after=await p.textContent('#count');
    const mirrored=await p.evaluate(()=>document.querySelector('#fPath').value);
    await p.click('#drawer .btn'); await p.waitForTimeout(200);
    await p.click('#cards .card'); await p.waitForTimeout(300);
    const det=await p.evaluate(()=>document.querySelector('#detail').classList.contains('open'));
    const hs=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
    extra={drawerOpens:dOpen, drawerFilters:(before!==after&&mirrored==='G'), detailOpens:det, hScroll:hs};
  }
  await p.close();
  return {...base,...extra,errors:errs};
}
out.desk=await probe(1280,860,false);
out.phone=await probe(390,844,true);
await b.close();
console.log(JSON.stringify(out));
