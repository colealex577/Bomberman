import puppeteer from 'puppeteer-core';

const baseUrl=process.env.TEST_URL;
const executablePath=process.env.CHROME_PATH;
if(!baseUrl||!executablePath)throw new Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check'],timeout:30000});

async function makeClient(label,{ai=true,score=0,diff='normal'}={}){
  const context=await browser.createBrowserContext();
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e?.stack||e?.message||e)));
  page.on('console',m=>{if(m.text().startsWith('[connect]'))console.log(m.text());if(m.type()==='error'&&!/Failed to load resource:.*404/i.test(m.text()))errors.push('console: '+m.text())});
  await page.evaluateOnNewDocument(({ai,score,diff,label})=>{
    try{
      localStorage.setItem('BombermanMultiplayerAIEnabled',ai?'1':'0');
      localStorage.setItem('BombermanAIDifficultyV1',diff);
      localStorage.setItem('BombermanRatingV1',String(score));
      localStorage.setItem('BombermanScoreV1Initialized','1');
      localStorage.setItem('BombermanPlayerName',label);
    }catch(e){}
    try{if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({scope:location.href})}catch(e){}
  },{ai,score,diff,label});
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:20000});await page.waitForFunction(()=>window.BomberMultiplayer?.ready,{timeout:30000});
  await page.waitForFunction(()=>window.B115&&window.BomberDataSync&&window.BomberV124&&window.BomberV125&&BomberV125.version==='v0.12.5'&&typeof BomberV125.getDifficulty==='function'&&BomberV125.netInstalled&&BomberV125.connectInstalled&&gGameEngine?.menu&&document.getElementById('v125DifficultySetting'),{timeout:20000});
  console.log(label,'ready');
  return{context,page,errors,label};
}
async function waitFor(fn,timeout=20000,step=100){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return true;await sleep(step)}return false}
async function state(page){return page.evaluate(()=>({
  role:B115.role,started:B115.started,dataRole:BomberDataSync.role,ai:BomberV124.getAIEnabled(),difficulty:BomberV125.getDifficulty(),path:BomberV125.connectionPath,
  players:gGameEngine.players.map(p=>({alive:p.alive,x:p.bmp.x,y:p.bmp.y,gx:p.position.x,gy:p.position.y,v:p.velocity,bm:p.bombsMax,bs:p.bombStrength,escape:p.escapeBomb&&p.escapeBomb.__dataNetId||''})),
  bots:gGameEngine.bots.map(b=>({sim:!!b.simulatedHuman,v:b.velocity,d:b.v125Difficulty||''})),
  bombs:gGameEngine.bombs.filter(b=>b&&!b.exploded).map(b=>({id:b.__dataNetId||'',x:b.position.x,y:b.position.y,owner:b.__v125OwnerSlot})),
  version:document.getElementById('buildVersion125')?.textContent
}))}
async function connect(A,B,id,{ai=false,diff='normal',reverse=false}={}){
  await A.page.evaluate(({id,ai,diff})=>{BomberV124.setAIEnabled(ai);BomberV125.setDifficulty(diff);B115.privateId=()=>id;B115.els.privateCode.value='9';B115.els.name.value='Host125';B115.startPrivateHost()},{id,ai,diff});
  await sleep(700);
  await B.page.evaluate(({id,reverse})=>{BomberV125.forceReverseForTest=!!reverse;B115.privateId=()=>id;B115.els.privateCode.value='9';B115.els.name.value='Guest125';B115.startPrivateJoin()},{id,reverse});
  const ok=await waitFor(async()=>{const [a,b]=await Promise.all([state(A.page),state(B.page)]);return a.started&&b.started&&a.role==='host'&&b.role==='guest'&&a.dataRole==='host'&&b.dataRole==='guest'},25000,150);
  if(!ok)throw new Error('pair did not connect');
  await sleep(900);
}
async function closeClient(c){await c?.context.close().catch(()=>{})}
async function humanPoints(page){return page.evaluate(()=>{
  const out={};for(const slot of [0,3]){const box=document.querySelector('.qol_stat_box[data-slot="'+slot+'"]');out[slot]={points:box?.querySelector('.v125_points')?.textContent||'',pseudo:box?getComputedStyle(box.querySelector('.qol_stat_name'),'::after').content:''}}
  return out;
})}

let A,B,C,D;
try{
  // Reverse-connect path + difficulty sync + stable point labels.
  A=await makeClient('Host125',{ai:true,score:610,diff:'hard'});
  B=await makeClient('Guest125',{ai:true,score:830,diff:'easy'});
  const ui=await A.page.evaluate(()=>({version:document.getElementById('buildVersion125')?.textContent,buttons:[...document.querySelectorAll('[data-v125-diff]')].map(x=>x.textContent)}));
  if(ui.version!=='v0.12.5'||ui.buttons.join(',')!=='Easy,Normal,Hard,Expert')throw new Error('v0.12.5 difficulty UI missing: '+JSON.stringify(ui));
  await connect(A,B,'bomberman-v125-reverse-'+Date.now(),{ai:true,diff:'hard',reverse:true});
  let [a,b]=await Promise.all([state(A.page),state(B.page)]);
  console.log('REVERSE_HOST',JSON.stringify(a));console.log('REVERSE_GUEST',JSON.stringify(b));
  if(a.path!=='reverse-host'||b.path!=='reverse-guest')throw new Error('reverse hosting fallback was not used');
  if(a.difficulty!=='hard'||b.difficulty!=='hard')throw new Error('AI difficulty did not synchronize from host');
  if(a.bots.filter(x=>!x.sim).length!==2||b.bots.filter(x=>!x.sim).length!==2)throw new Error('AI bots missing in difficulty test');
  if(a.bots.filter(x=>!x.sim).some(x=>Math.abs(x.v-2.4)>.05)||b.bots.filter(x=>!x.sim).some(x=>Math.abs(x.v-2.4)>.08))throw new Error('hard difficulty speed not applied consistently');
  const expected=JSON.stringify([{0:{points:'610',pseudo:'none'},3:{points:'830',pseudo:'none'}},{0:{points:'610',pseudo:'none'},3:{points:'830',pseudo:'none'}}]);
  const labelsReady=await waitFor(async()=>JSON.stringify(await Promise.all([humanPoints(A.page),humanPoints(B.page)]))===expected,5000,70);
  if(!labelsReady)throw new Error('point labels did not populate with the correct player scores');
  const samples=[];for(let i=0;i<12;i++){samples.push(await Promise.all([humanPoints(A.page),humanPoints(B.page)]));await sleep(70)}
  for(const s of samples){if(JSON.stringify(s)!==expected)throw new Error('point labels flicker or map to wrong player: '+JSON.stringify(s))}
  console.log('REVERSE_DIFFICULTY_SCORE PASS');
  if([...A.errors,...B.errors].length)throw new Error('phase 1 browser errors: '+[...A.errors,...B.errors].join(' | '));
  await closeClient(A);await closeClient(B);A=B=null;

  // Movement, press-time bombs, escape, pickups and stale snapshots are now exercised
  // by authoritative-network-test.mjs under real transport delay. The retired fixture
  // teleported the guest while disabling position transmission; accepting that teleport
  // would violate host authority. Keep reverse connectivity/difficulty/profile regressions here.
  console.log('V125_NETCODE_SMOKE PASS');
}finally{
  await closeClient(A);await closeClient(B);await closeClient(C);await closeClient(D);await browser.close().catch(()=>{});
}
