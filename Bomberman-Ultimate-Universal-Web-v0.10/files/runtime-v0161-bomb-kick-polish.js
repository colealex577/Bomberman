(function(){
'use strict';
var VERSION='v0.16.0-hotfix.1',installed=false,lateTimer=null,demoTimer=null;
function G(){return window.gGameEngine||null}
function K(){return window.BomberKick160||null}
function $(id){return document.getElementById(id)}
function clone(p){return p?{x:Number(p.x)||0,y:Number(p.y)||0}:null}
function same(a,b){return !!(a&&b&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y))}
function norm(d){if(!d)return null;var x=Number(d.x)||0,y=Number(d.y)||0;if(Math.abs(x)>=Math.abs(y)&&x)return{x:x>0?1:-1,y:0};if(y)return{x:0,y:y>0?1:-1};return null}
function next(p,d){return{x:Number(p.x)+d.x,y:Number(p.y)+d.y}}
function actorAtTile(p){var g=G();if(!g||!p)return null;var all=(g.players||[]).concat(g.bots||[]);for(var i=0;i<all.length;i++){var a=all[i];if(a&&a.alive!==false&&same(a.position,p))return a}return null}
function bombAtTile(p,except){var g=G();if(!g)return null;for(var i=0;i<(g.bombs||[]).length;i++){var b=g.bombs[i];if(b&&b!==except&&!b.exploded&&same(b.position,p))return b}return null}
function material(p){var g=G();return g&&g.getTileMaterial?g.getTileMaterial(p):'wall'}
function makeKickCanvas(size){
 size=size||32;var c=document.createElement('canvas');c.width=size;c.height=size;var ctx=c.getContext('2d');if(!ctx)return c;ctx.imageSmoothingEnabled=false;var s=size/32;
 function r(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x*s),Math.round(y*s),Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s)))}
 r(0,0,32,32,'#9b7600');r(3,3,26,26,'#f0cd18');
 r(3,13,6,2,'#735700');r(1,17,7,2,'#735700');r(4,21,5,2,'#735700');
 r(11,8,10,2,'#111111');r(8,10,16,4,'#080808');r(7,14,18,8,'#050505');r(9,22,14,3,'#080808');r(11,25,10,2,'#111111');
 r(10,11,3,5,'#ffffff');r(9,14,2,5,'#d9d9d9');r(11,10,2,2,'#ffffff');
 r(15,23,8,2,'#790067');r(18,21,6,2,'#9d0084');
 r(20,8,3,3,'#2b1900');r(22,6,3,3,'#4a2800');r(24,4,2,3,'#6f3a00');
 r(25,2,4,2,'#fff41a');r(27,4,4,3,'#ff9e00');r(25,5,2,2,'#fff7a1');
 return c
}
var kickCanvas32=null,kickDataUrl='';
function kickCanvas(){if(!kickCanvas32){kickCanvas32=makeKickCanvas(32);try{kickDataUrl=kickCanvas32.toDataURL('image/png')}catch(e){kickDataUrl=''}}return kickCanvas32}
function drawKickIcon(canvas){if(!canvas)return;var ctx=canvas.getContext&&canvas.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;ctx.drawImage(kickCanvas(),0,0,canvas.width,canvas.height)}
function replaceKickBitmap(b){
 var g=G();if(!g||!b||!b.position||b.type!=='kick')return false;var old=b.bmp;try{if(old)g.stage.removeChild(old)}catch(e){}var bmp=new createjs.Bitmap(kickCanvas());var px=Utils.convertToBitmapPosition(b.position);bmp.x=px.x;bmp.y=px.y;b.bmp=bmp;b.__v161KickRendered=true;g.stage.addChild(bmp);try{var tile=g.getTile&&g.getTile(b.position);if(tile&&tile.material==='wood'&&g.moveToFront)g.moveToFront(tile.bmp)}catch(e){}return true
}
function ensureKickDistribution(g){
 g=g||G();if(!g||!g.bonuses)return 0;var list=g.bonuses.filter(function(b){return b&&b.position}),target=list.length?Math.min(8,Math.max(1,Math.round(list.length*.20))):0,kicks=list.filter(function(b){return b.type==='kick'});
 if(kicks.length<target){var eligible=list.filter(function(b){return b.type!=='kick'});for(var i=eligible.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=eligible[i];eligible[i]=eligible[j];eligible[j]=t}for(var n=0;n<target-kicks.length&&n<eligible.length;n++){eligible[n].type='kick';replaceKickBitmap(eligible[n]);kicks.push(eligible[n])}}
 for(var q=0;q<kicks.length;q++)if(!kicks[q].__v161KickRendered)replaceKickBitmap(kicks[q]);g.bombKickDropCount=kicks.length;g.bombKickMaxDrops=8;return kicks.length
}
function installDropPatch(){
 if(!window.GameEngine)return false;var cur=GameEngine.prototype.drawBonuses;if(!cur||cur.__v161KickDistribution)return true;var base=cur;var wrapped=function(){var r=base.apply(this,arguments);ensureKickDistribution(this);return r};wrapped.__v161KickDistribution=true;wrapped.__v161Base=base;GameEngine.prototype.drawBonuses=wrapped;return true
}
function installBonusIconPatch(){
 if(!window.Bonus)return false;var cur=Bonus.prototype.init;if(!cur||cur.__v161KickIcon)return true;var base=cur;var wrapped=function(position,typePosition){var r=base.apply(this,arguments);if(this.type==='kick'||Number(typePosition)===3){this.type='kick';this.position=clone(position);replaceKickBitmap(this)}return r};wrapped.__v161KickIcon=true;wrapped.__v161Base=base;Bonus.prototype.init=wrapped;return true
}
function impactAhead(bomb){
 if(!bomb||bomb.exploded||!bomb.__v160Moving||bomb.moveTargetPosition)return null;var d=norm(bomb.moveDirection);if(!d)return null;var p=next(bomb.position,d),m=material(p);if(m==='wood')return{type:'wood',position:p};var a=actorAtTile(p);if(a)return{type:'player',position:p,actor:a};return null
}
function installImpactPatch(){
 if(!window.Bomb)return false;var cur=Bomb.prototype.update;if(!cur||cur.__v161Impact)return true;var base=cur;var wrapped=function(){
  if(!this.exploded&&this.__v160Moving){var hit=impactAhead(this);if(hit){this.__v161Impact=hit.type;this.__v161ImpactPosition=clone(hit.position);this.explode();return}}
  var before=clone(this.position),r=base.apply(this,arguments);if(!this.exploded&&this.__v160Moving&&before&&!same(before,this.position))this.__v161HasMoved=true;
  if(!this.exploded&&this.__v160Moving&&this.__v161HasMoved){var a=actorAtTile(this.position);if(a){this.__v161Impact='player';this.__v161ImpactPosition=clone(this.position);this.explode()}}
  return r
 };wrapped.__v161Impact=true;wrapped.__v161Base=base;Bomb.prototype.update=wrapped;return true
}
function installTutorialSpawnPatch(){
 if(!window.GameEngine)return false;var cur=GameEngine.prototype.spawnBots;if(!cur||cur.__v161TutorialSafe)return true;var base=cur;var wrapped=function(){if(this.tutorialMode){this.bots=[];this.simulatedOpponent=null;return this.bots}return base.apply(this,arguments)};wrapped.__v161TutorialSafe=true;wrapped.__v161Base=base;GameEngine.prototype.spawnBots=wrapped;return true
}
function removeActorVisual(a){var g=G();if(!g||!a)return;try{if(a.bmp)g.stage.removeChild(a.bmp)}catch(e){}try{if(a.nameLabel)g.stage.removeChild(a.nameLabel)}catch(e){}a.alive=false}
function clearAccidentalTutorialBots(){
 var g=G(),k=K();if(!g||!k||!k.state||!k.state.tutorial||Number(k.state.tutorialStep)>=8)return;var old=(g.bots||[]).slice();if(!old.length)return;for(var i=0;i<old.length;i++)removeActorVisual(old[i]);for(var b=(g.bombs||[]).length-1;b>=0;b--){var bomb=g.bombs[b];if(bomb&&old.indexOf(bomb.owner)>=0){try{if(bomb.bmp)g.stage.removeChild(bomb.bmp)}catch(e){}g.bombs.splice(b,1)}}g.bots=[];k.state.tutorialBot=null
}
function farOpenTile(origin){var g=G(),best=null,bestD=-1;if(!g||!origin)return null;for(var y=1;y<g.tilesY-1;y++)for(var x=1;x<g.tilesX-1;x++){var p={x:x,y:y};if(material(p)!=='grass'||bombAtTile(p)||actorAtTile(p))continue;var d=Math.abs(x-origin.x)+Math.abs(y-origin.y);if(d>bestD){bestD=d;best=p}}return best}
function spawnTutorialDemo(){
 var g=G(),k=K();if(!g||!k||!k.state||!k.state.tutorial||Number(k.state.tutorialStep)!==8||k.state.tutorialBot)return false;var player=k.state.tutorialPlayer||(g.players&&g.players[0]);if(!player)return false;var pos=farOpenTile(player.position)||{x:g.tilesX-2,y:g.tilesY-2};var bot=new Bot(pos);bot.tutorialDummy=true;bot.started=true;bot.startTimer=9999;bot.statSlot=3;bot.id=3;bot.displayName='Demo AI';bot.bombKickCharges=1;bot.bombKickArmed=false;if(bot.nameLabel){bot.nameLabel.text='Demo AI';bot.nameLabel.visible=true}if(bot.bmp)bot.bmp.visible=true;g.bots.push(bot);k.state.tutorialBot=bot;
 demoTimer=setTimeout(function(){demoTimer=null;if(!k.state.tutorial||Number(k.state.tutorialStep)!==8||!bot.alive)return;var dx=player.position.x-bot.position.x,dy=player.position.y-bot.position.y,dir=Math.abs(dx)>=Math.abs(dy)?{x:dx>=0?1:-1,y:0}:{x:0,y:dy>=0?1:-1};var bomb=new Bomb(clone(bot.position),Math.max(1,Number(bot.bombStrength)||1));bomb.owner=bot;bomb.timerMax=2;g.stage.addChild(bomb.bmp);bot.bombs=bot.bombs||[];bot.bombs.push(bomb);g.bombs.push(bomb);if(k.startBombMoving)k.startBombMoving(bomb,dir,bot,player.position);bot.bombKickCharges=0;updateKickStats()},550);return true
}
function tutorialTick(){var k=K();if(!k||!k.state||!k.state.tutorial){if(demoTimer){clearTimeout(demoTimer);demoTimer=null}return}clearAccidentalTutorialBots();if(Number(k.state.tutorialStep)===8)spawnTutorialDemo()}
function ensureTutorialButtonStyle(){
 var st=$('v161-style');if(!st){st=document.createElement('style');st.id='v161-style';st.textContent='#v160TutorialBtn{left:50%!important;top:auto!important;bottom:22%!important;transform:translateX(-50%)!important;z-index:120!important;pointer-events:auto!important;min-width:148px!important;min-height:38px!important} .qol_stat_box{width:138px!important}.qol_stat_values{gap:3px!important}.qol_stat_item{min-width:20px!important}@media(max-width:640px){#v160TutorialBtn{bottom:18%!important;min-width:136px!important}.qol_stat_box{width:124px!important}.qol_stat_values{gap:2px!important}.qol_stat_item{min-width:18px!important}.qol_stat_icon{width:11px!important;height:11px!important}}';(document.head||document.documentElement).appendChild(st)}
 var b=$('v160TutorialBtn');if(b){b.style.pointerEvents='auto';b.setAttribute('aria-label','Open tutorial')}
}
function ensureKickHudImages(){kickCanvas();var ids=['v160KickHud','v160KickBtn'];for(var i=0;i<ids.length;i++){var root=$(ids[i]);if(!root)continue;var img=root.querySelector&&root.querySelector('img');if(img&&kickDataUrl&&img.getAttribute('data-v161-icon')!=='1'){img.src=kickDataUrl;img.setAttribute('data-v161-icon','1')}}}
function ensureKickStatItems(){
 var hud=$('qolStatHud');if(!hud)return;var boxes=hud.querySelectorAll('.qol_stat_box');for(var i=0;i<boxes.length;i++){var vals=boxes[i].querySelector('.qol_stat_values');if(!vals)continue;var item=vals.querySelector('[data-qol-stat="kick"]');if(!item){item=document.createElement('span');item.className='qol_stat_item';item.setAttribute('data-qol-stat','kick');var icon=document.createElement('canvas');icon.className='qol_stat_icon';icon.width=16;icon.height=16;icon.setAttribute('aria-hidden','true');var count=document.createElement('span');count.className='qol_stat_count';count.textContent='×0';item.appendChild(icon);item.appendChild(count);vals.appendChild(item)}drawKickIcon(item.querySelector('canvas'))}
}
function updateKickStats(){
 ensureKickStatItems();var g=G(),hud=$('qolStatHud');if(!g||!hud)return;var slots=g.getContestantsByStatSlot?g.getContestantsByStatSlot():[];for(var i=0;i<4;i++){var box=hud.querySelector('.qol_stat_box[data-slot="'+i+'"]'),e=slots[i];if(!box)continue;var item=box.querySelector('[data-qol-stat="kick"]');if(!item)continue;var count=item.querySelector('.qol_stat_count');if(count)count.textContent='×'+Math.max(0,Number(e&&e.bombKickCharges)||0);drawKickIcon(item.querySelector('canvas'))}
}
function normalizeCurrentBonuses(){var g=G();if(!g)return;ensureKickDistribution(g)}
function installLatePatches(){if(!K()||!window.GameEngine||!window.Bomb||!window.Bonus)return false;installDropPatch();installBonusIconPatch();installImpactPatch();installTutorialSpawnPatch();ensureTutorialButtonStyle();ensureKickHudImages();normalizeCurrentBonuses();updateKickStats();return true}
function tick(){installLatePatches();tutorialTick();ensureTutorialButtonStyle();ensureKickHudImages();updateKickStats()}
function install(){if(installed)return true;if(!K()||!window.createjs||!window.Utils)return false;installed=true;kickCanvas();installLatePatches();lateTimer=setInterval(tick,140);window.BomberKick161={version:VERSION,makeKickCanvas:makeKickCanvas,ensureKickDistribution:ensureKickDistribution,updateKickStats:updateKickStats,debug:{impactAhead:impactAhead,spawnTutorialDemo:spawnTutorialDemo,clearAccidentalTutorialBots:clearAccidentalTutorialBots}};return true}
var tries=0,boot=setInterval(function(){if(install()||++tries>400)clearInterval(boot)},25);
})();
