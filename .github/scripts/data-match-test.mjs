import puppeteer from 'puppeteer-core';

const baseUrl=process.env.TEST_URL;
const executablePath=process.env.CHROME_PATH;
if(!baseUrl||!executablePath) throw new Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const browser=await puppeteer.launch({
  executablePath,
  headless:true,
  args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check'],
  timeout:30000
});

async function makeClient(label){
  const context=await browser.createBrowserContext();
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e&&e.message||e)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource:.*404/i.test(m.text()))errors.push('console: '+m.text())});
  await page.evaluateOnNewDocument(()=>{
    try{if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({scope:location.href})}catch(e){}
  });
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForFunction(()=>window.B115&&window.BomberOnline&&window.BomberDataSync&&B115.__dataSyncInstalled&&gGameEngine&&gGameEngine.menu,{timeout:15000});
  console.log(label,'ready');
  return{context,page,errors};
}
async function waitFor(fn,timeout=20000,step=100){
  const end=Date.now()+timeout;
  while(Date.now()<end){if(await fn())return true;await sleep(step)}
  return false;
}
async function state(page){
  return page.evaluate(()=>({
    role:B115.role,
    started:B115.started,
    dataActive:BomberDataSync.active,
    dataRole:BomberDataSync.role,
    localHidden:document.getElementById('localStage').hidden,
    remoteHidden:document.getElementById('remoteStage').hidden,
    hasVideo:!!(document.getElementById('remoteVideo')&&document.getElementById('remoteVideo').srcObject),
    players:gGameEngine.players.map(p=>({x:p.bmp.x,y:p.bmp.y,alive:p.alive})),
    bots:gGameEngine.bots.map(p=>({x:p.bmp.x,y:p.bmp.y,alive:p.alive})),
    bombs:gGameEngine.bombs.filter(b=>b&&!b.exploded).map(b=>({x:b.position.x,y:b.position.y,id:b.__dataNetId||''})),
    wood:gGameEngine.tiles.filter(t=>t.material==='wood').map(t=>t.position.y*17+t.position.x).sort((a,b)=>a-b)
  }))
}

let A,B;
try{
  A=await makeClient('HOST');
  B=await makeClient('JOIN');
  const testPeer='bomberman-v0120-ci-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
  await A.page.evaluate(id=>{
    B115.privateId=()=>id;
    B115.els.privateCode.value='9';
    B115.els.name.value='HostCI';
    B115.startPrivateHost();
  },testPeer);
  await sleep(1000);
  await B.page.evaluate(id=>{
    B115.privateId=()=>id;
    B115.els.privateCode.value='9';
    B115.els.name.value='JoinCI';
    B115.startPrivateJoin();
  },testPeer);

  const connected=await waitFor(async()=>{
    const [a,b]=await Promise.all([state(A.page),state(B.page)]);
    return a.started&&b.started&&a.dataActive&&b.dataActive&&a.dataRole==='host'&&b.dataRole==='guest';
  },25000,250);
  if(!connected)throw new Error('host/join data match did not connect');
  await sleep(1200);

  let [h,j]=await Promise.all([state(A.page),state(B.page)]);
  console.log('CONNECTED HOST',JSON.stringify(h));
  console.log('CONNECTED JOIN',JSON.stringify(j));
  if(h.localHidden||j.localHidden)throw new Error('one client is not rendering its local canvas');
  if(!h.remoteHidden||!j.remoteHidden)throw new Error('legacy remote video stage is visible');
  if(h.hasVideo||j.hasVideo)throw new Error('legacy video stream is still active');
  if(JSON.stringify(h.wood)!==JSON.stringify(j.wood))throw new Error('initial wood maps differ');

  const joinBefore=j.players[1];
  await B.page.keyboard.down('ArrowUp');
  await sleep(320);
  const joinDuring=(await state(B.page)).players[1];
  if(!(joinDuring.y<joinBefore.y-2))throw new Error('joiner local prediction did not move immediately');
  await B.page.keyboard.up('ArrowUp');
  await sleep(650);
  [h,j]=await Promise.all([state(A.page),state(B.page)]);
  const p2dist=Math.hypot(h.players[1].x-j.players[1].x,h.players[1].y-j.players[1].y);
  console.log('P2_RECONCILE_DISTANCE',p2dist);
  if(p2dist>18)throw new Error('joiner player diverged from host authority: '+p2dist);

  const hostBefore=h.players[0];
  await A.page.keyboard.down('ArrowRight');
  await sleep(360);
  await A.page.keyboard.up('ArrowRight');
  await sleep(700);
  [h,j]=await Promise.all([state(A.page),state(B.page)]);
  if(!(h.players[0].x>hostBefore.x+2))throw new Error('host player did not move during sync test');
  const p1dist=Math.hypot(h.players[0].x-j.players[0].x,h.players[0].y-j.players[0].y);
  console.log('P1_REMOTE_DISTANCE',p1dist);
  if(p1dist>22)throw new Error('remote host player not smoothly synchronized: '+p1dist);

  await sleep(900);
  [h,j]=await Promise.all([state(A.page),state(B.page)]);
  for(let i=0;i<Math.min(h.bots.length,j.bots.length);i++){
    if(!h.bots[i].alive)continue;
    const d=Math.hypot(h.bots[i].x-j.bots[i].x,h.bots[i].y-j.bots[i].y);
    console.log('BOT_DISTANCE',i,d);
    if(d>28)throw new Error('bot '+i+' diverged on joiner: '+d);
  }

  await B.page.keyboard.down('Shift');
  await sleep(80);
  await B.page.keyboard.up('Shift');
  const bombSynced=await waitFor(async()=>{
    const [a,b]=await Promise.all([state(A.page),state(B.page)]);
    return a.bombs.length>0&&b.bombs.length>0&&a.bombs.some(x=>b.bombs.some(y=>x.x===y.x&&x.y===y.y));
  },5000,100);
  if(!bombSynced)throw new Error('guest bomb did not synchronize to host and joiner');
  [h,j]=await Promise.all([state(A.page),state(B.page)]);
  console.log('BOMBS HOST',JSON.stringify(h.bombs),'JOIN',JSON.stringify(j.bombs));

  await sleep(2800);
  [h,j]=await Promise.all([state(A.page),state(B.page)]);
  if(JSON.stringify(h.wood)!==JSON.stringify(j.wood))throw new Error('wood maps diverged after authoritative explosion');
  console.log('FINAL_WOOD_COUNT',h.wood.length);
  if(A.errors.length||B.errors.length)throw new Error('browser errors: '+[...A.errors,...B.errors].join(' | '));
  console.log('DATA_MATCH_TEST PASS');
}finally{
  await A?.context.close().catch(()=>{});
  await B?.context.close().catch(()=>{});
  await browser.close().catch(()=>{});
}
