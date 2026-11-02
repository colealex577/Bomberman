import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const contexts=[],errors=[];

async function client(name){
  const ctx=await browser.createBrowserContext();
  const page=await ctx.newPage();
  contexts.push(ctx);
  page.on('pageerror',e=>errors.push(name+': '+e.stack));
  await page.evaluateOnNewDocument(n=>{
    localStorage.setItem('BombermanPlayerName',n);
    localStorage.setItem('BombermanRatingV1','100');
    localStorage.setItem('BombermanScoreV1Initialized','1');
    navigator.serviceWorker.register=()=>Promise.resolve({});
  },name);
  await page.goto(process.env.TEST_URL);
  await page.waitForFunction(()=>window.BomberMultiplayer?.ready&&window.BomberKick160&&window.BomberFix16222,{timeout:30000});
  return page;
}

async function wait(fn,message,ms=10000){
  const end=Date.now()+ms;
  while(Date.now()<end){if(await fn())return;await sleep(50)}
  throw new Error(message);
}

const state=p=>p.evaluate(()=>BomberMultiplayer.inspect());
async function equalWorld(a,b,ms=8000){
  await wait(async()=>{
    const [x,y]=await Promise.all([state(a),state(b)]);
    return x.roundId===y.roundId&&x.worldRevision===y.worldRevision&&x.checksum===y.checksum;
  },'host and guest authoritative worlds diverged',ms);
}

