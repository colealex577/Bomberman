import puppeteer from 'puppeteer-core';

const url=process.env.TEST_URL;
const executablePath=process.env.CHROME_PATH;
if(!url||!executablePath)throw new Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const browser=await puppeteer.launch({
  executablePath,headless:true,
  args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check'],
  timeout:30000
});
const context=await browser.createBrowserContext();
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e&&e.message||e)));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource:.*404/i.test(m.text()))errors.push('console: '+m.text())});
await page.evaluateOnNewDocument(()=>{
  try{localStorage.setItem('BombermanPlayerName','QOLCI')}catch(e){}
  try{if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({scope:location.href})}catch(e){}
});

try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForFunction(()=>window.BomberQOL&&BomberQOL.installed&&window.BomberDataSync&&B115.__dataSyncInstalled&&gGameEngine&&gGameEngine.menu,{timeout:15000});
  const boot=await page.evaluate(()=>({
    version:document.getElementById('buildVersion120')?.textContent,
    old119:getComputedStyle(document.getElementById('buildVersion119')).display,
    mobileDisplay:getComputedStyle(document.getElementById('mobileControls')).display,
    dpadButtons:[...document.querySelectorAll('#qolDpad .qol_dpad_btn')].map(b=>({text:b.textContent.trim(),svg:!!b.querySelector('svg')})),
    touchSettings:!!document.getElementById('qolTouchSettings')
  }));
  console.log('BOOT',JSON.stringify(boot));
  if(boot.version!=='v0.12.0')throw new Error('visible version is not v0.12.0');
  if(boot.old119!=='none')throw new Error('old version badge still visible');
  if(boot.mobileDisplay!=='none')throw new Error('mobile controls visible before game starts');
  if(!boot.touchSettings||boot.dpadButtons.length!==4||boot.dpadButtons.some(x=>x.text||!x.svg))throw new Error('SVG-only arrow pad not installed cleanly');

  await page.evaluate(()=>BomberOnline.openLobby());
  await sleep(250);
  const lobbyBefore=await page.evaluate(()=>({choiceHidden:B115.els.panel_choice.hidden,choiceDisplay:getComputedStyle(B115.els.panel_choice).display}));
  if(lobbyBefore.choiceHidden||lobbyBefore.choiceDisplay==='none')throw new Error('lobby choice should be visible initially');
  await page.click('#privateMatchBtn');
  await sleep(120);
  const lobbyAfter=await page.evaluate(()=>({
    choiceHidden:B115.els.panel_choice.hidden,
    choiceDisplay:getComputedStyle(B115.els.panel_choice).display,
    privateHidden:B115.els.panel_private.hidden,
    privateDisplay:getComputedStyle(B115.els.panel_private).display
  }));
  console.log('LOBBY_AFTER_PRIVATE',JSON.stringify(lobbyAfter));
  if(!lobbyAfter.choiceHidden||lobbyAfter.choiceDisplay!=='none'||lobbyAfter.privateHidden||lobbyAfter.privateDisplay==='none')throw new Error('old public/private choices did not collapse after selection');

  await page.evaluate(()=>{
    document.body.classList.remove('desktop-ui');document.body.classList.add('touch-ui');
    document.getElementById('qolArrowMode').click();
    B115.els.lobby.hidden=true;gGameEngine.lobbyOpen=false;gGameEngine.menu.setMode('multi');
  });
  await sleep(450);
  const live=await page.evaluate(()=>{
    const canvas=document.getElementById('canvas').getBoundingClientRect();
    const boxes=[...document.querySelectorAll('.qol_stat_box:not([hidden])')].map(b=>{const r=b.getBoundingClientRect();return{slot:b.dataset.slot,left:r.left,right:r.right,top:r.top,bottom:r.bottom}});
    return{
      roundLive:document.body.classList.contains('qol_round_live'),
      hasStats:document.body.classList.contains('qol_has_stats'),
      mobileDisplay:getComputedStyle(document.getElementById('mobileControls')).display,
      joystickDisplay:getComputedStyle(document.getElementById('mobileJoystick')).display,
      dpadDisplay:getComputedStyle(document.getElementById('qolDpad')).display,
      canvas:{left:canvas.left,right:canvas.right,top:canvas.top,bottom:canvas.bottom},
      boxes
    }
  });
  console.log('LIVE',JSON.stringify(live));
  if(!live.roundLive||!live.hasStats)throw new Error('round-live UI state did not activate');
  if(live.mobileDisplay==='none'||live.joystickDisplay!=='none'||live.dpadDisplay==='none')throw new Error('arrow-pad mobile mode did not activate correctly');
  if(live.boxes.length<2)throw new Error('external stats boxes not visible');
  for(const b of live.boxes){
    const verticallyOutside=b.bottom<=live.canvas.top+1||b.top>=live.canvas.bottom-1;
    if(!verticallyOutside)throw new Error('stat box '+b.slot+' overlaps playable canvas');
  }

  await page.evaluate(()=>BomberQOL.showPostMatch('CI ROUND OVER'));
  await sleep(100);
  const post=await page.evaluate(()=>({
    hidden:document.getElementById('qolPostMatch').hidden,
    random:document.getElementById('qolRandomBtn').textContent,
    replay:document.getElementById('qolReplayBtn').textContent,
    menu:document.getElementById('qolMenuBtn').textContent,
    mobileDisplay:getComputedStyle(document.getElementById('mobileControls')).display
  }));
  console.log('POST',JSON.stringify(post));
  if(post.hidden||post.random!=='New random match'||post.replay!=='Replay opponent'||post.menu!=='Back to menu')throw new Error('post-round actions missing');
  if(post.mobileDisplay!=='none')throw new Error('mobile controls remain visible over post-round UI');
  if(errors.length)throw new Error('browser errors: '+errors.join(' | '));
  console.log('QOL_SMOKE PASS');
}finally{
  await context.close().catch(()=>{});
  await browser.close().catch(()=>{});
}
