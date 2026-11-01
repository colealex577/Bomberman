import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text())&&!/PeerJS/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','V157Test');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberBehavior157?.version==='v0.15.7'&&window.BomberRoundSocial158?.version==='v0.15.8'&&window.BomberHumanObserver152&&window.BomberV127&&window.gGameEngine?.menu,{timeout:30000});

 const clock=await p.evaluate(()=>{const before=Date.now();BomberBehavior157.clock.set('manual','02:30');const night=BomberBehavior157.clock.get(),h=new Date().getHours(),m=new Date().getMinutes(),nightChance=BomberBehavior157.noObserverRoomChance();BomberBehavior157.clock.set('manual','19:10');const peak=BomberBehavior157.clock.get(),peakChance=BomberBehavior157.noObserverRoomChance();return{before,after:Date.now(),night,h,m,nightChance,peak,peakChance,settings:!!document.getElementById('v157ClockSetting')}});
 assert.equal(clock.night.band,'overnight');assert.equal(clock.h,2);assert.equal(clock.m,30);assert.ok(clock.nightChance>=.5,'overnight observer scarcity is not substantial');assert.equal(clock.peak.band,'peak');assert.ok(clock.peakChance<.1,'peak observer scarcity is too high');assert.equal(clock.settings,true);assert.ok(clock.after>=clock.before);
 console.log('MANUAL_ACTIVITY_CLOCK PASS');

 await p.evaluate(()=>{BomberBehavior157.clock.set('manual','19:10');const old=Math.random;Math.random=()=>.99;BomberOnline.openLobby();const b=document.getElementById('v152ObserveBtn');b.click();Math.random=old});
 await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='observe'&&gGameEngine.bots?.length===4,{timeout:7000});await sleep(500);
 const initialNotice=await p.evaluate(()=>Array.from(document.querySelectorAll('#chatMessages .chat_line')).map(x=>x.textContent).join('|'));
 assert.match(initialNotice,/V157Test.*spectating this round/i,'local observer arrival was not announced in chat');
 const repaired=await p.evaluate(()=>{const bots=gGameEngine.bots,src=bots[0],victim=bots[1],px=Utils.convertToBitmapPosition(src.position);victim.position={...src.position};victim.bmp.x=px.x;victim.bmp.y=px.y;victim.targetPosition={...src.position};victim.targetBitmapPosition={x:px.x,y:px.y};victim.updatePosition?.();const before=new Set(bots.map(b=>b.position.x+','+b.position.y)).size;const ok=BomberBehavior157.repairDuplicateSpawns();const after=new Set(bots.map(b=>b.position.x+','+b.position.y)).size;return{before,after,ok,positions:bots.map(b=>({...b.position}))}});
 assert.ok(repaired.before<4);assert.equal(repaired.after,4);assert.equal(repaired.ok,true,'duplicate first-load spawn was not repaired');
 await p.click('#v152JoinNextBtn');await sleep(120);
 const queueNotice=await p.evaluate(()=>Array.from(document.querySelectorAll('#chatMessages .chat_line')).map(x=>x.textContent).join('|'));
 assert.match(queueNotice,/V157Test.*joined the queue for the next round/i,'local queue action was not announced in chat');
 console.log('OBSERVER_CHAT_AND_SPAWN_REPAIR PASS');

 await p.evaluate(()=>BomberHumanObserver152.debug.finishObservedRound());
 await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='joined'&&gGameEngine.players?.length===1,{timeout:7000});await sleep(300);

 const tank=await p.evaluate(()=>{const bot=gGameEngine.bots.find(b=>b.simulatedHuman);bot.humanRating=850;bot.rating=850;bot.bonusCounts=bot.bonusCounts||{};bot.bonusCounts.heart=2;bot.escapeMode=false;bot.__v157TankPlan=null;const pos={...bot.position},adj={x:Math.min(gGameEngine.tilesX-2,pos.x+1),y:pos.y};if(gGameEngine.getTileMaterial(adj)!=='grass')adj={x:Math.max(1,pos.x-1),y:pos.y};const bomb=new Bomb(adj,2);gGameEngine.stage.addChild(bomb.bmp);gGameEngine.bombs.push(bomb);const eligible=BomberBehavior157.tank.eligible(bot),planned=BomberBehavior157.tank.plan(bot),before=bot.bonusCounts.heart;bot.die();const after=bot.bonusCounts.heart,alive=bot.alive,inv=bot.__v157InvulnerableUntil>Date.now();try{bomb.exploded=true;gGameEngine.stage.removeChild(bomb.bmp);Utils.removeFromArray(gGameEngine.bombs,bomb)}catch(e){}bot.__v157TankPlan=null;return{eligible,planned,before,after,alive,inv}});
 assert.equal(tank.eligible,true);assert.equal(tank.planned,true,'elite simulated human did not build a tank-hit escape plan');assert.equal(tank.before,2);assert.equal(tank.after,1,'tank hit did not spend exactly one heart');assert.equal(tank.alive,true);assert.equal(tank.inv,true);
 console.log('PLANNED_TANK_HIT PASS');

 const winner=await p.evaluate(()=>{const sim=gGameEngine.bots.find(b=>b.simulatedHuman),actors=gGameEngine.players.concat(gGameEngine.bots),states=actors.map(x=>x.alive);gGameEngine.players.forEach(x=>x.alive=false);gGameEngine.bots.forEach(x=>x.alive=(x===sim));const out={name:sim.displayName,label:BomberBehavior157.winnerLabel()};actors.forEach((x,i)=>x.alive=states[i]);return out});
 assert.equal(winner.label,winner.name+' WINS');assert.ok(!/AI SURVIVOR/i.test(winner.label));
 console.log('USERNAME_WINNER_LABEL PASS');

 const death=await p.evaluate(async()=>{const g=gGameEngine,bots=g.bots.slice();g.matchFinished=false;g.spectatorFinished=false;g.spectatorMode=false;g.players[0].alive=false;bots.forEach((b,i)=>b.alive=i<2);g.beginSpectating();const title=document.querySelector('#v157DeathCard h2')?.textContent||'',buttons=[...document.querySelectorAll('#v157DeathCard button')].map(b=>b.textContent),overlay=!document.getElementById('v157Death').hidden;BomberBehavior157.death.spectate();const spectatingBefore=!document.getElementById('v157SpectatingBar').hidden;const survivor=bots[0];bots.forEach(b=>b.alive=(b===survivor));g.finishSpectating((survivor.displayName||'AI SURVIVOR')+' WINS');await new Promise(r=>setTimeout(r,350));const postButtons=[...document.querySelectorAll('#v158Actions button')].map(b=>b.textContent),postOpen=!!BomberQOL.postMatchOpen,matchFinished=!!g.matchFinished,restarted=!!(g.players?.[0]?.alive!==false&&!g.matchFinished),mode=BomberHumanObserver152.state().mode,deathHidden=document.getElementById('v157Death').hidden,barHidden=document.getElementById('v157SpectatingBar').hidden;return{title,buttons,overlay,spectatingBefore,postButtons,postOpen,matchFinished,restarted,mode,deathHidden,barHidden}});
 assert.equal(death.title,'You Died');assert.deepEqual(death.buttons,['Spectate','Leave Lobby']);assert.equal(death.overlay,true);assert.equal(death.spectatingBefore,true);assert.equal(death.postOpen,true,'round result did not replace spectator UI after one survivor remained');assert.equal(death.matchFinished,true);assert.equal(death.restarted,false,'joined roster restarted automatically instead of waiting for a rematch request');assert.equal(death.mode,'joined','round finish unexpectedly left the joined public lobby');assert.deepEqual(death.postButtons,['Request rematch','New public match','Home screen']);assert.equal(death.deathHidden,true);assert.equal(death.barHidden,true);
 console.log('YOU_DIED_THEN_EXPLICIT_ROUND_END PASS');

 await p.evaluate(()=>{const root=document.getElementById('chatMessages');const row=document.createElement('div');row.className='chat_line';row.textContent='stale lobby message';root.appendChild(row);BomberBehavior157.death.leave()});await sleep(120);
 assert.equal(await p.evaluate(()=>document.querySelectorAll('#chatMessages .chat_line').length),0,'chat was not cleared on lobby exit');
 console.log('LOBBY_SCOPED_CHAT PASS');

 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V157_AI_CHAT_DEATH_FLOW_SMOKE PASS');
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