try{
  const host=await client('Host'),guest=await client('Guest');
  const room='bomberman-kick-reconnect-'+Date.now();
  await host.evaluate(id=>{
    BomberV124.setAIEnabled(false);
    B115.privateId=()=>id;
    B115.els.privateCode.value='8';
    B115.startPrivateHost();
  },room);
  await sleep(700);
  await guest.evaluate(id=>{
    BomberV124.setAIEnabled(false);
    B115.privateId=()=>id;
    B115.els.privateCode.value='8';
    B115.startPrivateJoin();
  },room);
  await wait(()=>guest.evaluate(()=>BomberDataSync.role==='guest'&&!!BomberMultiplayer.roundId&&B115.conn?.open),'private connection did not establish',30000);
  await equalWorld(host,guest);
  assert.equal(await host.evaluate(()=>BomberDataSync.role),'host');
  assert.equal(await guest.evaluate(()=>BomberDataSync.role),'guest');
  assert.ok(await host.evaluate(()=>gGameEngine.players[0].bmp.visible&&gGameEngine.players[1].bmp.visible),'host did not render both private-match players');
  assert.ok(await guest.evaluate(()=>gGameEngine.players[0].bmp.visible&&gGameEngine.players[1].bmp.visible),'guest did not render both private-match players');
  console.log('PRIVATE_CONNECT_VISIBLE_STATE PASS');

  await host.evaluate(()=>{
    const g=gGameEngine;
    for(const t of g.tiles.slice())if(t.material==='wood'){g.stage.removeChild(t.bmp);g.tiles.splice(g.tiles.indexOf(t),1)}
    for(const b of g.bonuses.slice())try{b.destroy()}catch(e){}
    const p=g.players[1],px=Utils.convertToBitmapPosition({x:9,y:9});
    p.bmp.x=px.x;p.bmp.y=px.y;p.updatePosition();if(p.updateNameLabel)p.updateNameLabel();
    p.bombsMax=3;p.bombKickCharges=2;p.bonusCounts=p.bonusCounts||{};p.bonusCounts.kick=2;p.lastMoveDirection={x:1,y:0};p.bombKickArmed=false;
    BomberMultiplayer.publish();
  });
  await equalWorld(host,guest);
  assert.equal(await guest.evaluate(()=>gGameEngine.players[1].bombKickCharges),2,'kick inventory did not mirror to guest');

  await guest.keyboard.down('KeyE');await sleep(40);await guest.keyboard.up('KeyE');
  await wait(()=>host.evaluate(()=>gGameEngine.bombs.some(b=>b.__v160Moving)),'E did not create an authoritative moving bomb');
  await wait(()=>guest.evaluate(()=>BomberMultiplayer.inspect().world.bombs.some(b=>b.moving)),'guest did not receive moving bomb state');
  const kickState=await host.evaluate(()=>({charges:gGameEngine.players[1].bombKickCharges,bombs:BomberMultiplayer.inspect().world.bombs.map(b=>({moving:b.moving,dir:b.dir}))}));
  assert.equal(kickState.charges,1,'E did not consume exactly one Bomb Kick charge');
  assert.ok(kickState.bombs.some(b=>b.moving&&b.dir&&b.dir.x===1&&b.dir.y===0),'E bomb did not travel in the last movement direction');
  console.log('DIRECT_E_KICK_AUTHORITATIVE PASS');

  await sleep(220);
  await guest.keyboard.down('Space');await sleep(35);await guest.keyboard.up('Space');
  await wait(()=>host.evaluate(()=>gGameEngine.bombs.length>=2),'Space did not place a second bomb');
  const normal=await host.evaluate(()=>BomberMultiplayer.inspect().world.bombs.map(b=>({moving:b.moving,x:b.x,y:b.y})));
  assert.ok(normal.some(b=>b.moving),'traveling E bomb disappeared unexpectedly');
  assert.ok(normal.some(b=>!b.moving),'Space must place a normal stationary bomb');
  assert.equal(await host.evaluate(()=>gGameEngine.players[1].bombKickCharges),1,'Space incorrectly consumed a Bomb Kick charge');
  await equalWorld(host,guest);
  console.log('SPACE_NORMAL_BOMB PASS');

  const roundBefore=await guest.evaluate(()=>BomberMultiplayer.roundId);
  await guest.evaluate(()=>B115.conn.close());
  await wait(()=>guest.evaluate(()=>B115.conn?.open&&BomberDataSync.role==='guest'),'guest did not automatically reconnect',20000);
  await wait(()=>guest.evaluate(()=>BomberMultiplayer.metrics.resyncs>0),'guest did not receive authoritative reconnect resync',10000);
  assert.equal(await guest.evaluate(()=>BomberMultiplayer.roundId),roundBefore,'reconnect incorrectly started a new round');
  await equalWorld(host,guest,10000);
  assert.ok(await host.evaluate(()=>gGameEngine.players[0].bmp.visible&&gGameEngine.players[1].bmp.visible),'host lost a player sprite after reconnect');
  assert.ok(await guest.evaluate(()=>gGameEngine.players[0].bmp.visible&&gGameEngine.players[1].bmp.visible),'guest lost a player sprite after reconnect');
  console.log('RECONNECT_RESYNC_VISIBILITY PASS');

  // Public matchmaking is tested in fresh clients. Reusing a page immediately
  // after a private game is an artificial lifecycle that is not part of normal
  // host/join flow and can retain intentional game/menu state from that match.
  const publicHost=await client('PublicHost'),publicGuest=await client('PublicGuest');
  const publicRoom='bomberman-public-smoke-'+Date.now();
  await publicHost.evaluate(id=>{
    B115.PUBLIC=[id];
    BomberV124.setAIEnabled(false);
    B115.startPublicHost();
  },publicRoom);
  await sleep(700);
  await publicGuest.evaluate(id=>{
    B115.PUBLIC=[id];
    BomberV124.setAIEnabled(false);
    B115.startPublicJoin();
  },publicRoom);
  await wait(()=>publicGuest.evaluate(()=>BomberDataSync.role==='guest'&&!!BomberMultiplayer.roundId&&B115.conn?.open),'public connection did not establish',30000);
  await equalWorld(publicHost,publicGuest,10000);
  assert.equal(await publicHost.evaluate(()=>BomberDataSync.role),'host');
  assert.equal(await publicGuest.evaluate(()=>BomberDataSync.role),'guest');
  assert.ok(await publicHost.evaluate(()=>gGameEngine.players[0].bmp.visible&&gGameEngine.players[1].bmp.visible),'host did not render both public-match players');
  assert.ok(await publicGuest.evaluate(()=>gGameEngine.players[0].bmp.visible&&gGameEngine.players[1].bmp.visible),'guest did not render both public-match players');
  console.log('PUBLIC_CONNECT_VISIBLE_STATE PASS');

  assert.deepEqual(errors,[]);
  console.log('MULTIPLAYER_KICK_RECONNECT_SMOKE PASS');
}finally{
  await Promise.all(contexts.map(c=>c.close()));
  await browser.close();
}
