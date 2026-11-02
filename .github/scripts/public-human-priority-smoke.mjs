import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const contexts=[],errors=[];
async function client(name){const ctx=await browser.createBrowserContext(),p=await ctx.newPage();contexts.push(ctx);p.on('pageerror',e=>errors.push(name+': '+String(e.stack||e)));await p.evaluateOnNewDocument(n=>{localStorage.setItem('BombermanPlayerName',n);localStorage.setItem('BombermanRatingV1','100');localStorage.setItem('BombermanScoreV1Initialized','1');navigator.serviceWorker.register=()=>Promise.resolve({})},name);await p.goto(process.env.TEST_URL,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.BomberPublicPresence16223?.version==='v0.16.2.23'&&window.BomberFix16223&&window.BomberMultiplayer?.ready&&window.BomberFix16222,{timeout:30000});return p}
async function wait(fn,msg,ms=20000){const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await sleep(80)}throw new Error(msg)}
try{
 const ui=await client('UI');
 assert.equal(await ui.evaluate(()=>BomberBuildVersion),'v0.16.2.23');
 assert.equal(await ui.title(),'Bomberman v0.16.2.23');
 assert.match(await ui.$eval('#bomb1',e=>e.textContent),/Space = normal bomb.*E = Bomb Kick/);
 assert.match(await ui.$eval('#bomb2',e=>e.textContent),/Shift = normal bomb.*Q = Bomb Kick/);
 const oldArm=await ui.evaluate(()=>/arm (?:a traveling )?bomb kick/i.test(document.body.innerText));
 assert.equal(oldArm,false,'stale Bomb Kick arm/toggle wording is still visible');
 console.log('V016223_UI_CONTROLS PASS');

 const host=await client('RealHost'),joiner=await client('RealJoiner'),observer=await client('Observer'),queued=await client('QueuedJoiner');
 const room='bomberman-human-priority-'+Date.now();
 await host.evaluate(id=>{B115.PUBLIC=[id];BomberV124.setAIEnabled(false);B115.startPublicHost()},room);
 await wait(()=>host.evaluate(()=>B115.role==='host'&&B115.peer?.open&&BomberPublicPresence16223.state().hostSlot),'explicit public host did not open',20000);
 await joiner.evaluate(id=>{B115.PUBLIC=[id];BomberV124.setAIEnabled(false);BomberPublicPresence16223.startJoin()},room);
 await wait(()=>joiner.evaluate(()=>B115.role==='guest'&&B115.conn?.open&&BomberDataSync.role==='guest'&&!!BomberMultiplayer.roundId),'Join Public did not choose the real waiting human',30000);
 assert.equal(await host.evaluate(()=>B115.started),true);
 console.log('REAL_WAITING_HUMAN_PRIORITY PASS');

 await observer.evaluate(id=>{B115.PUBLIC=[id];BomberPublicPresence16223.startObserve()},room);
 await wait(()=>observer.evaluate(()=>BomberPublicPresence16223.state().mode==='spectator'&&BomberPublicPresence16223.state().queued===false),'Observe did not spectate the active real-human match',20000);
 await wait(()=>host.evaluate(()=>BomberPublicPresence16223.state().spectators>=1),'host did not register observer',10000);
 assert.equal(await observer.evaluate(()=>BomberPublicPresence16223.queueNext()),true);
 await wait(()=>observer.evaluate(()=>BomberPublicPresence16223.state().queued===true),'observer did not enter next-round queue',5000);
 console.log('REAL_MATCH_OBSERVE_AND_QUEUE PASS');

 await queued.evaluate(id=>{B115.PUBLIC=[id];BomberPublicPresence16223.startJoin()},room);
 await wait(()=>queued.evaluate(()=>BomberPublicPresence16223.state().mode==='spectator'&&BomberPublicPresence16223.state().queued===true),'Join Public did not spectate+queue when a real match was already active',20000);
 console.log('JOIN_ACTIVE_REAL_MATCH_SPECTATE_QUEUE PASS');

 const simHost=await client('SimHost'),simJoin=await client('SimJoin');
 const simRoom='bomberman-sim-presence-'+Date.now();
 await simHost.evaluate(id=>{B115.PUBLIC=[id];BomberPublicPresence16223.startJoin()},simRoom);
 await wait(()=>simHost.evaluate(()=>BomberPublicPresence16223.state().simulatedHost&&B115.peer?.open&&B115.kind==='public'),'no-human Join Public did not create a discoverable fresh simulated match',30000);
 await simJoin.evaluate(id=>{B115.PUBLIC=[id];BomberPublicPresence16223.startJoin()},simRoom);
 await wait(()=>simJoin.evaluate(()=>BomberPublicPresence16223.state().mode==='spectator'&&BomberPublicPresence16223.state().queued),'real joiner did not discover/spectate human-v-simulated public match',20000);
 await wait(()=>simHost.evaluate(()=>BomberPublicPresence16223.state().spectators>=1),'simulated public host did not keep discoverable spectator presence',10000);
 console.log('HUMAN_V_SIMULATED_DISCOVERABLE PASS');

 await simHost.evaluate(()=>{gGameEngine.matchFinished=true;if(window.BomberQOL)BomberQOL.postMatchOpen=true});
 await wait(()=>simJoin.evaluate(()=>BomberPublicPresence16223.state().mode==='player'),'queued spectator was not promoted for the next round',10000);
 await wait(()=>simJoin.evaluate(()=>B115.role==='guest'&&B115.conn?.open&&BomberDataSync.role==='guest'&&!!BomberMultiplayer.roundId),'promoted spectator did not become authoritative multiplayer guest',30000);
 console.log('QUEUED_NEXT_ROUND_PROMOTION PASS');

 assert.deepEqual(errors,[]);
 console.log('PUBLIC_HUMAN_PRIORITY_SMOKE PASS');
}finally{await Promise.all(contexts.map(c=>c.close().catch(()=>{})));await browser.close().catch(()=>{})}