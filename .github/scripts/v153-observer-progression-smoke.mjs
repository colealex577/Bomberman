import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text())&&!/PeerJS/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','Observer153');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberRelease150?.version==='v0.15.3'&&window.BomberHumanObserver152?.version==='v0.15.3'&&window.BomberObserver153?.version==='v0.15.3'&&window.gGameEngine?.menu,{timeout:30000});
 assert.equal(await p.evaluate(()=>document.getElementById('buildVersion150')?.textContent),'v0.15.3');
 assert.equal(await p.title(),'Bomberman v0.15.3');

 await p.evaluate(()=>BomberOnline.openLobby());
 await p.waitForFunction(()=>document.getElementById('v152ObserveBtn'),{timeout:5000});
 await p.click('#v152ObserveBtn');
 await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='observe'&&gGameEngine.players.length===0&&gGameEngine.bots?.length===4,{timeout:10000});

 const stages=[];
 for(let i=1;i<=10;i++){
   const audit=await p.evaluate(n=>{BomberHumanObserver152.debug.primeObservedRound(n);return BomberHumanObserver152.debug.progressionAudit()},i);
   assert.equal(audit.state,i,`observer state ${i} did not apply`);
   assert.equal(audit.actorPaths,true,`observer state ${i} placed an actor outside the path carved from its own spawn`);
   assert.equal(audit.duplicateActors,false,`observer state ${i} overlapped actors`);
   assert.ok(audit.initialWood>0&&audit.removedWood>0,`observer state ${i} did not carve wood`);
   assert.equal(audit.positions.length,4,`observer state ${i} did not position all four contestants`);
   if(stages.length)assert.ok(audit.removedWood>stages.at(-1).removedWood,`observer state ${i} was not more progressed than state ${i-1}`);
   stages.push(audit);
 }
 assert.ok(stages[0].progress<.2,'early observer state was too open');
 assert.ok(stages[4].progress>.4&&stages[4].progress<.55,'mid observer state was not mid-game');
 assert.ok(stages[9].progress>.88,'late observer state was not substantially open');
 assert.ok(stages[9].collectedBonuses>=stages[0].collectedBonuses,'late observer state did not reflect more collected pickups');

 await p.evaluate(()=>BomberHumanObserver152.debug.primeObservedRound(5));
 const names=await p.evaluate(()=>BomberHumanObserver152.state().profiles.map(x=>x.name));
 await p.click('#v152JoinNextBtn');
 await p.evaluate(()=>BomberHumanObserver152.debug.finishObservedRound());
 await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='joined'&&gGameEngine.players?.length===1&&gGameEngine.bots?.length===3,{timeout:7000});
 await sleep(700);
 let roster=await p.evaluate(()=>BomberHumanObserver152.debug.auditRoster());
 assert.deepEqual(roster,{players:1,bots:3,sims:2,ais:1,shape:true,duplicate:false,playerAtSpawn:true,botOnPlayerSpawn:false},'queued join did not produce the exact clean 1 human + 2 simulated humans + 1 AI layout');
 const joinedNames=await p.evaluate(()=>gGameEngine.bots.filter(b=>b.simulatedHuman).sort((a,b)=>a.statSlot-b.statSlot).map(b=>b.displayName));
 assert.deepEqual(joinedNames,names,'queued join did not preserve the two observed human-style opponents');

 await p.evaluate(()=>{
   const api=BomberHumanObserver152.debug,sp=api.spawnPosition(0),sims=gGameEngine.bots.filter(b=>b.simulatedHuman);
   sims[0].simulatedHuman=false;
   const victim=gGameEngine.bots[1],px=Utils.convertToBitmapPosition(sp);victim.position={x:sp.x,y:sp.y};victim.bmp.x=px.x;victim.bmp.y=px.y;victim.updatePosition?.();
   api.stabilizeJoined();
 });
 await sleep(250);
 roster=await p.evaluate(()=>BomberHumanObserver152.debug.auditRoster());
 assert.deepEqual(roster,{players:1,bots:3,sims:2,ais:1,shape:true,duplicate:false,playerAtSpawn:true,botOnPlayerSpawn:false},'joined-round sanitizer did not repair the reported duplicate-spawn / extra-AI corruption');

 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V153_OBSERVER_PROGRESSION_SMOKE PASS',JSON.stringify({states:stages.map(s=>({state:s.state,removed:s.removedWood,progress:s.progress,positions:s.positions,collected:s.collectedBonuses})),roster}));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
