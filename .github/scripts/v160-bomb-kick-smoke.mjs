import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','KickTest');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberKick160?.version==='v0.16.0'&&window.gGameEngine?.menu&&document.getElementById('v160TutorialBtn'),{timeout:30000});
 await sleep(450);
 const boot=await p.evaluate(()=>({version:BomberKick160.version,title:document.title,preload:window.BomberPreload150?.version,drop20:BomberKick160.planKickCount(20),drop118:BomberKick160.planKickCount(118),tutorialHidden:document.getElementById('v160TutorialBtn').hidden}));
 assert.equal(boot.version,'v0.16.0');assert.equal(boot.title,'Bomberman v0.16.0');assert.equal(boot.preload,'v0.16.0');assert.equal(boot.drop20,4);assert.equal(boot.drop118,8);assert.equal(boot.tutorialHidden,false);
 console.log('VERSION_RARE_DROP_AND_MENU PASS',JSON.stringify(boot));
 await p.evaluate(()=>gGameEngine.menu.setMode('single'));
 await p.waitForFunction(()=>gGameEngine.players?.length===1&&!gGameEngine.menu.visible,{timeout:5000});await sleep(180);
 const travel=await p.evaluate(()=>{
  const g=gGameEngine,pl=g.players[0];
  for(let x=2;x<=6;x++)for(let i=g.tiles.length-1;i>=0;i--){const t=g.tiles[i];if(t.material==='wood'&&t.position.x===x&&t.position.y===1){g.stage.removeChild(t.bmp);g.tiles.splice(i,1)}}
  pl.bombKickCharges=2;pl.lastMoveDirection={x:1,y:0};pl.armBombKick(true);const b=pl.placeBomb();b.timerMax=99;
  for(let i=0;i<8;i++)b.update();
  return{moving:!!b.__v160Moving,x:b.position.x,charges:pl.bombKickCharges,armed:pl.bombKickArmed,travelUses:pl.__v160TravelPlaced};
 });
 assert.equal(travel.moving,true);assert.ok(travel.x>=2,'traveling bomb failed to move into the next tile');assert.equal(travel.charges,1);assert.equal(travel.armed,false);assert.equal(travel.travelUses,1);
 console.log('TRAVELING_BOMB_RESERVE_USE PASS',JSON.stringify(travel));
 const kicked=await p.evaluate(()=>{
  const g=gGameEngine,pl=g.players[0];g.bombs.slice().forEach(b=>{b.exploded=true;try{g.stage.removeChild(b.bmp)}catch(e){}});g.bombs=[];pl.bombs=[];pl.bombKickCharges=1;
  const b=new Bomb({x:2,y:1},1);b.timerMax=99;g.stage.addChild(b.bmp);g.bombs.push(b);const ok=pl.tryKickBomb(b,{x:1,y:0});return{ok,moving:!!b.__v160Moving,dir:b.moveDirection,charges:pl.bombKickCharges,kickUses:pl.__v160KickedBombs};
 });
 assert.equal(kicked.ok,true);assert.equal(kicked.moving,true);assert.deepEqual(kicked.dir,{x:1,y:0});assert.equal(kicked.charges,0);assert.ok(kicked.kickUses>=1);
 console.log('DIRECT_KICK PASS',JSON.stringify(kicked));
 const ai=await p.evaluate(()=>{
  const g=gGameEngine,old=g.getTileMaterial.bind(g),grass=new Set(['1,1','2,1','2,2','2,3']);
  g.getTileMaterial=q=>grass.has(q.x+','+q.y)?'grass':'wall';
  try{
   const target={alive:true,position:{x:2,y:3}};
   const low={position:{x:1,y:1},bombKickCharges:1,bombStrength:1,humanSkill:.30};
   const high={position:{x:1,y:1},bombKickCharges:1,bombStrength:1,humanSkill:.95};
   const lowChoice=BomberKick160.travelChoice(low,target),highChoice=BomberKick160.travelChoice(high,target);
   return{low:!!lowChoice,high:!!highChoice,highDir:highChoice&&highChoice.dir,highScore:highChoice&&highChoice.score,skillLow:BomberKick160.actorSkill(low),skillHigh:BomberKick160.actorSkill(high)};
  }finally{g.getTileMaterial=old}
 });
 assert.equal(ai.low,false,'low-skill AI burned a rare kick on a non-obvious diagonal setup');assert.equal(ai.high,true,'elite AI failed to recognize the corner route');assert.deepEqual(ai.highDir,{x:1,y:0});assert.ok(ai.highScore>=38);
 console.log('SKILL_SCALED_AI_RESERVE_AND_CORNER_USE PASS',JSON.stringify(ai));
 const mobile=await p.evaluate(()=>{const pl=gGameEngine.players[0];pl.bombKickCharges=2;BomberKick160.refreshMobileButton();const b=document.getElementById('v160KickBtn'),shown=!b.hidden;pl.bombKickCharges=0;BomberKick160.refreshMobileButton();return{shown,hiddenAfter:b.hidden}});
 assert.equal(mobile.shown,true);assert.equal(mobile.hiddenAfter,true);
 console.log('CONTEXT_MOBILE_BUTTON PASS');
 await p.evaluate(()=>{gGameEngine.menu.show();BomberKick160.startTutorial()});
 await p.waitForFunction(()=>BomberKick160.state.tutorial&&BomberKick160.state.tutorialPlayer&&BomberKick160.state.tutorialBot,{timeout:5000});
 const tutorial=await p.evaluate(()=>({panel:!document.getElementById('v160TutorialPanel').hidden,step:BomberKick160.state.tutorialStep,dummy:!!BomberKick160.state.tutorialBot.tutorialDummy,botVisible:BomberKick160.state.tutorialBot.bmp.visible,text:document.getElementById('v160TutorialText').textContent}));
 assert.equal(tutorial.panel,true);assert.equal(tutorial.step,0);assert.equal(tutorial.dummy,true);assert.equal(tutorial.botVisible,false);assert.match(tutorial.text,/Move with/i);
 await p.evaluate(()=>BomberKick160.exitTutorial());await sleep(200);assert.equal(await p.evaluate(()=>BomberKick160.state.tutorial),false);
 console.log('PASSIVE_TUTORIAL_FLOW PASS');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V160_BOMB_KICK_SMOKE PASS');
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}