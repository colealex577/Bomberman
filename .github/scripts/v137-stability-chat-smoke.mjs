import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
async function wait(fn,msg,ms=12000){const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return}catch{}await sleep(70)}throw Error(msg)}
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','StabilityTester');localStorage.setItem('BombermanBestOfV130','3');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberStability137?.version==='v0.13.7'&&window.BomberChallenge136&&window.BomberLeaderboard127&&window.gGameEngine?.menu,{timeout:30000});
 assert.equal(await p.evaluate(()=>document.getElementById('buildVersion137')?.textContent),'v0.13.7');

 // Reproduce the reported empty multiplayer card: Map/Rounds stay visible while every core panel is hidden.
 await p.evaluate(()=>{BomberOnline.openLobby();['nameSetupPanel','lobbyChoice','privateMatchPanel','onlineWaitingPanel'].forEach(id=>{const e=document.getElementById(id);if(e)e.hidden=true})});
 await wait(()=>p.evaluate(()=>document.getElementById('lobbyChoice')&&!document.getElementById('lobbyChoice').hidden),'lobby choice did not self-repair',1800);
 const lobby=await p.evaluate(()=>({choice:!document.getElementById('lobbyChoice').hidden,map:!!document.getElementById('v133MultiMaps'),rounds:!!document.getElementById('v131RoundSets')}));
 assert.equal(lobby.choice,true);assert.equal(lobby.map,true);assert.equal(lobby.rounds,true);

 // Host/join search roles must not make chat flash before a round has actually started.
 const preChat=await p.evaluate(async()=>{B115.started=false;B115.kind='public';B115.setRole('host');await new Promise(r=>setTimeout(r,420));const panel=document.getElementById('chatPanel'),toggle=document.getElementById('chatToggleBtn');return{panel:getComputedStyle(panel).display,toggle:getComputedStyle(toggle).display,active:document.body.classList.contains('v137_chat_active')}});
 assert.equal(preChat.active,false);assert.equal(preChat.panel,'none');assert.equal(preChat.toggle,'none');
 await p.evaluate(()=>{B115.kind='';B115.setRole('offline');B115.started=false;const l=document.getElementById('multiplayerLobby');if(l)l.hidden=true;gGameEngine.lobbyOpen=false;gGameEngine.menu.show()});

 // GAME OVER / spectator banners must be cleared when returning to the menu.
 const cleaned=await p.evaluate(async()=>{const a=document.getElementById('spectatorBanner'),b=document.getElementById('remoteSpectatorBanner');if(a)a.hidden=false;if(b)b.hidden=false;gGameEngine.menu.show();await new Promise(r=>setTimeout(r,40));return{a:!a||a.hidden,b:!b||b.hidden}});
 assert.equal(cleaned.a,true);assert.equal(cleaned.b,true);

 // Stable leaderboard copy is rendered separately from legacy text that older loops still mutate.
 await p.evaluate(()=>BomberLeaderboard127.open());
 await p.waitForFunction(()=>document.getElementById('v137LeaderboardDesc')&&document.getElementById('v137LeaderboardNote'));
 const stable1=await p.evaluate(()=>({d:document.getElementById('v137LeaderboardDesc').textContent,n:document.getElementById('v137LeaderboardNote').textContent,oldD:getComputedStyle(document.querySelector('#v127LeaderboardPanel .v127_lb_head p')).display}));
 await sleep(900);
 const stable2=await p.evaluate(()=>({d:document.getElementById('v137LeaderboardDesc').textContent,n:document.getElementById('v137LeaderboardNote').textContent}));
 assert.deepEqual(stable2,{d:stable1.d,n:stable1.n});assert.equal(stable1.oldD,'none');

 // Normal challenge decisions take 3-5 seconds; use a currently accepting player so the test ends in a match.
 const challenged=await p.evaluate(()=>{const names=BomberLeaderboard127.population().map(x=>x.name),name=names.find(n=>BomberChallenge136.availability(n));if(!name)throw Error('no accepting challenge candidate');document.getElementById('v127LeaderboardPanel').hidden=true;const t=performance.now();const ok=BomberChallenge136.challenge(name);return{name,t,ok}});
 assert.equal(challenged.ok,true);
 await sleep(2400);
 assert.notEqual(await p.evaluate(()=>B115.role),'simulated','challenge resolved before 3 seconds');
 await wait(()=>p.evaluate(name=>B115.role==='simulated'&&B115.remoteName===name,challenged.name),'accepted challenge did not start',6000);
 const elapsed=await p.evaluate(t=>performance.now()-t,challenged.t);assert.ok(elapsed>=3000,'challenge delay '+elapsed);assert.ok(elapsed<=5600,'challenge delay '+elapsed);

 // Visible match text is stable; volatile post-round set text is replaced by a stable copy outside the rebuilt stats region.
 await sleep(500);
 const stableMatch=await p.evaluate(()=>({status:document.getElementById('v137MatchStatus')?.textContent||'',legacy:getComputedStyle(document.getElementById('onlineMatchStatus')).display,summary:document.getElementById('v132MatchSummary')?.textContent||'',summaryDisplay:document.getElementById('v132MatchSummary')?getComputedStyle(document.getElementById('v132MatchSummary')).display:'none',post:document.getElementById('v137PostSetSummary')?.textContent||'',volatile:document.querySelector('#v130PostStats>.v132_set_post')?getComputedStyle(document.querySelector('#v130PostStats>.v132_set_post')).display:'none'}));
 assert.ok(stableMatch.status.includes(challenged.name),stableMatch.status);assert.equal(stableMatch.legacy,'none');assert.notEqual(stableMatch.summaryDisplay,'none');assert.ok(/best of 3/i.test(stableMatch.summary),stableMatch.summary);assert.ok(/set/i.test(stableMatch.post),stableMatch.post);assert.equal(stableMatch.volatile,'none');
 const postBefore=stableMatch.post;await sleep(700);assert.equal(await p.evaluate(()=>document.getElementById('v137PostSetSummary')?.textContent||''),postBefore);

 // Simulated players support basic chat-back and roughly one third carry bot-related chatter personality.
 const rates=await p.evaluate(()=>{const names=BomberLeaderboard127.population().map(x=>x.name);return{bot:BomberStability137.debug.botRate(names),reply:BomberStability137.debug.forceReply('are you a bot?')}});
 assert.ok(rates.bot>.26&&rates.bot<.42,'bot-talk rate '+rates.bot);assert.ok(rates.reply&&rates.reply.length>1);
 await wait(()=>p.evaluate(reply=>Array.from(document.querySelectorAll('#chatMessages .chat_line')).some(x=>x.textContent.includes(reply)),rates.reply),'simulated chat reply did not appear',2500);

 // Detect a long corridor shuttle pattern that the old 10-position loop detector missed; escape mode is disabled so this isolates shuttle detection.
 const loop=await p.evaluate(()=>{const bot=gGameEngine.bots.find(b=>b&&b.alive!==false);if(!bot)return false;bot.escapeMode=false;bot.hyperAggressive=true;const trail=['1,1','2,1','3,1','4,1','5,1','6,1','7,1','8,1','9,1','8,1','7,1','6,1','5,1','4,1','3,1','2,1','1,1'];BomberStability137.debug.setTrail(bot,trail);return BomberStability137.longLoop(bot)});
 assert.equal(loop,true,'long shuttle loop was not detected');

 const delays=await p.evaluate(()=>Array.from({length:100},()=>BomberStability137.decisionDelay()));assert.ok(delays.every(x=>x>=3000&&x<=5000));
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V137_STABILITY_CHAT PASS',JSON.stringify({lobby,preChat,cleaned,stableMatch,elapsed,botRate:rates.bot}));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
