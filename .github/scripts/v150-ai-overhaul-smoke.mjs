import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','V150Test');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberRelease150?.version==='v0.15.2'&&window.BomberAI150?.version==='v0.15.0'&&window.BomberPreload150?.version==='v0.15.2'&&window.BomberOpening144?.version==='v0.14.4'&&window.gGameEngine?.menu,{timeout:30000});
 await p.waitForFunction(()=>gGameEngine.playerBoyImg&&gGameEngine.playerBoyImg.complete&&gGameEngine.tilesImgs?.grass,{timeout:15000});
 assert.equal(await p.evaluate(()=>document.getElementById('buildVersion150')?.textContent),'v0.15.2');
 assert.equal(await p.title(),'Bomberman v0.15.2');
 await p.evaluate(()=>{B115.setRole('offline');gGameEngine.menu.setMode('single')});
 await p.waitForFunction(()=>gGameEngine.bots?.length>=2&&!gGameEngine.menu.visible,{timeout:8000});
 const result=await p.evaluate(()=>{
  const bot=gGameEngine.bots.find(b=>b&&b.alive!==false),api=BomberAI150.debug||BomberAI150;
  if(!bot)throw Error('no live bot');
  const before=api.state(bot);api.setWait(bot,350,'smoke wait');const wait=api.state(bot);
  const target=BomberAI150.chooseTarget(bot,true);
  const path=target?api.timedPath(bot,bot.position,target.position,true):null;
  const saved={escapeMode:bot.escapeMode,escapePath:bot.escapePath,escapePathIndex:bot.escapePathIndex,escapeThreatBomb:bot.escapeThreatBomb,escapeThreats:bot.escapeThreats,escapeDestination:bot.escapeDestination};
  const own={exploded:false,fires:[],position:{x:-90,y:-90},getDangerPositions(){return[{x:-90,y:-90}]}};
  gGameEngine.bombs.push(own);
  bot.escapeMode=true;bot.escapePath=[{x:bot.position.x,y:bot.position.y}];bot.escapePathIndex=1;bot.escapeThreatBomb=own;bot.escapeThreats=[];bot.escapeDestination={x:bot.position.x,y:bot.position.y};
  const holdsOwnBomb=bot.trackedBombStillDangerous();
  Utils.removeFromArray(gGameEngine.bombs,own);
  bot.escapeMode=saved.escapeMode;bot.escapePath=saved.escapePath;bot.escapePathIndex=saved.escapePathIndex;bot.escapeThreatBomb=saved.escapeThreatBomb;bot.escapeThreats=saved.escapeThreats;bot.escapeDestination=saved.escapeDestination;
  return{preload:BomberPreload150.nativeImages,waitMs:wait.waitUntil-Date.now(),target:!!target,pathLength:path&&path.length,opening:BomberOpening144.version,replans:before.replans||0,holdsOwnBomb};
 });
 assert.equal(result.preload,true,'native image loader was not active');
 assert.ok(result.waitMs>0,'deliberate wait state was not recorded');
 assert.ok(result.target,'AI could not choose a living contestant');
 assert.ok(result.pathLength===null||result.pathLength>=1,'timed path returned an invalid route');
 assert.equal(result.opening,'v0.14.4','v0.14.4 opening fix was not preserved');
 assert.equal(result.holdsOwnBomb,true,'bot forgot its own live bomb after reaching cover');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V150_AI_OVERHAUL_SMOKE PASS',JSON.stringify(result));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}