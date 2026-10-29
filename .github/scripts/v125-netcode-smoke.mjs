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
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource:.*404/i.test(m.text()))errors.push('console: '+m.text())});
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
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:20000});
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
  const samples=[];for(let i=0;i<12;i++){samples.push(await Promise.all([humanPoints(A.page),humanPoints(B.page)]));await sleep(70)}
  const expected=JSON.stringify([{0:{points:'610',pseudo:'none'},3:{points:'830',pseudo:'none'}},{0:{points:'610',pseudo:'none'},3:{points:'830',pseudo:'none'}}]);
  for(const s of samples){if(JSON.stringify(s)!==expected)throw new Error('point labels flicker or map to wrong player: '+JSON.stringify(s))}
  console.log('REVERSE_DIFFICULTY_SCORE PASS');
  if([...A.errors,...B.errors].length)throw new Error('phase 1 browser errors: '+[...A.errors,...B.errors].join(' | '));
  await closeClient(A);await closeClient(B);A=B=null;

  // Client-owned guest movement, press-time bomb tile, power-up authority.
  C=await makeClient('HostMove',{ai:false,score:120,diff:'normal'});
  D=await makeClient('GuestMove',{ai:false,score:340,diff:'normal'});
  await connect(C,D,'bomberman-v125-move-'+Date.now(),{ai:false,diff:'normal',reverse:false});
  [a,b]=await Promise.all([state(C.page),state(D.page)]);
  if(a.ai||b.ai||a.bots.length||b.bots.length)throw new Error('AI-off match unexpectedly has bots');

  const ys=[];await D.page.keyboard.down('ArrowUp');
  for(let i=0;i<14;i++){await sleep(32);ys.push((await state(D.page)).players[1].y)}
  await D.page.keyboard.up('ArrowUp');await sleep(220);
  for(let i=1;i<ys.length;i++)if(ys[i]>ys[i-1]+0.3)throw new Error('guest was rubber-banded backward while moving: '+JSON.stringify(ys));
  [a,b]=await Promise.all([state(C.page),state(D.page)]);
  const moveDist=Math.hypot(a.players[1].x-b.players[1].x,a.players[1].y-b.players[1].y);
  if(moveDist>8)throw new Error('host did not follow guest-owned movement closely: '+moveDist);
  console.log('SMOOTH_MOVE PASS',JSON.stringify(ys));

  // Freeze movement transmission so host is deliberately one tile behind; bomb must still use guest press-time tile.
  await D.page.evaluate(()=>{BomberV125.pauseMoveForTest=true});
  await D.page.keyboard.down('ArrowUp');await sleep(340);await D.page.keyboard.up('ArrowUp');await sleep(50);
  const intended=await D.page.evaluate(()=>({x:gGameEngine.players[1].position.x,y:gGameEngine.players[1].position.y,px:gGameEngine.players[1].bmp.x,py:gGameEngine.players[1].bmp.y}));
  const staleHost=await C.page.evaluate(()=>({x:gGameEngine.players[1].position.x,y:gGameEngine.players[1].position.y}));
  if(intended.x===staleHost.x&&intended.y===staleHost.y)throw new Error('test failed to create stale host position');
  await D.page.keyboard.down('Shift');await sleep(65);await D.page.keyboard.up('Shift');
  const bombOK=await waitFor(async()=>{const [x,y]=await Promise.all([state(C.page),state(D.page)]);return x.bombs.some(z=>z.x===intended.x&&z.y===intended.y&&z.id)&&y.bombs.some(z=>z.x===intended.x&&z.y===intended.y&&z.id)},5000,80);
  if(!bombOK){const [x,y]=await Promise.all([state(C.page),state(D.page)]);throw new Error('bomb did not use press-time guest tile. intended='+JSON.stringify(intended)+' staleHost='+JSON.stringify(staleHost)+' host='+JSON.stringify(x.bombs)+' guest='+JSON.stringify(y.bombs))}
  b=await state(D.page);const ownBomb=b.bombs.find(z=>z.x===intended.x&&z.y===intended.y);if(!ownBomb||b.players[1].escape!==ownBomb.id)throw new Error('guest own bomb did not grant escape-through protection');
  await D.page.evaluate(()=>{BomberV125.pauseMoveForTest=false;BomberV125.sendMove()});
  const beforeEscape=(await state(D.page)).players[1].y;await D.page.keyboard.down('ArrowUp');await sleep(230);await D.page.keyboard.up('ArrowUp');await sleep(150);const afterEscape=(await state(D.page)).players[1].y;if(!(afterEscape<beforeEscape-2))throw new Error('guest got stuck behind own bomb after placement');
  console.log('PRESS_TILE_BOMB_ESCAPE PASS');
  await waitFor(async()=>{const [x,y]=await Promise.all([state(C.page),state(D.page)]);return x.bombs.length===0&&y.bombs.length===0},5500,100);

  // Seed one visible speed pickup on both copies, then let host confirm the guest pickup.
  const pickup=await C.page.evaluate(()=>{
    const p=gGameEngine.players[1],pos={x:p.position.x,y:p.position.y},b=new Bonus(pos,0);gGameEngine.bonuses.push(b);
    const wood=gGameEngine.tiles.filter(t=>t.material==='wood').map(t=>t.position.y*17+t.position.x);
    const typeIndex=x=>x.type==='bomb'?1:x.type==='fire'?2:x.type==='heart'?3:0;
    const bonus=gGameEngine.bonuses.map(x=>[x.position.y*17+x.position.x,typeIndex(x)]);
    B115.send({type:'dataWorld',world:{wood,bonus}});
    return{x:pos.x,y:pos.y,i:pos.y*17+pos.x,before:p.velocity};
  });
  const visible=await waitFor(()=>D.page.evaluate(({x,y})=>gGameEngine.bonuses.some(b=>b.position.x===x&&b.position.y===y),pickup),3000,80);
  if(!visible)throw new Error('test pickup never appeared on guest');
  await C.page.evaluate(()=>gGameEngine.players[1].handleBonusCollision());
  const picked=await waitFor(async()=>{
    const [hs,gs]=await Promise.all([state(C.page),state(D.page)]);
    const exists=await D.page.evaluate(({x,y})=>gGameEngine.bonuses.some(b=>b.position.x===x&&b.position.y===y),pickup);
    return !exists&&Math.abs(hs.players[1].v-gs.players[1].v)<.01&&hs.players[1].v>pickup.before;
  },4000,80);
  if(!picked)throw new Error('host-confirmed pickup did not remove/sync on guest');
  // Deliberately send a stale world that still claims the consumed pickup exists. v0.12.5 must suppress it.
  await C.page.evaluate(({i})=>{
    const wood=gGameEngine.tiles.filter(t=>t.material==='wood').map(t=>t.position.y*17+t.position.x);
    const typeIndex=x=>x.type==='bomb'?1:x.type==='fire'?2:x.type==='heart'?3:0;
    const bonus=gGameEngine.bonuses.map(x=>[x.position.y*17+x.position.x,typeIndex(x)]);bonus.push([i,0]);B115.send({type:'dataWorld',world:{wood,bonus}});
  },pickup);
  await sleep(350);
  const reappeared=await D.page.evaluate(({x,y})=>gGameEngine.bonuses.some(b=>b.position.x===x&&b.position.y===y),pickup);
  if(reappeared)throw new Error('consumed pickup reappeared from a stale world snapshot');
  console.log('PICKUP_AUTHORITY PASS');

  if([...C.errors,...D.errors].length)throw new Error('phase 2 browser errors: '+[...C.errors,...D.errors].join(' | '));
  console.log('V125_NETCODE_SMOKE PASS');
}finally{
  await closeClient(A);await closeClient(B);await closeClient(C);await closeClient(D);await browser.close().catch(()=>{});
}
