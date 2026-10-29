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
 await p.waitForFunction(()=>window.BomberPolish135?.version==='v0.13.5'&&window.BomberGameplay134&&window.gGameEngine?.menu,{timeout:30000});
 await p.waitForFunction(()=>document.getElementById('buildVersion135')?.textContent==='v0.13.5',{timeout:5000});
 const menu=await p.evaluate(()=>{
  const g=gGameEngine,m=g.menu,d=BomberPolish135.debug;d.normalizeMenu();
  const icons=m.views.filter(v=>v&&v.sourceRect&&Number(v.sourceRect.width)===48&&Number(v.sourceRect.height)===48&&typeof v.x==='number').sort((a,b)=>a.x-b.x);
  const singleX=g.size.w/2-110-20,multiX=g.size.w/2+20,expected=[singleX+31,multiX+15,multiX+47];
  const card=m.views.some(v=>v&&v.children&&v.children.some(c=>String(c&&c.text||'').toLowerCase()==='character'));
  return{actual:icons.slice(0,3).map(v=>v.x),expected,card,count:icons.length};
 });
 assert.ok(menu.count>=3,'main menu did not expose the three player icons');assert.equal(menu.card,false,'legacy character card remained in the canvas menu');for(let i=0;i<3;i++)assert.ok(Math.abs(menu.actual[i]-menu.expected[i])<.01,'menu player icon '+i+' was outside its stable slot');
 const redraw=await p.evaluate(()=>{for(let i=0;i<4;i++){gGameEngine.menu.hide();gGameEngine.menu.show();BomberPolish135.normalizeMenu()}const g=gGameEngine,m=g.menu,icons=m.views.filter(v=>v&&v.sourceRect&&Number(v.sourceRect.width)===48&&Number(v.sourceRect.height)===48).sort((a,b)=>a.x-b.x),singleX=g.size.w/2-130,multiX=g.size.w/2+20;return icons.slice(0,3).map(v=>v.x).join('|')+'::'+[singleX+31,multiX+15,multiX+47].join('|')});
 assert.equal(redraw.split('::')[0],redraw.split('::')[1],'menu icon normalization was not stable across redraws');
 const names=await p.evaluate(()=>{
  const g=gGameEngine,d=BomberPolish135.debug,old=g.simulatedOpponent;B115.setRole('simulated');B115.localName='LocalHero';B115.remoteName='ChatRival';g.simulatedOpponent={displayName:'WrongName',nameLabel:{text:'WrongName'}};d.syncNames();const sim={display:g.simulatedOpponent.displayName,label:g.simulatedOpponent.nameLabel.text,chat:B115.remoteName};g.simulatedOpponent=old;
  B115.setRole('host');B115.localName='HostName';B115.remoteName='GuestName';g.menu.setMode('multi');d.syncNames();const net={p0:g.players[0]&&g.players[0].nameLabel&&g.players[0].nameLabel.text,p1:g.players[1]&&g.players[1].nameLabel&&g.players[1].nameLabel.text,names:(g.playerNames||[]).slice(0,2)};return{sim,net}
 });
 assert.equal(names.sim.display,'ChatRival');assert.equal(names.sim.label,'ChatRival','simulated opponent sprite name must match chat username');assert.equal(names.sim.label,names.sim.chat);assert.deepEqual(names.net,{p0:'HostName',p1:'GuestName',names:['HostName','GuestName']},'online player labels did not share the network/chat name source');
 await sleep(80);
 const ai=await p.evaluate(()=>{
  B115.setRole('offline');gGameEngine.menu.setMode('single');gGameEngine.menu.visible=true;
  const d=BomberPolish135.debug,g=gGameEngine,bot=g.bots[0];for(let i=1;i<g.bots.length;i++)g.bots[i].alive=false;g.bombs=[];
  const start={x:1,y:g.tilesY-2},bonus={x:2,y:g.tilesY-2},bp=Utils.convertToBitmapPosition(start);bot.alive=true;bot.escapeMode=false;bot.__v134Bait=null;bot.position={...start};bot.targetPosition={...start};bot.targetBitmapPosition={...bp};bot.bmp.x=bp.x;bot.bmp.y=bp.y;bot.__v135PowerupTarget=null;bot.__v135RecentPositions=[];bot.__v135ReverseStreak=0;bot.__v135LastTransition=null;
  const oldBonuses=g.bonuses;g.bonuses=[{position:{...bonus},type:'speed'}];const path=d.bestPowerupPath(bot);const pursued=d.tryPowerup(bot),powerTarget={...bot.targetPosition};
  bot.position={...start};bot.targetPosition={...start};bot.targetBitmapPosition={...bp};bot.bmp.x=bp.x;bot.bmp.y=bp.y;d.setHistory(bot,['1,'+(g.tilesY-3),'1,'+(g.tilesY-2),'1,'+(g.tilesY-3),'1,'+(g.tilesY-2)]);const loopDetected=d.isLooping(bot),broke=d.breakLoop(bot),loopTarget={...bot.targetPosition},breaks=bot.__v135LoopBreaks||0;g.bonuses=oldBonuses;g.menu.visible=false;
  return{start,bonus,path,pursued,powerTarget,loopDetected,broke,loopTarget,breaks}
 });
 assert.ok(ai.path&&ai.path.length>=2,'AI did not find a safe exposed power-up path');assert.equal(ai.pursued,true,'AI did not actively pursue an exposed power-up');assert.deepEqual(ai.powerTarget,ai.bonus,'AI power-up objective did not become the movement target');assert.equal(ai.loopDetected,true,'ABAB movement cycle was not detected');assert.equal(ai.broke,true,'AI failed to break a repeated movement cycle');assert.notDeepEqual(ai.loopTarget,{x:1,y:ai.start.y-1},'AI loop breaker reversed onto the same prior tile again');assert.ok(ai.breaks>=1,'AI loop breaker did not record a cycle break');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V135_POLISH_SMOKE PASS',JSON.stringify({menu,names,ai:{powerTarget:ai.powerTarget,loopTarget:ai.loopTarget,breaks:ai.breaks}}));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
