import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','V144Test');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberOpening144?.version==='v0.14.4'&&window.BomberIntelligence143?.version==='v0.14.3'&&window.gGameEngine?.menu,{timeout:30000});
 assert.equal(await p.evaluate(()=>document.getElementById('buildVersion144')?.textContent),'v0.14.4');
 await p.evaluate(()=>{B115.setRole('offline');gGameEngine.menu.setMode('single')});
 await p.waitForFunction(()=>gGameEngine.bots?.length>=2&&!gGameEngine.menu.visible,{timeout:8000});
 const setup=await p.evaluate(()=>{
  const g=gGameEngine,api=BomberOpening144;
  const bots=g.bots.slice(),sim=bots.slice().sort((a,b)=>(b.position.x+b.position.y)-(a.position.x+a.position.y))[0];
  for(const b of bots){b.alive=(b===sim);b.started=(b===sim);b.escapeMode=false;b.__v144BreakoutTarget=null;b.bombs=[]}
  g.bombs=[];g.simulatedOpponent=sim;sim.simulatedHuman=true;sim.bombsMax=Math.max(1,sim.bombsMax||1);sim.bombStrength=Math.max(1,sim.bombStrength||1);
  B115.setRole('simulated');g.playing=true;g.matchFinished=false;g.menu.visible=false;
  const px=Utils.convertToBitmapPosition(sim.position);sim.bmp.x=px.x;sim.bmp.y=px.y;sim.targetPosition={x:sim.position.x,y:sim.position.y};sim.targetBitmapPosition={x:px.x,y:px.y};
  const a=api.debug.analyze(sim),wood=g.tiles.filter(t=>t.material==='wood').length,forced=api.debug.force(sim);
  window.__v144Sim=sim;window.__v144Wood=wood;
  return{a,forced,position:{x:sim.position.x,y:sim.position.y},target:sim.targetPosition,wood};
 });
 assert.equal(setup.a.eligible,true,'simulated opponent was not recognized as the no-AI opening case');
 assert.ok(setup.a.size<=4,`expected a tiny starting pocket, got ${setup.a.size}`);
 assert.ok(setup.a.frontier>0,'starting pocket had no wood frontier to break through');
 assert.equal(setup.forced,true,'opening breakout routine did not commit to movement or a safe bomb');
 await p.waitForFunction(()=>{
  const g=gGameEngine,sim=window.__v144Sim;if(!sim)return false;
  const wood=g.tiles.filter(t=>t.material==='wood').length;
  const a=BomberOpening144.debug.analyze(sim);
  return wood<window.__v144Wood||a.size>4;
 },{timeout:9000});
 const end=await p.evaluate(()=>({wood:gGameEngine.tiles.filter(t=>t.material==='wood').length,a:BomberOpening144.debug.analyze(window.__v144Sim),escape:!!window.__v144Sim.escapeMode,alive:window.__v144Sim.alive!==false}));
 assert.equal(end.alive,true,'simulated opponent died during opening breakout regression');
 assert.ok(end.wood<setup.wood||end.a.size>4,'simulated opponent never opened the three-tile starting pocket');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V144_OPENING_SMOKE PASS',JSON.stringify({setup,end}));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}