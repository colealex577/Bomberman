import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const clients=[],errors=[];
async function client(name){
 const ctx=await browser.createBrowserContext(),p=await ctx.newPage();clients.push(ctx);
 p.on('console',m=>{if(m.text().startsWith('[connect]'))console.log(m.text())});
 p.on('pageerror',e=>errors.push(name+': '+e.stack));
 await p.evaluateOnNewDocument(name=>{localStorage.setItem('BombermanPlayerName',name);localStorage.setItem('BombermanRatingV1','100');localStorage.setItem('BombermanScoreV1Initialized','1');navigator.serviceWorker.register=()=>Promise.resolve({})},name);
 await p.goto(process.env.TEST_URL);await p.waitForFunction(()=>window.BomberMultiplayer?.ready);return p;
}
async function wait(fn,message,ms=6000){const until=Date.now()+ms;while(Date.now()<until){if(await fn())return;await sleep(40)}throw Error(message)}
const state=p=>p.evaluate(()=>BomberMultiplayer.inspect());
async function equalWorld(a,b){await wait(async()=>{const [x,y]=await Promise.all([state(a),state(b)]);return x.roundId===y.roundId&&x.worldRevision===y.worldRevision&&x.checksum===y.checksum},'host and rendered guest worlds diverged')}
try{
 const h=await client('Authority'),g=await client('Mirror');
 const id='bomberman-auth129-'+Date.now();
 await h.evaluate(id=>{BomberV124.setAIEnabled(false);B115.privateId=()=>id;B115.els.privateCode.value='9';B115.startPrivateHost()},id);await sleep(800);
 await g.evaluate(id=>{B115.privateId=()=>id;B115.els.privateCode.value='9';B115.startPrivateJoin()},id);
 await wait(()=>g.evaluate(()=>BomberDataSync.role==='guest'&&!!BomberMultiplayer.roundId),'connection failed',30000);
 await equalWorld(h,g);assert.equal((await state(h)).world.actors.length,2);assert.equal(await g.evaluate(()=>gGameEngine.bots.length),0);
 console.log('INITIAL_BOARD_AI_OFF PASS');
 // Delay guest inputs, leaving real WebRTC transport in place. Prediction must precede host processing.
 await g.evaluate(()=>{const send=B115.send;B115.send=function(d){if(d?.type==='auth129'&&d.kind==='input'){setTimeout(()=>send.call(B115,d),100);return}return send.call(B115,d)}});
 const before=await g.evaluate(()=>gGameEngine.players[1].bmp.y);
 await g.keyboard.down('ArrowUp');await sleep(65);
 assert.ok(await g.evaluate(y=>gGameEngine.players[1].bmp.y<y-1,before),'prediction was not immediate');
 await sleep(150);await g.keyboard.up('ArrowUp');await sleep(450);
 const xy=await Promise.all([h,g].map(p=>p.evaluate(()=>({x:gGameEngine.players[1].bmp.x,y:gGameEngine.players[1].bmp.y,tile:gGameEngine.players[1].position}))));
 assert.ok(Math.hypot(xy[0].x-xy[1].x,xy[0].y-xy[1].y)<2);assert.deepEqual(xy[0].tile,xy[1].tile);
 console.log('PREDICTED_INPUT_ACK PASS');
 // Prepare a host-owned open lane and one destructible block in the blast.
 await h.evaluate(()=>{const g=gGameEngine;for(const t of g.tiles.slice())if(t.material==='wood'){g.stage.removeChild(t.bmp);g.tiles.splice(g.tiles.indexOf(t),1)}for(const b of g.bonuses.slice())b.destroy();const p=g.players[1];p.bmp.x=13*32;p.bmp.y=11*32;p.updatePosition();p.bombStrength=2;const t=new Tile('wood',{x:12,y:11});g.tiles.push(t);g.stage.addChild(t.bmp);BomberMultiplayer.publish()});await sleep(400);await equalWorld(h,g);
 const press=await g.evaluate(()=>({...gGameEngine.players[1].position}));
 await g.evaluate(()=>{const send=B115.send;B115.send=function(d){const r=send.call(B115,d);if(d?.type==='auth129'&&d.kind==='input'&&d.cmd?.bomb)send.call(B115,d);return r}});
 await g.keyboard.down('Space');await sleep(20);await g.keyboard.up('Space');
 await wait(async()=>{const x=await state(g);return x.world.bombs.length===1},'authoritative bomb missing');
 await equalWorld(h,g);const bomb=(await state(h)).world.bombs[0];assert.equal(bomb.x,press.x);assert.equal(bomb.y,press.y);assert.ok(bomb.id);
 assert.equal(await g.evaluate(()=>gGameEngine.bombs[0] instanceof Bomb),false,'guest created gameplay Bomb');
 await g.keyboard.down('ArrowRight');await sleep(580);await g.keyboard.up('ArrowRight');await g.keyboard.down('ArrowUp');await sleep(400);await g.keyboard.up('ArrowUp');
 assert.ok(await g.evaluate(()=>gGameEngine.players[1].position.x>13),'guest cannot escape bomb');
 await wait(()=>g.evaluate(()=>gGameEngine.bombs.some(b=>b.exploded)),'explosion missing');
 await equalWorld(h,g);const exploded=(await state(g)).world.bombs.find(b=>b.id===bomb.id);assert.ok(exploded.cells.includes(11*17+12),'host explosion cells missing wood');
 await wait(async()=>!(await state(g)).world.bombs.length,'bomb never removed');await equalWorld(h,g);
 assert.ok(!(await state(g)).world.tiles.some(t=>t[0]===11*17+12));
 console.log('BOMB_ID_PRESS_TILE_ESCAPE_EXPLOSION_WOOD PASS');
 // Spawn ahead of the player, then collect by actual guest input.
 const bonus=await h.evaluate(()=>{const p=gGameEngine.players[1];p.bmp.x=15*32;p.bmp.y=9*32;p.updatePosition();gGameEngine.bonuses.push(new Bonus({x:15,y:8},0));BomberMultiplayer.publish();return p.velocity});
 await sleep(400);await equalWorld(h,g);const stale=await state(h);
 assert.ok(stale.world.bonuses.length);await g.keyboard.down('ArrowUp');await sleep(330);await g.keyboard.up('ArrowUp');
 await wait(async()=>!(await state(g)).world.bonuses.length,'pickup not collected');await equalWorld(h,g);
 assert.ok((await state(g)).world.actors[1].stats.v>bonus);
 await g.evaluate(s=>B115.guestData({type:'auth129',kind:'snapshot',session:s.roundId.split(':')[0],roundId:s.roundId,worldRevision:s.worldRevision,world:s.world,checksum:s.checksum}),stale);
 await sleep(150);assert.equal((await state(g)).world.bonuses.length,0);assert.ok(!(await state(g)).world.tiles.some(t=>t[0]===11*17+12));
 console.log('PICKUP_STATS_STALE_SNAPSHOT PASS');
 await h.evaluate(()=>gGameEngine.players[1].die());await sleep(450);await equalWorld(h,g);
 assert.equal(await h.evaluate(()=>BomberV127.getScore()),110);assert.equal(await g.evaluate(()=>BomberV127.getScore()),90);
 await h.evaluate(()=>gGameEngine.players[1].die());await sleep(120);assert.equal(await g.evaluate(()=>BomberV127.getScore()),90);
 assert.ok(await g.evaluate(()=>!document.getElementById('qolPostMatch').hidden||!document.getElementById('qolEliminated').hidden));
 await g.evaluate(()=>BomberV127.requestRematch());await wait(()=>h.evaluate(()=>!document.getElementById('qolRematchPrompt').hidden),'rematch prompt missing');await h.click('#qolRematchAccept');
 await wait(async()=>(await state(g)).roundId!==stale.roundId,'round ID did not change');await equalWorld(h,g);
 const fresh=await state(g),rejected0=await g.evaluate(()=>BomberMultiplayer.metrics.rejectedPackets);
 await g.evaluate(s=>B115.guestData({type:'auth129',kind:'snapshot',session:s.roundId.split(':')[0],roundId:s.roundId,worldRevision:999999,world:s.world}),stale);
 await sleep(100);let current=await state(g),rejected1=await g.evaluate(()=>BomberMultiplayer.metrics.rejectedPackets);assert.equal(current.roundId,fresh.roundId);assert.ok(rejected1>rejected0,'old-round snapshot was not rejected');
 await g.evaluate(s=>B115.guestData({type:'auth129',kind:'actors',session:s.roundId.split(':')[0],roundId:s.roundId,q:999999,ack:999999,actors:[{x:0,y:0},{x:0,y:0}]}),stale);
 await sleep(100);current=await state(g);const rejected2=await g.evaluate(()=>BomberMultiplayer.metrics.rejectedPackets);assert.equal(current.roundId,fresh.roundId);assert.ok(rejected2>rejected1,'old-round actor packet was not rejected');
 console.log('DEATH_SCORING_REMATCH_OLD_ROUND PASS');
 // A fresh AI-on match verifies that guests never invoke Bot.update, including lightning.
 await h.evaluate(()=>{B115.destroyNetwork();B115.started=false});await g.evaluate(()=>{B115.destroyNetwork();B115.started=false});
 const ai=id+'-ai';await h.evaluate(id=>{BomberV124.setAIEnabled(true);B115.privateId=()=>id;B115.startPrivateHost()},ai);await sleep(800);await g.evaluate(id=>{B115.privateId=()=>id;B115.startPrivateJoin()},ai);
 await wait(()=>g.evaluate(()=>BomberDataSync.role==='guest'&&gGameEngine.bots.length===2),'AI match failed',30000);
 await g.evaluate(()=>{window.botCalls=0;for(const b of gGameEngine.bots)b.update=()=>{window.botCalls++}});
 await h.evaluate(()=>{for(const b of gGameEngine.bots){b.hyperAggressive=true;b.started=true}});await sleep(500);
 assert.equal(await g.evaluate(()=>window.botCalls),0);assert.ok(await g.evaluate(()=>gGameEngine.bots.every(b=>b.hyperAggressive&&b.__v126Marker?.visible)));
 await h.evaluate(()=>gGameEngine.bots[0].die());await sleep(1900);
 assert.ok(await g.evaluate(()=>{const dead=BomberMultiplayer.inspect().world.actors.filter(a=>!a.alive);return dead.length===1&&gGameEngine.bots[0].bmp.alpha<=0}),'guest must fade the dead AI');
 assert.ok(await g.evaluate(()=>gGameEngine.bots[1].alive),'surviving AI identity must remain intact');
 console.log('HOST_ONLY_AI_ATTACK_MIRROR PASS');
 // Public fallback opponent identity, visual randomization and two-second rematch.
 await g.evaluate(()=>{B115.destroyNetwork();B115.started=false;B115.kind='public';B115.setRole('host');B115.startSimulated()});await sleep(700);
 const sim=await g.evaluate(()=>{const p=BomberLeaderboard127.profile(B115.remoteName),b=gGameEngine.simulatedOpponent;return {p,score:b.rating,rank:b.leaderboardRank,appearance:b.characterAppearance}});
 assert.equal(sim.score,sim.p.score);assert.equal(sim.rank,sim.p.displayRank);assert.ok(sim.appearance);
 await g.evaluate(()=>{window.oldSim=gGameEngine.simulatedOpponent;BomberV127.requestRematch()});await sleep(1100);assert.equal(await g.evaluate(()=>oldSim===gGameEngine.simulatedOpponent),true);await sleep(1200);assert.equal(await g.evaluate(()=>oldSim===gGameEngine.simulatedOpponent),false);
 // Full-range matchmaking must still allow leaderboard leaders to appear in real public matches.
 await g.evaluate(()=>{localStorage.setItem('BombermanRatingV1','995');B115.kind='public';B115.setRole('host');BomberPolish131.debug.forceTarget(1000);B115.startSimulated()});await sleep(600);
 assert.ok(await g.evaluate(()=>gGameEngine.simulatedOpponent.leaderboardRank<=50),'top 50 opponent was not eligible for full-range matchmaking');
 const rankedBefore=await g.evaluate(()=>BomberLeaderboard127.profile(B115.remoteName));
 await g.evaluate(()=>gGameEngine.simulatedOpponent.die());
 await wait(()=>g.evaluate(before=>{const p=BomberLeaderboard127.profile(B115.remoteName);return p.losses===before.losses+1&&p.score===Math.max(0,before.score-10)},rankedBefore),'simulated opponent result did not settle',4000);
 const rankedAfter=await g.evaluate(()=>({p:BomberLeaderboard127.profile(B115.remoteName),score:gGameEngine.simulatedOpponent.rating}));
 assert.equal(rankedAfter.p.score,Math.max(0,rankedBefore.score-10));assert.equal(rankedAfter.score,rankedAfter.p.score);assert.equal(rankedAfter.p.losses,rankedBefore.losses+1);
 const floor=await g.evaluate(()=>{const p=BomberLeaderboard127.population().find(p=>p.score===0);BomberLeaderboard127.recordResult(p.name,-10);return BomberLeaderboard127.recordResult(p.name,10).score});assert.equal(floor,10,'zero score accumulated hidden loss debt');
 assert.deepEqual(errors,[]);console.log('AUTHORITATIVE_NETWORK_TEST PASS');
}finally{await Promise.all(clients.map(c=>c.close()));await browser.close()}