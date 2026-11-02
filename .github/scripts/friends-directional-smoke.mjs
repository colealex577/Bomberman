import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const contexts=[],errors=[];
async function client(name,rating,wins,losses){const ctx=await browser.createBrowserContext(),p=await ctx.newPage();contexts.push(ctx);p.on('pageerror',e=>errors.push(name+': '+String(e.stack||e)));await p.evaluateOnNewDocument(v=>{localStorage.setItem('BombermanPlayerName',v.name);localStorage.setItem('BombermanRatingV1',String(v.rating));localStorage.setItem('BombermanPlayerWinsV1',String(v.wins));localStorage.setItem('BombermanPlayerLossesV1',String(v.losses));localStorage.setItem('BombermanScoreV1Initialized','1');navigator.serviceWorker.register=()=>Promise.resolve({})}, {name,rating,wins,losses});await p.goto(process.env.TEST_URL,{waitUntil:'domcontentloaded',timeout:30000});await p.waitForFunction(()=>window.BomberFriends16225?.version==='v0.16.2.25'&&window.BomberPublicPresence16223&&window.BomberMultiplayer?.ready,{timeout:45000});return p}
async function wait(fn,msg,ms=20000){const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await sleep(80)}throw new Error(msg)}
try{
 const host=await client('FriendHost',730,14,6),guest=await client('FriendGuest',610,8,7);const room='bomberman-friends-'+Date.now();
 await host.evaluate(id=>{B115.PUBLIC=[id];BomberV124.setAIEnabled(false);BomberPublicPresence16223.startHost()},room);
 await wait(()=>host.evaluate(()=>B115.role==='host'&&B115.peer?.open), 'friends host did not open',20000);
 await guest.evaluate(id=>{B115.PUBLIC=[id];BomberV124.setAIEnabled(false);BomberPublicPresence16223.startJoin()},room);
 await wait(()=>guest.evaluate(()=>B115.role==='guest'&&B115.conn?.open&&BomberDataSync.role==='guest'),'friends guest did not connect',30000);
 await wait(()=>host.evaluate(()=>BomberFriends16225.directory().some(x=>x.name==='FriendGuest'&&x.rating===610&&x.wins===8&&x.losses===7)),'host did not persist guest friend stats',10000);
 await wait(()=>guest.evaluate(()=>BomberFriends16225.directory().some(x=>x.name==='FriendHost'&&x.rating===730&&x.wins===14&&x.losses===6)),'guest did not persist host friend stats',10000);
 console.log('FRIEND_HISTORY_GOSSIP PASS');
 const viewer=await client('FriendViewer',300,1,1);
 await viewer.evaluate(id=>{B115.PUBLIC=[id];BomberFriends16225.refreshOnline()},room);
 await sleep(4500);
 console.log('FRIEND_VIEWER_DIRECTORY',JSON.stringify(await viewer.evaluate(()=>BomberFriends16225.directory())));
 console.log('FRIEND_VIEWER_ONLINE',JSON.stringify(await viewer.evaluate(()=>BomberFriends16225.online())));
 await wait(()=>viewer.evaluate(()=>BomberFriends16225.directory().some(x=>x.name==='FriendHost')&&Object.values(BomberFriends16225.online()).some(x=>x.profile?.name==='FriendHost')),'viewer did not discover online host friend',12000);
 await viewer.evaluate(()=>BomberFriends16225.showFriends());
 await wait(()=>viewer.evaluate(()=>{const t=document.getElementById('v16225FriendList')?.innerText||'';return /FriendHost/.test(t)&&/Online now/.test(t)&&/Challenge/.test(t)&&/Observe match/.test(t)}),'Friends tab did not render online actions',8000);
 assert.equal(await viewer.evaluate(()=>document.querySelector('#v16225Tabs [data-tab="friends"]')?.classList.contains('active')),true);
 console.log('FRIENDS_TAB_ONLINE_ACTIONS PASS');
 await viewer.evaluate(()=>{const b=[...document.querySelectorAll('[data-friend-action="observe"]')].find(x=>x.closest('.v16225_friend_row')?.innerText.includes('FriendHost'));if(!b)throw Error('observe button missing');b.click()});
 await wait(()=>viewer.evaluate(()=>BomberPublicPresence16223.state().mode==='spectator'),'Friends Observe Match did not target the friend match',20000);
 console.log('FRIEND_OBSERVE_TARGET PASS');
 if(errors.length)throw new Error('browser errors: '+errors.join(' | '));
 console.log('FRIENDS_DIRECTIONAL_SMOKE PASS');
}finally{await Promise.all(contexts.map(c=>c.close().catch(()=>{})));await browser.close().catch(()=>{})}
