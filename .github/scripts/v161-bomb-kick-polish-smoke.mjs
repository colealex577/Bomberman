import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text())&&!/PeerJS/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','KickPolish');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberKick160&&window.BomberKick161?.version==='v0.16.0-hotfix.1'&&window.BomberKick161Compat?.version==='v0.16.1'&&window.BomberSpeed161?.version==='v0.16.1'&&window.BomberV125&&window.gGameEngine?.menu&&document.getElementById('v160TutorialBtn'),{timeout:30000});
 await sleep(700);

 const menu=await p.evaluate(()=>{const game=document.getElementById('game').getBoundingClientRect(),b=document.getElementById('v160TutorialBtn'),r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{hidden:b.hidden,gameBottom:game.bottom,buttonBottom:r.bottom,clearance:game.bottom-r.bottom,hit:hit===b||b.contains(hit)}});
 assert.equal(menu.hidden,false);assert.ok(menu.clearance>55,'Tutorial button is still trapped in the bottom menu area: '+JSON.stringify(menu));assert.equal(menu.hit,true,'Tutorial button is covered by another UI layer');
 console.log('TUTORIAL_BUTTON_ACCESSIBLE PASS',JSON.stringify(menu));

 await p.click('#v160TutorialBtn');
 await p.waitForFunction(()=>BomberKick160.state.tutorial&&BomberKick160.state.tutorialPlayer,{timeout:5000});await sleep(500);
 const isolated=await p.evaluate(()=>({step:BomberKick160.state.tutorialStep,bots:gGameEngine.bots.length,botBombs:gGameEngine.bombs.filter(b=>b.owner&&b.owner.isBot).length,storedBot:!!BomberKick160.state.tutorialBot}));
 assert.equal(isolated.step,0);assert.equal(isolated.bots,0,'tutorial spawned an invisible active bot');assert.equal(isolated.botBombs,0,'tutorial bot planted a hidden bomb');assert.equal(isolated.storedBot,false);
 console.log('TUTORIAL_NO_INVISIBLE_BOT PASS',JSON.stringify(isolated));

 await p.evaluate(()=>{BomberKick160.state.tutorialStep=8;BomberKick161.debug.spawnTutorialDemo()});await sleep(120);
 const demo=await p.evaluate(()=>{const b=BomberKick160.state.tutorialBot;return{bots:gGameEngine.bots.length,exists:!!b,visible:!!(b&&b.bmp&&b.bmp.visible),dummy:!!(b&&b.tutorialDummy)}});
 assert.equal(demo.exists,true);assert.equal(demo.visible,true);assert.equal(demo.dummy,true);assert.equal(demo.bots,1);
 await sleep(650);
 const demoBombs=await p.evaluate(()=>gGameEngine.bombs.filter(b=>b.owner===BomberKick160.state.tutorialBot).length);
 assert.ok(demoBombs<=1,'passive tutorial demo created multiple autonomous bombs');
 console.log('TUTORIAL_DEMO_ONLY_WHEN_NEEDED PASS',JSON.stringify({...demo,demoBombs}));
 await p.evaluate(()=>BomberKick160.exitTutorial());await sleep(250);

 await p.evaluate(()=>gGameEngine.menu.setMode('single'));
 await p.waitForFunction(()=>gGameEngine.players?.length===1&&!gGameEngine.menu.visible,{timeout:5000});await sleep(500);
 const drops=await p.evaluate(()=>{const list=gGameEngine.bonuses||[],k=list.filter(b=>b.type==='kick'),desired=BomberKick161.desiredKickCount(list.length);return{total:list.length,kicks:k.length,desired,max:gGameEngine.bombKickMaxDrops,internal:k.every(b=>b.bmp&&b.bmp.image&&b.bmp.image.tagName==='CANVAS'),rendered:k.every(b=>b.__v161KickRendered)}});
 assert.ok(drops.total>0);assert.ok(Math.abs(drops.kicks-drops.desired)<=1,'Bomb Kick distribution drifted too far from rare target');assert.ok(drops.kicks>=1&&drops.kicks<=8);assert.equal(drops.max,8);assert.equal(drops.internal,true,'Bomb Kick pickup did not use the internal fallback icon');assert.equal(drops.rendered,true);
 console.log('RARE_KICK_DROPS_AND_INTERNAL_ICON PASS',JSON.stringify(drops));

 const stats=await p.evaluate(()=>{const g=gGameEngine,all=(g.players||[]).concat(g.bots||[]);all.forEach((e,i)=>{e.bombKickCharges=i+1});BomberKick161.updateKickStats();return[...document.querySelectorAll('.qol_stat_box:not([hidden])')].map(box=>{const items=[...box.querySelectorAll('.qol_stat_item')],kickItems=[...box.querySelectorAll('[data-qol-stat="kick"]')],kick=kickItems[0],c=kick&&kick.querySelector('canvas'),ctx=c&&c.getContext('2d'),data=ctx?ctx.getImageData(0,0,c.width,c.height).data:[];let alpha=0;for(let i=3;i<data.length;i+=4)alpha+=data[i];return{slot:box.dataset.slot,itemCount:items.length,kickItems:kickItems.length,kickCount:kick?.querySelector('.qol_stat_count')?.textContent||'',alpha}})});
 assert.ok(stats.length>=1);for(const s of stats){assert.ok(s.itemCount>=5,'player stat box lost existing stats');assert.equal(s.kickItems,1,'Bomb Kick stat should appear exactly once');assert.match(s.kickCount,/^×\d+$/);assert.ok(s.alpha>0,'Bomb Kick stat icon is blank')}
 console.log('BOMB_KICK_PLAYER_STATS PASS',JSON.stringify(stats));

 const speeds=await p.evaluate(()=>{
  const g=gGameEngine,b=g.bots[0];if(!b)throw Error('no AI available for speed test');
  const out={};
  for(const d of ['easy','normal','hard','expert']){BomberV125.setDifficulty(d);BomberSpeed161.normalize(b);out[d]={velocity:b.velocity,start:b.startTimerMax}}
  BomberV125.setDifficulty('normal');b.bonusCounts=b.bonusCounts||{};b.bonusCounts.speed=0;b.__v161LegitSpeedBonus=0;b.__v161SpeedInitialized=true;BomberSpeed161.normalize(b);
  const oldRemain=b.remainingWoodCount;b.remainingWoodCount=()=>0;b.hyperAggressive=false;b.hyperAggroSpeedApplied=false;b.updateEndgameAggression();const endgame=b.velocity;b.remainingWoodCount=oldRemain;
  const oldUltimate=!!g.ultimateMode;g.ultimateMode=false;b.bonusCounts.speed=0;b.__v161LegitSpeedBonus=0;b.__v161SpeedInitialized=true;BomberSpeed161.normalize(b);b.applyBonus({type:'speed'});const afterPickup=b.velocity,pickups=b.bonusCounts.speed;
  g.ultimateMode=true;b.bonusCounts.speed=0;b.__v161LegitSpeedBonus=0;b.__v161SpeedInitialized=true;BomberSpeed161.normalize(b);b.applyBonus({type:'speed'});const ultimatePickup=b.velocity;
  g.ultimateMode=oldUltimate;
  const sim=g.bots[1]||b;sim.simulatedHuman=true;sim.humanSkill=1;sim.velocity=4.2;sim.__v161SpeedInitialized=false;sim.bonusCounts=sim.bonusCounts||{};sim.bonusCounts.speed=0;BomberSpeed161.normalize(sim);const eliteSim=sim.velocity;
  return{out,endgame,afterPickup,pickups,ultimatePickup,eliteSim}
 });
 for(const d of ['easy','normal','hard','expert'])assert.equal(speeds.out[d].velocity,2,'difficulty changed AI foot speed on '+d);
 assert.ok(speeds.out.easy.start>speeds.out.hard.start&&speeds.out.hard.start>=speeds.out.expert.start,'difficulty no longer changes reaction/opening delay');
 assert.equal(speeds.endgame,2,'endgame aggression changed AI foot speed');assert.equal(speeds.eliteSim,2,'rating/skill changed simulated-human foot speed');assert.equal(speeds.afterPickup,2.8,'normal Speed pickup did not increase AI foot speed by 0.8');assert.equal(speeds.ultimatePickup,6,'Ultimate Speed pickup did not apply its 5x pickup strength');assert.ok(speeds.pickups>=1);
 console.log('STANDARD_AI_SPEED_POWERUPS_ONLY PASS',JSON.stringify(speeds));

 const impacts=await p.evaluate(()=>{
  const g=gGameEngine;
  function clearBombs(){for(const b of g.bombs||[])try{g.stage.removeChild(b.bmp)}catch(e){}g.bombs=[];(g.players||[]).forEach(x=>x.bombs=[]);(g.bots||[]).forEach(x=>x.bombs=[])}
  function woodPair(){for(const t of g.tiles){if(!t||t.material!=='wood')continue;for(const d of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]){const q={x:t.position.x-d.x,y:t.position.y-d.y};if(g.getTileMaterial(q)==='grass')return{origin:q,target:{...t.position},dir:d}}}return null}
  function openPair(){for(let y=1;y<g.tilesY-1;y++)for(let x=1;x<g.tilesX-2;x++){const a={x,y},b={x:x+1,y};if(g.getTileMaterial(a)==='grass'&&g.getTileMaterial(b)==='grass')return{origin:a,target:b,dir:{x:1,y:0}}}return null}
  function putActor(a,pos){const px=Utils.convertToBitmapPosition(pos);a.alive=true;a.position={...pos};a.bmp.x=px.x;a.bmp.y=px.y;if(a.targetPosition)a.targetPosition={...pos};if(a.targetBitmapPosition)a.targetBitmapPosition={x:px.x,y:px.y};if(a.updateNameLabel)a.updateNameLabel()}
  function runImpact(pair,timerMax){const b=new Bomb({...pair.origin},1);b.timerMax=timerMax;g.stage.addChild(b.bmp);g.bombs.push(b);BomberKick160.startBombMoving(b,pair.dir,null,null);let frames=0;while(!b.exploded&&frames++<30)b.update();return{exploded:b.exploded,impact:b.__v161Impact||'',position:{...b.position},frames}}
  clearBombs();for(const bot of g.bots)bot.alive=false;
  const w=woodPair();if(!w)throw Error('no wood impact lane');const woodResult=runImpact(w,99),woodGone=g.getTileMaterial(w.target)!=='wood';
  clearBombs();const o=openPair();if(!o)throw Error('no open impact lane');putActor(g.players[0],o.target);const playerResult=runImpact(o,99);
  clearBombs();const f=woodPair();if(!f)throw Error('no second wood impact lane');const fuseResult=runImpact(f,0),woodStill=g.getTileMaterial(f.target)==='wood';
  return{wood:{...woodResult,target:w.target,woodGone},player:{...playerResult,target:o.target},fuse:{...fuseResult,origin:f.origin,target:f.target,woodStill}};
 });
 assert.equal(impacts.wood.exploded,true);assert.equal(impacts.wood.impact,'wood');assert.deepEqual(impacts.wood.position,impacts.wood.target);assert.equal(impacts.wood.woodGone,true);
 assert.equal(impacts.player.exploded,true);assert.equal(impacts.player.impact,'player');assert.deepEqual(impacts.player.position,impacts.player.target);
 assert.equal(impacts.fuse.exploded,true);assert.equal(impacts.fuse.impact,'');assert.deepEqual(impacts.fuse.position,impacts.fuse.origin);
 console.log('IMPACT_AND_FUSE_PRIORITY PASS',JSON.stringify(impacts));

 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V161_BOMB_KICK_POLISH_SMOKE PASS');
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}