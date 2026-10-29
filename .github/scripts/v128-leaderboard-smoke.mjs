import puppeteer from 'puppeteer-core';
const baseUrl=process.env.TEST_URL,executablePath=process.env.CHROME_PATH;if(!baseUrl||!executablePath)throw new Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check'],timeout:30000});
const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(String(e?.stack||e?.message||e)));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource:.*404/i.test(m.text()))errors.push('console: '+m.text())});
try{
 await page.evaluateOnNewDocument(()=>{try{localStorage.setItem('BombermanPlayerName','ColeRank');localStorage.setItem('BombermanRatingV1','0');localStorage.setItem('BombermanScoreV1Initialized','1')}catch(e){}try{if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({scope:location.href})}catch(e){}});
 await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:20000});
 await page.waitForFunction(()=>window.BomberLeaderboard127&&BomberLeaderboard127.population&&BomberLeaderboard127.rank&&window.BomberV127&&gGameEngine?.menu,{timeout:20000});
 const audit=await page.evaluate(()=>{
  const pop=BomberLeaderboard127.population(),top=BomberLeaderboard127.top50(),r0=BomberLeaderboard127.rank(0,'ColeRank'),r50=BomberLeaderboard127.rank(top[49].score,'ThresholdUser');
  const cats=pop.reduce((a,p)=>(a[p.category]=(a[p.category]||0)+1,a),{}),topCats=top.reduce((a,p)=>(a[p.category]=(a[p.category]||0)+1,a),{});
  const now=Date.now(),future=now+5*60*1000+1000,sample=pop.filter(p=>p.baseScore>0).slice(0,40);
  const changed=sample.filter(p=>BomberLeaderboard127.profileAt(p.name,now)?.score!==BomberLeaderboard127.profileAt(p.name,future)?.score).length;
  return{count:pop.length,topCount:top.length,cats,topCats,r0,r50,fiftieth:top[49].score,changed,first:top[0],last:top[49]};
 });
 console.log('LEADERBOARD_AUDIT',JSON.stringify(audit));
 if(audit.count!==599||audit.topCount!==50)throw new Error('simulated population/top50 size incorrect');
 if(!(audit.cats.gamer>100&&audit.cats.male>50&&audit.cats.number>200))throw new Error('name style mix is missing');
 if(!(audit.topCats.gamer>0&&audit.topCats.male>0&&audit.topCats.number>0))throw new Error('top 50 does not contain all requested name styles');
 if(audit.r0<500||audit.r0>600)throw new Error('0-point rank not around #500-600: '+audit.r0);
 if(audit.r50<35||audit.r50>70)throw new Error('rank does not approach top 50 near 50th-place score: '+JSON.stringify(audit));
 if(audit.changed<5)throw new Error('leaderboard does not change dynamically between live buckets');
 await page.evaluate(()=>{localStorage.setItem('BombermanRatingV1','990');BomberLeaderboard127.open()});await sleep(100);
 const climb=await page.evaluate(()=>({rank:BomberLeaderboard127.rankForPlayer(),inTop:!!document.querySelector('#v127LbList .v127_lb_row.you'),youText:document.getElementById('v127LbYou')?.textContent||''}));
 console.log('PLAYER_CLIMB',JSON.stringify(climb));
 if(climb.rank>10||!climb.inTop)throw new Error('high-score player did not enter visible top 50');
 await page.click('#v127LeaderboardPanel .v127_lb_close');await page.evaluate(()=>{localStorage.setItem('BombermanRatingV1','0');B115.kind='public';B115.setRole('host');B115.startSimulated()});await sleep(850);
 const live=await page.evaluate(()=>{
  const p=BomberLeaderboard127.profile(B115.remoteName),sim=gGameEngine.simulatedOpponent,box=sim&&document.querySelector('.qol_stat_box[data-slot="'+sim.statSlot+'"]');
  return{name:B115.remoteName,profile:p,simScore:sim?.rating,simRank:sim?.leaderboardRank,status:B115.els.matchStatus?.textContent||'',hudRank:box?.getAttribute('data-rank')||'',inPopulation:BomberLeaderboard127.population().some(x=>x.name===B115.remoteName)};
 });
 console.log('LIVE_RANKED_OPPONENT',JSON.stringify(live));
 if(!live.inPopulation||!live.profile)throw new Error('matched simulated opponent is not from leaderboard population');
 if(live.simScore!==live.profile.score)throw new Error('matched opponent score differs from leaderboard score');
 if(Number(live.simRank)!==Number(live.profile.displayRank))throw new Error('matched opponent rank differs from leaderboard position');
 if(live.hudRank!==String(live.profile.displayRank)||!live.status.includes('(#'+live.profile.displayRank+')'))throw new Error('in-game HUD/status does not show opponent leaderboard rank');
 if(errors.length)throw new Error('browser errors: '+errors.join(' | '));
 console.log('V128_LEADERBOARD_SMOKE PASS');
}finally{await context.close().catch(()=>{});await browser.close().catch(()=>{})}
