(function(){
'use strict';
var VERSION='v0.16.2.32';
var SKINS=['light','fair','medium','tan','deep'], SHOES=['original','black','white','red','blue'];
var STYLES=['balanced','cautious','collector','hunter','opportunist','trapper','aggressive'];
function hash(v){var s=String(v||''),h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function clamp(n){return Math.max(0,Math.min(1000,Math.round(Number(n)||0)))}
function clean(n){return String(n||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,14)}
function L(){return window.BomberLeaderboard127||null}
function C(){return window.BomberChallenge136||null}
function G(){return window.gGameEngine||null}
function S(){return window.B115||null}
function nativeAppearance(name){
 var h=hash('v136|appearance|'+name),h2=hash('v136|gear|'+name),h3=hash('v136|shoes|'+name),r=h2%100;
 return{gender:h%100<20?'female':'male',skin:SKINS[(h>>>8)%SKINS.length],glasses:((h2>>>9)%100)<34,hat:r<50?'none':r<76?'cap':'beanie',shoes:SHOES[h3%SHOES.length]}
}
function profile(name){
 name=clean(name);var l=L(),p=l&&l.profile&&l.profile(name);
 if(!p)return null;
 var base=Number(p.baseScore),rating=clamp(p.score),skill=isFinite(base)?clamp(base):rating;
 var stage=(hash('v16232|style|'+name)>>>0)%STYLES.length,app=(C()&&C().appearanceFor?C().appearanceFor(name):nativeAppearance(name));
 var rank=Number(p.displayRank||p.rank);
 return{id:'sim:'+name,name:name,nickname:String(p.nickname||name).slice(0,12),rating:rating,score:rating,
  rank:Number.isFinite(rank)&&rank>0?Math.round(rank):null,baseSkillRating:skill,skillRating:skill,
  playStyle:STYLES[stage],appearance:app};
}
function toMatch(name){var p=profile(name);if(!p)return null;return{id:p.id,name:p.name,nickname:p.nickname,rating:p.rating,
 baseSkillRating:p.baseSkillRating,appearance:p.appearance,playStyle:p.playStyle,personality:p.playStyle,leaderboardRank:p.rank}}
function applyAppearance(bot,a){
 if(!a||!bot||!bot.bmp||!window.BomberCharacter||!BomberCharacter.makeSheet||!window.createjs)return false;
 try{
  var c=BomberCharacter.makeSheet(a);if(!c)return false;
  var sh=new createjs.SpriteSheet({images:[c],frames:{width:48,height:48,regX:10,regY:12},
   animations:{idle:[0,0,'idle'],down:[0,3,'down',.1],left:[4,7,'left',.1],up:[8,11,'up',.1],right:[12,15,'right',.1],dead:[16,16,'dead',.1]}});
  var anim=bot.bmp.currentAnimation||'idle';bot.bmp.spriteSheet=sh;bot.characterAppearance=a;
  if(bot.bmp.gotoAndPlay)bot.bmp.gotoAndPlay(anim);return true
 }catch(e){return false}
}
function apply(bot,p){
 if(!bot)return false;
 if(typeof p==='string')p=profile(p);
 if(!p||!p.name)return false;
 var fresh=bot.__v16232Identity!==p.id;
 bot.simulatedHuman=true;bot.displayName=p.name;
 bot.rating=p.rating;bot.humanRating=p.rating;bot.leaderboardRank=p.rank;
 bot.__v16232SkillRating=p.skillRating;
 bot.humanSkill=window.BomberCharacter&&BomberCharacter.skillFromRating?BomberCharacter.skillFromRating(p.skillRating):Math.max(.08,Math.min(1,(p.skillRating-350)/650));
 bot.personality=p.playStyle;bot.socialPersona=p.playStyle;bot.playStyle=p.playStyle;bot.__v138Persona=p.playStyle;
 var raw=bot.__v152Profile||{};
 raw.name=p.name;raw.rating=p.rating;raw.appearance=p.appearance;raw.baseSkillRating=p.skillRating;raw.playStyle=p.playStyle;raw.nickname=p.nickname;
 bot.__v152Profile=raw;
 if(fresh||!bot.characterAppearance||JSON.stringify(bot.characterAppearance)!==JSON.stringify(p.appearance)){
  applyAppearance(bot,p.appearance);
  bot.__v16232Identity=p.id;
 }
 if(bot.nameLabel&&bot.nameLabel.text!==p.name)bot.nameLabel.text=p.name;
 return true
}
function actors(){
 var g=G(),s=S();if(!g)return[];
 var a=(g.bots||[]).filter(function(e){return !!(e&&e.simulatedHuman)}).slice();
 if(s&&s.role==='simulated'&&g.simulatedOpponent&&a.indexOf(g.simulatedOpponent)<0)a.push(g.simulatedOpponent);
 return a
}
function sync(){
 var a=actors(),s=S();
 for(var i=0;i<a.length;i++){var e=a[i],name=clean(e.displayName||(e===G().simulatedOpponent&&s&&s.remoteName)||'');var p=profile(name);if(p)apply(e,p)}
 return a.length
}
function localName(){
 var s=S(),n=clean(s&&s.localName);
 try{var stored=clean(localStorage.getItem('BombermanPlayerName'));if(stored&&(!n||/^Player(?: 1)?$/i.test(n)))n=stored}catch(e){}
 return n||'Player'
}
function localRating(){
 try{var c=window.BomberCharacter;if(c&&c.getRating)return clamp(c.getRating())}catch(e){}
 try{return clamp(localStorage.getItem('BombermanRatingV1'))}catch(e){return 0}
}
function hud(){
 var g=G(),l=L(),s=S(),root=document.getElementById('qolStatHud');
 if(!g||!l||!root)return false;
 var slots=g.getContestantsByStatSlot?g.getContestantsByStatSlot():[],self=s&&s.role==='guest'?g.players&&g.players[1]:g.players&&g.players[0];
 for(var i=0;i<4;i++){
  var box=root.querySelector('.qol_stat_box[data-slot="'+i+'"]'),e=slots[i];
  if(!box||!e||box.hidden)continue;
  var rating=null,rank=null,p=null;
  if(e===self){
   rating=localRating();rank=l.rank(rating,localName())
  }else if(e.simulatedHuman||s&&s.role==='simulated'&&e===g.simulatedOpponent){
   p=profile(e.displayName||s&&s.remoteName);if(p){rating=p.rating;rank=p.rank}
  }else if(!e.isBot&&g.players&&g.players.indexOf(e)>=0&&isFinite(Number(e.rating))){
   rating=clamp(e.rating);rank=l.rank(rating,clean(e.displayName)||'Player')
  }
  if(rating===null)continue;
  var v=String(rating)+(Number.isFinite(Number(rank))&&Number(rank)>0?' · #'+rank:'');
  var pts=box.querySelector('.v125_points');if(!pts){pts=document.createElement('span');pts.className='v125_points';box.appendChild(pts)}
  if(pts.textContent!==v)pts.textContent=v;
  pts.hidden=false;box.setAttribute('data-rating',String(rating));box.setAttribute('data-rank',rank==null?'':String(rank))
 }
 return true
}
function help(){
 var a=document.getElementById('bomb1'),t=document.getElementById('v160TutorialText');
 var want='Space = normal bomb • WASD = fire Bomb Kick';
 if(a&&a.textContent!==want)try{a.textContent=want}catch(e){}
 if(t){
  var old=String(t.textContent||''),next=old;
  if(/^Traveling bomb:/i.test(old))next='Traveling bomb: press W/A/S/D to fire a moving Bomb Kick up, left, down, or right. One Bomb Kick charge is consumed. Space places a normal stationary bomb.';
  else if(/^Tutorial complete\./i.test(old))next='Tutorial complete. Core controls: arrow keys = move • Space = normal bomb • W/A/S/D = directional Bomb Kick • walk into a bomb = kick it. On mobile, use the yellow Bomb Kick button.';
  if(old!==next)t.textContent=next
 }
}
function tick(){try{sync();hud();help()}catch(e){}}
window.BomberIdentity16232={version:VERSION,hash:hash,profile:profile,toMatch:toMatch,apply:apply,sync:sync,hud:hud};
setInterval(tick,150);tick();
})();