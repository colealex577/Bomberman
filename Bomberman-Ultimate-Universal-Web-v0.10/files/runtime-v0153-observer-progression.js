(function(){
'use strict';
var VERSION='v0.15.3.2',installed=false,apiStateBase=null,startBase=null;
var local={observeSerial:0,joinedSerial:0,state:0,progress:0,lastPrime:null,lastRoster:null,repairing:false};
var STATES=[
{id:1,remove:.10,travel:.16},{id:2,remove:.18,travel:.23},{id:3,remove:.27,travel:.31},{id:4,remove:.36,travel:.39},{id:5,remove:.46,travel:.48},
{id:6,remove:.56,travel:.57},{id:7,remove:.66,travel:.66},{id:8,remove:.75,travel:.75},{id:9,remove:.84,travel:.84},{id:10,remove:.92,travel:.92}
];
function G(){return window.gGameEngine||null}
function A(){return window.BomberHumanObserver152||null}
function clone(p){return p?{x:Number(p.x),y:Number(p.y)}:null}
function key(p){return Number(p.x)+','+Number(p.y)}
function spawn(g,slot){if(g&&g.getSpawnSlotPosition){var p=g.getSpawnSlotPosition(slot);if(p)return clone(p)}return{x:slot<2?1:g.tilesX-2,y:slot%2?g.tilesY-2:1}}
function n4(p){return[{x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1}]}
function inside(g,p){return !!g&&p.x>0&&p.y>0&&p.x<g.tilesX-1&&p.y<g.tilesY-1}
function open(g,p){return inside(g,p)&&g.getTileMaterial(p)==='grass'}
function reachable(g,start){
 var out=[],q=[clone(start)],seen={};seen[key(start)]=1;
 while(q.length){var p=q.shift();if(!open(g,p))continue;out.push(p);var ns=n4(p);for(var i=0;i<ns.length;i++){var x=ns[i],k=key(x);if(!seen[k]&&open(g,x)){seen[k]=1;q.push(x)}}}
 return out
}
function woodAt(g,p){if(!inside(g,p))return null;for(var i=0;i<g.tiles.length;i++){var t=g.tiles[i];if(t&&t.material==='wood'&&t.position.x===p.x&&t.position.y===p.y)return t}return null}
function removeWood(g,t){if(!g||!t)return false;var i=g.tiles.indexOf(t);if(i<0)return false;g.tiles.splice(i,1);try{g.stage.removeChild(t.bmp)}catch(e){}return true}
function frontier(g,slot,stateId,step){
 var start=spawn(g,slot),cells=reachable(g,start),seen={},out=[];
 for(var i=0;i<cells.length;i++){var ns=n4(cells[i]);for(var j=0;j<ns.length;j++){var t=woodAt(g,ns[j]);if(!t)continue;var k=key(t.position);if(seen[k])continue;seen[k]=1;out.push(t)}}
 var cx=(g.tilesX-1)/2,cy=(g.tilesY-1)/2;
 out.sort(function(a,b){
  function score(t){var x=t.position.x,y=t.position.y,center=Math.abs(x-cx)+Math.abs(y-cy),axis=((slot+stateId+step)%2===0)?Math.abs(y-start.y):Math.abs(x-start.x),jitter=((x*37+y*53+slot*71+stateId*29+step*11)%23)/23;return center*.72+axis*.12+jitter*.55}
  return score(a)-score(b)
 });
 return out
}
function carve(g,spec){
 var initial=g.tiles.filter(function(t){return t&&t.material==='wood'}).length,target=Math.min(initial,Math.max(0,Math.round(initial*spec.remove))),removed=0,slot=spec.id%4,stalls=0;
 while(removed<target&&stalls<16){var f=frontier(g,slot,spec.id,removed),t=f.length?f[0]:null;if(t&&removeWood(g,t)){removed++;stalls=0}else stalls++;slot=(slot+1)%4}
 return{initial:initial,removed:removed,progress:initial?removed/initial:0}
}
function destroyBonus(g,b){try{if(b.destroy)b.destroy();else{g.stage.removeChild(b.bmp);Utils.removeFromArray(g.bonuses,b)}}catch(e){try{Utils.removeFromArray(g.bonuses,b)}catch(x){}}}
function settleBonuses(g,spec){
 var list=(g&&g.bonuses||[]).filter(function(b){return b&&b.position&&g.getTileMaterial(b.position)==='grass'}),removed=0,cap=spec.id<=1?1:spec.id===2?2:spec.id<=6?3:4;
 list.sort(function(a,b){function score(x){var p=x.position,t=String(x.type||'');return((p.x*47+p.y*61+spec.id*31+t.length*17)%997)}return score(a)-score(b)});
 for(var i=cap;i<list.length;i++){destroyBonus(g,list[i]);removed++}
 return{kept:Math.min(cap,list.length),removed:removed,cap:cap}
}
function living(){var g=G(),a=[];if(!g)return a;(g.players||[]).forEach(function(x){if(x&&x.alive!==false)a.push(x)});(g.bots||[]).forEach(function(x){if(x&&x.alive!==false)a.push(x)});return a}
function move(e,p){
 var g=G();if(!e||!p||!g)return;var px=Utils.convertToBitmapPosition(p);e.position=clone(p);
 if(e.bmp){e.bmp.x=px.x;e.bmp.y=px.y}
 if(e.targetPosition)e.targetPosition=clone(p);
 if(e.targetBitmapPosition)e.targetBitmapPosition={x:px.x,y:px.y};
 if(e.dirX!==undefined)e.dirX=0;if(e.dirY!==undefined)e.dirY=0;
 if(e.updatePosition)e.updatePosition();if(e.updateNameLabel)e.updateNameLabel()
}
function loadout(spec,slot){
 var id=spec.id,bomb=0,fire=0,speed=0,j=(slot*11+id*7)%3;
 if(id===1){if(slot===3)speed=1}
 else if(id===2){if(j===0)bomb=1;else if(j===1)fire=1;else speed=1}
 else if(id<=4){bomb=1;fire=((slot+id)%2===0)?1:0;speed=((slot+id)%2===1||id===4)?1:0}
 else if(id<=6){bomb=1+(((slot+id)%3===0)?1:0);fire=1+((id===6&&(slot%2===0))?1:0);speed=1}
 else if(id<=8){bomb=2;fire=1+(((slot+id)%2===0)?1:0);speed=1+(((slot+id)%2===1)?1:0)}
 else{bomb=2+(((slot+id)%2===0)?1:0);fire=2+(((slot+id)%3===0)?1:0);speed=2+(((slot+id)%3===1)?1:0)}
 return{bomb:bomb,fire:fire,speed:speed}
}
function boost(e,spec,slot){
 if(!e)return{bomb:0,fire:0,speed:0};var c=loadout(spec,slot),g=G(),step=g&&g.ultimateMode?4:.8,base=Number(e.__v138BaseSpeed);if(!isFinite(base)||base<=0)base=Number(e.velocity)||2;
 e.bombsMax=Math.max(Number(e.bombsMax)||1,1+c.bomb);e.bombStrength=Math.max(Number(e.bombStrength)||1,1+c.fire);
 e.__v138BaseSpeed=base;e.__v138Shoes=Math.max(Number(e.__v138Shoes)||0,c.speed);e.velocity=Math.max(Number(e.velocity)||base,base+c.speed*step);
 if(!e.bonusCounts)e.bonusCounts={speed:0,bomb:0,fire:0,heart:0};
 e.bonusCounts.bomb=Math.max(Number(e.bonusCounts.bomb)||0,c.bomb);e.bonusCounts.fire=Math.max(Number(e.bonusCounts.fire)||0,c.fire);e.bonusCounts.speed=Math.max(Number(e.bonusCounts.speed)||0,c.speed);
 if(window.BomberMovementController&&BomberMovementController.ensureSpeed&&e.isBot)try{BomberMovementController.ensureSpeed(e)}catch(x){}
 return c
}
function prime(forceState){
 var g=G();if(!g)return 0;var n=Number(forceState);if(!isFinite(n)||n<1||n>10)n=1+Math.floor(Math.random()*STATES.length);var spec=STATES[n-1],c=carve(g,spec),bonusState=settleBonuses(g,spec),actors=living(),used={},positions=[],loadouts=[];
 for(var i=0;i<actors.length;i++){var slot=Number(actors[i].statSlot);if(!isFinite(slot))slot=i;var p=actorPosition(g,slot,spec,used);used[key(p)]=1;move(actors[i],p);var l=boost(actors[i],spec,slot);positions.push({slot:slot,x:p.x,y:p.y});loadouts.push({slot:slot,bomb:l.bomb,fire:l.fire,speed:l.speed})}
 local.state=spec.id;local.progress=c.progress;local.lastPrime={state:spec.id,initialWood:c.initial,removedWood:c.removed,progress:c.progress,visibleBonuses:bonusState.kept,collectedBonuses:bonusState.removed,bonusCap:bonusState.cap,positions:positions,loadouts:loadouts};
 if(g.updateStatHud)g.updateStatHud();
 var status=document.getElementById('v152ObserverStatus');if(status)status.textContent='Dropped into a believable match state '+spec.id+' of 10. You can queue for the next round.';
 return c.progress
}
function actorPosition(g,slot,spec,used){
 var start=spawn(g,slot),cells=reachable(g,start),cx=(g.tilesX-1)/2,cy=(g.tilesY-1)/2,maxD=Math.max(1,Math.abs(start.x-cx)+Math.abs(start.y-cy)),want=Math.max(1,maxD*spec.travel),best=null,bestScore=1e9;
 for(var i=0;i<cells.length;i++){var p=cells[i],k=key(p);if(used[k])continue;var d=Math.abs(p.x-start.x)+Math.abs(p.y-start.y),center=Math.abs(p.x-cx)+Math.abs(p.y-cy),sep=true;
  for(var uk in used){var xy=uk.split(','),ud=Math.abs(p.x-Number(xy[0]))+Math.abs(p.y-Number(xy[1]));if(ud<2){sep=false;break}}
  if(!sep)continue;var score=Math.abs(d-want)*2+center*.08+(((p.x*17+p.y*31+slot*13+spec.id*7)%19)/19);if(score<bestScore){bestScore=score;best=p}
 }
 return best||start
}
function observeAudit(){
 var g=G(),p=local.lastPrime;if(!g||!p)return null;var actors=living(),paths=true,dupe=false,seen={};
 for(var a=0;a<actors.length;a++){var slot=Number(actors[a].statSlot);if(!isFinite(slot))slot=a;var cells=reachable(g,spawn(g,slot)),own={};for(var i=0;i<cells.length;i++)own[key(cells[i])]=1;if(!own[key(actors[a].position)])paths=false;var k=key(actors[a].position);if(seen[k])dupe=true;seen[k]=1}
 return{state:p.state,initialWood:p.initialWood,removedWood:p.removedWood,progress:p.progress,visibleBonuses:p.visibleBonuses,collectedBonuses:p.collectedBonuses,bonusCap:p.bonusCap,loadouts:p.loadouts.slice(),actorPaths:paths,duplicateActors:dupe,positions:p.positions.slice()}
}
function roster(){
 var g=G(),bots=g&&g.bots||[],players=g&&g.players||[],sims=bots.filter(function(b){return!!b.simulatedHuman}),ais=bots.filter(function(b){return!b.simulatedHuman}),slot0=spawn(g,0),seen={},duplicate=false,all=players.concat(bots);
 for(var i=0;i<all.length;i++){var k=key(all[i].position);if(seen[k])duplicate=true;seen[k]=1}
 var shape=bots.length===3&&bots.some(function(b){return b.simulatedHuman&&Number(b.statSlot)===1})&&bots.some(function(b){return b.simulatedHuman&&Number(b.statSlot)===2})&&bots.some(function(b){return!b.simulatedHuman&&Number(b.statSlot)===3});
 return{players:players.length,bots:bots.length,sims:sims.length,ais:ais.length,shape:shape,duplicate:duplicate,playerAtSpawn:players.length===1&&key(players[0].position)===key(slot0),botOnPlayerSpawn:bots.some(function(b){return key(b.position)===key(slot0)})}
}
function positionJoined(){
 var g=G();if(!g)return false;if(g.players&&g.players[0])move(g.players[0],spawn(g,0));
 (g.bots||[]).forEach(function(b,i){var slot=Number(b.statSlot);if(!isFinite(slot))slot=i+1;move(b,spawn(g,slot))});
 local.lastRoster=roster();return local.lastRoster.players===1&&local.lastRoster.bots===3&&local.lastRoster.sims===2&&local.lastRoster.ais===1&&local.lastRoster.shape&&!local.lastRoster.duplicate&&local.lastRoster.playerAtSpawn&&!local.lastRoster.botOnPlayerSpawn
}
function cleanJoinedRound(){
 var g=G();if(!g||local.repairing)return false;local.repairing=true;
 try{
  g.__v152RosterMode='joined';g.__v152ObserverMode=false;g.__v152JoinedMode=true;g.simulatedOpponentMode=false;g.playersCount=1;g.botsCount=3;g.playing=true;g.spectatorFinished=false;g.matchFinished=false;
  g.restart();positionJoined()
 }finally{local.repairing=false}
 return true
}
function stabilizeJoined(){
 if(local.repairing)return;var r=roster();
 if(r.players!==1||r.bots!==3||r.sims!==2||r.ais!==1||!r.shape||r.duplicate||!r.playerAtSpawn||r.botOnPlayerSpawn)cleanJoinedRound();else positionJoined()
}
function handleObserve(serial){
 var g=G();if(!g||local.observeSerial===serial)return;local.observeSerial=serial;g.__v152RosterMode='observe';g.__v152ObserverMode=true;g.__v152JoinedMode=false;g.simulatedOpponentMode=false;g.playersCount=0;g.botsCount=4;g.playing=true;g.spectatorFinished=false;g.matchFinished=false;g.restart();prime()
}
function handleJoined(serial){
 if(local.joinedSerial===serial)return;local.joinedSerial=serial;cleanJoinedRound();[80,220,500].forEach(function(ms){setTimeout(function(){var a=A();if(a&&a.state().mode==='joined')stabilizeJoined()},ms)})
}
function patchApi(){
 var a=A();if(!a)return false;
 if(!apiStateBase){apiStateBase=a.state;a.state=function(){var s=apiStateBase();s.observedProgress=local.progress||s.observedProgress;s.observedState=local.state||s.observedState||0;return s}}
 a.version=VERSION;
 if(!startBase){startBase=a.startObserver;a.startObserver=function(){var r=startBase.apply(a,arguments),s=a.state();if(r&&s.mode==='observe')handleObserve(s.roundSerial);return r}}
 if(a.debug){
  a.debug.primeObservedRound=function(n){var g=G();if(!g)return 0;g.__v152RosterMode='observe';g.playersCount=0;g.botsCount=4;g.restart();return prime(n)};
  a.debug.progressionAudit=observeAudit;
  a.debug.auditRoster=function(){local.lastRoster=roster();return local.lastRoster};
  a.debug.stabilizeJoined=stabilizeJoined;
  a.debug.spawnPosition=function(slot){return spawn(G(),slot)}
 }
 var b=document.getElementById('v152ObserveBtn');if(b&&!b.__v153){b.__v153=true;b.onclick=function(){A().startObserver()}}
 return true
}
function tick(){
 var a=A(),g=G();if(!a||!g)return;patchApi();var s=a.state();
 if(s.mode==='observe'&&s.roundSerial!==local.observeSerial)handleObserve(s.roundSerial);
 else if(s.mode==='joined'&&s.roundSerial!==local.joinedSerial)handleJoined(s.roundSerial)
}
function install(){
 if(installed)return true;if(!A()||!G()||!window.Utils)return false;installed=true;patchApi();window.BomberObserver153={version:VERSION,states:STATES.slice(),prime:prime,audit:observeAudit,roster:roster,stabilizeJoined:stabilizeJoined,loadout:loadout};return true
}
var tries=0,t=setInterval(function(){if(install()||++tries>1200)clearInterval(t)},30);setInterval(tick,40);
})();
