import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const contexts=[],errors=[];
async function client(name){const ctx=await browser.createBrowserContext(),p=await ctx.newPage();contexts.push(ctx);p.on('pageerror',e=>errors.push(name+': '+String(e.stack||e)));await p.evaluateOnNewDocument(n=>{localStorage.setItem('BombermanPlayerName',n);localStorage.setItem('BombermanRatingV1','500');localStorage.setItem('BombermanScoreV1Initialized','1');navigator.serviceWorker.register=()=>Promise.resolve({})},name);await p.goto(process.env.TEST_URL,{waitUntil:'domcontentloaded',timeout:30000});await p.waitForFunction(()=>window.BomberFriends16225?.version==='v0.16.2.25'&&window.BomberFix16222&&window.BomberMultiplayer?.ready,{timeout:45000});return p}
async function wait(fn,msg,ms=20000){const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await sleep(60)}throw new Error(msg)}
try{
 const host=await client('DirHost'),guest=await client('DirGuest'),room='bomberman-dir-'+Date.now();
 await host.evaluate(id=>{BomberV124.setAIEnabled(false);B115.privateId=()=>id;B115.els.privateCode.value='8';B115.startPrivateHost()},room);
 await sleep(700);
 await guest.evaluate(id=>{BomberV124.setAIEnabled(false);B115.privateId=()=>id;B115.els.privateCode.value='8';B115.startPrivateJoin()},room);
 await wait(()=>guest.evaluate(()=>B115.role==='guest'&&B115.conn?.open&&BomberDataSync.role==='guest'),'directional private match did not connect',30000);
 await host.evaluate(()=>{const g=gGameEngine;for(const t of g.tiles.slice())if(t.material==='wood'){g.stage.removeChild(t.bmp);g.tiles.splice(g.tiles.indexOf(t),1)}for(const b of g.bombs.slice())try{b.explode()}catch(e){}const p=g.players[1],px=Utils.convertToBitmapPosition({x:9,y:9});p.bmp.x=px.x;p.bmp.y=px.y;p.updatePosition();p.bombsMax=3;p.bombKickCharges=2;p.bonusCounts=p.bonusCounts||{};p.bonusCounts.kick=2;p.lastMoveDirection={x:-1,y:0};gInputEngine.actions.left2=true;gInputEngine.actions.right2=false;BomberMultiplayer.publish()});
 assert.equal(await host.evaluate(()=>!!gInputEngine.actions.left2),true,'authoritative remote player was not in running-left state');
 await guest.keyboard.down('KeyE');await sleep(20);await guest.keyboard.down('KeyD');await sleep(15);await guest.keyboard.up('KeyD');await sleep(10);await guest.keyboard.up('KeyE');
 await wait(()=>host.evaluate(()=>gGameEngine.bombs.some(b=>b.__v160Moving&&b.moveDirection?.x===1&&b.moveDirection?.y===0)),'E+D did not create an authoritative right-moving Bomb Kick',8000);
 const st=await host.evaluate(()=>({left:!!gInputEngine.actions.left2,right:!!gInputEngine.actions.right2,charges:gGameEngine.players[1].bombKickCharges,last:gGameEngine.players[1].lastMoveDirection,bombs:gGameEngine.bombs.map(b=>({moving:!!b.__v160Moving,dir:b.moveDirection}))}));
 assert.equal(st.left,true,'direction chord interrupted existing left movement');
 assert.equal(st.right,false,'direction chord incorrectly changed movement to the throw direction');
 assert.equal(st.charges,1,'directional throw did not consume exactly one Bomb Kick charge');
 assert.equal(st.last.x,-1,'directional throw permanently changed the player movement direction');
 assert.ok(st.bombs.some(b=>b.moving&&b.dir?.x===1),'directional Bomb Kick did not travel right');
 await host.evaluate(()=>{gInputEngine.actions.left2=false});
 console.log('E_WASD_DIRECTIONAL_THROW_WITHOUT_MOVEMENT_CHANGE PASS');
 if(errors.length)throw new Error('browser errors: '+errors.join(' | '));
 console.log('DIRECTIONAL_KICK_SMOKE PASS');
}finally{await Promise.all(contexts.map(c=>c.close().catch(()=>{})));await browser.close().catch(()=>{})}
