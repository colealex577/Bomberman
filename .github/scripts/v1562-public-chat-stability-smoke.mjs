import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','PublicChatTest');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberPublicChat1562?.version==='v0.15.6.2'&&window.BomberBehavior157?.version==='v0.15.7'&&window.B115&&window.gGameEngine?.menu&&document.getElementById('chatPanel'),{timeout:30000});
 await p.evaluate(()=>{B115.kind='public';B115.started=true;B115.setRole('host');gGameEngine.playing=true;gGameEngine.menu.visible=false;const bar=document.getElementById('onlineMatchBar');if(bar)bar.hidden=false;BomberPublicChat1562.sync()});
 await p.waitForFunction(()=>BomberPublicChat1562.state().latched&&BomberPublicChat1562.state().panelVisible,{timeout:5000});
 const initial=await p.evaluate(()=>({state:BomberPublicChat1562.state(),attr:document.body.getAttribute('data-v01562-public-chat'),hidden:document.getElementById('chatPanel').hidden,display:getComputedStyle(document.getElementById('chatPanel')).display,toggle:getComputedStyle(document.getElementById('chatToggleBtn')).display,toast:getComputedStyle(document.getElementById('chatToast')).display}));
 assert.equal(initial.attr,'1');assert.equal(initial.hidden,false);assert.equal(initial.display,'flex');assert.equal(initial.toggle,'none');assert.equal(initial.toast,'none');

 // Recreate the exact conflict that caused PC public chat flashing: the old owner briefly decides the match is inactive.
 const samples=await p.evaluate(async()=>{const out=[];for(let i=0;i<18;i++){B115.started=false;document.body.classList.remove('v137_chat_active');const panel=document.getElementById('chatPanel');panel.hidden=true;panel.style.setProperty('display','none','important');await new Promise(r=>setTimeout(r,16));const cs=getComputedStyle(panel);out.push({hidden:panel.hidden,display:cs.display,visibility:cs.visibility,opacity:cs.opacity,owner:document.body.getAttribute('data-v01562-public-chat')});B115.started=true;await new Promise(r=>setTimeout(r,16))}return out});
 for(const s of samples){assert.equal(s.owner,'1','public chat owner dropped during transient started=false');assert.equal(s.hidden,false,'chat panel stayed hidden during old-owner conflict');assert.equal(s.display,'flex','chat panel flashed display:none');assert.notEqual(s.visibility,'hidden');assert.notEqual(s.opacity,'0')}
 console.log('PUBLIC_DESKTOP_PANEL_NO_FLASH PASS');

 // Legacy typing rows from v0.13.7/v0.13.8/v0.14.0 must be removed before paint and never surface a toast.
 await p.evaluate(()=>{const root=document.getElementById('chatMessages');['v137Typing','v138Typing','v140Typing'].forEach(id=>{const row=document.createElement('div');row.id=id;row.className='chat_line';row.textContent='is typing...';root.appendChild(row)});const toast=document.getElementById('chatToast');toast.hidden=false;toast.style.display='block'});
 await sleep(80);
 const legacy=await p.evaluate(()=>({typing:['v132Typing','v137Typing','v138Typing','v139Typing','v140Typing'].filter(id=>document.getElementById(id)),toastDisplay:getComputedStyle(document.getElementById('chatToast')).display,panel:BomberPublicChat1562.state().panelVisible}));
 assert.deepEqual(legacy.typing,[]);assert.equal(legacy.toastDisplay,'none');assert.equal(legacy.panel,true);
 console.log('LEGACY_TYPING_AND_TOAST_SUPPRESSED PASS');

 // Once latched, a transient started=false must not hide chat; explicit exit from public mode must release ownership.
 await p.evaluate(()=>{B115.started=false;gGameEngine.playing=false;BomberPublicChat1562.sync()});await sleep(250);
 assert.equal(await p.evaluate(()=>BomberPublicChat1562.state().panelVisible),true,'latched public chat disappeared between public round states');
 await p.evaluate(()=>{B115.kind='';B115.setRole('offline');BomberPublicChat1562.sync()});await sleep(100);
 const ended=await p.evaluate(()=>({latched:BomberPublicChat1562.state().latched,owner:document.body.getAttribute('data-v01562-public-chat')}));assert.equal(ended.latched,false);assert.equal(ended.owner,null);
 console.log('PUBLIC_CHAT_LATCH_RELEASE PASS');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V1562_PUBLIC_CHAT_STABILITY_SMOKE PASS');
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
