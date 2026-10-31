import puppeteer from 'puppeteer-core';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage();await p.setViewport({width:1280,height:800});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','ChatDebug');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberPublicChat1562&&window.B115&&window.gGameEngine?.menu,{timeout:30000});
 await p.evaluate(()=>{B115.kind='public';B115.started=true;B115.setRole('host');gGameEngine.playing=true;gGameEngine.menu.visible=false;BomberPublicChat1562.sync()});
 for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,100));console.log('CHAT_DEBUG',i,JSON.stringify(await p.evaluate(()=>({role:B115.role,kind:B115.kind,started:B115.started,playing:gGameEngine.playing,menu:gGameEngine.menu.visible,pub:BomberPublicChat1562.state(),behavior:window.BomberBehavior157?.version||null,sessionAttr:document.body.getAttribute('data-v01562-public-chat'),panelHidden:document.getElementById('chatPanel')?.hidden,panelDisplay:getComputedStyle(document.getElementById('chatPanel')).display}))));}
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
