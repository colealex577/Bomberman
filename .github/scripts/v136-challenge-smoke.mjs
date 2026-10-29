import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
async function wait(fn,msg,ms=12000){const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return}catch{}await sleep(70)}throw Error(msg)}
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','ChallengeTester');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberChallenge136?.version==='v0.13.6'&&window.BomberLeaderboard127&&window.gGameEngine?.menu,{timeout:30000});
 assert.equal(await p.evaluate(()=>document.getElementById('buildVersion136')?.textContent),'v0.13.6');
 await p.evaluate(()=>BomberLeaderboard127.open());
 await p.waitForFunction(()=>document.querySelectorAll('#v127LeaderboardPanel .v136_challenge_btn').length>=49,{timeout:8000});
 const board=await p.evaluate(()=>({
  title:document.querySelector('#v127LeaderboardPanel .v127_lb_head h2')?.textContent,
  desc:document.querySelector('#v127LeaderboardPanel .v127_lb_head p')?.textContent,
  buttons:document.querySelectorAll('#v127LeaderboardPanel .v136_challenge_btn').length,
  cols:document.querySelectorAll('#v127LeaderboardPanel .v127_lb_columns > *').length,
  note:document.querySelector('#v127LeaderboardPanel .v127_lb_note')?.textContent
 }));
 assert.equal(board.title,'Leaderboard');assert.ok(!/simulat/i.test(board.desc||''));assert.ok(!/simulat/i.test(board.note||''));assert.ok(board.buttons>=49);assert.equal(board.cols,6);
 const distribution=await p.evaluate(()=>{
  const pop=BomberLeaderboard127.population(),names=pop.map(x=>x.name),fixed=Date.UTC(2026,9,29,20,0,0);
  const online=names.filter(n=>BomberChallenge136.availability(n,fixed)).length/names.length;
  const female=BomberChallenge136.debug.femaleRate(names),looks=names.map(n=>BomberChallenge136.appearanceFor(n));
  return{online,female,skins:[...new Set(looks.map(x=>x.skin))].length,hats:[...new Set(looks.map(x=>x.hat))].length,shoes:[...new Set(looks.map(x=>x.shoes))].length}
 });
 assert.ok(distribution.online>.22&&distribution.online<.38,'availability ratio '+distribution.online);assert.ok(distribution.female>.14&&distribution.female<.26,'female ratio '+distribution.female);assert.equal(distribution.skins,5);assert.equal(distribution.hats,3);assert.equal(distribution.shoes,5);
 await p.evaluate(()=>{document.getElementById('v127LeaderboardPanel').hidden=true;gGameEngine.menu.setMode('single')});
 await p.waitForFunction(()=>gGameEngine.bots&&gGameEngine.bots.length>=2&&!gGameEngine.menu.visible,{timeout:8000});
 const pass=await p.evaluate(()=>{
  const g=gGameEngine,D=BomberChallenge136.debug,bots=g.bots.filter(b=>b&&b.alive!==false);let a=null,b=null,target=null;
  for(const candidate of bots){for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){const q={x:candidate.position.x+d[0],y:candidate.position.y+d[1]};if(D.safeGrass(candidate,q)){a=candidate;target=q;break}}if(a)break}
  if(!a)return{ok:false,reason:'no safe bot neighbor'};b=bots.find(x=>x!==a);if(!b)return{ok:false,reason:'no second bot'};
  const savePos={x:b.position.x,y:b.position.y},saveTarget={x:b.targetPosition.x,y:b.targetPosition.y},before=a.__v136PassThroughs||0;
  b.position={x:target.x,y:target.y};b.targetPosition={x:target.x,y:target.y};a.setNextTile(target);
  const ok=a.targetPosition.x===target.x&&a.targetPosition.y===target.y&&(a.__v136PassThroughs||0)>before;
  b.position=savePos;b.targetPosition=saveTarget;return{ok,target:{...target},passes:a.__v136PassThroughs||0}
 });
 assert.equal(pass.ok,true,pass.reason||'AI did not target occupied safe tile');
 await p.evaluate(()=>gGameEngine.menu.show());await sleep(120);
 const target=await p.evaluate(()=>{const x=BomberLeaderboard127.population()[0];BomberChallenge136.debug.forceChallenge(x.name);return{name:x.name,score:x.score,appearance:BomberChallenge136.appearanceFor(x.name),skill:BomberCharacter.skillFromRating(x.score)}});
 await wait(()=>p.evaluate(name=>B115.role==='simulated'&&B115.remoteName===name&&!!gGameEngine.simulatedOpponent,target.name),'challenge match did not start',10000);
 await sleep(700);
 const match=await p.evaluate(()=>({name:B115.remoteName,rating:gGameEngine.simulatedOpponent.rating,skill:gGameEngine.simulatedOpponent.humanSkill,appearance:gGameEngine.simulatedAppearance,status:B115.els?.matchStatus?.textContent||''}));
 assert.equal(match.name,target.name);assert.equal(match.rating,target.score);assert.ok(Math.abs(match.skill-target.skill)<1e-9);assert.deepEqual(match.appearance,target.appearance);assert.ok(!/simulat/i.test(match.status),match.status);
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V136_CHALLENGE_SMOKE PASS',JSON.stringify({board,distribution,pass,target,match}));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
