import puppeteer from 'puppeteer-core';

const url=process.env.TEST_URL;
const executablePath=process.env.CHROME_PATH;
if(!url||!executablePath) throw new Error('TEST_URL/CHROME_PATH missing');

const browser=await puppeteer.launch({
  executablePath,
  headless:true,
  args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check'],
  timeout:30000
});
const page=await browser.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e&&e.message||e)));
page.on('console',msg=>{if(msg.type()==='error')errors.push('console: '+msg.text())});
try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
  await new Promise(r=>setTimeout(r,9000));
  const state=await page.evaluate(()=>({
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
  }));
  console.log('STATE',JSON.stringify(state));
  console.log('ERRORS',JSON.stringify(errors));
  if(!state.canvas||!state.gameEngine||!state.menu||!state.menuVisible||!state.b115||!state.bomberOnline||!state.dataLayer||!state.dataInstalled){throw new Error('Bomberman/data-sync boot incomplete')}
  if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
}finally{
  await browser.close();
}
