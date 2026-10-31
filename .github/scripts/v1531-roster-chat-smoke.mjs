import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text())&&!/PeerJS/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','RosterTest');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberRelease150?.version==='v0.15.3.2'&&window.BomberRoster1531?.version==='v0.15.3.2'&&window.BomberObserver153?.version==='v0.15.3.2'&&window.gGameEngine?.menu,{timeout:30000});
 const joined=await p.evaluate(()=>{
   const g=gGameEngine;g.__v152RosterMode='joined';g.__v152ObserverMode=false;g.__v152JoinedMode=true;g.playersCount=2;g.botsCount=4;g.simulatedOpponentMode=true;g.playing=true;g.menu.hide();g.restart();
   const a=BomberRoster1531.audit(),all=g.players.concat(g.bots),positions=all.map(e=>`${e.position.x},${e.position.y}`),sims=g.bots.filter(b=>b.simulatedHuman);
   return {a,unique:new Set(positions).size,total:all.length,playerPos:positions[0],spawn0:`${g.getSpawnSlotPosition(0).x},${g.getSpawnSlotPosition(0).y}`,appearances:sims.map(b=>({applied:!!b.characterAppearance,profile:!!b.__v152Profile?.appearance,matches:JSON.stringify(b.characterAppearance)===JSON.stringify(b.__v152Profile?.appearance)}))};
 });
 assert.equal(joined.total,4,'joined round rendered more than four contestants');
 assert.equal(joined.a.players,1);assert.equal(joined.a.bots,3);assert.equal(joined.a.sims,2);assert.equal(joined.a.ais,1);assert.equal(joined.unique,4,'joined contestants overlap at spawn');assert.equal(joined.playerPos,joined.spawn0,'local player not in slot 0');assert.deepEqual(joined.a.slots.map(x=>[x.slot,x.sim]),[[0,false],[1,true],[2,true],[3,false]],'joined slot ownership wrong');
 assert.equal(joined.appearances.length,2);for(const x of joined.appearances){assert.equal(x.profile,true,'simulated-human profile did not get a randomized appearance');assert.equal(x.applied,true,'randomized simulated-human appearance was not rendered');assert.equal(x.matches,true,'rendered appearance did not match its randomized profile')}
 const chat=await p.evaluate(async()=>{
   const S=B115,t=S.els.chatToast||document.getElementById('chatToast'),panel=S.els.chatPanel,msg=S.els.chatMessages;if(panel)panel.hidden=true;if(t){t.hidden=true;t.textContent=''};const before=msg?msg.children.length:0;
   S.appendChat('NeonFox','roster chat S path',false);BomberOnline.appendChat('PixelPilot','roster chat online path',false);await new Promise(r=>setTimeout(r,120));
   return {before,after:msg?msg.children.length:0,hidden:t?!!t.hidden:true,text:t?t.textContent:''};
 });
 assert.equal(chat.after,chat.before+2,'both roster chat render paths did not enter chat history');assert.equal(chat.hidden,true,'roster chat toast became visible');assert.equal(chat.text,'','roster chat invoked transient toast text');
 const publicChat=await p.evaluate(()=>{
   const S=B115,g=gGameEngine,msg=S.els.chatMessages;g.__v152RosterMode='';g.__v152ObserverMode=false;g.__v152JoinedMode=false;S.kind='public';S.remoteName='RemoteTest';S.localName='RosterTest';S.setRole('host');window.__v1532Sent=null;S.conn={open:true,send:d=>{window.__v1532Sent=d}};const before=msg.children.length;
   const sent=S.sendChat('public send test');const packet=window.__v1532Sent;S.hostData({type:'chat',text:'public receive test'});const rows=Array.from(msg.children).slice(-2).map(x=>x.textContent);S.conn=null;S.kind='';S.setRole('offline');return{sent,packet,before,after:msg.children.length,rows};
 });
 assert.equal(publicChat.sent,true,'public sendChat did not report success');assert.deepEqual(publicChat.packet,{type:'chat',text:'public send test'},'public chat was not transmitted over the open connection');assert.equal(publicChat.after,publicChat.before+2,'public send/receive did not append both messages');assert.ok(publicChat.rows[0].includes('public send test'));assert.ok(publicChat.rows[1].includes('public receive test'));
 const bands=await p.evaluate(()=>({overnight:BomberRoster1531.timeBand(2),peak:BomberRoster1531.timeBand(20)}));assert.equal(bands.overnight.quiet,true);assert.equal(bands.peak.quiet,false);assert.ok(bands.overnight.chance>bands.peak.chance,'quiet-hour comment chance was not higher than peak hours');
 const observe=await p.evaluate(()=>{const g=gGameEngine;g.__v152RosterMode='observe';g.playersCount=2;g.botsCount=4;g.simulatedOpponentMode=true;g.restart();return BomberRoster1531.audit()});
 assert.equal(observe.players,0);assert.equal(observe.bots,4);assert.equal(observe.sims,2);assert.equal(observe.ais,2);assert.ok(observe.slots.filter(x=>x.sim).every(x=>x.appearance),'observed simulated humans did not render randomized appearances');
 if(errors.length)throw Error('browser errors: '+errors.join('\n'));
 console.log('v0.15.3.2 roster/chat smoke passed',JSON.stringify({joined,chat,publicChat,bands,observe}));
} finally {await browser.close()}