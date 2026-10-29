import puppeteer from 'puppeteer-core';

const baseUrl=process.env.TEST_URL;
const executablePath=process.env.CHROME_PATH;
if(!urlSafe(baseUrl)||!executablePath)throw new Error('TEST_URL/CHROME_PATH missing');
function urlSafe(v){return typeof v==='string'&&v.length>0}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check'],timeout:30000});

async function makeClient(label,aiPref=true){
 const context=await browser.createBrowserContext();
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e?.stack||e?.message||e)));
 page.on('console',m=>{if(m.text().startsWith('[connect]'))console.log(m.text());if(m.type()==='error'&&!/Failed to load resource:.*404/i.test(m.text()))errors.push('console: '+m.text())});
 await page.evaluateOnNewDocument(pref=>{try{localStorage.setItem('BombermanMultiplayerAIEnabled',pref?'1':'0')}catch(e){}try{if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({scope:location.href})}catch(e){}},aiPref);
 await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:20000});await page.waitForFunction(()=>window.BomberMultiplayer?.ready,{timeout:30000});
 await page.waitForFunction(()=>window.B115&&window.BomberV124&&BomberV124.version==='v0.12.4'&&window.BomberDataSync&&B115.__dataSyncInstalled&&document.getElementById('v124AiToggle')&&gGameEngine?.menu,{timeout:18000});
 console.log(label,'ready');
 return{context,page,errors,label};
}
async function waitFor(fn,timeout=20000,step=100){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return true;await sleep(step)}return false}
async function snapshot(page){return page.evaluate(()=>({
 role:B115.role,started:B115.started,dataActive:!!BomberDataSync.active,dataRole:BomberDataSync.role,ai:BomberV124.getAIEnabled(),players:gGameEngine.players.map(p=>({alive:p.alive,x:p.bmp.x,y:p.bmp.y})),bots:gGameEngine.bots.map(b=>({alive:b.alive,sim:!!b.simulatedHuman,x:b.bmp.x,y:b.bmp.y})),bombs:gGameEngine.bombs.filter(b=>b&&!b.exploded).map(b=>({id:b.__dataNetId||'',x:b.position.x,y:b.position.y,t:b.timer})),actions:{up2:!!gInputEngine.actions.up2,down2:!!gInputEngine.actions.down2,left2:!!gInputEngine.actions.left2,right2:!!gInputEngine.actions.right2,bomb2:!!gInputEngine.actions.bomb2},elim:document.getElementById('qolEliminated')&&!document.getElementById('qolEliminated').hidden,earlyBtn:(()=>{const n=document.getElementById('v127RematchNow'),o=document.getElementById('qolElimRematchNow');return !!((n&&!n.hidden&&getComputedStyle(n).display!=='none')||(o&&!o.hidden&&getComputedStyle(o).display!=='none'))})(),prompt:document.getElementById('qolRematchPrompt')&&!document.getElementById('qolRematchPrompt').hidden,version:document.getElementById('buildVersion124')?.textContent}))}
async function clickEarly(page){await page.evaluate(()=>{const n=document.getElementById('v127RematchNow'),o=document.getElementById('qolElimRematchNow'),b=n&&!n.hidden&&getComputedStyle(n).display!=='none'?n:o;if(!b)throw new Error('no visible early rematch control');b.click()})}
async function connectPair(A,B,peerId,hostAI){
 await A.page.evaluate(({id,hostAI})=>{BomberV124.setAIEnabled(hostAI);B115.privateId=()=>id;B115.els.privateCode.value='9';B115.els.name.value='Host124';B115.startPrivateHost()},{id:peerId,hostAI});
 await sleep(850);
 await B.page.evaluate(id=>{B115.privateId=()=>id;B115.els.privateCode.value='9';B115.els.name.value='Guest124';B115.startPrivateJoin()},peerId);
 const ok=await waitFor(async()=>{const [a,b]=await Promise.all([snapshot(A.page),snapshot(B.page)]);return a.started&&b.started&&a.role==='host'&&b.role==='guest'&&a.dataActive&&b.dataActive&&a.dataRole==='host'&&b.dataRole==='guest'},25000,200);
 if(!ok)throw new Error('pair did not connect');
 await sleep(900);
}
async function closeClient(c){await c?.context.close().catch(()=>{})}

