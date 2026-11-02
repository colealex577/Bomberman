import puppeteer from 'puppeteer-core';

const url=process.env.TEST_URL;
const executablePath=process.env.CHROME_PATH;
if(!url||!executablePath)throw new Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check'],timeout:30000});
const context=await browser.createBrowserContext();
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e&&e.message||e)));
page.on('console',m=>{if(m.text().startsWith('[connect]'))console.log(m.text());if(m.type()==='error'&&!/Failed to load resource:.*404/i.test(m.text()))errors.push('console: '+m.text())});
await page.evaluateOnNewDocument(()=>{try{if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({scope:location.href})}catch(e){}});

try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForFunction(()=>window.BomberQOL&&BomberQOL.installed&&BomberQOL.hudGraphicsFixed&&BomberQOL.bottomRightOpponent&&BomberQOL.stagedElimination&&window.BomberDataSync&&B115.__dataSyncInstalled&&gGameEngine&&gGameEngine.menu&&gGameEngine.bonusesImg,{timeout:15000});
  await page.evaluate(()=>{if(B115.els?.lobby)B115.els.lobby.hidden=true;gGameEngine.lobbyOpen=false;gGameEngine.menu.setMode('multi')});
  await sleep(650);
  const layout=await page.evaluate(()=>{
    const p2=gGameEngine.players[1];
    const bots=gGameEngine.bots.map(b=>({slot:b.statSlot,name:b.displayName,x:b.position.x,y:b.position.y}));
    const boxes=[...document.querySelectorAll('.qol_stat_box:not([hidden])')].map(box=>({
      slot:box.dataset.slot,
      items:[...box.querySelectorAll('.qol_stat_item')].map(item=>{
        const c=item.querySelector('canvas');const ctx=c&&c.getContext?c.getContext('2d'):null;const d=ctx?ctx.getImageData(0,0,c.width,c.height).data:[];let alpha=0;for(let i=3;i<d.length;i+=4)alpha+=d[i];
        return{type:item.getAttribute('data-qol-stat'),count:item.querySelector('.qol_stat_count')?.textContent||'',alpha};
      })
    }));
    return{p2:{x:p2.position.x,y:p2.position.y,slot:p2.statSlot},bots,boxes};
  });
  console.log('HUD_LAYOUT',JSON.stringify(layout));
  if(layout.p2.x!==15||layout.p2.y!==11||layout.p2.slot!==3)throw new Error('Player 2 is not bottom-right');
  if(layout.bots.length!==2||layout.bots.some(b=>![1,2].includes(b.slot)))throw new Error('normal AI did not occupy the two remaining corners');
  if(layout.boxes.length<4)throw new Error('expected four visible stat boxes');
  const expectedStats=['heart','speed','bomb','fire','kick'];
  for(const box of layout.boxes){
    if(box.items.length!==5)throw new Error('stat box '+box.slot+' does not have five graphical items including Bomb Kick');
    const types=box.items.map(i=>i.type).sort();
    if(JSON.stringify(types)!==JSON.stringify(expectedStats.slice().sort()))throw new Error('stat box '+box.slot+' has unexpected pickup stats: '+types.join(','));
    if(box.items.some(i=>i.alpha<=0))throw new Error('stat box '+box.slot+' contains a blank pickup icon');
  }

  await page.evaluate(()=>gGameEngine.beginMultiplayerSpectating(0));
  await sleep(120);
  const early=await page.evaluate(()=>({banner:!document.getElementById('spectatorBanner').hidden,modal:!document.getElementById('qolEliminated').hidden,title:document.getElementById('spectatorTitle').textContent}));
  console.log('ELIM_EARLY',JSON.stringify(early));
  if(!early.banner||early.modal||early.title!=='GAME OVER')throw new Error('elimination should begin with only the GAME OVER banner');
  await sleep(2050);
  const options=await page.evaluate(()=>({banner:!document.getElementById('spectatorBanner').hidden,modal:!document.getElementById('qolEliminated').hidden}));
  console.log('ELIM_OPTIONS',JSON.stringify(options));
  if(options.banner||!options.modal)throw new Error('spectate/menu choices did not replace the banner after two seconds');
  await page.click('#qolSpectateBtn');
  await sleep(100);
  const spectating=await page.evaluate(()=>({banner:!document.getElementById('spectatorBanner').hidden,modal:!document.getElementById('qolEliminated').hidden}));
  console.log('SPECTATING_CLEAR',JSON.stringify(spectating));
  if(spectating.banner||spectating.modal)throw new Error('spectating should leave a clear game view');
  if(errors.length)throw new Error('browser errors: '+errors.join(' | '));
  console.log('HUD_FLOW_SMOKE PASS');
}finally{
  await context.close().catch(()=>{});
  await browser.close().catch(()=>{});
}
