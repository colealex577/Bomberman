import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
async function wait(fn,msg,ms=12000){const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return}catch{}await sleep(70)}throw Error(msg)}
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','StabilityTester');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberStability139?.version==='v0.13.9'&&window.BomberAI138&&window.BomberStability137&&window.BomberLeaderboard127&&window.gGameEngine?.menu,{timeout:30000});
 assert.equal(await p.evaluate(()=>document.getElementById('buildVersion139')?.textContent),'v0.13.9');

 const publicGuard=await p.evaluate(()=>{const ok=BomberStability139.debug.latchPublic(),shield=document.getElementById('v139SearchShield');const out={ok,active:BomberStability139.debug.publicState().active,body:document.body.classList.contains('v139_public_latched'),shield:!!shield&&!shield.hidden};BomberStability139.debug.cancelPublic();out.cleared=!BomberStability139.debug.publicState().active&&!document.body.classList.contains('v139_public_latched');return out});
 assert.equal(publicGuard.ok,true,'public matchmaking latch did not start');
 assert.equal(publicGuard.active,true,'public matchmaking latch was not active');
 assert.equal(publicGuard.body,true,'public matchmaking body guard missing');
 assert.equal(publicGuard.shield,true,'public matchmaking shield missing');
 assert.equal(publicGuard.cleared,true,'public matchmaking latch did not clear');

 const name=await p.evaluate(()=>BomberLeaderboard127.population().map(x=>x.name).find(n=>BomberChallenge136.availability(n))||BomberLeaderboard127.population()[0].name);
 await p.evaluate(name=>BomberStability137.debug.forceChallenge(name,'accept'),name);
 await wait(()=>p.evaluate(name=>B115.role==='simulated'&&B115.remoteName===name,name),'simulated match did not start',7000);
 await wait(()=>p.evaluate(()=>gGameEngine.bots&&gGameEngine.bots.some(b=>b&&b.alive!==false)),'no live bot',5000);

 const movement=await p.evaluate(async()=>{
  const bot=gGameEngine.bots.find(b=>b&&b.simulatedHuman&&b.alive!==false)||gGameEngine.bots.find(b=>b&&b.alive!==false);if(!bot)throw Error('bot missing');
  bot.started=true;bot.escapeMode=false;gGameEngine.playing=true;gGameEngine.lobbyOpen=false;gGameEngine.menu.visible=false;
  const horizontal=['1,5','2,5','3,5','4,5','5,5','6,5','7,5','8,5','7,5','6,5','5,5','4,5','3,5','2,5','1,5','2,5','3,5','4,5','5,5','6,5','7,5','8,5','7,5','6,5','5,5','4,5','3,5','2,5'];
  const wood=gGameEngine.tiles.filter(t=>t.material==='wood');wood.forEach(t=>{t.material='grass'});
  BomberStability139.debug.setTrail(bot,horizontal);const corridor=BomberStability139.corridorProblem(bot),forced=BomberStability139.forceNovelRoute(bot,corridor),afterRoute=BomberStability139.debug.state(bot);
  wood.forEach(t=>{t.material='wood'});
  const human=gGameEngine.players[0],oldHuman={x:human.position.x,y:human.position.y},oldTarget=human.targetPosition?{x:human.targetPosition.x,y:human.targetPosition.y}:null,oldBonuses=gGameEngine.bonuses;
  gGameEngine.bonuses=[];human.position={x:bot.position.x,y:bot.position.y};human.targetPosition={x:bot.position.x,y:bot.position.y};bot.__v134Bait={x:bot.position.x,y:bot.position.y,triggered:false,ambush:{x:bot.position.x,y:bot.position.y}};const invalid=BomberStability139.strictItemAmbush(bot),pruned=BomberStability139.debug.pruneAmbush(bot),cleared=!bot.__v134Bait;
  gGameEngine.bonuses=[{position:{x:bot.position.x,y:bot.position.y},type:'speed'}];bot.__v134Bait={x:bot.position.x,y:bot.position.y,triggered:false,ambush:{x:bot.position.x,y:bot.position.y}};const valid=BomberStability139.strictItemAmbush(bot);bot.__v134Bait=null;
  gGameEngine.bonuses=oldBonuses;human.position=oldHuman;if(oldTarget)human.targetPosition=oldTarget;
  await new Promise(r=>setTimeout(r,1050));
  BomberStability139.debug.setTrail(bot,[]);BomberStability139.debug.setStuck(bot,2500);const before=BomberStability139.debug.state(bot).breaks,reason=BomberStability139.watchdog(bot),after=BomberStability139.debug.state(bot);
  return{corridor,forced,recovery:afterRoute.recovery.length,banAxis:afterRoute.banAxis,invalid,pruned,cleared,valid,reason,before,afterBreaks:after.breaks};
 });
 assert.equal(movement.corridor,'horizontal','long row shuttle was not detected');
 assert.equal(movement.forced,true,'corridor loop did not force a novel route');
 assert.ok(movement.recovery>=1,'novel route did not commit to recovery');
 assert.equal(movement.banAxis,'horizontal','old corridor axis was not temporarily banned');
 assert.equal(movement.invalid,false,'non-item ambush was incorrectly allowed');
 assert.equal(movement.pruned,true,'non-item ambush was not cancelled');
 assert.equal(movement.cleared,true,'cancelled ambush remained active');
 assert.equal(movement.valid,true,'nearby exposed-item ambush was not allowed');
 assert.equal(movement.reason,'stuck','stationary watchdog did not identify stuck bot');
 assert.ok(movement.afterBreaks>movement.before,'stationary watchdog did not force movement');

 const social=await p.evaluate(()=>({answer:BomberStability139.answerFor('what map do you like?'),spectator:BomberStability139.debug.spectatorLine(),duel:BomberStability139.debug.duelLine(),question:BomberStability139.debug.question()}));
 assert.ok(social.answer&&social.answer.length>3,'question fallback answer missing');
 assert.ok(social.spectator&&social.spectator.length>5,'spectator reaction missing');
 assert.ok(social.duel&&social.duel.length>5,'final-two dialogue missing');
 assert.ok(typeof social.question==='string'&&social.question.trim().length>3,'personality question/prompt missing');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V139_STABILITY_SOCIAL PASS',JSON.stringify({publicGuard,movement,social}));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}