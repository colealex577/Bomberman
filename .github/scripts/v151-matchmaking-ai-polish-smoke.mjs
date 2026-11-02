import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text())&&!/PeerJS/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','V151Test');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberRelease150?.version==='v0.15.5'&&window.BomberMatchmaking151?.version==='v0.15.4.4'&&window.BomberPolish151?.version==='v0.15.1'&&window.BomberAI150?.version==='v0.15.0'&&window.BomberPreload150?.version==='v0.16.2.22'&&window.gGameEngine?.menu,{timeout:30000});
 assert.equal(await p.evaluate(()=>window.BomberBuildVersion),'v0.16.2.22');
 assert.equal(await p.title(),'Bomberman v0.16.2.22');
 const activity=await p.evaluate(()=>({overnight:BomberMatchmaking151.activityForHour(2),early:BomberMatchmaking151.activityForHour(7),day:BomberMatchmaking151.activityForHour(13),peak:BomberMatchmaking151.activityForHour(20)}));
 assert.equal(activity.overnight.band,'overnight');assert.equal(activity.peak.band,'peak');assert.ok(activity.overnight.activity<activity.early.activity&&activity.early.activity<activity.day.activity&&activity.day.activity<activity.peak.activity,'time-of-day activity model did not rise from overnight toward peak');assert.ok(activity.overnight.minSeconds>activity.peak.maxSeconds,'overnight empty-queue fallback was not clearly slower than peak hours');

 await p.evaluate(()=>BomberOnline.openLobby());
 await p.waitForFunction(()=>document.getElementById('publicMatchBtn')&&BomberMatchmaking151.debug?.captured(),{timeout:5000});
 console.log('V151_OWNER',await p.evaluate(()=>BomberMatchmaking151.debug.ownerSource()));
 const firstClick=await p.evaluate(async()=>{
   document.getElementById('publicMatchBtn').click();
   await new Promise(r=>setTimeout(r,350));
   const out={kind:B115.kind,role:B115.role,live:BomberMatchmaking151.isLive(),activity:B115.__v0154Activity,fallbackSeconds:B115.__v0154FallbackSeconds};
   B115.destroyNetwork();B115.kind='';B115.setRole('offline');
   return out;
 });
 assert.equal(firstClick.kind,'public','first click did not start public matchmaking');
 assert.ok(firstClick.role==='host'||firstClick.role==='guest','first click never entered a matchmaking role');
 assert.equal(firstClick.live,true,'matchmaking repair did not become live');assert.ok(firstClick.activity&&firstClick.activity.band,'public matchmaking did not capture a time-of-day activity band');assert.ok(firstClick.fallbackSeconds>=firstClick.activity.minSeconds&&firstClick.fallbackSeconds<=firstClick.activity.maxSeconds,'fallback timing was outside the selected time band');

 const farm=await p.evaluate(()=>({
   near:BomberPolish151.debug.betterFarm({base:5.2,rank:3,yield:3},{base:5,rank:1,yield:1}),
   far:BomberPolish151.debug.betterFarm({base:7,rank:3,yield:3},{base:5,rank:1,yield:1})
 }));
 assert.equal(farm.near,true,'multi-block farming did not win an otherwise-equal choice');
 assert.equal(farm.far,false,'farming yield overrode a clearly better route');

 const fumbleRates=await p.evaluate(()=>({
   high:BomberPolish151.fumbleChance({humanSkill:1}),
   low:BomberPolish151.fumbleChance({humanSkill:.08}),
   mid:BomberPolish151.fumbleChance({humanSkill:.54})
 }));
 assert.ok(Math.abs(fumbleRates.high-.01)<1e-9,'high-skill fumble rate was not 1%');
 assert.ok(Math.abs(fumbleRates.low-.04)<1e-9,'low-skill fumble rate was not 4%');
 assert.ok(fumbleRates.mid>fumbleRates.high&&fumbleRates.mid<fumbleRates.low,'mid-skill fumble rate did not scale between endpoints');

 await p.evaluate(()=>{B115.kind='public';B115.setRole('host');B115.startSimulated()});
 await p.waitForFunction(()=>B115.role==='simulated'&&gGameEngine.simulatedOpponent,{timeout:8000});
 const human=await p.evaluate(()=>{
   const sim=gGameEngine.simulatedOpponent,normal=(gGameEngine.bots||[]).find(b=>b&&!b.simulatedHuman),api=BomberPolish151.debug,vs=BomberPolish151.state(sim);
   sim.started=false;
   const fumble=api.forceFumble(sim),q=BomberPolish151.state(sim).humanQuirk;
   const normalFumble=normal?api.forceFumble(normal):false;
   BomberPolish151.state(sim).humanQuirk=null;BomberPolish151.state(sim).microCooldown=0;
   gGameEngine.bombs.length=0;
   const before={x:sim.position.x,y:sim.position.y},center=Utils.convertToBitmapPosition(sim.position),micro=api.forceMicro(sim),afterTarget={x:sim.targetPosition.x,y:sim.targetPosition.y},offset=Math.hypot(sim.targetBitmapPosition.x-center.x,sim.targetBitmapPosition.y-center.y);
   return{fumble,normalFumble,qType:q&&q.type,origin:q&&q.origin,drift:q&&q.drift,micro,before,afterTarget,offset};
 });
 assert.equal(human.fumble,true,'simulated human could not arm the missed-bomb correction');
 assert.equal(human.normalFumble,false,'standard AI received simulated-human fumble behavior');
 assert.equal(human.qType,'missed-bomb');
 assert.notDeepEqual(human.origin,human.drift,'missed-bomb correction had no false escape step');
 assert.equal(human.micro,true,'simulated human could not enter a fractional stance');
 assert.deepEqual(human.afterTarget,human.before,'fractional stance changed the logical grid tile');
 assert.ok(human.offset>=5&&human.offset<16,'fractional stance was outside the safe within-tile range');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V151_MATCHMAKING_AI_POLISH_SMOKE PASS',JSON.stringify({activity,firstClick,farm,fumbleRates,human}));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}