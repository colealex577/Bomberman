(function(){
'use strict';
var VERSION='v0.16.0',installed=false,installTimer=null,versionObserver=null;
var state={tutorial:false,tutorialStep:0,tutorialSaved:null,tutorialPlayer:null,tutorialBot:null,tutorialPickupType:'',tutorialDemoBomb:null,remoteKickCount:0,remoteKickArmed:false};
var DIRS=[{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}];
function G(){return window.gGameEngine||null}
function $(id){return document.getElementById(id)}
function clone(p){return p?{x:Number(p.x)||0,y:Number(p.y)||0}:null}
function same(a,b){return !!(a&&b&&a.x===b.x&&a.y===b.y)}
function norm(d){if(!d)return null;var x=Number(d.x)||0,y=Number(d.y)||0;if(Math.abs(x)>=Math.abs(y)&&x)return{x:x>0?1:-1,y:0};if(y)return{x:0,y:y>0?1:-1};return null}
function key(p){return p.x+','+p.y}
function next(p,d){return{x:p.x+d.x,y:p.y+d.y}}
function dist(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}
function finite(v){v=Number(v);return isFinite(v)?v:null}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function isBot(a){return !!(a&&window.Bot&&a instanceof Bot)}
function actorSkill(a){
 if(!a)return .45;
 var s=finite(a.humanSkill);if(s!==null)return clamp(s,.08,1);
 var r=finite(a.humanRating);if(r===null)r=finite(a.rating);if(r!==null)return clamp((r-350)/650,.08,1);
 var d=String(a.v125Difficulty||'').toLowerCase();
 if(d==='easy')return .25;if(d==='hard')return .74;if(d==='expert')return .92;if(d==='normal')return .48;
 return gGameEngine&&gGameEngine.ultimateMode?.78:.48;
}
function liveActors(){var g=G(),out=[];if(!g)return out;var all=(g.players||[]).concat(g.bots||[]);for(var i=0;i<all.length;i++)if(all[i]&&all[i].alive!==false)out.push(all[i]);return out}
function actorAt(p,except){var a=liveActors();for(var i=0;i<a.length;i++)if(a[i]!==except&&same(a[i].position,p))return a[i];return null}
function bombAt(p,except){var g=G();if(!g)return null;for(var i=0;i<g.bombs.length;i++){var b=g.bombs[i];if(b&&b!==except&&!b.exploded&&same(b.position,p))return b}return null}
function material(p){var g=G();return g?g.getTileMaterial(p):'wall'}
function clearWoodAt(p){var g=G();if(!g)return;for(var i=g.tiles.length-1;i>=0;i--){var t=g.tiles[i];if(t&&t.material==='wood'&&same(t.position,p)){try{g.stage.removeChild(t.bmp)}catch(e){}g.tiles.splice(i,1)}}}
function moveEntity(e,p){if(!e||!p)return;var px=Utils.convertToBitmapPosition(p);e.position=clone(p);if(e.bmp){e.bmp.x=px.x;e.bmp.y=px.y}if(e.targetPosition)e.targetPosition=clone(p);if(e.targetBitmapPosition)e.targetBitmapPosition={x:px.x,y:px.y};if(e.updatePosition)e.updatePosition();if(e.updateNameLabel)e.updateNameLabel()}
function targetFor(actor){if(!actor)return null;if(typeof actor.getBestOpponent==='function'){try{var o=actor.getBestOpponent();if(o&&o.alive)return o}catch(e){}}var all=liveActors(),best=null,score=1e9;for(var i=0;i<all.length;i++){var a=all[i];if(a===actor)continue;var d=dist(actor.position,a.position);if(d<score){score=d;best=a}}return best}
function chooseCornerDir(bomb,blockedDir){
 var g=G();if(!g)return null;var c=blockedDir.x?[{x:0,y:1},{x:0,y:-1}]:[{x:1,y:0},{x:-1,y:0}],valid=[];
 for(var i=0;i<c.length;i++){var p=next(bomb.position,c[i]);if(material(p)!=='grass'||actorAt(p,null))continue;valid.push(c[i])}
 if(!valid.length)return null;
 var sk=actorSkill(bomb.owner),t=bomb.travelTarget;
 if(sk>=.7&&t){valid.sort(function(a,b){return dist(next(bomb.position,a),t)-dist(next(bomb.position,b),t)});return valid[0]}
 var idx=DIRS.findIndex(function(d){return d.x===blockedDir.x&&d.y===blockedDir.y});
 if(idx<0)return valid[0];var clockwise=DIRS[(idx+1)%4];for(var j=0;j<valid.length;j++)if(same(valid[j],clockwise))return valid[j];return valid[0]
}
function canBombAdvance(bomb,dir,depth){
 depth=depth||0;if(depth>10)return false;var p=next(bomb.position,dir),m=material(p);if(m==='wood')return false;if(m==='wall')return !!chooseCornerDir(bomb,dir);if(actorAt(p,null))return false;var other=bombAt(p,bomb);if(other)return canBombAdvance(other,dir,depth+1);return m==='grass'
}
function startBombMoving(bomb,dir,owner,target){
 dir=norm(dir);if(!bomb||bomb.exploded||!dir)return false;bomb.__v160Moving=true;bomb.moveDirection=dir;bomb.moveTargetPosition=null;bomb.owner=owner||bomb.owner||null;bomb.travelTarget=target?clone(target):bomb.travelTarget||null;return true
}
function stopBombMoving(bomb){if(!bomb)return;bomb.__v160Moving=false;bomb.moveTargetPosition=null}
function updateBombMotion(bomb){
 var g=G();if(!g||!bomb.__v160Moving||bomb.exploded)return;
 var d=norm(bomb.moveDirection);if(!d){stopBombMoving(bomb);return}
 if(!bomb.moveTargetPosition){
  var np=next(bomb.position,d),m=material(np);
  if(m==='wall'){
   var turn=chooseCornerDir(bomb,d);if(!turn){stopBombMoving(bomb);return}bomb.moveDirection=turn;d=turn;np=next(bomb.position,d);m=material(np)
  }
  if(m==='wood'||m!=='grass'||actorAt(np,null)){stopBombMoving(bomb);return}
  var front=bombAt(np,bomb);
  if(front){
   if(!canBombAdvance(front,d,0)){stopBombMoving(bomb);return}
   startBombMoving(front,d,bomb.owner,bomb.travelTarget);return;
  }
  bomb.moveTargetPosition=np;
 }
 var px=Utils.convertToBitmapPosition(bomb.moveTargetPosition),tx=px.x+bomb.size.w/4,ty=px.y+bomb.size.h/4;
 var speed=Math.max(3,Math.min(8,Number(bomb.moveSpeed)||5));
 var dx=tx-bomb.bmp.x,dy=ty-bomb.bmp.y;
 if(Math.abs(dx)<=speed&&Math.abs(dy)<=speed){bomb.bmp.x=tx;bomb.bmp.y=ty;bomb.position=clone(bomb.moveTargetPosition);bomb.moveTargetPosition=null;return}
 if(dx)bomb.bmp.x+=dx>0?Math.min(speed,dx):-Math.min(speed,-dx);if(dy)bomb.bmp.y+=dy>0?Math.min(speed,dy):-Math.min(speed,-dy)
}
function traceRoute(origin,dir,target,skill,strength){
 var p=clone(origin),d=norm(dir),out=[],seen={};if(!p||!d)return out;for(var n=0;n<18;n++){
  var np=next(p,d),m=material(np);
  if(m==='wood')break;
  if(m==='wall'){
   var cand=d.x?[{x:0,y:1},{x:0,y:-1}]:[{x:1,y:0},{x:-1,y:0}],ok=[];
   for(var c=0;c<cand.length;c++){var q=next(p,cand[c]);if(material(q)==='grass')ok.push(cand[c])}
   if(!ok.length)break;if(skill>=.7&&target)ok.sort(function(a,b){return dist(next(p,a),target)-dist(next(p,b),target)});d=ok[0];np=next(p,d);m=material(np);if(m!=='grass')break;
  }
  var k=key(np)+'|'+d.x+','+d.y;if(seen[k])break;seen[k]=1;out.push(clone(np));p=np;
 }
 return out
}
function routeThreatens(route,target,strength){if(!target)return false;strength=Math.max(1,Number(strength)||1);for(var i=0;i<route.length;i++){var p=route[i];if(same(p,target))return true;if((p.x===target.x||p.y===target.y)&&dist(p,target)<=strength)return true}return false}
function travelChoice(bot,opponent){
 if(!bot||!opponent||!opponent.alive||!(bot.bombKickCharges>0))return null;var sk=actorSkill(bot),dx=opponent.position.x-bot.position.x,dy=opponent.position.y-bot.position.y,cands=[];
 if(dx)cands.push({x:dx>0?1:-1,y:0});if(dy)cands.push({x:0,y:dy>0?1:-1});
 if(sk<.68){if(dx!==0&&dy!==0)return null;var d=dx?{x:dx>0?1:-1,y:0}:{x:0,y:dy>0?1:-1};var r=traceRoute(bot.position,d,opponent.position,sk,bot.bombStrength);return routeThreatens(r,opponent.position,bot.bombStrength)?{dir:d,target:clone(opponent.position),score:90}:null}
 var best=null;
 for(var i=0;i<cands.length;i++){var r2=traceRoute(bot.position,cands[i],opponent.position,sk,bot.bombStrength),score=routeThreatens(r2,opponent.position,bot.bombStrength)?120:0;if(r2.length)score+=Math.max(0,26-dist(r2[r2.length-1],opponent.position)*3);if(sk>=.82&&r2.length>=2)score+=8;if(!best||score>best.score)best={dir:cands[i],target:clone(opponent.position),score:score}}
 return best&&best.score>=38?best:null
}
function shouldAutoKick(actor,bomb,dir){
 if(!actor||!bomb||!(actor.bombKickCharges>0)||!dir)return false;if(!isBot(actor))return true;var sk=actorSkill(actor),after=next(bomb.position,dir);if(material(after)!=='grass')return false;if(sk>=.72)return true;if(sk>=.45)return Math.random()<.58;return Math.random()<.28
}
function consumeCharge(actor,kind){
 if(!actor||!(actor.bombKickCharges>0))return false;actor.bombKickCharges--;if(actor.bombKickCharges<0)actor.bombKickCharges=0;if(kind==='travel')actor.__v160TravelPlaced=(actor.__v160TravelPlaced||0)+1;if(kind==='kick')actor.__v160KickedBombs=(actor.__v160KickedBombs||0)+1;refreshHud(actor);return true
}
function armKick(actor,force){
 if(!actor||!(actor.bombKickCharges>0))return false;if(force===false){actor.bombKickArmed=false;refreshHud(actor);return false}if(force===true){actor.bombKickArmed=true;refreshHud(actor);return true}actor.bombKickArmed=!actor.bombKickArmed;refreshHud(actor);return actor.bombKickArmed
}
function localActor(){var g=G();if(!g||!g.players||!g.players.length)return null;if(window.BomberOnline&&BomberOnline.isGuest&&BomberOnline.isGuest())return null;return g.players[0]||null}
function sendInventory(actor){try{if(actor&&actor.id===1&&window.BomberOnline&&BomberOnline.isHost&&BomberOnline.isHost()&&BomberOnline.broadcast)BomberOnline.broadcast({type:'kickInventory',count:actor.bombKickCharges||0,armed:!!actor.bombKickArmed})}catch(e){}}
function ensureHud(){
 if(!$('v160KickHud')){var h=document.createElement('div');h.id='v160KickHud';h.hidden=true;h.innerHTML='<img src="./files/img/bomb_kick.png" alt=""><span></span>';var game=$('game');if(game)game.appendChild(h);else document.body.appendChild(h)}
 if(!$('v160KickBtn')){var cluster=document.querySelector('.mobile_action_cluster');if(cluster){var b=document.createElement('button');b.id='v160KickBtn';b.className='touch_btn v160_kick_btn';b.type='button';b.hidden=true;b.setAttribute('aria-label','Arm Bomb Kick');b.innerHTML='<img src="./files/img/bomb_kick.png" alt="">';cluster.insertBefore(b,cluster.firstChild);var fire=function(e){if(e){e.preventDefault();e.stopPropagation()}if(window.BomberOnline&&BomberOnline.isGuest&&BomberOnline.isGuest()){sendGuestKickChord()}else{var p=localActor();if(p)armKick(p)}};b.addEventListener('click',fire);b.addEventListener('touchend',fire,{passive:false})}}
}
function refreshHud(actor){
 ensureHud();var isGuest=!!(window.BomberOnline&&BomberOnline.isGuest&&BomberOnline.isGuest()),count=isGuest?state.remoteKickCount:(actor||localActor()||{}).bombKickCharges||0,armed=isGuest?state.remoteKickArmed:!!((actor||localActor()||{}).bombKickArmed),h=$('v160KickHud'),b=$('v160KickBtn');
 if(h){h.hidden=!(count>0);var s=h.querySelector('span');if(s)s.textContent=(armed?'ARMED • ':'')+'BOMB KICK ×'+count}
 if(b){b.hidden=!(count>0);b.classList.toggle('armed',armed);b.setAttribute('aria-label',armed?'Bomb Kick armed. Tap to cancel':'Arm Bomb Kick. '+count+' remaining');b.title=armed?'Bomb Kick armed':'Bomb Kick ×'+count}
 sendInventory(actor)
}
function sendGuestKickChord(){try{if(!window.BomberOnline||!BomberOnline.sendTouchAction)return;BomberOnline.sendTouchAction('left',true);BomberOnline.sendTouchAction('right',true);setTimeout(function(){BomberOnline.sendTouchAction('left',false);BomberOnline.sendTouchAction('right',false)},120)}catch(e){}}
function setRemoteKickInventory(count,armed){state.remoteKickCount=Math.max(0,Number(count)||0);state.remoteKickArmed=!!armed;refreshHud(null)}
function ensureStyle(){if($('v160-style'))return;var s=document.createElement('style');s.id='v160-style';s.textContent='#game{position:relative}#v160KickHud{position:absolute;right:8px;top:8px;z-index:45;display:flex;align-items:center;gap:5px;padding:4px 7px;border:2px solid #b58900;border-radius:6px;background:rgba(255,225,0,.92);color:#211700;font:900 10px Arial,sans-serif;pointer-events:none;box-shadow:0 2px 5px rgba(0,0,0,.3)}#v160KickHud[hidden]{display:none!important}#v160KickHud img{width:22px;height:22px;image-rendering:pixelated}.v160_kick_btn{background:#e6b800!important;border-color:#8f7000!important;padding:0!important;overflow:hidden}.v160_kick_btn[hidden]{display:none!important}.v160_kick_btn img{width:42px;height:42px;image-rendering:pixelated;display:block}.v160_kick_btn.armed{outline:3px solid #fff200;box-shadow:0 0 14px #ffe600}#v160TutorialBtn{position:absolute;z-index:55;left:50%;bottom:11px;transform:translateX(-50%);min-width:132px;min-height:34px;border:1px solid #d7aa00;border-radius:7px;background:#d09f00;color:#171100;font:900 13px Arial,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.35);cursor:pointer}#v160TutorialBtn[hidden]{display:none!important}#v160TutorialPanel{position:fixed;z-index:7200;left:50%;top:max(12px,env(safe-area-inset-top));transform:translateX(-50%);width:min(490px,calc(100vw - 24px));box-sizing:border-box;padding:12px 14px;border:1px solid rgba(255,220,0,.55);border-radius:11px;background:rgba(28,19,3,.95);color:#fff;font-family:Arial,sans-serif;box-shadow:0 12px 38px rgba(0,0,0,.48)}#v160TutorialPanel[hidden]{display:none!important}#v160TutorialPanel h3{margin:0;color:#ffe45a;font-size:15px}#v160TutorialText{margin:6px 0 0;font-size:12px;line-height:1.35;color:#f4f1e7}#v160TutorialActions{display:flex;gap:7px;margin-top:9px}#v160TutorialActions button{min-height:33px;padding:0 12px;border:1px solid rgba(255,255,255,.2);border-radius:7px;background:#5a4a18;color:#fff;font-weight:800}#v160TutorialActions button:first-child{background:#8b710f}#v160TutorialProgress{font-size:10px;color:#cdbf86;float:right}@media(max-width:640px){#v160TutorialPanel{top:max(8px,env(safe-area-inset-top));padding:10px 11px}#v160KickHud{top:5px;right:5px}}';(document.head||document.documentElement).appendChild(s)}
function ensureTutorialUi(){ensureStyle();var game=$('game');if(game&&!$('v160TutorialBtn')){var b=document.createElement('button');b.id='v160TutorialBtn';b.type='button';b.textContent='Tutorial';b.onclick=startTutorial;game.appendChild(b)}if(!$('v160TutorialPanel')){var p=document.createElement('div');p.id='v160TutorialPanel';p.hidden=true;p.innerHTML='<span id="v160TutorialProgress"></span><h3>Bomberman Tutorial</h3><div id="v160TutorialText"></div><div id="v160TutorialActions"><button id="v160TutorialNext" type="button">Skip step</button><button id="v160TutorialExit" type="button">Exit tutorial</button></div>';document.body.appendChild(p);$('v160TutorialNext').onclick=function(){advanceTutorial(true)};$('v160TutorialExit').onclick=exitTutorial}}
var TUTORIAL_TEXT=[
 'Move with the arrow keys (or WASD where enabled). On mobile, use the joystick. Move at least one tile to continue.',
 'Plant a normal bomb with Space or Alt. On mobile, tap the bomb button. Bombs explode after their fuse and fire travels in straight lines.',
 'Pick up the Speed power-up. It permanently increases your movement speed for the round.',
 'Pick up the Bomb power-up. It increases how many bombs you can have active at once.',
 'Pick up the Fire power-up. It increases the blast range of every bomb you place.',
 'Pick up the yellow Bomb Kick power-up. Each pickup gives a stored Bomb Kick use. On mobile, its yellow action button appears only while you have a use available.',
 'Traveling bomb: face or move in the direction you want, press E to arm Bomb Kick, then place a bomb. The bomb slides down the lane, can push other bombs, and snakes around wall corners until something stops it or it explodes.',
 'Direct kick: while you still have a Bomb Kick use, simply walk into a bomb. It shoots away in the direction you pushed it. This does not require pressing E.',
 'AI demonstration: stronger opponents save Bomb Kick for useful moments. They can fire traveling bombs around corners, shove bomb chains toward targets, or kick a blocking bomb away to escape. The tutorial opponent is passive and will not attack you.',
 'Tutorial complete. Core controls: move • Space/Alt = bomb • E = arm a traveling Bomb Kick • walk into a bomb = kick it. On mobile, Bomb Kick appears as a context button when available.'
];
function tutorialPanel(){ensureTutorialUi();return $('v160TutorialPanel')}
function showTutorialStep(){var p=tutorialPanel();if(!p)return;p.hidden=false;var n=clamp(state.tutorialStep,0,TUTORIAL_TEXT.length-1);$('v160TutorialText').textContent=TUTORIAL_TEXT[n];$('v160TutorialProgress').textContent=(n+1)+' / '+TUTORIAL_TEXT.length;$('v160TutorialNext').textContent=n===TUTORIAL_TEXT.length-1?'Finish':'Skip step';prepareTutorialStep(n)}
function findOpenNear(origin,minDistance){var g=G(),best=null;minDistance=minDistance||1;for(var radius=minDistance;radius<=6;radius++)for(var i=0;i<DIRS.length;i++){var p={x:origin.x+DIRS[i].x*radius,y:origin.y+DIRS[i].y*radius};if(p.x<=0||p.y<=0||p.x>=g.tilesX-1||p.y>=g.tilesY-1)continue;clearWoodAt(p);if(material(p)==='grass'&&!bombAt(p)&&!actorAt(p,null))return p}return best}
function spawnTutorialBonus(type){var g=G(),p=state.tutorialPlayer;if(!g||!p)return;var typeIndex={speed:0,bomb:1,fire:2,kick:3}[type],pos=findOpenNear(p.position,1);if(!pos)return;for(var i=g.bonuses.length-1;i>=0;i--)if(g.bonuses[i].__v160Tutorial){try{g.bonuses[i].destroy()}catch(e){}}var b=new Bonus(pos,typeIndex);b.__v160Tutorial=true;g.bonuses.push(b);state.tutorialPickupType=type}
function prepareTutorialStep(n){var g=G(),p=state.tutorialPlayer;if(!g||!p)return;if(n===2)spawnTutorialBonus('speed');else if(n===3)spawnTutorialBonus('bomb');else if(n===4)spawnTutorialBonus('fire');else if(n===5)spawnTutorialBonus('kick');else if(n===6){if(!(p.bombKickCharges>0))p.bombKickCharges=1;p.bombKickArmed=false;refreshHud(p)}else if(n===7){if(!(p.bombKickCharges>0))p.bombKickCharges=1;p.bombKickArmed=false;var pos=findOpenNear(p.position,1);if(pos){var b=new Bomb(pos,1);b.timerMax=999;b.__v160TutorialDemo=true;g.stage.addChild(b.bmp);g.bombs.push(b);state.tutorialDemoBomb=b}refreshHud(p)}else if(n===8){var bot=state.tutorialBot;if(bot){bot.tutorialDummy=true;bot.bmp.visible=true;if(bot.nameLabel)bot.nameLabel.visible=true;var bp=findOpenNear(p.position,5)||{x:g.tilesX-2,y:g.tilesY-2};moveEntity(bot,bp);bot.bombKickCharges=1;bot.bombKickArmed=false;setTimeout(function(){if(!state.tutorial||state.tutorialStep!==8||!bot.alive)return;var d={x:bot.position.x>p.position.x?-1:1,y:0};var db=bot.plantBomb?bot.plantBomb():null;if(db){db.timerMax=2;startBombMoving(db,d,bot,p.position);consumeCharge(bot,'travel')}},700)}}}
function advanceTutorial(skip){if(!state.tutorial)return;if(state.tutorialStep>=TUTORIAL_TEXT.length-1){exitTutorial();return}state.tutorialStep++;showTutorialStep()}
function startTutorial(){var g=G();if(!g||!g.menu)return false;ensureTutorialUi();state.tutorialSaved={playersCount:g.playersCount,botsCount:g.botsCount,simulatedOpponentMode:!!g.simulatedOpponentMode};state.tutorial=true;state.tutorialStep=0;g.tutorialMode=true;g.simulatedOpponentMode=false;g.playersCount=1;g.botsCount=1;g.playing=true;g.menu.hide();g.restart();setTimeout(function(){var gg=G();if(!gg)return;state.tutorialPlayer=gg.players[0]||null;state.tutorialBot=gg.bots[0]||null;if(state.tutorialPlayer){state.tutorialPlayer.__v160TutorialStart=clone(state.tutorialPlayer.position);state.tutorialPlayer.__v160PlacedBombs=0;state.tutorialPlayer.__v160PickupCounts={};state.tutorialPlayer.__v160TravelPlaced=0;state.tutorialPlayer.__v160KickedBombs=0}if(state.tutorialBot){state.tutorialBot.tutorialDummy=true;state.tutorialBot.bmp.visible=false;if(state.tutorialBot.nameLabel)state.tutorialBot.nameLabel.visible=false}showTutorialStep()},80);return true}
function exitTutorial(){var g=G();state.tutorial=false;state.tutorialStep=0;var p=tutorialPanel();if(p)p.hidden=true;if(g){g.tutorialMode=false;var sv=state.tutorialSaved||{};g.playersCount=sv.playersCount===undefined?0:sv.playersCount;g.botsCount=sv.botsCount===undefined?4:sv.botsCount;g.simulatedOpponentMode=!!sv.simulatedOpponentMode;g.playing=false;try{g.restart()}catch(e){}if(g.menu)g.menu.show()}state.tutorialPlayer=state.tutorialBot=state.tutorialDemoBomb=null;refreshHud(null)}
function tutorialTick(){if(!state.tutorial)return;var p=state.tutorialPlayer;if(!p)return;var n=state.tutorialStep,done=false;if(n===0)done=!same(p.position,p.__v160TutorialStart);else if(n===1)done=(p.__v160PlacedBombs||0)>0;else if(n>=2&&n<=5)done=((p.__v160PickupCounts||{})[state.tutorialPickupType]||0)>0;else if(n===6)done=(p.__v160TravelPlaced||0)>0;else if(n===7)done=(p.__v160KickedBombs||0)>0;if(done)setTimeout(function(){if(state.tutorial&&state.tutorialStep===n)advanceTutorial(false)},220)}
function planKickCount(dropCount){dropCount=Math.max(0,Math.floor(Number(dropCount)||0));if(!dropCount)return 0;return Math.min(8,Math.max(1,Math.round(dropCount*.20)))}
function planBonusTypes(dropCount){var k=planKickCount(dropCount),out=[];for(var i=0;i<k;i++)out.push(3);for(var j=k;j<dropCount;j++)out.push((j-k)%3);return out}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function patchBonuses(){
 var oldInit=Bonus.prototype.init;Bonus.prototype.types=['speed','bomb','fire','kick'];Bonus.prototype.init=function(position,typePosition){if(Number(typePosition)!==3)return oldInit.apply(this,arguments);this.type='kick';this.position=clone(position);this.bmp=new createjs.Bitmap((G()&&G().kickBonusImg)||'./files/img/bomb_kick.png');var px=Utils.convertToBitmapPosition(position);this.bmp.x=px.x;this.bmp.y=px.y;if(G())G().stage.addChild(this.bmp)};
 GameEngine.prototype.drawBonuses=function(){var woods=[];for(var i=0;i<this.tiles.length;i++)if(this.tiles[i].material==='wood')woods.push(this.tiles[i]);shuffle(woods);var chosen=[];if(this.ultimateMode)chosen=woods.slice();else{var rate=clamp(Number(this.bonusesPercent)||16,16,100);for(var n=0;n<woods.length;n++)if(rate>=100||Math.random()*100<rate)chosen.push(woods[n]);if(!chosen.length&&woods.length)chosen.push(woods[0])}var types=planBonusTypes(chosen.length);shuffle(types);for(var x=0;x<chosen.length;x++){var b=new Bonus(chosen[x].position,types[x]);this.bonuses.push(b);this.moveToFront(chosen[x].bmp)}this.bombKickDropCount=planKickCount(chosen.length);this.bombKickMaxDrops=8};
}
function patchBomb(){
 var oldInit=Bomb.prototype.init,oldUpdate=Bomb.prototype.update,oldRemove=Bomb.prototype.remove;
 Bomb.prototype.init=function(position,strength){oldInit.apply(this,arguments);this.__v160Moving=false;this.moveDirection=null;this.moveTargetPosition=null;this.moveSpeed=5;this.owner=null;this.travelTarget=null};
 Bomb.prototype.startMoving=function(dir,owner,target){return startBombMoving(this,dir,owner,target)};
 Bomb.prototype.stopMoving=function(){stopBombMoving(this)};
 Bomb.prototype.update=function(){oldUpdate.apply(this,arguments);if(!this.exploded)updateBombMotion(this)};
 Bomb.prototype.remove=function(){this.__v160Moving=false;this.moveTargetPosition=null;oldRemove.apply(this,arguments)};
}
function setupActor(actor){if(!actor)return;if(actor.bombKickCharges===undefined)actor.bombKickCharges=0;if(actor.bombKickArmed===undefined)actor.bombKickArmed=false;if(!actor.lastMoveDirection)actor.lastMoveDirection={x:1,y:0};if(!actor.__v160PickupCounts)actor.__v160PickupCounts={};if(actor.controls&&!actor.controls.kick)actor.controls.kick=actor.id===1?'kick2':'kick'}
function patchPlayer(){
 var oldInit=Player.prototype.init,oldUpdate=Player.prototype.update,oldApply=Player.prototype.applyBonus,oldDetect=Player.prototype.detectBombCollision,oldDie=Player.prototype.die;
 Player.prototype.init=function(position,controls,id){oldInit.apply(this,arguments);setupActor(this);refreshHud(this)};
 Player.prototype.setBombsListener=function(){if(isBot(this))return;var that=this;if(!gInputEngine||!this.controls)return;gInputEngine.addListener(this.controls.bomb,function(){that.placeBomb()});gInputEngine.addListener(this.controls.kick||((that.id===1)?'kick2':'kick'),function(){armKick(that)})};
 Player.prototype.getBombKickDirection=function(){setupActor(this);var c=this.controls||{},a=gInputEngine&&gInputEngine.actions||{};if(a[c.up])return{x:0,y:-1};if(a[c.down])return{x:0,y:1};if(a[c.left])return{x:-1,y:0};if(a[c.right])return{x:1,y:0};return norm(this.lastMoveDirection)||{x:1,y:0}};
 Player.prototype.armBombKick=function(force){return armKick(this,force)};
 Player.prototype.consumeBombKick=function(kind){return consumeCharge(this,kind)};
 Player.prototype.tryKickBomb=function(bomb,dir){setupActor(this);dir=norm(dir);if(!bomb||!dir||!(this.bombKickCharges>0))return false;if(bomb.__v160Moving&&same(bomb.moveDirection,dir))return false;if(!canBombAdvance(bomb,dir,0))return false;var t=targetFor(this);startBombMoving(bomb,dir,this,t&&t.position);consumeCharge(this,'kick');return true};
 Player.prototype.placeBomb=function(){setupActor(this);for(var i=0;i<gGameEngine.bombs.length;i++)if(!gGameEngine.bombs[i].exploded&&same(gGameEngine.bombs[i].position,this.position))return false;var active=0;for(var j=0;j<this.bombs.length;j++)if(!this.bombs[j].exploded)active++;if(active>=this.bombsMax)return false;var bomb=new Bomb(clone(this.position),this.bombStrength);bomb.owner=this;gGameEngine.stage.addChild(bomb.bmp);this.bombs.push(bomb);gGameEngine.bombs.push(bomb);this.__v160PlacedBombs=(this.__v160PlacedBombs||0)+1;var that=this;bomb.setExplodeListener(function(){Utils.removeFromArray(that.bombs,bomb)});if(this.bombKickArmed&&this.bombKickCharges>0){var d=this.getBombKickDirection(),t=targetFor(this);this.bombKickArmed=false;startBombMoving(bomb,d,this,t&&t.position);consumeCharge(this,'travel')}refreshHud(this);return bomb};
 Player.prototype.update=function(){setupActor(this);if(this.alive&&G()&&!G().menu.visible&&gInputEngine&&this.controls){var a=gInputEngine.actions,d=null;if(a[this.controls.up])d={x:0,y:-1};else if(a[this.controls.down])d={x:0,y:1};else if(a[this.controls.left])d={x:-1,y:0};else if(a[this.controls.right])d={x:1,y:0};if(d)this.lastMoveDirection=d}oldUpdate.apply(this,arguments);refreshHud(this)};
 Player.prototype.detectBombCollision=function(pixels){setupActor(this);var p=Utils.convertToEntityPosition(pixels),dir=this.getBombKickDirection();for(var i=0;i<gGameEngine.bombs.length;i++){var b=gGameEngine.bombs[i];if(!b.exploded&&same(b.position,p)&&b!==this.escapeBomb&&shouldAutoKick(this,b,dir)){if(this.tryKickBomb(b,dir))return true}}return oldDetect.apply(this,arguments)};
 Player.prototype.applyBonus=function(bonus){setupActor(this);if(bonus&&bonus.type==='kick'){var add=G()&&G().ultimateMode?5:1;this.bombKickCharges+=add;this.__v160PickupCounts.kick=(this.__v160PickupCounts.kick||0)+1;refreshHud(this);return}oldApply.apply(this,arguments);if(bonus&&bonus.type)this.__v160PickupCounts[bonus.type]=(this.__v160PickupCounts[bonus.type]||0)+1};
 Player.prototype.die=function(){if(G()&&G().tutorialMode&&!isBot(this))return;return oldDie.apply(this,arguments)};
}
function tryDefensiveKick(bot){if(!bot||!(bot.bombKickCharges>0)||actorSkill(bot)<.72)return false;for(var i=0;i<DIRS.length;i++){var bp=next(bot.position,DIRS[i]),b=bombAt(bp,null);if(!b)continue;var after=next(bp,DIRS[i]);if(material(after)!=='grass'||actorAt(after,null))continue;if(bot.tryKickBomb(b,DIRS[i]))return true}return false}
function patchBot(){
 var oldPlant=Bot.prototype.plantBomb,oldChoose=Bot.prototype.chooseNextAction,oldDie=Bot.prototype.die;
 Bot.prototype.chooseBombKickTravel=function(opponent){return travelChoice(this,opponent||targetFor(this))};
 Bot.prototype.plantBomb=function(){setupActor(this);var opp=targetFor(this),choice=travelChoice(this,opp),bomb=oldPlant.apply(this,arguments);if(!bomb)return bomb;bomb.owner=this;if(choice&&this.bombKickCharges>0){startBombMoving(bomb,choice.dir,this,choice.target);consumeCharge(this,'travel')}return bomb};
 Bot.prototype.chooseNextAction=function(){setupActor(this);if(this.tutorialDummy){this.animate('idle');return}if(!this.isSafe(this.position)&&tryDefensiveKick(this))return;return oldChoose.apply(this,arguments)};
 Bot.prototype.die=function(){if(this.tutorialDummy&&G()&&G().tutorialMode)return;return oldDie.apply(this,arguments)};
}
function patchInput(){var old=InputEngine.prototype.setup;InputEngine.prototype.setup=function(){old.apply(this,arguments);this.bind(69,'kick');this.bind(81,'kick2')};if(window.gInputEngine){gInputEngine.bind(69,'kick');gInputEngine.bind(81,'kick2')}}
function patchGame(){var oldSetup=GameEngine.prototype.setup;GameEngine.prototype.setup=function(){oldSetup.apply(this,arguments);for(var i=0;i<(this.players||[]).length;i++)setupActor(this.players[i]);for(var j=0;j<(this.bots||[]).length;j++)setupActor(this.bots[j]);refreshHud(null)}}
function enforceVersion(){try{if(window.BomberOnboarding1561)BomberOnboarding1561.version=VERSION;var b=$('releaseBadge1561');if(b){var s=b.querySelector('strong');if(s&&s.textContent!==VERSION)s.textContent=VERSION;b.setAttribute('aria-label','Bomberman '+VERSION+', Remastered by Cole Alexander')}if(document.title!=='Bomberman '+VERSION)document.title='Bomberman '+VERSION}catch(e){}}
function watchVersion(){if(versionObserver||!window.MutationObserver)return;versionObserver=new MutationObserver(enforceVersion);versionObserver.observe(document.documentElement,{subtree:true,childList:true,characterData:true});setInterval(enforceVersion,120)}
var remoteChordLatch=false;
function onlineKickBridgeTick(){try{if(window.BomberOnline&&BomberOnline.isHost&&BomberOnline.isHost()&&window.gInputEngine){var l=!!gInputEngine.actions.left2,r=!!gInputEngine.actions.right2;if(l&&r&&!remoteChordLatch){remoteChordLatch=true;var g=G(),p=g&&g.players&&g.players[1];if(p)armKick(p);gInputEngine.actions.left2=false;gInputEngine.actions.right2=false}else if(!l&&!r)remoteChordLatch=false}}catch(e){}}
function installGuestKeyBridge(){window.addEventListener('keydown',function(e){if(e.code==='KeyE'&&window.BomberOnline&&BomberOnline.isGuest&&BomberOnline.isGuest()){e.preventDefault();e.stopPropagation();if(!e.repeat)sendGuestKickChord()}},true)}
function menuTick(){onlineKickBridgeTick();ensureTutorialUi();var b=$('v160TutorialBtn'),g=G(),gate=$('v01561FirstRun');if(b)b.hidden=!!(state.tutorial||!g||!g.menu||!g.menu.visible||(gate&&!gate.hidden));tutorialTick();if(!state.tutorial)refreshHud(null)}
function install(){if(installed)return true;if(!window.Player||!window.Bot||!window.Bomb||!window.Bonus||!window.GameEngine||!window.InputEngine||!window.gInputEngine)return false;installed=true;patchInput();patchBonuses();patchBomb();patchPlayer();patchBot();patchGame();ensureStyle();ensureHud();ensureTutorialUi();installGuestKeyBridge();watchVersion();enforceVersion();try{if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))navigator.serviceWorker.register('./sw.js?v=0160').catch(function(){})}catch(e){}setInterval(menuTick,180);window.BomberKick160={version:VERSION,state:state,actorSkill:actorSkill,planKickCount:planKickCount,planBonusTypes:planBonusTypes,startTutorial:startTutorial,exitTutorial:exitTutorial,refreshMobileButton:function(){refreshHud(null)},setRemoteKickInventory:setRemoteKickInventory,startBombMoving:startBombMoving,traceRoute:traceRoute,travelChoice:travelChoice,debug:{actorSkill:actorSkill,planKickCount:planKickCount,planBonusTypes:planBonusTypes,travelChoice:travelChoice,traceRoute:traceRoute,routeThreatens:routeThreatens,tryDefensiveKick:tryDefensiveKick,updateBombMotion:updateBombMotion}};return true}
function boot(){if(install())return;var tries=0;installTimer=setInterval(function(){if(install()||++tries>200){clearInterval(installTimer);installTimer=null}},25)}
boot();
})();