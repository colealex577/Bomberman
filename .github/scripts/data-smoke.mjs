import puppeteer from 'puppeteer-core';

const baseUrl=process.env.TEST_URL;
const executablePath=process.env.CHROME_PATH;
if(!baseUrl||!executablePath) throw new Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const timeout=(ms,label)=>new Promise((_,rej)=>setTimeout(()=>rej(new Error(label+' timed out')),ms));

const browser=await puppeteer.launch({
  executablePath,
  headless:true,
  args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking'],
  timeout:30000
});

async function inspect(label,url,expectData){
  const context=await browser.createBrowserContext();
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e&&e.message||e)));
  page.on('console',msg=>{
    if(msg.type()!=='error')return;
    const text=msg.text();
    if(/Failed to load resource:.*404/i.test(text))return;
    errors.push('console: '+text);
  });
  await page.evaluateOnNewDocument(()=>{
    try{
      if(navigator.serviceWorker){
        navigator.serviceWorker.register=function(){return Promise.resolve({scope:location.href})};
      }
    }catch(e){}
  });
  try{
    console.log('MILESTONE',label,'navigate');
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
    console.log('MILESTONE',label,'domcontentloaded');
    await sleep(6000);
    console.log('MILESTONE',label,'evaluate');
    const state=await Promise.race([
      page.evaluate(()=>({
        readyState:document.readyState,
        canvas:!!document.getElementById('canvas'),
        gameEngine:!!window.gGameEngine,
        menu:!!(window.gGameEngine&&gGameEngine.menu),
        menuVisible:!!(window.gGameEngine&&gGameEngine.menu&&gGameEngine.menu.visible),
        b115:!!window.B115,
        bomberOnline:!!window.BomberOnline,
        dataLayer:!!window.BomberDataSync,
        dataInstalled:!!(window.B115&&B115.__dataSyncInstalled),
        lobby:!!document.getElementById('multiplayerLobby'),
        players:window.gGameEngine&&gGameEngine.players?gGameEngine.players.length:null,
        bots:window.gGameEngine&&gGameEngine.bots?gGameEngine.bots.length:null
      })),
      timeout(6000,label+' page.evaluate')
    ]);
    console.log('STATE',label,JSON.stringify(state));
    console.log('ERRORS',label,JSON.stringify(errors));
    if(!state.canvas||!state.gameEngine||!state.menu||!state.menuVisible||!state.b115||!state.bomberOnline||!state.lobby)throw new Error(label+' core Bomberman boot incomplete');
    if(expectData&&(!state.dataLayer||!state.dataInstalled))throw new Error(label+' data layer did not install');
    if(!expectData&&(state.dataLayer||state.dataInstalled))throw new Error(label+' unexpectedly loaded data layer');
    if(errors.length)throw new Error(label+' browser errors: '+errors.join(' | '));
    return state;
  } finally {
    await context.close().catch(()=>{});
  }
}

try{
  const baseline=new URL(baseUrl);baseline.searchParams.set('nodata','1');
  await inspect('BASELINE',baseline.toString(),false);
  const data=new URL(baseUrl);data.searchParams.delete('nodata');
  await inspect('DATA',data.toString(),true);
}finally{
  await Promise.race([browser.close(),timeout(5000,'browser.close')]).catch(e=>console.log('CLOSE_WARNING',e.message));
}
process.exit(0);
