import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','V143Test');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberIntelligence143?.version==='v0.14.3'&&window.BomberStability140?.version==='v0.14.2'&&window.gGameEngine?.menu,{timeout:30000});
 assert.equal(await p.evaluate(()=>document.getElementById('buildVersion143')?.textContent),'v0.14.3');
 await p.evaluate(()=>{B115.setRole('offline');gGameEngine.menu.setMode('single')});
 await p.waitForFunction(()=>gGameEngine.bots?.length>=2&&!gGameEngine.menu.visible,{timeout:8000});await sleep(250);
 const r=await p.evaluate(()=>{
  const g=gGameEngine,api=BomberIntelligence143,d=BomberStability140.debug,h=g.players[0],a=g.bots[0],b=g.bots[1];
  g.tiles=g.tiles.filter(t=>t.material==='wall');g.bombs=[];g.bonuses=[];g.playing=true;g.matchFinished=false;g.menu.visible=false;
  for(const x of g.bots)x.alive=false;
  function place(bot,x,y){bot.alive=true;bot.started=true;bot.escapeMode=false;bot.hyperAggressive=true;bot.__v143Target=null;bot.__v140Motion=null;bot.position={x,y};const px=Utils.convertToBitmapPosition(bot.position);bot.bmp.x=px.x;bot.bmp.y=px.y;bot.targetPosition={x,y};bot.targetBitmapPosition={x:px.x,y:px.y};bot.bombs=[];bot.bombsMax=Math.max(1,bot.bombsMax||1)}
  h.alive=false;place(a,5,5);place(b,5,8);a.simulatedHuman=false;b.simulatedHuman=true;
  const ta=api.debug.forceTarget(a),tb=api.debug.forceTarget(b);
  const mutual=ta===b&&tb===a;
  const bonus=api.pressureBonus(a,a.position,b);
  b.simulatedHuman=false;place(a,7,7);place(b,7,7);const separated=api.debug.forceSeparate();const sa=d.state(a),sb=d.state(b);const routesDiffer=JSON.stringify(sa.recovery)!==JSON.stringify(sb.recovery)||!samePos(a.targetPosition,b.targetPosition);
  function samePos(x,y){return x&&y&&x.x===y.x&&x.y===y.y}
  const names=Array.from({length:120},(_,i)=>'Persona'+i),personas=api.debug.personas(names),extra=['deadpan','coach','reckless','analyst','nervous','showoff'].reduce((n,k)=>n+(personas[k]||0),0);
  const lines=api.debug.sampleLines('analyst',5),uniqueLines=new Set(lines.map(x=>x.toLowerCase())).size;
  const easySave=a.v125Difficulty,hardSave=b.v125Difficulty;a.v125Difficulty='easy';b.v125Difficulty='hard';const easy=api.mistakeChance(a),hard=api.mistakeChance(b);a.v125Difficulty=easySave;b.v125Difficulty=hardSave;
  return{mutual,bonus,separated,routesDiffer,routeA:sa.recovery,routeB:sb.recovery,personas,extra,lines,uniqueLines,easy,hard};
 });
 assert.equal(r.mutual,true,'bot-only endgame did not make survivors target one another');
 assert.ok(r.bonus>0,'predicted trap/exit pressure did not increase bomb placement value');
 assert.ok(r.separated>=2,'persistent ordinary-bot overlap did not hand both actors to the existing recovery controller');
 assert.equal(r.routesDiffer,true,'overlapping bots were given the same recovery commitment');
 assert.ok(r.extra>=20,'new personality types are not represented broadly enough');
 assert.equal(r.lines.length,5,'personality pool did not provide enough distinct lines');
 assert.equal(r.uniqueLines,5,'personality layer repeated a line in the same sample');
 assert.ok(r.easy>r.hard&&r.hard>=.02,'skill-dependent mistake rate is not bounded correctly');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V143_INTELLIGENCE_SMOKE PASS',JSON.stringify(r));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
