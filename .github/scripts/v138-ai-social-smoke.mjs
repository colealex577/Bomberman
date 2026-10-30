import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
async function wait(fn,msg,ms=12000){const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return}catch{}await sleep(70)}throw Error(msg)}
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','MovementTester');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberAI138?.version==='v0.13.8'&&window.BomberStability137&&window.BomberLeaderboard127&&window.gGameEngine?.menu,{timeout:30000});
 assert.equal(await p.evaluate(()=>document.getElementById('buildVersion138')?.textContent),'v0.13.8');

 // Start a deterministic simulated match through the existing challenge path.
 const name=await p.evaluate(()=>BomberLeaderboard127.population().map(x=>x.name).find(n=>BomberChallenge136.availability(n))||BomberLeaderboard127.population()[0].name);
 await p.evaluate(name=>BomberStability137.debug.forceChallenge(name,'accept'),name);
 await wait(()=>p.evaluate(name=>B115.role==='simulated'&&B115.remoteName===name,name),'simulated match did not start',7000);
 await wait(()=>p.evaluate(()=>gGameEngine.bots&&gGameEngine.bots.some(b=>b&&b.alive!==false)),'no live bot',5000);

 const movement=await p.evaluate(()=>{
  const bot=gGameEngine.bots.find(b=>b&&b.simulatedHuman&&b.alive!==false)||gGameEngine.bots.find(b=>b&&b.alive!==false);if(!bot)throw Error('bot missing');
  bot.started=true;bot.escapeMode=false;gGameEngine.playing=true;gGameEngine.lobbyOpen=false;gGameEngine.menu.visible=false;
  bot.__v138BaseSpeed=gGameEngine.ultimateMode?4:2;bot.__v138Shoes=0;bot.velocity=.17;const base=BomberAI138.ensureSpeed(bot);
  bot.applyBonus({type:'speed'});const shoe=BomberAI138.ensureSpeed(bot),expected=base+(gGameEngine.ultimateMode?4:.8);
  bot.velocity=.11;bot.updateEndgameAggression();const afterAggro=BomberAI138.ensureSpeed(bot);
  const vertical=['5,1','5,2','5,3','5,4','5,5','5,6','5,7','5,6','5,5','5,4','5,3','5,2','5,1','5,2','5,3','5,4','5,5','5,6','5,7','5,6','5,5','5,4'];
  BomberAI138.debug.setTrail(bot,vertical);const axis=BomberAI138.axisProblem(bot);
  BomberAI138.debug.setTrail(bot,[]);BomberAI138.debug.setStuck(bot,2600);const stuckBefore=BomberAI138.problem(bot);BomberAI138.watchdog(bot);const st=BomberAI138.debug.state(bot);
  return{base,shoe,expected,afterAggro,axis,stuckBefore,breaks:st.breaks,recovery:st.recovery.length,speed:st.speed,shoes:st.shoes};
 });
 assert.equal(movement.shoe,movement.expected,'shoe speed was not exact');
 assert.equal(movement.afterAggro,movement.expected,'endgame aggression changed exact shoe speed');
 assert.equal(movement.axis,'vertical','vertical shuttle was not detected');
 assert.equal(movement.stuckBefore,'stuck','stationary watchdog did not detect a stuck bot');
 assert.ok(movement.breaks>=1,'watchdog did not force a movement break');
 assert.ok(movement.recovery>=1,'watchdog did not create a recovery route');
 assert.equal(movement.speed,movement.expected,'watchdog allowed a creep velocity');

 const social=await p.evaluate(()=>{
  const names=BomberLeaderboard127.population().map(x=>x.name),counts=BomberAI138.debug.personaRate(names),reply=BomberAI138.debug.reply('why are you moving so fast?');
  return{counts,reply,start:B115.SIM_START.length,death:B115.SIM_DEATH.length,kill:B115.SIM_KILL.length};
 });
 assert.ok(Object.keys(social.counts).length>=7,'not enough stable chat personalities: '+JSON.stringify(social.counts));
 assert.ok(social.reply&&social.reply.length>3,'contextual reply missing');
 assert.ok(social.start>=50&&social.death>=55&&social.kill>=55,'social pools were not expanded');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V138_AI_SOCIAL PASS',JSON.stringify({movement,social}));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
