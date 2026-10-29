import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','LowPlayer');localStorage.setItem('BombermanRatingV1','0');localStorage.setItem('BombermanScoreV1Initialized','1');localStorage.removeItem('BombermanBestOfV130');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberPolish131?.version==='v0.13.1'&&window.BomberSocial130&&window.BomberLeaderboard127&&window.B115&&window.gGameEngine?.menu,{timeout:30000});
 const pools=await p.evaluate(()=>({start:B115.SIM_START,death:B115.SIM_DEATH,kill:B115.SIM_KILL}));
 assert.ok(pools.start.length>=35&&pools.death.length>=40&&pools.kill.length>=40,'message pools were not expanded');
 for(const msg of [...pools.start,...pools.death,...pools.kill])assert.equal(msg,msg.toLowerCase(),'non-lowercase casual message: '+msg);
 assert.ok([...pools.start,...pools.death,...pools.kill].some(x=>/srry|wait wha|bro i-|thot|lets do ths|good lu|nicee/.test(x)),'no typo/cut-off messages found');
 const q=await p.evaluate(()=>{const a=BomberPolish131.sampleTargets(4000),bins=[0,0,0,0];for(const v of a)bins[Math.min(3,Math.floor(v/251))]++;return bins});
 q.forEach((n,i)=>assert.ok(n>800&&n<1200,'target score quartile '+i+' not roughly even: '+q.join(',')));
 await p.evaluate(()=>BomberOnline.openLobby());await sleep(400);
 const lobby=await p.evaluate(()=>{const round=document.getElementById('v131RoundSets'),touch=document.getElementById('qolTouchSettings'),old=document.querySelector('#v127SettingsPanel .v130_set_section');return{visible:!document.getElementById('multiplayerLobby').hidden,round:!!round,roundDisplay:round&&getComputedStyle(round).display,touch:touch&&getComputedStyle(touch).display,desktop:BomberPolish131.isDesktop(),old:old&&getComputedStyle(old).display,text:document.getElementById('multiplayerLobby').innerText}});
 assert.equal(lobby.visible,true);assert.equal(lobby.round,true);assert.notEqual(lobby.roundDisplay,'none');assert.equal(lobby.old,'none');if(lobby.desktop)assert.equal(lobby.touch,'none');assert.ok(!/simulated/i.test(lobby.text),'multiplayer lobby still exposes simulated wording: '+lobby.text);
 await p.click('[data-v131-best="5"]');await sleep(80);assert.equal(await p.evaluate(()=>BomberSocial130.getBestOf()),5);assert.equal(await p.evaluate(()=>localStorage.getItem('BombermanBestOfV130')),'5');
 await p.evaluate(()=>{BomberPolish131.debug.forceTarget(950);B115.kind='public';B115.setRole('host');B115.startSimulated()});
 await p.waitForFunction(()=>B115.role==='simulated'&&!!B115.remoteName&&!!BomberLeaderboard127.profile(B115.remoteName),{timeout:10000});await sleep(550);
 const match=await p.evaluate(()=>{const prof=BomberLeaderboard127.profile(B115.remoteName),sim=gGameEngine.simulatedOpponent;return{target:BomberPolish131.lastTarget(),name:B115.remoteName,score:prof&&prof.score,local:Number(localStorage.getItem('BombermanRatingV1')),simScore:sim&&sim.rating,rank:prof&&prof.displayRank,status:B115.els.matchStatus&&B115.els.matchStatus.textContent}});
 assert.equal(match.target,950);assert.ok(Math.abs(match.score-950)<=30,'forced high-level opponent was not near target: '+JSON.stringify(match));assert.equal(match.local,0);assert.equal(match.simScore,match.score);assert.ok(match.rank>0);assert.ok(!/simulated/i.test(match.status||''));
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V131_POLISH_SMOKE PASS',JSON.stringify({bins:q,match}));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
