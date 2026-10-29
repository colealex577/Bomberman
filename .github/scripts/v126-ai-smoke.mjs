import puppeteer from 'puppeteer-core';
const url=process.env.TEST_URL,executablePath=process.env.CHROME_PATH;if(!url||!executablePath)throw new Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check'],timeout:30000});
const context=await browser.createBrowserContext();const page=await context.newPage();const errors=[];
page.on('pageerror',e=>errors.push(String(e?.stack||e?.message||e)));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource:.*404/i.test(m.text()))errors.push('console: '+m.text())});
await page.evaluateOnNewDocument(()=>{try{localStorage.setItem('BombermanMultiplayerAIEnabled','1');localStorage.setItem('BombermanAIDifficultyV1','normal')}catch(e){}try{if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({scope:location.href})}catch(e){}});
function assert(c,m){if(!c)throw new Error(m)}
try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
 await page.waitForFunction(()=>window.BomberAI126&&BomberAI126.version==='v0.12.6'&&window.Bot&&gGameEngine?.menu&&document.getElementById('buildVersion126')?.textContent==='v0.12.6',{timeout:18000});
 await page.waitForFunction(()=>window.BomberMultiplayer?.ready&&gGameEngine.stage?.canvas,{timeout:30000});
 await page.evaluate(()=>gGameEngine.menu.setMode('single'));await sleep(350);
 let single=await page.evaluate(()=>({players:gGameEngine.players.length,bots:gGameEngine.bots.length,version:document.getElementById('buildVersion126')?.textContent}));
 assert(single.players===1&&single.bots>0,'single-player AI did not start');assert(single.version==='v0.12.6','version badge missing');
 const standard=await page.evaluate(()=>{
   const g=gGameEngine,b=g.bots[0];g.menu.visible=true;
   for(let i=g.tiles.length-1;i>=0;i--){const t=g.tiles[i];if(t&&t.material==='wood')try{t.remove()}catch(e){}}
   for(const x of g.bombs){try{g.stage.removeChild(x.bmp)}catch(e){}}g.bombs=[];b.bombs=[];
   const useless=b.bombUtility(b.position),before=g.bombs.length,rejected=b.plantBomb()===false&&g.bombs.length===before;
   let woodPos=null;for(const d of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]){const p={x:b.position.x+d.x,y:b.position.y+d.y};if(g.getTileMaterial(p)==='grass'){woodPos=p;break}}
   if(!woodPos)throw new Error('no adjacent grass for wood test');const t=new Tile('wood',woodPos);g.stage.addChild(t.bmp);g.tiles.push(t);
   const woodPlan=b.bombUtility(b.position),woodBomb=b.plantBomb();
   if(woodBomb){try{g.stage.removeChild(woodBomb.bmp)}catch(e){};Utils.removeFromArray(g.bombs,woodBomb);Utils.removeFromArray(b.bombs,woodBomb)}try{t.remove()}catch(e){}
   const p=g.players[0],target={x:b.position.x+1,y:b.position.y};if(g.getTileMaterial(target)!=='grass')target.x=b.position.x-1;p.position={x:target.x,y:target.y};const bp=Utils.convertToBitmapPosition(target);p.bmp.x=bp.x;p.bmp.y=bp.y;
   b.bombStrength=Math.max(1,b.bombStrength);const targetPlan=b.bombUtility(b.position),targetBomb=b.plantBomb();
   if(targetBomb){try{g.stage.removeChild(targetBomb.bmp)}catch(e){};Utils.removeFromArray(g.bombs,targetBomb);Utils.removeFromArray(b.bombs,targetBomb)}
   b.hyperAggressive=true;BomberAI126.syncMarkers();const markerOn=!!(b.__v126Marker&&b.__v126Marker.visible&&b.attackMode);b.hyperAggressive=false;BomberAI126.syncMarkers();const markerOff=!!(b.__v126Marker&&!b.__v126Marker.visible&&!b.attackMode);
   return{useless,rejected,woodPlan,woodAllowed:!!woodBomb,targetPlan,targetAllowed:!!targetBomb,markerOn,markerOff}
 });
 console.log('STANDARD_AI',JSON.stringify(standard));
 assert(standard.useless.wood===0&&standard.useless.targets===0&&standard.rejected,'standard AI planted a useless bomb');
 assert(standard.woodPlan.wood>0&&standard.woodAllowed,'standard AI refused productive wood bomb');
 assert(standard.targetPlan.targets>0&&standard.targetAllowed,'standard AI refused direct opponent bomb');
 assert(standard.markerOn&&standard.markerOff,'standard AI attack marker did not track attack mode');
 await page.evaluate(()=>{gGameEngine.menu.visible=false;B115.kind='public';B115.setRole('host');B115.startSimulated()});await sleep(650);
 const sim=await page.evaluate(()=>{
   const g=gGameEngine,b=g.simulatedOpponent,p=g.players[0];if(!b)throw new Error('simulated human missing');g.menu.visible=true;
   for(let i=g.tiles.length-1;i>=0;i--){const t=g.tiles[i];if(t&&t.material==='wood')try{t.remove()}catch(e){}}
   for(const x of g.bombs){try{g.stage.removeChild(x.bmp)}catch(e){}}g.bombs=[];b.bombs=[];
   const far={x:1,y:1};p.position={x:far.x,y:far.y};let bp=Utils.convertToBitmapPosition(far);p.bmp.x=bp.x;p.bmp.y=bp.y;
   const useless=b.bombUtility(b.position),rejected=b.plantBomb()===false;
   let target={x:b.position.x-1,y:b.position.y};if(g.getTileMaterial(target)!=='grass')target={x:b.position.x,y:b.position.y-1};p.position={x:target.x,y:target.y};bp=Utils.convertToBitmapPosition(target);p.bmp.x=bp.x;p.bmp.y=bp.y;b.bombStrength=Math.max(1,b.bombStrength);
   const direct=b.bombUtility(b.position),allowed=b.plantBomb();if(allowed){try{g.stage.removeChild(allowed.bmp)}catch(e){};Utils.removeFromArray(g.bombs,allowed);Utils.removeFromArray(b.bombs,allowed)}
   b.hyperAggressive=true;BomberAI126.syncMarkers();const marker=!!(b.__v126Marker&&b.__v126Marker.visible&&b.attackMode),markerY=b.__v126Marker&&b.__v126Marker.y,spriteY=b.bmp.y;
   return{useless,rejected,direct,allowed:!!allowed,marker,markerAbove:markerY<spriteY,simulatedHuman:!!b.simulatedHuman}
 });
 console.log('SIM_HUMAN',JSON.stringify(sim));
 assert(sim.simulatedHuman&&sim.useless.wood===0&&sim.useless.targets===0&&sim.rejected,'fake human planted useless bomb');
 assert(sim.direct.targets>0&&sim.allowed,'fake human refused direct attack bomb');
 assert(sim.marker&&sim.markerAbove,'fake-human attack marker missing/not above attacker');
 if(errors.length)throw new Error('browser errors: '+errors.join(' | '));
 console.log('V126_AI_SMOKE PASS');
}finally{await context.close().catch(()=>{});await browser.close().catch(()=>{})}

