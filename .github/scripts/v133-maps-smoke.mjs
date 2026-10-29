import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.removeItem('BombermanSingleMapV133');localStorage.removeItem('BombermanMultiMapV133');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberMaps133?.version==='v0.13.3'&&window.BomberSocial130&&window.BomberMultiplayer?.ready&&window.gGameEngine?.menu,{timeout:30000});
 const layouts=await p.evaluate(()=>{
  const api=BomberMaps133,W=17,H=13,spawns=[[1,1],[15,1],[1,11],[15,11]],out=[];
  function connected(id){const open=new Set();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(api.material(id,x,y)!=='wall')open.add(x+','+y);const q=[spawns[0]],seen=new Set([spawns[0].join(',')]);while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+','+(y+dy);if(open.has(k)&&!seen.has(k)){seen.add(k);q.push([x+dx,y+dy])}}}return spawns.every(s=>seen.has(s.join(',')))&&seen.size===open.size}
  for(const m of api.maps){let wall=0,wood=0,grass=0,sig='';for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=api.material(m.id,x,y);sig+=v==='wall'?'#':v==='wood'?'w':'.';if(v==='wall')wall++;else if(v==='wood')wood++;else grass++}out.push({id:m.id,sig,wall,wood,grass,connected:connected(m.id),spawn:spawns.map(([x,y])=>api.material(m.id,x,y))})}return out
 });
 assert.equal(layouts.length,12);assert.equal(new Set(layouts.map(x=>x.sig)).size,12,'map layouts are not distinct');
 for(const x of layouts){assert.equal(x.connected,true,x.id+' has disconnected hard-wall regions');assert.deepEqual(x.spawn,['grass','grass','grass','grass'],x.id+' has blocked spawn');assert.ok(x.wood>=50,x.id+' has too little destructible cover: '+x.wood)}
 const defaults=await p.evaluate(()=>{const board={wall:0,wood:0};for(const t of gGameEngine.tiles||[])if(t&&Object.prototype.hasOwnProperty.call(board,t.material))board[t.material]++;return{single:BomberMaps133.getSelection('single'),multi:BomberMaps133.getSelection('multi'),tile:!!document.getElementById('mainMapTile'),active:BomberMaps133.active(),board}});assert.deepEqual(defaults,{single:'classic',multi:'classic',tile:true,active:'classic',board:{wall:91,wood:118}},'default Classic board changed');
 await p.click('#mainMapTile');await sleep(80);let panel=await p.evaluate(()=>({hidden:document.getElementById('v133MapPanel').hidden,count:document.getElementById('v133SingleSelect').options.length}));assert.equal(panel.hidden,false);assert.equal(panel.count,13);
 await p.select('#v133SingleSelect','crossroads');await p.click('#v133MapPanel .v133_done');assert.equal(await p.evaluate(()=>BomberMaps133.getSelection('single')),'crossroads');
 await p.evaluate(()=>gGameEngine.menu.setMode('single'));await p.waitForFunction(()=>gGameEngine.playersCount===1&&BomberMaps133.active()==='crossroads',{timeout:5000});
 assert.equal(await p.evaluate(()=>gGameEngine.getTileMaterial({x:8,y:6})),'grass','Crossroads center should be open');
 await p.evaluate(()=>{gGameEngine.menu.show();BomberOnline.openLobby()});await sleep(400);
 const lobby=await p.evaluate(()=>({exists:!!document.getElementById('v133MultiMaps'),opts:document.getElementById('v133MultiSelect')?.options.length,rounds:!!document.getElementById('v131RoundSets')}));assert.deepEqual(lobby,{exists:true,opts:13,rounds:true});
 await p.select('#v133MultiSelect','longlanes');await sleep(70);assert.equal(await p.evaluate(()=>BomberMaps133.getSelection('multi')),'longlanes');
 await p.evaluate(()=>{B115.setRole('guest');BomberMaps133.debug.setRemote('shuffle','fortress')});await sleep(220);const guestChoice=await p.evaluate(()=>({disabled:document.getElementById('v133MultiSelect').disabled,shown:document.getElementById('v133MultiSelect').value,saved:BomberMaps133.getSelection('multi')}));assert.deepEqual(guestChoice,{disabled:true,shown:'shuffle',saved:'longlanes'},'guest host-map state leaked into saved preference');
 await p.evaluate(()=>{B115.setRole('offline');BomberMaps133.setSelection('single','shuffle');gGameEngine.lobbyOpen=false;document.getElementById('multiplayerLobby').hidden=true;gGameEngine.playersCount=1;gGameEngine.menu.hide();gGameEngine.restart()});await sleep(120);const shuffleA=await p.evaluate(()=>BomberMaps133.active());await p.evaluate(()=>gGameEngine.restart());await sleep(120);const shuffleB=await p.evaluate(()=>BomberMaps133.active());assert.notEqual(shuffleA,shuffleB,'shuffle repeated the previous map');
 await p.evaluate(()=>{B115.setRole('guest');gGameEngine.playersCount=2;BomberMaps133.debug.setRemote('shuffle','fortress');gGameEngine.restart()});await sleep(120);assert.equal(await p.evaluate(()=>BomberMaps133.active()),'fortress','guest did not use host active map');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V133_MAPS_SMOKE PASS',JSON.stringify({maps:layouts.map(x=>({id:x.id,wall:x.wall,wood:x.wood,grass:x.grass})),shuffle:[shuffleA,shuffleB],guestChoice}));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}