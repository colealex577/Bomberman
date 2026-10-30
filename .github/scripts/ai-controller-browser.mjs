import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.evaluateOnNewDocument(()=>{if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
 await p.goto(process.env.TEST_URL,{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.BomberMovementController&&window.gGameEngine?.menu);
 await p.evaluate(()=>{B115.setRole('offline');gGameEngine.menu.setMode('single')});
 await p.waitForFunction(()=>gGameEngine.bots?.length>=2);
 const r=await p.evaluate(()=>{
  const g=gGameEngine,d=BomberStability140.debug,a=g.bots[0],b=g.bots[1],realNow=Date.now;let now=realNow();Date.now=()=>now;
  const out={};
  try{
   g.tiles=g.tiles.filter(t=>t.material==='wall');g.bombs=[];g.bonuses=[];g.matchFinished=false;g.playing=true;g.menu.visible=false;
   // Each case below deliberately teleports/reuses the same bot. Reset the
   // v0.15 persistent-intent state between cases so this legacy controller test
   // isolates the movement behavior it was written to test. Real matches create
   // fresh bots on restart and do not teleport a live bot between scenarios.
   function place(bot,x,y){bot.position={x,y};const px=Utils.convertToBitmapPosition(bot.position);bot.bmp.x=px.x;bot.bmp.y=px.y;bot.clearEscapePlan();bot.__v140Motion=null;bot.__v134Bait=null;bot.__v150AI=null;bot.started=true;bot.alive=true;bot.bombs=[];bot.bombsMax=0;bot.setNextTile(bot.position)}
   function frames(n){for(let i=0;i<n;i++){now+=20;for(const bot of [a,b])if(bot.alive)bot.update();if(i%7===0)BomberGameplay134.debug.resolveReservations()}}
   // Actual Player collision, Bot update, all runtime wrappers and real board tiles.
   place(a,5,5);place(b,5,5);d.hardRecover(a,'stuck');d.hardRecover(b,'stuck');frames(90);
   out.separation=Math.hypot(a.bmp.x-b.bmp.x,a.bmp.y-b.bmp.y);
   b.alive=false;place(a,5,5);a.bmp.x-=18;a.setNextTile({x:5,y:5});const choose=a.chooseNextAction;a.chooseNextAction=()=>{};frames(20);out.centerError=Math.abs(a.bmp.x-5*g.tileSize);a.chooseNextAction=choose;
   place(a,7,5);const trail=[];for(let x=1;x<=13;x++)trail.push(x+',5');for(let x=12;x>=1;x--)trail.push(x+',5');for(let x=2;x<=7;x++)trail.push(x+',5');d.setTrail(a,trail);
   out.loop=BomberStability140.corridorProblem(a);out.exit=BomberStability140.forceNovelRoute(a,out.loop);let maxOff=0;for(let i=0;i<160;i++){frames(1);maxOff=Math.max(maxOff,Math.abs(a.position.y-5))}out.maxOff=maxOff;
   place(a,3,3);g.players[0].alive=true;g.players[0].position={x:13,y:11};const start=Math.abs(a.position.x-13)+Math.abs(a.position.y-11);frames(220);out.huntProgress=start-(Math.abs(a.position.x-13)+Math.abs(a.position.y-11));
   // A real threat's completed cover plan must survive the stationary watchdog.
   place(a,5,5);const bomb=new Bomb({x:1,y:1},1);g.bombs=[bomb];a.beginEscapePlan([{x:5,y:4},{x:5,y:5}],bomb);a.escapePathIndex=2;d.setStuck(a,2500);out.cover=BomberStability140.watchdog(a);out.keptCover=a.escapeMode;
   g.bombs=[];d.setStuck(a,2500);out.stale=BomberStability140.watchdog(a);out.cleared=!a.escapeMode;
   return out;
  }finally{Date.now=realNow;g.menu.visible=true}
 });
 assert.ok(r.separation>40,JSON.stringify(r));assert.ok(r.centerError<.01,JSON.stringify(r));assert.equal(r.loop,'horizontal');assert.equal(r.exit,true);assert.ok(r.maxOff>=2,JSON.stringify(r));assert.ok(r.huntProgress>5,JSON.stringify(r));assert.equal(r.cover,'');assert.equal(r.keptCover,true);assert.equal(r.stale,'escape-stale');assert.equal(r.cleared,true);
 assert.deepEqual(errors,[]);console.log('AI_CONTROLLER_BROWSER PASS',JSON.stringify(r));
}finally{await browser.close()}
