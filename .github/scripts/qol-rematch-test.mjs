import puppeteer from 'puppeteer-core';

const baseUrl=process.env.TEST_URL;
const executablePath=process.env.CHROME_PATH;
if(!baseUrl||!executablePath)throw new Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check'],timeout:30000});
async function client(name){
  const context=await browser.createBrowserContext();const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(String(e&&e.message||e)));page.on('console',m=>{if(m.text().startsWith('[connect]'))console.log(m.text());if(m.type()==='error'&&!/Failed to load resource:.*404/i.test(m.text()))errors.push('console: '+m.text())});
  await page.evaluateOnNewDocument(n=>{try{localStorage.setItem('BombermanPlayerName',n)}catch(e){}try{if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({scope:location.href})}catch(e){}},name);
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:20000});await page.waitForFunction(()=>window.BomberMultiplayer?.ready,{timeout:30000});
  await page.waitForFunction(()=>window.BomberQOL&&BomberQOL.installed&&window.BomberDataSync&&B115.__dataSyncInstalled&&gGameEngine&&gGameEngine.menu,{timeout:15000});
  return{context,page,errors};
}
async function waitFor(fn,timeout=20000,step=100){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return true;await sleep(step)}return false}
let A,B;
try{
  A=await client('HostQOL');B=await client('JoinQOL');
  const peer='bomberman-qol-ci-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
  await A.page.evaluate(id=>{B115.privateId=()=>id;B115.els.privateCode.value='8';B115.els.name.value='HostQOL';B115.startPrivateHost()},peer);
  await sleep(900);
  await B.page.evaluate(id=>{B115.privateId=()=>id;B115.els.privateCode.value='8';B115.els.name.value='JoinQOL';B115.startPrivateJoin()},peer);
  const connected=await waitFor(async()=>Promise.all([A.page.evaluate(()=>B115.started&&BomberDataSync.role==='host'&&!!B115.conn?.open),B.page.evaluate(()=>B115.started&&BomberDataSync.role==='guest'&&!!B115.conn?.open)]).then(x=>x.every(Boolean)),25000,200);
  if(!connected)throw new Error('QOL rematch clients failed to connect');
  await A.page.evaluate(()=>BomberQOL.showPostMatch('TEST ROUND OVER'));
  await B.page.evaluate(()=>BomberQOL.showPostMatch('TEST ROUND OVER'));
  const postReady=await waitFor(async()=>Promise.all([A.page.evaluate(()=>!document.getElementById('qolPostMatch').hidden),B.page.evaluate(()=>!document.getElementById('qolPostMatch').hidden)]).then(x=>x.every(Boolean)),4000,100);
  if(!postReady)throw new Error('delayed post-match controls did not appear');
  await A.page.click('#qolReplayBtn');
  const prompted=await waitFor(()=>B.page.evaluate(()=>!document.getElementById('qolRematchPrompt').hidden),8000,100);
  if(!prompted)throw new Error('joiner did not receive rematch prompt');
  await B.page.click('#qolRematchAccept');
  const restarted=await waitFor(async()=>{
    const [h,j]=await Promise.all([
      A.page.evaluate(()=>({post:document.getElementById('qolPostMatch').hidden,match:gGameEngine.matchFinished,conn:!!B115.conn?.open,role:BomberDataSync.role,players:gGameEngine.players.length})),
      B.page.evaluate(()=>({post:document.getElementById('qolPostMatch').hidden,match:gGameEngine.matchFinished,conn:!!B115.conn?.open,role:BomberDataSync.role,players:gGameEngine.players.length}))
    ]);
    return h.post&&j.post&&!h.match&&!j.match&&h.conn&&j.conn&&h.role==='host'&&j.role==='guest'&&h.players===2&&j.players===2;
  },10000,150);
  if(!restarted)throw new Error('accepted rematch did not restart both clients on same connection');
  if(A.errors.length||B.errors.length)throw new Error('browser errors: '+[...A.errors,...B.errors].join(' | '));
  console.log('QOL_REMATCH_TEST PASS');
}finally{
  await A?.context.close().catch(()=>{});await B?.context.close().catch(()=>{});await browser.close().catch(()=>{});
}