let A,B,C,D;
try{
 A=await makeClient('AI-HOST',true);B=await makeClient('AI-GUEST',false);
 const ui=await A.page.evaluate(()=>({version:document.getElementById('buildVersion124')?.textContent,toggle:document.getElementById('v124AiToggle')?.textContent,note:document.getElementById('v124AiNote')?.textContent}));
 console.log('V124_UI',JSON.stringify(ui));
 if(ui.version!=='v0.12.4'||!ui.toggle||!ui.note)throw new Error('v0.12.4 AI setting UI missing');
 await connectPair(A,B,'bomberman-v124-ai-'+Date.now(),true);
 let [a,b]=await Promise.all([snapshot(A.page),snapshot(B.page)]);
 console.log('AI_ON_HOST',JSON.stringify(a));console.log('AI_ON_GUEST',JSON.stringify(b));
 if(!a.ai||!b.ai||a.bots.filter(x=>!x.sim).length!==2||b.bots.filter(x=>!x.sim).length!==2)throw new Error('AI-on setting did not synchronize two normal bots');
 await A.page.evaluate(()=>gGameEngine.players[1].die());
 const elimReady=await waitFor(async()=>{const s=await snapshot(B.page);return s.elim&&s.earlyBtn},6000,100);
 if(!elimReady)throw new Error('early rematch button did not appear for eliminated human with AI alive');
 await clickEarly(B.page);
 const promptReady=await waitFor(async()=>{const s=await snapshot(A.page);return s.prompt},5000,100);
 if(!promptReady)throw new Error('early rematch request did not reach surviving human');
 await A.page.click('#qolRematchAccept');
 const restarted=await waitFor(async()=>{const [x,y]=await Promise.all([snapshot(A.page),snapshot(B.page)]);return x.players.length===2&&y.players.length===2&&x.players.every(p=>p.alive)&&y.players.every(p=>p.alive)&&!y.elim},8000,150);
 if(!restarted)throw new Error('accepted early rematch did not restart both clients');
 console.log('EARLY_REMATCH PASS');
 await closeClient(A);await closeClient(B);A=B=null;

 C=await makeClient('NOAI-HOST',true);D=await makeClient('NOAI-GUEST',true);
 await connectPair(C,D,'bomberman-v124-noai-'+Date.now(),false);
 [a,b]=await Promise.all([snapshot(C.page),snapshot(D.page)]);
 console.log('AI_OFF_HOST',JSON.stringify(a));console.log('AI_OFF_GUEST',JSON.stringify(b));
 if(a.ai||b.ai||a.bots.filter(x=>!x.sim).length!==0||b.bots.filter(x=>!x.sim).length!==0)throw new Error('AI-off setting did not remove normal multiplayer bots on both clients');
 const before=b.players[1];
 await D.page.keyboard.down('ArrowUp');await sleep(240);let moved=await snapshot(D.page);await D.page.evaluate(()=>window.dispatchEvent(new Event('blur')));await sleep(120);let released=await snapshot(D.page);if(!moved.actions.up2||released.actions.up2)throw new Error('multiplayer movement input did not recover cleanly after blur');await D.page.keyboard.up('ArrowUp').catch(()=>{});
 await D.page.keyboard.down('ArrowUp');await sleep(180);await D.page.keyboard.up('ArrowUp');await sleep(80);let afterMove=await snapshot(D.page);if(afterMove.players[1].y>=before.y)throw new Error('guest movement did not resume after focus/input recovery');
 await D.page.keyboard.down('Shift');await sleep(80);await D.page.keyboard.up('Shift');
 const oneBomb=await waitFor(async()=>{const [x,y]=await Promise.all([snapshot(C.page),snapshot(D.page)]);return x.bombs.length===1&&y.bombs.length===1&&x.bombs[0].id&&y.bombs[0].id===x.bombs[0].id},4000,80);if(!oneBomb)throw new Error('single bomb press did not produce one authoritative network bomb');
 const cleared=await waitFor(async()=>{const [x,y]=await Promise.all([snapshot(C.page),snapshot(D.page)]);return x.bombs.length===0&&y.bombs.length===0},5500,100);if(!cleared)throw new Error('authoritative bomb did not clear normally');
 if([...C.errors,...D.errors].length)throw new Error('browser errors: '+[...C.errors,...D.errors].join(' | '));
 console.log('V124_MULTIPLAYER_SMOKE PASS');
}finally{await closeClient(A);await closeClient(B);await closeClient(C);await closeClient(D);await browser.close().catch(()=>{})}

