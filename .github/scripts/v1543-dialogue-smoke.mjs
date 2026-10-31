import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text())&&!/PeerJS/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','DialogueTest');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberDialogue1543?.version==='v0.15.4.2-dialogue'&&window.BomberSocial155?.version==='v0.15.5'&&window.BomberObserver154&&window.BomberObserver153&&window.BomberHumanObserver152&&window.B115,{timeout:30000});
 const counts=await p.evaluate(()=>BomberDialogue1543.poolCounts);
 assert.ok(counts.context>=190,'legacy contextual dialogue pool unexpectedly disappeared');assert.ok(counts.conversations>=40,'legacy scripted pool unexpectedly disappeared');assert.ok(counts.pickup>=30&&counts.death>=35&&counts.response>=45,'legacy event/response pools unexpectedly disappeared');
 await p.evaluate(()=>BomberOnline.openLobby());await p.waitForFunction(()=>document.getElementById('v152ObserveBtn'),{timeout:5000});await p.click('#v152ObserveBtn');
 await p.waitForFunction(()=>BomberHumanObserver152.state().mode==='observe'&&B115.role==='roster'&&BomberDialogue1543.state().simNames.length>=2,{timeout:10000});
 await p.waitForFunction(()=>B115.appendChat&&B115.appendChat.__v0155Social===true,{timeout:3000});
 await p.evaluate(()=>{const root=document.getElementById('chatMessages');if(root)root.innerHTML='';BomberDialogue1543.debug.clearConversation();BomberSocial155.debug.cancelScript()});
 const one=await p.evaluate(()=>{const root=document.getElementById('chatMessages'),name=BomberDialogue1543.state().simNames[0],before=root.children.length;B115.appendChat(name,'legacy generic trigger?',false);return{before,after:root.children.length,text:root.lastElementChild?.querySelector('span')?.textContent||root.lastElementChild?.textContent||''}});
 assert.equal(one.after-one.before,1,'v0.15.5 changed one normal chat opportunity into multiple immediate messages');assert.ok(one.text&&!one.text.includes('legacy generic trigger'),'v0.15.5 did not replace legacy source chatter');assert.ok(!one.text.includes('?'),'AI-initiated compatibility chatter reintroduced a question');
 await p.evaluate(()=>{BomberDialogue1543.debug.clearConversation();BomberObserver153.prime(1)});await sleep(60);const early=await p.evaluate(()=>BomberDialogue1543.debug.stage());assert.ok(['opening','early'].includes(early.key),'early progression state did not map to early-stage dialogue');
 await p.evaluate(()=>{BomberDialogue1543.debug.clearConversation();BomberObserver153.prime(10)});await sleep(60);const late=await p.evaluate(()=>BomberDialogue1543.debug.stage());assert.ok(['endgame','duel'].includes(late.key),'late progression state did not map to endgame dialogue');
 const userReplyCapture=await p.evaluate(()=>{const root=document.getElementById('chatMessages'),before=root.children.length;B115.appendChat(B115.localName,'nice one lol',true);const state=BomberDialogue1543.state();return{before,after:root.children.length,lastUser:state.lastUserLine&&state.lastUserLine.text}});
 assert.equal(userReplyCapture.after-userReplyCapture.before,1,'player chat was duplicated immediately by the new social owner');assert.equal(userReplyCapture.lastUser,'nice one lol','player chat no longer reaches the retained contextual history');
 const roundClock=await p.evaluate(()=>({serial:BomberHumanObserver152.state().roundSerial,started:BomberDialogue1543.roundStartedAt}));await p.evaluate(()=>BomberHumanObserver152.debug.finishObservedRound());await p.waitForFunction(s=>BomberHumanObserver152.state().mode==='observe'&&BomberHumanObserver152.state().roundSerial>s,{timeout:7000},roundClock.serial);await sleep(350);
 const nextClock=await p.evaluate(()=>({serial:BomberHumanObserver152.state().roundSerial,started:BomberDialogue1543.roundStartedAt}));assert.ok(nextClock.serial>roundClock.serial,'observer round did not advance for dialogue clock check');assert.ok(nextClock.started>roundClock.started,'dialogue long-round clock did not reset for the next round');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V1543_DIALOGUE_SMOKE PASS',JSON.stringify({counts,one,early,late,userReplyCapture,roundClock,nextClock}));
} finally {await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
