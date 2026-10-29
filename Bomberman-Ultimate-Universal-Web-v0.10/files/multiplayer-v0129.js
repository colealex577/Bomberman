/* One host simulation; guests render a revisioned mirror and predict movement only. */
(function () {
'use strict';
const S = window.B115;
if (!S) return;
const DS = window.BomberDataSync = {active:false,role:'offline',version:'v0.12.9-authoritative'};
// Compatibility consumers use this flag, but the old data netcode is not loaded.
S.__dataSyncInstalled = true;
const N = window.BomberMultiplayer = {
 version:'v0.12.9', ready:false, roundId:null, roundNumber:0, worldRevision:0,
 actorSequence:0, lastActorSequence:0, inputSequence:0, lastProcessedInput:0,
 mirror:null, debug:new URLSearchParams(location.search).has('netdebug'),
 metrics:{guestBotUpdates:0,corrections:0,rejectedPackets:0},
};
const G=()=>window.gGameEngine;
const host=()=>DS.active&&S.role==='host';
const guest=()=>DS.active&&S.role==='guest';
const copy=x=>JSON.parse(JSON.stringify(x));
const cell=p=>p.y*G().tilesX+p.x;
const pos=n=>({x:n%G().tilesX,y:Math.floor(n/G().tilesX)});
let session='',lastWorld=null,pending=[],commands=[],serial=0,controlSeq=0,lastControl=0;
let building=null,starting=false,lastFrame=0,lastRecovery=0,lastQueued=0;
let oldHost,oldGuest,oldSend,baseMove,previousSession='',lastSeenRound=0;
let budget=200,budgetTime=0, applying=false,announcedRound=null;
const retiredSessions=new Set();
const legacyWire=/^(dataState|dataWorld|dataBombSpawn|dataBombExplode|v125Move|v125BombRequest|v125BombAck|v125Pickup|key|bomb|streamRetry|streamAck|qolRematchRequest|qolRematchResponse|qolRematchStart)$/;
const controls=/^(v127DuelResolved|v127AIBonus|v127RematchRequest|v127RematchResponse|v123Profile|spectate|matchEnd|qolOpponentLeft)$/;
function raw(d){if(S.conn&&S.conn.open)oldSend.call(S,d)}
function send(kind,data){raw(Object.assign({type:'auth129',kind,roundId:N.roundId,roundNumber:N.roundNumber,session},data))}
function stats(e){return {v:e.velocity,bm:e.bombsMax,bs:e.bombStrength,h:e.hearts||0,c:copy(e.bonusCounts||{})}}
function putStats(e,s){e.velocity=s.v;e.bombsMax=s.bm;e.bombStrength=s.bs;e.hearts=s.h;e.bonusCounts=copy(s.c)}
function actors(){return G().players.concat(G().bots)}
function ensureBomb(b){if(!b.__dataNetId)b.__dataNetId=N.roundId+':b'+(++serial);if(!b.endTime)b.endTime=Date.now()+b.timerMax*1000;return b}
function world(){
 const g=G();
 return {
 tiles:g.tiles.map(t=>[cell(t.position),t.material]).sort((a,b)=>a[0]-b[0]),
 bonuses:g.bonuses.map(b=>[cell(b.position),b.type]).sort((a,b)=>a[0]-b[0]),
 bombs:g.bombs.map(b=>{ensureBomb(b);return {id:b.__dataNetId,x:b.position.x,y:b.position.y,s:b.strength,owner:g.players.indexOf(b.owner),end:b.endTime,exploded:!!b.exploded,cells:b.fires.map(f=>cell(f.position)).sort((a,b)=>a-b)}}).sort((a,b)=>a.id.localeCompare(b.id)),
 actors:actors().map(e=>({alive:e.alive!==false,stats:stats(e)})),
 finished:!!g.matchFinished,spectatorFinished:!!g.spectatorFinished,
 };
}
function checksum(w){let h=2166136261;const s=JSON.stringify(w);for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return (h>>>0).toString(16)}
function actorPacket(){return {q:++N.actorSequence,ack:N.lastProcessedInput,at:Date.now(),actors:actors().map(e=>({x:e.bmp.x,y:e.bmp.y,an:e.bmp.currentAnimation||'idle',attack:!!e.hyperAggressive,alive:e.alive!==false}))}}
function diff(a,b){
 const ops=[];
 for(const [key,removed,added] of [['tiles','woodDestroyed','tileChanged'],['bonuses','bonusCollected','bonusSpawned'],['bombs','bombRemoved','bombSpawned']]){
  const id=x=>key==='bombs'?x.id:x[0],am=new Map(a[key].map(x=>[id(x),x])),bm=new Map(b[key].map(x=>[id(x),x]));
  for(const [k] of am)if(!bm.has(k))ops.push({type:removed,key,id:k});
  for(const [k,v] of bm)if(JSON.stringify(am.get(k))!==JSON.stringify(v))ops.push({type:key==='bombs'&&v.exploded?'bombExploded':added,key,id:k,value:v});
 }
 if(JSON.stringify(a.actors)!==JSON.stringify(b.actors))ops.push({type:'actorStatsOrDeath',key:'actors',value:b.actors});
 for(const k of ['finished','spectatorFinished'])if(a[k]!==b[k])ops.push({type:'roundState',key:k,value:b[k]});
 return ops;
}
function publish(){
 if(!host()||!N.roundId||starting)return;
 const w=world();if(lastWorld){const ops=diff(lastWorld,w);if(ops.length)send('events',{worldRevision:++N.worldRevision,ops})}
 lastWorld=copy(w);
}
function recovery(){publish();send('snapshot',{worldRevision:N.worldRevision,world:lastWorld,checksum:checksum(lastWorld)})}
function animate(e,a){if(e.bmp.currentAnimation!==a)e.animate(a)}
function applyLife(){
 const g=G();actors().forEach((e,i)=>{const a=N.mirror.actors[i];if(!a)return;putStats(e,a.stats);if(!a.alive&&e.alive!==false){e.alive=false;if(e.nameLabel)e.nameLabel.visible=false;animate(e,'dead');e.fade()} });
 g.matchFinished=N.mirror.finished;g.spectatorFinished=N.mirror.spectatorFinished;
 if(g.updateStatHud)g.updateStatHud();
}
function removeVisual(b){if(b.bmp)G().stage.removeChild(b.bmp);(b.fires||[]).forEach(f=>G().stage.removeChild(f.bmp))}
function sprite(img,w,h,regX,regY,frames){return new createjs.Sprite(new createjs.SpriteSheet({images:[img],frames:{width:w,height:h,regX,regY},animations:{idle:[0,frames,'idle',.2]}}),'idle')}
function renderWorld(){
 const g=G(),w=N.mirror;
 const wanted=new Map(w.tiles),existing=new Map(g.tiles.map(t=>[cell(t.position),t]));
 for(const [k,t] of existing)if(wanted.get(k)!==t.material){g.stage.removeChild(t.bmp);g.tiles.splice(g.tiles.indexOf(t),1);existing.delete(k)}
 for(const [k,m] of wanted)if(!existing.has(k)){const t=new Tile(m,pos(k));g.stage.addChild(t.bmp);g.tiles.push(t)}
 const bonuses=new Map(w.bonuses);
 for(const b of g.bonuses.slice())if(bonuses.get(cell(b.position))!==b.type){g.stage.removeChild(b.bmp);g.bonuses.splice(g.bonuses.indexOf(b),1)}
 const kinds={speed:0,bomb:1,fire:2,heart:3};
 for(const [k,t] of bonuses)if(!g.bonuses.some(b=>cell(b.position)===k))g.bonuses.push(new Bonus(pos(k),kinds[t]));
 const bombs=new Map(w.bombs.map(b=>[b.id,b]));
 for(const b of g.bombs.slice())if(!bombs.has(b.__dataNetId)){removeVisual(b);g.bombs.splice(g.bombs.indexOf(b),1)}
 for(const d of w.bombs){
  let b=g.bombs.find(b=>b.__dataNetId===d.id);
  if(!b){b={__dataNetId:d.id,position:{x:d.x,y:d.y},strength:d.s,endTime:d.end,exploded:false,fires:[],owner:g.players[d.owner],__v125OwnerSlot:d.owner};b.bmp=sprite(g.bombImg,28,28,5,5,4);b.bmp.x=d.x*g.tileSize+7;b.bmp.y=d.y*g.tileSize+7;g.stage.addChild(b.bmp);g.bombs.push(b);actors().forEach(p=>{if(Utils.comparePositions(p.position,b.position))p.escapeBomb=b})}
  if(b.exploded!==d.exploded||JSON.stringify(b.fires.map(f=>cell(f.position)).sort((a,b)=>a-b))!==JSON.stringify(d.cells)){
   b.fires.forEach(f=>g.stage.removeChild(f.bmp));b.fires=[];b.exploded=d.exploded;
   if(d.exploded){g.stage.removeChild(b.bmp);for(const k of d.cells){const p=pos(k),bmp=sprite(g.fireImg,38,38,0,0,5);bmp.x=p.x*g.tileSize+2;bmp.y=p.y*g.tileSize-5;g.stage.addChild(bmp);b.fires.push({position:p,bmp})}}
  }
 }
 // Hidden pickups stay under wood; actors and their labels remain above the board.
 g.tiles.forEach(t=>{if(t.material==='wood')g.moveToFront(t.bmp)});
 actors().forEach(e=>{g.moveToFront(e.bmp);if(e.nameLabel)g.moveToFront(e.nameLabel)});
 applyLife();
}
function direction(){const a=gInputEngine.actions;return a.up2?'up':a.down2?'down':a.left2?'left':a.right2?'right':'idle'}
// Shared movement only. No pickup, death, bomb, AI or world updates are reachable here.
function move(p,dir,dt){
 if(!p||!p.alive)return;
 const v=p.velocity*Math.min(dt,34)/(1000/G().fps),dx=dir==='left'?-1:dir==='right'?1:0,dy=dir==='up'?-1:dir==='down'?1:0;
 animate(p,dir);if(!dx&&!dy)return;
 // Substeps prevent high-speed pickups from tunnelling through a wall or bomb.
 const steps=Math.max(1,Math.ceil(v/2));
 for(let n=0;n<steps;n++){
  const q={x:p.bmp.x+dx*v/steps,y:p.bmp.y+dy*v/steps};
  if(p.detectBombCollision(q))break;
  if(p.detectWallCollision(q)){
   const corner=p.getCornerFix(dx,dy);if(!corner)break;
   const fix={x:p.bmp.x+(dy?Math.sign(corner.x-p.bmp.x)*v/steps:0),y:p.bmp.y+(dx?Math.sign(corner.y-p.bmp.y)*v/steps:0)};
   if(p.detectWallCollision(fix)||p.detectBombCollision(fix))break;p.bmp.x=fix.x;p.bmp.y=fix.y;
  }else{p.bmp.x=q.x;p.bmp.y=q.y}p.updatePosition();
 }
}
function input(dt,bomb){
 if(!guest()||!N.roundId||G().menu.visible||G().lobbyOpen)return;
 const p=G().players[1];if(!p||!p.alive)return;
 const cmd={seq:++N.inputSequence,player:1,dt:Math.max(0,Math.min(34,dt)),dir:direction(),at:Date.now()};
 if(bomb)cmd.bomb={x:p.position.x,y:p.position.y};
 else move(p,cmd.dir,cmd.dt);
 pending.push(cmd);if(pending.length>180)pending.shift();send('input',{cmd});
}
function plant(p,x,y){
 const g=G();if(!p||!p.alive||g.menu.visible||g.matchFinished||!Number.isInteger(x)||!Number.isInteger(y))return;
 // Press-time tile must be the tile reached by the preceding ordered movement inputs.
 if(x!==p.position.x||y!==p.position.y||g.getTileMaterial({x,y})!=='grass')return;
 if(g.bombs.some(b=>!b.exploded&&b.position.x===x&&b.position.y===y)||p.bombs.filter(b=>!b.exploded).length>=p.bombsMax)return;
 const b=new Bomb({x,y},p.bombStrength);b.owner=p;b.__v125OwnerSlot=1;ensureBomb(b);g.stage.addChild(b.bmp);p.bombs.push(b);g.bombs.push(b);p.escapeBomb=b;b.setExplodeListener(()=>Utils.removeFromArray(p.bombs,b));
}
function processInputs(){
 const p=G().players[1];if(!p)return;
 const now=performance.now();budget=Math.min(200,budget+Math.max(0,now-budgetTime));budgetTime=now;
 while(commands.length){const c=commands.shift();if(c.seq<=N.lastProcessedInput)continue;
  const dt=Math.min(c.dt,budget);budget-=dt;move(p,c.dir,dt);N.lastProcessedInput=c.seq;
  if(p.alive){if(p.detectFireCollision())p.die();if(p.alive)p.handleBonusCollision()}
  if(c.bomb)plant(p,c.bomb.x,c.bomb.y);
 }
}
function receiveActors(d){
 if(d.q<=N.lastActorSequence)return;N.lastActorSequence=d.q;
 const now=performance.now();actors().forEach((e,i)=>{
  const a=d.actors[i];if(!a)return;e.hyperAggressive=!!a.attack;e.attackMode=!!a.attack;
  if(i===1){
   pending=pending.filter(c=>c.seq>d.ack);
   const visible={x:e.bmp.x,y:e.bmp.y};e.bmp.x=a.x;e.bmp.y=a.y;e.updatePosition();e.escapeBomb=G().bombs.find(b=>!b.exploded&&Utils.comparePositions(b.position,e.position))||null;
   for(const c of pending)if(!c.bomb)move(e,c.dir,c.dt);
   const error=Math.hypot(e.bmp.x-visible.x,e.bmp.y-visible.y);
   if(error<1.5){e.bmp.x=visible.x;e.bmp.y=visible.y;e.updatePosition()}else N.metrics.corrections++;
  }else{e.__authTarget={fromX:e.bmp.x,fromY:e.bmp.y,x:a.x,y:a.y,an:a.an,at:now}}
 });
}
N.frame=function(){
 if(!guest())return false;
 const now=performance.now(),dt=lastFrame?Math.min(34,now-lastFrame):16.667;lastFrame=now;
 if(N.roundId){input(dt,false);for(const e of actors()){const t=e.__authTarget;if(!t||!e.alive)continue;const k=Math.min(1,(now-t.at)/50);e.bmp.x=t.fromX+(t.x-t.fromX)*k;e.bmp.y=t.fromY+(t.y-t.fromY)*k;e.updatePosition();animate(e,t.an)}}
 G().menu.update();G().stage.update();return true;
};
N.afterFrame=publish;
function newRound(){
 N.roundNumber++;N.roundId=session+':'+N.roundNumber;N.worldRevision=0;N.actorSequence=0;N.lastActorSequence=0;N.lastProcessedInput=0;N.inputSequence=0;lastQueued=0;serial=0;commands=[];pending=[];lastWorld=null;budget=200;budgetTime=performance.now();
}
function initPacket(type){announcedRound=N.roundId;publish();const w=world();lastWorld=copy(w);send('init',{worldRevision:N.worldRevision,world:w,actors:actorPacket(),startType:type,names:[S.localName,S.remoteName],ultimate:S.ultimate,dropRate:S.dropRate,bots:G().bots.length})}
function begin(d){
 if(retiredSessions.has(d.session))return;
 if(d.session===previousSession&&d.roundNumber<=lastSeenRound)return;
 if(previousSession&&previousSession!==d.session)retiredSessions.add(previousSession);
 previousSession=d.session;lastSeenRound=d.roundNumber;session=d.session;N.roundId=d.roundId;N.roundNumber=d.roundNumber;N.worldRevision=d.worldRevision;N.lastActorSequence=0;N.inputSequence=0;pending=[];lastFrame=0;lastControl=0;
 DS.active=true;DS.role='guest';S.started=true;S.streamAck=true;S.clearFallback();
 S.remoteName=S.cleanName(d.names[0]);S.localName=S.cleanName(d.names[1]);S.applyMode(d.ultimate,true);S.applyDrop(d.dropRate,true);
 const g=G();g.onlineDataMode=true;g.networkRole='guest';g.playerNames=d.names;g.simulatedOpponentMode=false;g.lobbyOpen=false;
 S.els.lobby.hidden=true;S.els.localStage.hidden=false;S.els.remoteStage.hidden=true;S.els.matchBar.hidden=false;
 building=d;N.mirror=copy(d.world);
 try{if(d.startType==='start')g.menu.setMode('multi');else oldGuest.call(S,{type:'v127RematchStart'})}finally{building=null}
 renderWorld();receiveActors(d.actors);
 if(d.startType==='start')oldGuest.call(S,{type:'start',names:d.names,ultimate:d.ultimate,dropRate:d.dropRate});
 S.els.localStage.hidden=false;S.els.remoteStage.hidden=true;S.ensureMusic();S.chatVisibility();
}
function receive(d,isHost){
 if(!d||d.type!=='auth129')return false;
 if(d.kind==='init'&&!isHost){begin(d);return true}
 if(d.roundId!==N.roundId||d.session!==session){N.metrics.rejectedPackets++;return true}
 if(isHost){
  if(d.kind==='input'){
   const c=d.cmd;if(!c||c.player!==1||!Number.isSafeInteger(c.seq)||c.seq<=lastQueued||!Number.isFinite(c.dt)||c.dt<0||c.dt>34||!['up','down','left','right','idle'].includes(c.dir)||commands.length>=180)return true;
   lastQueued=c.seq;commands.push(c);
  }else if(d.kind==='recover')recovery();
  else if(d.kind==='control'&&d.q>lastControl&&/^(v127RematchRequest|v127RematchResponse|v123Profile|qolOpponentLeft)$/.test(d.packet.type)){lastControl=d.q;oldHost.call(S,d.packet)}
  return true;
 }
 if(d.kind==='actors')receiveActors(d);
 else if(d.kind==='events'){
  if(d.worldRevision<=N.worldRevision)return true;
  if(d.worldRevision!==N.worldRevision+1){send('recover',{});return true}
  const w=copy(N.mirror);
  for(const op of d.ops){if(['tiles','bonuses','bombs'].includes(op.key)){const key=x=>op.key==='bombs'?x.id:x[0];w[op.key]=w[op.key].filter(x=>key(x)!==op.id);if(op.value)w[op.key].push(op.value);w[op.key].sort((a,b)=>op.key==='bombs'?a.id.localeCompare(b.id):a[0]-b[0])}else if(['actors','finished','spectatorFinished'].includes(op.key))w[op.key]=op.value}
  N.mirror=w;N.worldRevision=d.worldRevision;renderWorld();
 }else if(d.kind==='snapshot'){
  if(d.worldRevision<N.worldRevision)return true;
  if(N.debug&&d.worldRevision===N.worldRevision&&checksum(world())!==d.checksum)console.warn('[net129] mirror mismatch',{roundId:N.roundId,revision:N.worldRevision,expected:d.world,actual:world()});
  N.mirror=copy(d.world);N.worldRevision=d.worldRevision;renderWorld();
 }else if(d.kind==='control'&&d.q>lastControl){lastControl=d.q;if(d.packet.type==='spectate'){G().spectatorMode=true;const banner=document.getElementById('spectatorBanner');if(banner)banner.hidden=false}applying=true;try{oldGuest.call(S,d.packet)}finally{applying=false}}
 return true;
}
function install(){
 if(N.ready)return true;
 if(!window.BomberV127||!BomberV127.fixLayerReady||!window.BomberLeaderboard127||!window.BomberV125||!BomberV125.connectInstalled)return false;
 oldSend=S.send;oldHost=S.hostData;oldGuest=S.guestData;
 S.send=function(d){
  if(!d)return;if(legacyWire.test(d.type))return;
  if(d.type==='start'||d.type==='v127RematchStart'){if(host())initPacket(d.type);return}
  if(controls.test(d.type)){if(N.roundId&&!applying){publish();send('control',{q:++controlSeq,packet:d})}return}
  return oldSend.call(S,d);
 };
 S.hostData=function(d){if(receive(d,true))return;if(d&&(legacyWire.test(d.type)||controls.test(d.type)))return;return oldHost.call(S,d)};
 S.guestData=function(d){if(receive(d,false))return;if(d&&(legacyWire.test(d.type)||controls.test(d.type)||d.type==='start'||d.type==='v127RematchStart'))return;return oldGuest.call(S,d)};
 const start=S.startHostMatch;S.startHostMatch=function(){if(S.started)return;session=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);N.roundNumber=0;DS.active=true;DS.role='host';G().onlineDataMode=true;G().networkRole='host';return start.apply(S,arguments)};
 const destroy=S.destroyNetwork;S.destroyNetwork=function(){DS.active=false;DS.role='offline';N.roundId=null;N.mirror=null;pending=[];commands=[];return destroy.apply(S,arguments)};
 S.streamTo=function(){};S.incomingCall=c=>c.close();
 const restart=GameEngine.prototype.restart;GameEngine.prototype.restart=function(){if(guest()&&!building)return;if(host()){newRound();starting=true}try{return restart.apply(this,arguments)}finally{starting=false;if(host()){const id=N.roundId;setTimeout(()=>{if(host()&&N.roundId===id&&announcedRound!==id)initPacket('v127RematchStart')},0)}}};
 const tiles=GameEngine.prototype.drawTiles,bonuses=GameEngine.prototype.drawBonuses,bots=GameEngine.prototype.spawnBots;
 GameEngine.prototype.drawTiles=function(){if(!building)return tiles.apply(this,arguments);for(let y=0;y<this.tilesY;y++)for(let x=0;x<this.tilesX;x++){const t=new Tile('grass',{x,y});this.stage.addChild(t.bmp)}for(const [k,m] of building.world.tiles){const t=new Tile(m,pos(k));this.stage.addChild(t.bmp);this.tiles.push(t)}};
 GameEngine.prototype.drawBonuses=function(){if(!building)return bonuses.apply(this,arguments)};
 GameEngine.prototype.spawnBots=function(){if(!building)return bots.apply(this,arguments);const count=this.botsCount;this.botsCount=building.bots;try{return bots.apply(this,arguments)}finally{this.botsCount=count}};
 baseMove=Player.prototype.update;Player.prototype.update=function(){if(guest())return;if(host()&&this===G().players[1]){processInputs();if(this.alive){if(this.detectFireCollision())this.die();if(this.alive)this.handleBonusCollision()}return}return baseMove.apply(this,arguments)};
 const botUpdate=Bot.prototype.update;Bot.prototype.update=function(){if(guest()){N.metrics.guestBotUpdates++;return}return botUpdate.apply(this,arguments)};
 const pickup=Player.prototype.handleBonusCollision,die=Player.prototype.die;
 Player.prototype.handleBonusCollision=function(){if(guest())return;return pickup.apply(this,arguments)};
 Player.prototype.die=function(){if(guest())return;return die.apply(this,arguments)};
 const bombInit=Bomb.prototype.init,bombUpdate=Bomb.prototype.update,bombExplode=Bomb.prototype.explode;
 Bomb.prototype.init=function(){const r=bombInit.apply(this,arguments);if(host())ensureBomb(this);return r};
 Bomb.prototype.update=function(){if(guest())return;if(host()){if(!this.exploded&&Date.now()>=ensureBomb(this).endTime)this.explode();return}return bombUpdate.apply(this,arguments)};
 Bomb.prototype.explode=function(){if(guest()||this.exploded)return;return bombExplode.apply(this,arguments)};
 const action=S.remoteAction;S.remoteAction=function(a,down){if(!guest())return action.apply(S,arguments);const was=!!gInputEngine.actions[a];gInputEngine.actions[a]=!!down;if(a==='bomb2'&&down&&!was)input(0,true)};
 window.addEventListener('keyup',e=>{if(DS.active&&e.code==='Enter'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){e.preventDefault();e.stopImmediatePropagation();BomberV127.requestRematch()}},true);
 const keys={ArrowUp:'up2',KeyW:'up2',ArrowDown:'down2',KeyS:'down2',ArrowLeft:'left2',KeyA:'left2',ArrowRight:'right2',KeyD:'right2',Space:'bomb2',ShiftLeft:'bomb2',ShiftRight:'bomb2'};
 for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{if(!guest()||!keys[e.code]||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;S.remoteAction(keys[e.code],type==='keydown');e.preventDefault();e.stopPropagation()},true);
 BomberOnline.sendTouchAction=function(a,down){if(guest())S.remoteAction({up:'up2',down:'down2',left:'left2',right:'right2',bomb:'bomb2'}[a]||a,down)};
 BomberOnline.isDataMatch=()=>DS.active;BomberOnline.broadcastBomb=function(){};
 const badge=document.createElement('div');badge.id='buildVersion129';badge.textContent=N.version;badge.setAttribute('aria-label','Game version');badge.style.cssText='position:fixed;top:5px;left:6px;z-index:2147483647;background:#21111a;color:white;padding:2px 5px;font:bold 9px Arial;pointer-events:none';document.body.appendChild(badge);
 const style=document.createElement('style');style.textContent='#buildVersion127{display:none!important}';document.head.appendChild(style);
 BomberV125.netInstalled=true;N.ready=true;
 N.inspect=()=>({roundId:N.roundId,worldRevision:N.worldRevision,world:world(),checksum:checksum(world())});
 N.recovery=recovery;N.publish=publish;
 return true;
}
const t=setInterval(()=>{if(install())clearInterval(t)},40);
setInterval(()=>{if(!N.ready||!host()||!N.roundId)return;publish();send('actors',actorPacket());if(Date.now()-lastRecovery>3000){lastRecovery=Date.now();recovery()}},1000/30);
})();
