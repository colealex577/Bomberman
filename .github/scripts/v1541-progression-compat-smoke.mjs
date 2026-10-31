import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text())&&!/PeerJS/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','Progress1541');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberRelease150?.version==='v0.15.5'&&window.BomberObserver153?.version==='v0.15.3.2'&&window.BomberObserver153?.handledObserveSerial&&window.BomberHumanObserver152?.debug?.primeObservedRound&&window.gGameEngine?.menu,{timeout:30000});
 await p.evaluate(()=>BomberOnline.openLobby());await p.waitForFunction(()=>document.getElementById('v152ObserveBtn'),{timeout:5000});await p.click('#v152ObserveBtn');
 await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='observe'&&gGameEngine.bots?.length===4&&BomberObserver153.handledObserveSerial()===BomberHumanObserver152.state().roundSerial,{timeout:10000});
 const states=await p.evaluate(()=>{const out=[];for(let n=1;n<=10;n++){BomberHumanObserver152.debug.primeObservedRound(n);out.push(BomberObserver153.audit())}return out});
 assert.equal(states.length,10);for(let i=0;i<10;i++){const a=states[i];assert.equal(a.state,i+1,`state ${i+1} did not prime`);assert.ok(a.bonusCap<=4,`state ${i+1} exposes too many pickups`);assert.ok(a.visibleBonuses<=a.bonusCap,`state ${i+1} exceeded pickup cap`);assert.equal(a.duplicateActors,false,`state ${i+1} overlaps actors`);assert.equal(a.actorPaths,true,`state ${i+1} stranded an actor`);if(i>0)assert.ok(a.removedWood>=states[i-1].removedWood,`wood removal regressed at state ${i+1}`)}
 for(const l of states[0].loadouts)assert.ok(l.bomb+l.fire+l.speed<=1,'opening state gives too many upgrades');
 for(const l of states[9].loadouts){assert.ok(l.bomb>=2,'late state missing bomb upgrades');assert.ok(l.fire>=2,'late state missing fire upgrades');assert.ok(l.speed>=2,'late state missing speed upgrades')}
 const serial=await p.evaluate(()=>({round:BomberHumanObserver152.state().roundSerial,handled:BomberObserver153.handledObserveSerial()}));assert.equal(serial.handled,serial.round,'progression serial handshake is out of sync');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V1541_PROGRESSION_COMPAT_SMOKE PASS',JSON.stringify({serial,first:states[0],last:states[9]}));
} finally {await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
