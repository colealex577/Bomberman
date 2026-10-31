import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','PolishTest');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberPolish156?.version==='v0.15.6'&&window.BomberKillNames156?.version==='v0.15.6'&&window.BomberBehavior157?.version==='v0.15.7'&&window.BomberHumanObserver152&&window.BomberSocial155&&window.gGameEngine?.menu,{timeout:30000});
 assert.equal(await p.evaluate(()=>document.getElementById('buildVersion156')?.textContent),'v0.15.6');

 // Observer chat ownership must survive a simulated-human elimination, and the eliminated actor must retain its real displayed username.
 await p.evaluate(()=>BomberHumanObserver152.startObserver());
 await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='observe'&&gGameEngine.__v152RosterMode==='observe',{timeout:6000});
 await sleep(450);
 const arranged=await p.evaluate(()=>{BomberPolish156.arrangeObservedSpawns(gGameEngine);const sims=gGameEngine.bots.filter(b=>b.simulatedHuman).sort((a,b)=>a.statSlot-b.statSlot);return sims.map(b=>({name:b.displayName,slot:b.statSlot,pos:{...b.position}}))});
 assert.equal(arranged.length,2);assert.deepEqual(arranged.map(x=>x.slot),[0,3]);
 assert.deepEqual(arranged[0].pos,{x:1,y:1});
 assert.deepEqual(arranged[1].pos,await p.evaluate(()=>({x:gGameEngine.tilesX-2,y:gGameEngine.tilesY-2})));
 const deadName=arranged[1].name;
 await p.evaluate(()=>{const b=gGameEngine.bots.find(x=>x.simulatedHuman&&x.statSlot===3);window.__v156KilledActor=b;b.__v130AiName='AI 4';b.die()});
 await sleep(450);
 const afterSimDeath=await p.evaluate(()=>({mode:BomberHumanObserver152.state().mode,owner:document.body.getAttribute('data-v156-roster-chat'),hidden:document.getElementById('chatPanel').hidden,display:getComputedStyle(document.getElementById('chatPanel')).display,locked:window.__v156KilledActor?.__v130AiName||'',cached:(gGameEngine.__v130RoundBots||[]).filter(b=>b&&b.simulatedHuman).map(b=>b.__v130AiName),toast:document.getElementById('v130Toast')?.textContent||''}));
 assert.equal(afterSimDeath.mode,'observe');assert.equal(afterSimDeath.owner,'1');assert.equal(afterSimDeath.hidden,false);assert.notEqual(afterSimDeath.display,'none');
 assert.equal(afterSimDeath.locked,deadName,'eliminated simulated human lost its displayed username');
 if(afterSimDeath.toast)assert.ok(!/\bAI\s*\d+/i.test(afterSimDeath.toast),'kill log exposed a generic AI label: '+afterSimDeath.toast);
 console.log('OBSERVER_DEATH_CHAT_AND_NAMES PASS');

 // Joining the next round and dying locally must not remove the desktop chat either.
 await p.evaluate(()=>{BomberHumanObserver152.requestJoinNext();BomberHumanObserver152.debug.finishObservedRound()});
 await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='joined'&&gGameEngine.__v152RosterMode==='joined',{timeout:5000});
 await sleep(300);
 await p.evaluate(()=>gGameEngine.players[0].die());await sleep(350);
 const afterPlayerDeath=await p.evaluate(()=>({mode:BomberHumanObserver152.state().mode,owner:document.body.getAttribute('data-v156-roster-chat'),hidden:document.getElementById('chatPanel').hidden,display:getComputedStyle(document.getElementById('chatPanel')).display}));
 assert.equal(afterPlayerDeath.mode,'joined');assert.equal(afterPlayerDeath.owner,'1');assert.equal(afterPlayerDeath.hidden,false);assert.notEqual(afterPlayerDeath.display,'none');
 console.log('JOINED_DEATH_CHAT PASS');

 // Rating-scaled corridor trap: no behavior below threshold, much stronger at elite ratings.
 const trap=await p.evaluate(()=>{
  const dbg=BomberPolish156.debug,real=window.gGameEngine;
  const grass=new Set(['2,1','2,2','2,3']);
  const fake={tilesX:5,tilesY:5,tileSize:32,bombs:[],playing:true,matchFinished:false,menu:{visible:false},getTileMaterial:p=>grass.has(p.x+','+p.y)?'grass':'wall'};
  const target={alive:true,position:{x:2,y:2},targetPosition:{x:2,y:2},velocity:2,isBot:false,displayName:'Target'};
  const bot={simulatedHuman:true,humanRating:950,rating:950,alive:true,started:true,position:{x:2,y:1},targetPosition:{x:2,y:1},bombStrength:3,bombsMax:1,bombs:[],escapeMode:false,displayName:'EliteTrap',isSafe:()=>true,inBounds:p=>p.x>=0&&p.y>=0&&p.x<5&&p.y<5,hasBomb:()=>false,simulatedBlast:()=>[{x:2,y:1},{x:2,y:2},{x:2,y:3}],findPath:(a,b)=>[{...a},{...b}],activeBombCount(){return this.bombs.length},findEscapePath:()=>[{x:2,y:1},{x:1,y:1}],plantBomb(){const b={position:{...this.position}};this.bombs.push(b);return b},beginEscapePlan(){this.escapeMode=true},setNextTile(q){this.targetPosition={...q}}};
  fake.getPlayersAndBots=()=>[bot,target];window.gGameEngine=fake;let high=false,low=false,plan=null;try{plan=dbg.findTrap?dbg.findTrap(bot,target):BomberPolish156.findTrap(bot,target);high=dbg.tryTrap(bot,target);const lowBot={...bot,humanRating:600,rating:600,bombs:[],escapeMode:false,targetPosition:{x:2,y:1}};low=dbg.tryTrap(lowBot,target);return{plan:!!plan,high,low,bombs:bot.bombs.length,escaped:bot.escapeMode,c650:dbg.trapChance?dbg.trapChance(650):BomberPolish156.trapChance(650),c700:BomberPolish156.trapChance(700),c900:BomberPolish156.trapChance(900),c1000:BomberPolish156.trapChance(1000)}}finally{window.gGameEngine=real}
 });
 assert.equal(trap.plan,true,'elite corridor opportunity was not recognized');assert.equal(trap.high,true,'elite simulated human did not execute a forced corridor trap');assert.equal(trap.low,false,'sub-650 simulated human used elite corridor trapping');assert.equal(trap.bombs,1);assert.equal(trap.escaped,true);assert.ok(trap.c700<trap.c900&&trap.c900<trap.c1000,'corridor opportunism did not scale with rating');
 console.log('RATING_SCALED_CORRIDOR_TRAP PASS',JSON.stringify(trap));

 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V156_GAMEPLAY_POLISH_SMOKE PASS');
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
