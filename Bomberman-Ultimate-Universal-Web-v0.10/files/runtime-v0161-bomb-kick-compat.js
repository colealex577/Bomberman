(function(){
'use strict';
var installed=false,VERSION='v0.16.0-hotfix.1';
function G(){return window.gGameEngine||null}
function K(){return window.BomberKick160||null}
function P(){return window.BomberKick161||null}
function same(a,b){return a&&b&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y)}
function cell(pos){var g=G();return g&&pos?Number(pos.y)*g.tilesX+Number(pos.x):-1}
function mirrorTypeAt(pos){var n=window.BomberMultiplayer,w=n&&n.mirror;if(!w||!w.bonuses)return'';var c=cell(pos);for(var i=0;i<w.bonuses.length;i++)if(Number(w.bonuses[i][0])===c)return String(w.bonuses[i][1]||'');return''}
function makeHeart(size){size=size||32;var c=document.createElement('canvas');c.width=size;c.height=size;var x=c.getContext('2d');if(!x)return c;x.imageSmoothingEnabled=false;var s=size/32;function r(a,b,w,h,col){x.fillStyle=col;x.fillRect(Math.round(a*s),Math.round(b*s),Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s)))}r(0,0,32,32,'#71142d');r(3,3,26,26,'#d63a59');r(7,8,7,5,'#5c0523');r(18,8,7,5,'#5c0523');r(5,12,22,8,'#5c0523');r(8,20,16,4,'#5c0523');r(11,24,10,3,'#5c0523');r(14,27,4,2,'#5c0523');r(8,9,5,4,'#ff3158');r(19,9,5,4,'#ff3158');r(7,13,18,7,'#ff3158');r(10,20,12,4,'#ff3158');r(13,24,6,3,'#ff3158');r(8,10,3,2,'#ff9caf');return c}
var heartCanvas=null;
function placeBitmap(b,img){var g=G();if(!g||!b||!b.position)return;try{if(b.bmp)g.stage.removeChild(b.bmp)}catch(e){}var bmp=new createjs.Bitmap(img),px=Utils.convertToBitmapPosition(b.position);bmp.x=px.x;bmp.y=px.y;b.bmp=bmp;g.stage.addChild(bmp);try{var tile=g.getTile&&g.getTile(b.position);if(tile&&tile.material==='wood'&&g.moveToFront)g.moveToFront(tile.bmp)}catch(e){}}
function renderHeart(b){b.type='heart';heartCanvas=heartCanvas||makeHeart(32);placeBitmap(b,heartCanvas)}
function renderKick(b){b.type='kick';var p=P(),img=p&&p.makeKickCanvas?p.makeKickCanvas(32):null;if(img)placeBitmap(b,img);b.__v161KickRendered=true}
function patchBonus(){
 if(!window.Bonus)return false;var cur=Bonus.prototype.init;if(!cur||cur.__v161Compat)return true;
 var old=cur;var wrapped=function(position,typePosition){
  var mirror=mirrorTypeAt(position),n=Number(typePosition);
  if(mirror==='kick'||n===4){var r=old.call(this,position,0);this.position={x:position.x,y:position.y};renderKick(this);return r}
  if(mirror==='heart'||n===3){var h=old.call(this,position,3);this.position={x:position.x,y:position.y};renderHeart(this);return h}
  var r2=old.apply(this,arguments);if(this.type==='kick')renderKick(this);return r2
 };
 wrapped.__v161Compat=true;Bonus.prototype.init=wrapped;return true
}
function fixTutorialKick(){var k=K(),g=G();if(!k||!g||!k.state||!k.state.tutorial||Number(k.state.tutorialStep)!==5)return;for(var i=0;i<(g.bonuses||[]).length;i++){var b=g.bonuses[i];if(b&&b.__v160Tutorial){if(b.type!=='kick')renderKick(b);k.state.tutorialPickupType='kick';return}}
}
function syncKickStats(){
 var g=G();if(!g)return;var guest=!!(window.BomberDataSync&&BomberDataSync.active&&BomberDataSync.role==='guest'),all=(g.players||[]).concat(g.bots||[]);
 for(var i=0;i<all.length;i++){var e=all[i];if(!e)continue;e.bonusCounts=e.bonusCounts||{};if(!guest)e.bonusCounts.kick=Math.max(0,Number(e.bombKickCharges)||0)}
 var hud=document.getElementById('qolStatHud');if(!hud)return;var slots=g.getContestantsByStatSlot?g.getContestantsByStatSlot():[];
 for(var s=0;s<4;s++){var box=hud.querySelector('.qol_stat_box[data-slot="'+s+'"]'),e2=slots[s];if(!box||!e2)continue;var items=box.querySelectorAll('[data-qol-stat="kick"]');for(var d=1;d<items.length;d++)items[d].remove();var item=box.querySelector('[data-qol-stat="kick"]');if(!item)continue;var count=item.querySelector('.qol_stat_count'),value=guest?Number((e2.bonusCounts||{}).kick):Number(e2.bombKickCharges);if(count)count.textContent='×'+Math.max(0,value||0)}
}
function install(){if(installed)return true;if(!window.Bonus||!P())return false;installed=true;patchBonus();setInterval(function(){patchBonus();fixTutorialKick();syncKickStats()},90);window.BomberKick161Compat={version:VERSION,mirrorTypeAt:mirrorTypeAt};return true}
var n=0,t=setInterval(function(){if(install()||++n>600)clearInterval(t)},25);
})();