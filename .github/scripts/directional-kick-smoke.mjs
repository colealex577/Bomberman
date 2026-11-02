import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const contexts=[],errors=[];
async function client(name){const ctx=await browser.createBrowserContext(),p=await ctx.newPage();contexts.push(ctx);p.on('pageerror',e=>errors.push(name+': '+String(e.stack||e)));await p.evaluateOnNewDocument(n=>{localStorage.setItem('BombermanPlayerName',n);localStorage.setItem('BombermanRatingV1','500');localStorage.setItem('BombermanScoreV1Initialized','1');navigator.serviceWorker.register=()=>Promise.resolve({})},name);await p.goto(process.env.TEST_URL,{waitUntil:'domcontentloaded',timeout:30000});await p.waitForFunction(()=>window.BomberFriends16225?.version==='v0.16.2.25'&&window.BomberFriendsProtocol16225?.version==='v0.16.2.25'&&window.BomberFriendsGameRoute16225?.version==='v0.16.2.25'&&window.BomberDirectionalInputHotfix16225?.version==='v0.16.2.25-hotfix2'&&window.BomberFix16222&&window.BomberMultiplayer?.ready,{timeout:45000});return p}
async function wait(fn,msg,ms=20000){const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await sleep(60)}throw new Error(msg)}
async function auditDirectKeys(page){
 await page.evaluate(()=>{window.__dirAudit=[];window.__dirOrig=BomberFriends16225.throwDirectionIndex;window.__dirState={playing:gGameEngine.playing,visible:gGameEngine.menu.visible,playersCount:gGameEngine.playersCount,sim:gGameEngine.simulatedOpponentMode};gGameEngine.playing=true;gGameEngine.menu.visible=false;gGameEngine.playersCount=1;gGameEngine.simulatedOpponentMode=false;BomberFriends16225.throwDirectionIndex=(idx,d)=>{window.__dirAudit.push({idx,d});return true}});
 const expected=[['KeyW',{x:0,y:-1}],['KeyA',{x:-1,y:0}],['KeyS',{x:0,y:1}],['KeyD',{x:1,y:0}]];
 for(const [code,dir] of expected){await page.keyboard.press(code);await sleep(35);const call=await page.evaluate(()=>window.__dirAudit.shift());assert.ok(call,code+' did not directly trigger a directional Bomb Kick');assert.equal(call.idx,0,code+' targeted the wrong local player');assert.deepEqual(call.d,dir,code+' chose the wrong throw direction')}
 await page.keyboard.press('KeyE');await sleep(50);assert.equal(await page.evaluate(()=>window.__dirAudit.length),0,'E incorrectly participated in the WASD directional shortcut');
 assert.match(await page.evaluate(()=>document.getElementById('bomb1')?.textContent||''),/E = Bomb Kick \(last facing\).*W\/A\/S\/D = directional Bomb Kick/,'control copy did not describe the direct WASD + last-facing E scheme');
 await page.evaluate(()=>{BomberFriends16225.throwDirectionIndex=window.__dirOrig;gGameEngine.playing=window.__dirState.playing;gGameEngine.menu.visible=window.__dirState.visible;gGameEngine.playersCount=window.__dirState.playersCount;gGameEngine.simulatedOpponentMode=window.__dirState.sim;delete window.__dirOrig;delete window.__dirState;delete window.__dirAudit});
 console.log('DIRECT_WASD_DIRECTION_KEYS PASS');
}
try{
 const host=await client('DirHost'),guest=await client('DirGuest');
 await auditDirectKeys(guest);
 const room='bomberman-dir-'+Date.now();
 await host.evaluate(id=>{BomberV124.setAIEnabled(false);B115.privateId=()=>id;B115.els.privateCode.value='8';B115.startPrivateHost()},room);
 await sleep(700);
 await guest.evaluate(id=>{BomberV124.setAIEnabled(false);B115.privateId=()=>id;B115.els.privateCode.value='8';B115.startPrivateJoin()},room);
 await wait(()=>guest.evaluate(()=>B115.role==='guest'&&B115.conn?.open&&BomberDataSync.role==='guest'),'directional private match did not connect',30000);
 await wait(()=>host.evaluate(()=>B115.conn?.open),'host private game connection did not open',5000);
 await sleep(450);
 await host.evaluate(()=>{const g=gGameEngine;for(const t of g.tiles.slice())if(t.material==='wood'){g.stage.removeChild(t.bmp);g.tiles.splice(g.tiles.indexOf(t),1)}for(const b of g.bombs.slice())try{b.explode()}catch(e){}const p=g.players[1],px=Utils.convertToBitmapPosition({x:9,y:9});p.bmp.x=px.x;p.bmp.y=px.y;p.updatePosition();p.bombsMax=3;p.bombKickCharges=3;p.bonusCounts=p.bonusCounts||{};p.bonusCounts.kick=3;p.lastMoveDirection={x:-1,y:0};gInputEngine.actions.left2=true;gInputEngine.actions.right2=false;BomberMultiplayer.publish()});
 assert.equal(await host.evaluate(()=>!!gInputEngine.actions.left2),true,'authoritative remote player was not in running-left state');
 await guest.keyboard.press('KeyD');
 await wait(()=>host.evaluate(()=>gGameEngine.bombs.some(b=>b.__v160Moving&&b.moveDirection?.x===1&&b.moveDirection?.y===0)),'D alone did not create an authoritative right-moving Bomb Kick',8000);
 let st=await host.evaluate(()=>({left:!!gInputEngine.actions.left2,right:!!gInputEngine.actions.right2,charges:gGameEngine.players[1].bombKickCharges,last:gGameEngine.players[1].lastMoveDirection,bombs:gGameEngine.bombs.map(b=>({moving:!!b.__v160Moving,dir:b.moveDirection}))}));
 assert.equal(st.left,true,'D directional throw interrupted existing left movement');
 assert.equal(st.right,false,'D directional throw changed movement to the throw direction');
 assert.equal(st.charges,2,'D directional throw did not consume exactly one Bomb Kick charge');
 assert.equal(st.last.x,-1,'D directional throw permanently changed last facing direction');
 assert.ok(st.bombs.some(b=>b.moving&&b.dir?.x===1),'D directional Bomb Kick did not travel right');
 console.log('RUN_LEFT_THROW_RIGHT_WITH_D PASS');
 await host.evaluate(()=>{const g=gGameEngine;for(const b of g.bombs.slice())try{b.explode()}catch(e){}const p=g.players[1];p.bombKickCharges=2;p.bonusCounts=p.bonusCounts||{};p.bonusCounts.kick=2;p.lastMoveDirection={x:-1,y:0};gInputEngine.actions.left2=true;gInputEngine.actions.right2=false;BomberMultiplayer.publish()});
 await sleep(250);
 await guest.keyboard.press('KeyE');
 await wait(()=>host.evaluate(()=>gGameEngine.bombs.some(b=>b.__v160Moving&&b.moveDirection?.x===-1&&b.moveDirection?.y===0)),'E did not retain its old last-facing-direction Bomb Kick behavior',8000);
 st=await host.evaluate(()=>({left:!!gInputEngine.actions.left2,right:!!gInputEngine.actions.right2,last:gGameEngine.players[1].lastMoveDirection,charges:gGameEngine.players[1].bombKickCharges}));
 assert.equal(st.left,true,'E facing throw interrupted existing movement');
 assert.equal(st.right,false,'E facing throw changed movement');
 assert.equal(st.last.x,-1,'E facing throw changed the last-facing direction');
 assert.equal(st.charges,1,'E facing throw did not consume exactly one Bomb Kick charge');
 await host.evaluate(()=>{gInputEngine.actions.left2=false});
 console.log('E_LAST_FACING_THROW_UNCHANGED PASS');
 if(errors.length)throw new Error('browser errors: '+errors.join(' | '));
 console.log('DIRECTIONAL_KICK_SMOKE PASS');
}finally{await Promise.all(contexts.map(c=>c.close().catch(()=>{})));await browser.close().catch(()=>{})}