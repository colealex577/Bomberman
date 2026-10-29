import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.removeItem('BombermanSingleMapV133');localStorage.removeItem('BombermanMultiMapV133');localStorage.setItem('BombermanPlayerName','GameplayTest');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberGameplay134?.version==='v0.13.4'&&window.BomberMaps133&&window.BomberWhole132&&window.gGameEngine?.menu,{timeout:30000});
 await p.waitForFunction(()=>document.getElementById('buildVersion134')?.textContent==='v0.13.4',{timeout:5000});
 const startup=await p.evaluate(()=>({single:BomberMaps133.getSelection('single'),multi:BomberMaps133.getSelection('multi'),active:BomberMaps133.active(),badge:(document.getElementById('buildVersion134')||{}).textContent,tiers:[BomberGameplay134.tierFor(50),BomberGameplay134.tierFor(150),BomberGameplay134.tierFor(300)],eligible:[BomberGameplay134.baitEligible(299),BomberGameplay134.baitEligible(300)]}));
 assert.deepEqual(startup,{single:'classic',multi:'classic',active:'classic',badge:'v0.13.4',tiers:['low','middle','advanced'],eligible:[false,true]});
 await p.evaluate(()=>{B115.setRole('simulated');BomberGameplay134.forceDesktopChat()});await sleep(80);
 const chat=await p.evaluate(()=>({panel:document.getElementById('chatPanel').hidden,toggle:document.getElementById('chatToggleBtn').hidden,close:getComputedStyle(document.getElementById('chatCloseBtn')).display,desktop:BomberGameplay134.isDesktop()}));
 assert.equal(chat.desktop,true);assert.equal(chat.panel,false,'desktop chat panel should stay open');assert.equal(chat.toggle,true,'desktop chat toggle should be hidden');assert.equal(chat.close,'none','desktop chat close button should be hidden');
 const tones=await p.evaluate(()=>{
  const d=BomberGameplay134.debug,E=B115.els,old=Math.random;function last(){const x=E.chatMessages.lastElementChild;return x?x.querySelector('span')?.textContent||'':''}
  const names=['Rookie1','Rookie2','Rookie3','Rookie4','Rookie5','Rookie6'];let low=names.find(n=>d.lowMode(n)==='noob')||names[0];B115.remoteName=low;d.setRating(50);Math.random=()=>.9;B115.appendChat(low,'normal sentence',false);const lowText=last();
  B115.remoteName='MiddleGuy';d.setRating(150);B115.appendChat('MiddleGuy','hey good luck',false);const midText=last();
  B115.remoteName='SweatLord';d.setRating(500);Math.random=()=>0;B115.appendChat('SweatLord',B115.SIM_KILL[0],false);const advText=last();
  d.setTrapTaunt();B115.appendChat('SweatLord',B115.SIM_KILL[0],false);const trapText=last();Math.random=old;return{lowText,midText,advText,trapText,noob:d.noob,adv:d.advancedKill,trap:d.trap}
 });
 assert.ok(tones.noob.includes(tones.lowText),'low-rank chat was not converted to noob-style chat');assert.equal(tones.midText,'hey good luck','middle-rank chat should keep the existing conversational line');assert.ok(tones.adv.includes(tones.advText),'advanced kill chat did not use competitive trash talk');assert.ok(tones.trap.includes(tones.trapText),'trap kill did not use a trap taunt');
 await p.evaluate(()=>{B115.setRole('offline');gGameEngine.menu.setMode('single')});await p.waitForFunction(()=>gGameEngine.bots&&gGameEngine.bots.length>=2&&!gGameEngine.menu.visible,{timeout:5000});await sleep(200);
 const separate=await p.evaluate(()=>{
  const d=BomberGameplay134.debug,a=gGameEngine.bots[0],b=gGameEngine.bots[1],pos={x:1,y:11},px=Utils.convertToBitmapPosition(pos);for(const x of [a,b]){x.alive=true;x.position={...pos};x.targetPosition={...pos};x.targetBitmapPosition={...px};x.bmp.x=px.x;x.bmp.y=px.y;x.__v134Bait=null}d.resolveReservations();return{a:a.targetPosition,b:b.targetPosition,same:a.targetPosition.x===b.targetPosition.x&&a.targetPosition.y===b.targetPosition.y,onTopA:a.targetPosition.x===1&&a.targetPosition.y===11,onTopB:b.targetPosition.x===1&&b.targetPosition.y===11}
 });
 assert.equal(separate.same,false,'overlapped AI reserved the same escape tile');assert.equal(separate.onTopA,false,'first AI failed to diverge from overlap');assert.equal(separate.onTopB,false,'second AI failed to diverge from overlap');
 const bait=await p.evaluate(()=>{
  const d=BomberGameplay134.debug,bot=gGameEngine.bots[0],other=gGameEngine.bots[1],human=gGameEngine.players[0];d.setRating(500);other.alive=false;bot.simulatedHuman=true;bot.alive=true;bot.escapeMode=false;bot.bombsMax=Math.max(1,bot.bombsMax||1);bot.bombStrength=Math.max(3,bot.bombStrength||1);bot.bombs=[];gGameEngine.bombs=[];bot.__v134Bait=null;
  let plan=null;for(let y=1;y<gGameEngine.tilesY-1&&!plan;y++)for(let x=1;x<gGameEngine.tilesX-1;x++){const q={x,y};if(gGameEngine.getTileMaterial(q)!=='grass')continue;const a=d.findAmbush(bot,q);if(a){plan={bait:q,ambush:a.position};break}}
  if(!plan)return{error:'no safe bait ambush found'};
  const bp=plan.ambush,hp=plan.bait,bb=Utils.convertToBitmapPosition(bp),hb=Utils.convertToBitmapPosition(hp);bot.position={...bp};bot.targetPosition={...bp};bot.targetBitmapPosition={...bb};bot.bmp.x=bb.x;bot.bmp.y=bb.y;human.alive=true;human.position={...hp};human.targetPosition={...hp};human.bmp.x=hb.x;human.bmp.y=hb.y;
  d.setBait(bot,hp,bp);bot.setNextTile(hp);const reserved={...bot.targetPosition};bot.position={...bp};bot.targetPosition={...bp};bot.targetBitmapPosition={...bb};bot.bmp.x=bb.x;bot.bmp.y=bb.y;d.setBait(bot,hp,bp);const trapped=d.tryBaitTrap(bot);return{plan,reserved,trapped,trapWindow:bot.__v134TrapKillUntil||0,bombs:gGameEngine.bombs.length}
 });
 assert.ok(!bait.error,bait.error||'bait plan missing');assert.notDeepEqual(bait.reserved,bait.plan.bait,'advanced opponent walked onto its reserved bait power-up');assert.equal(bait.trapped,true,'advanced opponent did not execute an armed bait trap');assert.ok(bait.trapWindow>Date.now()-1000,'bait trap did not arm trap-kill attribution');assert.ok(bait.bombs>=1,'bait trap did not plant a bomb');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V134_GAMEPLAY_SMOKE PASS',JSON.stringify({startup,chat,separate,bait,tones:{low:tones.lowText,mid:tones.midText,advanced:tones.advText,trap:tones.trapText}}));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
