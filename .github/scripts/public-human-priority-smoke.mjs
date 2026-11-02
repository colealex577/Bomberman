import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const contexts=[],errors=[];
async function client(name){const ctx=await browser.createBrowserContext(),p=await ctx.newPage();contexts.push(ctx);p.on('pageerror',e=>errors.push(name+': '+String(e.stack||e)));await p.evaluateOnNewDocument(n=>{localStorage.setItem('BombermanPlayerName',n);localStorage.setItem('BombermanRatingV1','100');localStorage.setItem('BombermanScoreV1Initialized','1');navigator.serviceWorker.register=()=>Promise.resolve({})},name);await p.goto(process.env.TEST_URL,{waitUntil:'domcontentloaded',timeout:30000});await p.waitForFunction(()=>window.BomberPublicPresence16223?.version==='v0.16.2.23'&&window.BomberFix16224?.version==='v0.16.2.24'&&window.BomberAuthoritativeSpectatorChat16224?.version==='v0.16.2.24'&&window.BomberMultiplayer?.ready&&window.BomberFix16222,{timeout:45000});return p}
async function wait(fn,msg,ms=20000){const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await sleep(80)}throw new Error(msg)}
async function closePages(...pages){await Promise.all(pages.filter(Boolean).map(p=>p.browserContext().close().catch(()=>{})))}
async function openRealMatch(tag){const host=await client(tag+'Host'),joiner=await client(tag+'Joiner'),room='bomberman-'+tag.toLowerCase()+'-'+Date.now();await host.evaluate(id=>{B115.PUBLIC=[id];BomberV124.setAIEnabled(false);B115.startPublicHost()},room);await wait(()=>host.evaluate(()=>B115.role==='host'&&B115.peer?.open&&BomberPublicPresence16223.state().hostSlot),tag+' host did not open',20000);await joiner.evaluate(id=>{B115.PUBLIC=[id];BomberV124.setAIEnabled(false);BomberPublicPresence16223.startJoin()},room);await wait(()=>joiner.evaluate(()=>B115.role==='guest'&&B115.conn?.open&&BomberDataSync.role==='guest'&&!!BomberMultiplayer.roundId),tag+' joiner did not connect',30000);return{host,joiner,room}}
try{
 const ui=await client('UI');
 assert.equal(await ui.evaluate(()=>BomberBuildVersion),'v0.16.2.24');
 assert.equal(await ui.title(),'Bomberman v0.16.2.24');
 assert.match(await ui.$eval('#bomb1',e=>e.textContent),/Space = normal bomb.*E = Bomb Kick/);
 assert.match(await ui.$eval('#bomb2',e=>e.textContent),/Shift = normal bomb.*Q = Bomb Kick/);
 assert.equal(await ui.evaluate(()=>/arm (?:a traveling )?bomb kick/i.test(document.body.innerText)),false,'stale Bomb Kick arm/toggle wording is still visible');
 console.log('V016224_UI_CONTROLS PASS');
 await closePages(ui);

 const real=await openRealMatch('Real');
 assert.equal(await real.host.evaluate(()=>B115.started),true);
 console.log('REAL_WAITING_HUMAN_PRIORITY PASS');
 const watcher=await client('Watcher');
 await watcher.evaluate(id=>{B115.PUBLIC=[id];BomberPublicPresence16223.startObserve()},real.room);
 await wait(()=>watcher.evaluate(()=>BomberPublicPresence16223.state().mode==='spectator'&&!BomberPublicPresence16223.state().queued),'Observe did not spectate the active real-human match',20000);
 await wait(()=>real.host.evaluate(()=>BomberPublicPresence16223.state().spectators>=1),'host did not register observer',10000);
 assert.equal(await watcher.evaluate(()=>BomberPublicPresence16223.queueNext()),true);
 await wait(()=>watcher.evaluate(()=>BomberPublicPresence16223.state().queued),'observer did not enter next-round queue',5000);
 console.log('REAL_MATCH_OBSERVE_AND_QUEUE PASS');
 await closePages(real.host,real.joiner,watcher);

 const active=await openRealMatch('Active');
 const queued=await client('QueuedJoiner');
 await queued.evaluate(id=>{B115.PUBLIC=[id];BomberPublicPresence16223.startJoin()},active.room);
 await wait(()=>queued.evaluate(()=>BomberPublicPresence16223.state().mode==='spectator'&&BomberPublicPresence16223.state().queued),'Join Public did not spectate+queue when a real match was already active',20000);
 console.log('JOIN_ACTIVE_REAL_MATCH_SPECTATE_QUEUE PASS');
 await closePages(active.host,active.joiner,queued);

 const simHost=await client('SimHost');
 const simRoom='bomberman-sim-presence-'+Date.now();
 await simHost.evaluate(id=>{B115.PUBLIC=[id];BomberPublicPresence16223.startJoin()},simRoom);
 await wait(()=>simHost.evaluate(()=>BomberPublicPresence16223.state().simulatedHost&&B115.peer?.open&&B115.kind==='public'),'no-human Join Public did not create a discoverable fresh simulated match',30000);
 const simJoin=await client('SimJoin');
 await simJoin.evaluate(id=>{B115.PUBLIC=[id];BomberPublicPresence16223.startJoin()},simRoom);
 await wait(()=>simJoin.evaluate(()=>BomberPublicPresence16223.state().mode==='spectator'&&BomberPublicPresence16223.state().queued),'real joiner did not discover/spectate human-v-simulated public match',20000);
 await wait(()=>simHost.evaluate(()=>BomberPublicPresence16223.state().spectators>=1),'simulated public host did not keep discoverable spectator presence',10000);
 console.log('HUMAN_V_SIMULATED_DISCOVERABLE PASS');

 await wait(()=>simJoin.evaluate(()=>{const p=B115.els?.chatPanel;if(!p||p.hidden)return false;const s=getComputedStyle(p);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0}),'chat panel was not visibly rendered for the human observer',8000);
 await simJoin.evaluate(()=>{window.__rawSpectatorPackets=[];const m=B115.peer?.connections||{};Object.keys(m).forEach(k=>(m[k]||[]).forEach(c=>{try{c.on('data',d=>window.__rawSpectatorPackets.push(d))}catch(e){}}))});
 const directSent=await simHost.evaluate(()=>BomberPublicPresence16223.broadcastChat(B115.remoteName,'direct presence chat probe'));
 assert.equal(directSent,true,'authoritative presence chat send did not report success');
 await sleep(600);
 console.log('RAW_SPECTATOR_PACKETS',JSON.stringify(await simJoin.evaluate(()=>window.__rawSpectatorPackets||[])));
 console.log('OBSERVER_CHAT_DOM',JSON.stringify(await simJoin.evaluate(()=>B115.els?.chatMessages?.innerText||'')));
 await wait(()=>simJoin.evaluate(()=>/direct presence chat probe/.test(B115.els?.chatMessages?.innerText||'')),'observer did not receive authoritative spectator chat',8000);
 await simHost.evaluate(()=>B115.appendChat(B115.remoteName,'observer relay probe',false));
 await wait(()=>simJoin.evaluate(()=>/observer relay probe/.test(B115.els?.chatMessages?.innerText||'')),'observer did not receive public chat while spectating',8000);
 await simHost.evaluate(()=>{var f=window.BomberChatFix1544&&BomberChatFix1544.debug&&BomberChatFix1544.debug.directAppend;if(f)f(B115.remoteName,'simulated relay probe',false)});
 await wait(()=>simJoin.evaluate(()=>/simulated relay probe/.test(B115.els?.chatMessages?.innerText||'')),'observer did not receive simulated-human chat while spectating',8000);
 console.log('OBSERVER_CHAT_VISIBLE_AND_RELAYED PASS');

 const simName=await simHost.evaluate(()=>BomberFix16224.captureProfile().name);
 await simHost.evaluate(()=>{gGameEngine.matchFinished=true;if(window.BomberQOL)BomberQOL.postMatchOpen=true});
 await wait(()=>simJoin.evaluate(()=>BomberPublicPresence16223.state().mode==='player'),'queued spectator was not promoted for the next round',10000);
 await wait(()=>simJoin.evaluate(()=>B115.role==='guest'&&B115.conn?.open&&BomberDataSync.role==='guest'&&!!BomberMultiplayer.roundId),'promoted spectator did not become authoritative multiplayer guest',30000);
 await wait(()=>simHost.evaluate(name=>B115.role==='host'&&BomberDataSync.role==='host'&&gGameEngine.bots.some(b=>b&&b.simulatedHuman&&b.displayName===name),simName),'host did not preserve the simulated human into the promoted round',15000);
 await wait(()=>simJoin.evaluate(name=>gGameEngine.bots.some(b=>b&&b.simulatedHuman&&b.displayName===name&&(!b.bmp||b.bmp.visible!==false)),simName),'promoted observer could not see the preserved simulated human',15000);
 assert.equal(await simJoin.evaluate(name=>BomberFix16224.hybridProfile()?.name===name,simName),true,'promoted guest did not retain the simulated-human profile');
 assert.equal(await simHost.evaluate(()=>BomberMultiplayer.inspect().world.actors.length),3,'host authoritative actor roster was not human + human + simulated human');
 assert.equal(await simJoin.evaluate(()=>BomberMultiplayer.inspect().world.actors.length),3,'promoted guest actor roster was not human + human + simulated human');
 console.log('QUEUED_NEXT_ROUND_PROMOTION_WITH_SIM_SYNC PASS');
 if(errors.length)throw new Error('browser errors: '+errors.join(' | '));
 console.log('PUBLIC_HUMAN_PRIORITY_SMOKE PASS');
}finally{await Promise.all(contexts.map(c=>c.close().catch(()=>{})));await browser.close().catch(()=>{})}
