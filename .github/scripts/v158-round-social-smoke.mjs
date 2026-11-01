import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text())&&!/PeerJS/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','V158Test');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberRoundSocial158?.version==='v0.15.8'&&window.BomberBehavior157&&window.BomberHumanObserver152&&window.BomberSocial155&&window.gGameEngine?.menu,{timeout:30000});
 assert.equal(await p.evaluate(()=>document.getElementById('releaseBadge1561')?.querySelector('strong')?.textContent),'v0.15.8');
 console.log('V158_BRANDING PASS');

 // Enter a deterministic observed match and then join the next round.
 await p.evaluate(()=>{BomberBehavior157.clock.set('manual','19:10');BomberOnline.openLobby();const old=Math.random;Math.random=()=>.99;document.getElementById('v152ObserveBtn').click();Math.random=old});
 await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='observe'&&gGameEngine.bots?.length===4,{timeout:8000});
 await p.click('#v152JoinNextBtn');await p.evaluate(()=>BomberHumanObserver152.debug.finishObservedRound());
 await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='joined'&&gGameEngine.players?.length===1&&gGameEngine.bots?.length===3,{timeout:8000});await sleep(350);

 // Capture the full roster, then force a one-survivor state without relying on a death callback. Invoke the same watchdog used by the interval so the synthetic state cannot be overwritten by a frame before the assertion.
 const setup=await p.evaluate(()=>{BomberRoundSocial158.debug.captureAll();const g=gGameEngine,sim=g.bots.find(b=>b.simulatedHuman)||g.bots[0];g.players.forEach(x=>x.alive=false);g.bots.forEach(x=>x.alive=(x===sim));const before=BomberRoundSocial158.state().stats.length;BomberRoundSocial158.debug.roundEndTick();return{winner:sim.displayName||'AI SURVIVOR',before}});
 await p.waitForFunction(()=>window.BomberQOL?.postMatchOpen&&gGameEngine.matchFinished&&document.getElementById('qolPostMatch')?.hidden===false,{timeout:5000});await sleep(180);
 const ended=await p.evaluate(()=>({title:document.querySelector('#qolPostMatch .qol_title')?.textContent||'',copy:document.querySelector('#qolPostMatch .qol_copy')?.textContent||'',rows:document.querySelectorAll('#v158PostStats .v158_stat_row').length,deathHidden:document.getElementById('v157Death')?.hidden!==false,spectateHidden:document.getElementById('v157SpectatingBar')?.hidden!==false,buttons:[...document.querySelectorAll('#qolPostMatch .qol_actions button')].map(b=>b.textContent),state:BomberRoundSocial158.state()}));
 assert.match(ended.title,new RegExp(setup.winner.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' WINS','i'),'winner name was not shown');
 assert.match(ended.copy,/Final player stats/i);assert.ok(ended.rows>=setup.before,'not all captured participants were shown in final stats');assert.equal(ended.deathHidden,true);assert.equal(ended.spectateHidden,true);assert.ok(ended.buttons.includes('Request rematch'));assert.ok(ended.buttons.includes('Home screen'));assert.ok(ended.buttons.includes('New public match'));assert.equal(ended.state.finished,true);
 await sleep(1200);assert.equal(await p.evaluate(()=>BomberQOL.postMatchOpen&&gGameEngine.matchFinished),true,'round restarted automatically instead of waiting for a choice');
 console.log('ONE_SURVIVOR_FINALIZES_WITH_STATS PASS');

 // Explicit rematch request is allowed to restart the same joined lobby.
 await p.click('#qolReplayBtn');await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='joined'&&!gGameEngine.matchFinished&&!BomberQOL.postMatchOpen&&gGameEngine.players?.[0]?.alive!==false,{timeout:5000});
 console.log('EXPLICIT_REMATCH_ONLY PASS');

 // Ambient chatter is suppressed during tense play, while direct replies to the player remain allowed.
 const cadence=await p.evaluate(()=>{const g=gGameEngine,n=(BomberRoundSocial158.state().stats.find(x=>x.kind==='Human simulation')||{}).name||g.bots.find(b=>b.simulatedHuman)?.displayName||'Player';const d=[0,1,2,3].map(()=>({exploded:false,getDangerPositions:()=>[]}));g.bombs.push(...d);BomberRoundSocial158.debug.setLastAiAt(0);const tense=BomberRoundSocial158.state().tense,ambient=BomberRoundSocial158.debug.allowAiLine(n,'random middle of fight chatter');BomberRoundSocial158.debug.setLastUserNow();const reply=BomberRoundSocial158.debug.allowAiLine(n,'yeah lol');d.forEach(x=>Utils.removeFromArray(g.bombs,x));return{tense,ambient,reply}});
 assert.equal(cadence.tense,true);assert.equal(cadence.ambient,false,'ambient chatter was allowed during high tension');assert.equal(cadence.reply,true,'a direct reply to the player was suppressed');
 console.log('TENSION_AWARE_CHAT_GATE PASS');

 // Context events remain available outside danger and add new progression-aware chatter.
 const event=await p.evaluate(async()=>{BomberRoundSocial158.debug.setLastAiAt(0);const before=document.querySelectorAll('#chatMessages .chat_line').length,ok=BomberRoundSocial158.debug.queueEvent('mid',''),flushed=BomberRoundSocial158.debug.flushEvent();await new Promise(r=>setTimeout(r,1500));const after=document.querySelectorAll('#chatMessages .chat_line').length,text=document.getElementById('chatMessages')?.textContent||'';return{before,after,ok,flushed,text}});
 assert.equal(event.ok,true);assert.equal(event.flushed,true);assert.ok(event.after>event.before,'context event did not produce chat');assert.match(event.text,/board|routes|middle|safe part/i);
 console.log('CONTEXT_TRANSITION_CHAT PASS');

 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V158_ROUND_SOCIAL_SMOKE PASS');
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
