import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text())&&!/PeerJS/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','ObserverTest');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberRelease150?.version==='v0.15.2'&&window.BomberHumanObserver152?.version==='v0.15.2'&&window.gGameEngine?.menu,{timeout:30000});
 assert.equal(await p.title(),'Bomberman v0.15.2');
 assert.equal(await p.evaluate(()=>document.getElementById('buildVersion150')?.textContent),'v0.15.2');

 await p.evaluate(()=>BomberOnline.openLobby());
 await p.waitForFunction(()=>document.getElementById('v152ObserveBtn'),{timeout:5000});
 await p.click('#v152ObserveBtn');
 await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='observe'&&gGameEngine.playersCount===0&&gGameEngine.bots?.length===4,{timeout:10000});
 const observed=await p.evaluate(()=>{
   const sims=gGameEngine.bots.filter(b=>b.simulatedHuman),ais=gGameEngine.bots.filter(b=>!b.simulatedHuman),st=BomberHumanObserver152.state();
   return{players:gGameEngine.players.length,bots:gGameEngine.bots.length,sims:sims.length,ais:ais.length,names:sims.map(b=>b.displayName),progress:st.observedProgress,hud:!document.getElementById('v152ObserverHud').hidden,joinText:document.getElementById('v152JoinNextBtn').textContent};
 });
 assert.equal(observed.players,0,'observer round spawned a controllable player');
 assert.equal(observed.bots,4);assert.equal(observed.sims,2,'observer round did not contain two human-style opponents');assert.equal(observed.ais,2,'observer round did not contain two standard AI');
 assert.notEqual(observed.names[0],observed.names[1],'human-style opponents reused the same identity');
 assert.ok(observed.progress>=.12&&observed.progress<=.90,'observer did not enter at a randomized round point');
 assert.equal(observed.hud,true);assert.equal(observed.joinText,'Join next round');

 const humanization=await p.evaluate(()=>{
   const sims=gGameEngine.bots.filter(b=>b.simulatedHuman),normal=gGameEngine.bots.find(b=>!b.simulatedHuman),api=BomberHumanObserver152.debug;
   sims.forEach(b=>b.started=false);gGameEngine.bombs.length=0;
   const arrival=api.forceArrival(sims[0]),normalArrival=api.forceArrival(normal),a=sims[0].__v152Arrival;
   const c60=api.endgameChance(60000),c180=api.endgameChance(180000),slip=api.armSlip(sims[1]),normalSlip=api.armSlip(normal);
   api.forceChat();
   const text=Array.from(document.querySelectorAll('#chatMessages .chat_line')).map(x=>x.textContent).join('|');
   return{arrival,normalArrival,offset:a?Math.hypot(a.offset.x-a.center.x,a.offset.y-a.center.y):0,c60,c180,slip,normalSlip,chat:text,names:sims.map(b=>b.displayName)};
 });
 assert.equal(humanization.arrival,true,'simulated human could not arm a destination micro-correction');
 assert.equal(humanization.normalArrival,false,'standard AI received human arrival mistakes');
 assert.ok(humanization.offset>=2.4&&humanization.offset<=6.6,'arrival overshoot/undershoot exceeded safe within-tile range');
 assert.ok(humanization.c60>0&&humanization.c180>humanization.c60,'endgame mistake chance did not rise over time');
 assert.equal(humanization.slip,true,'simulated human could not arm an endgame slip');
 assert.equal(humanization.normalSlip,false,'standard AI received endgame human-slip behavior');
 assert.ok(humanization.chat.includes(humanization.names[0])&&humanization.chat.includes(humanization.names[1]),'both observed players did not communicate in chat');

 const before=await p.evaluate(()=>({serial:BomberHumanObserver152.state().roundSerial,names:BomberHumanObserver152.state().profiles.map(p=>p.name)}));
 await p.click('#v152JoinNextBtn');
 await new Promise(r=>setTimeout(r,350));
 const queued=await p.evaluate(()=>({mode:BomberHumanObserver152.state().mode,queued:BomberHumanObserver152.state().joinQueued,serial:BomberHumanObserver152.state().roundSerial,players:gGameEngine.playersCount}));
 assert.equal(queued.mode,'observe');assert.equal(queued.queued,true);assert.equal(queued.serial,before.serial,'join request restarted the current round');assert.equal(queued.players,0,'join request entered before the current round finished');
 await p.evaluate(()=>BomberHumanObserver152.debug.finishObservedRound());
 await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='joined'&&gGameEngine.playersCount===1&&gGameEngine.bots?.length===3,{timeout:7000});
 const joined=await p.evaluate(()=>({sims:gGameEngine.bots.filter(b=>b.simulatedHuman).length,ais:gGameEngine.bots.filter(b=>!b.simulatedHuman).length,names:gGameEngine.bots.filter(b=>b.simulatedHuman).map(b=>b.displayName),player:gGameEngine.players[0]?.displayName||gGameEngine.playerNames[0]}));
 assert.equal(joined.sims,2);assert.equal(joined.ais,1);assert.deepEqual(joined.names,before.names,'queued join did not preserve the two observed opponents');assert.equal(joined.player,'ObserverTest');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V152_HUMAN_OBSERVER_SMOKE PASS',JSON.stringify({observed,humanization,queued,joined}));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
