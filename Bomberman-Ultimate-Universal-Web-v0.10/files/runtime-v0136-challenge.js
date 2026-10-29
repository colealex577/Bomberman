(function(){
'use strict';
var VERSION='v0.13.6',S=window.B115,installed=false,pendingChallenge=null,activeChallenge=null;
if(!S)return;
var SKINS=['light','fair','medium','tan','deep'],SHOES=['original','black','white','red','blue'];
function G(){return window.gGameEngine||null}
function same(a,b){return!!(a&&b&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y))}
function key(p){return p?Number(p.x)+','+Number(p.y):''}
function clean(v){v=String(v||'Player').replace(/[<>]/g,'').replace(/\s+/g,' ').trim();return(v||'Player').slice(0,14)}
function hash(s){s=String(s||'');var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function contestants(bot){var g=G(),a=g&&g.getPlayersAndBots?g.getPlayersAndBots().slice():[];if(g&&g.simulatedOpponent&&a.indexOf(g.simulatedOpponent)<0)a.push(g.simulatedOpponent);return a.filter(function(x){return x&&x!==bot&&x.alive!==false})}
function occupant(bot,p,includeTargets){var a=contestants(bot);for(var i=0;i<a.length;i++){if(same(a[i].position,p)||(includeTargets&&same(a[i].targetPosition,p)))return a[i]}return null}
function reservedBait(bot,p){return!!(bot&&bot.__v134Bait&&!bot.__v134Bait.triggered&&same(bot.__v134Bait,p))}
function safeGrass(bot,p){var g=G();return!!(bot&&p&&g&&bot.inBounds(p)&&g.getTileMaterial(p)==='grass'&&!bot.hasBomb(p)&&bot.isSafe(p)&&!reservedBait(bot,p))}
function recentLoop(bot){var h=bot&&bot.__v135RecentPositions||[],n=h.length;if((bot&&bot.__v135ReverseStreak||0)>=2)return true;if(n>=4&&h[n-1]===h[n-3]&&h[n-2]===h[n-4]&&h[n-1]!==h[n-2])return true;if(n>=6&&h[n-1]===h[n-4]&&h[n-2]===h[n-5]&&h[n-3]===h[n-6])return true;return false}
function visitCount(bot,p){var h=bot&&bot.__v135RecentPositions||[],k=key(p),n=0;for(var i=0;i<h.length;i++)if(h[i]===k)n++;return n}
function rawSet(bot,p){var fn=bot&&bot.__v134OldSetNextTile;if(typeof fn!=='function')return false;var from=key(bot.position),r=fn.call(bot,p),to=key(bot.targetPosition);bot.__v135LastTransition={from:from,to:to};bot.__v135ReverseStreak=0;bot.__v136PassThroughs=(bot.__v136PassThroughs||0)+1;return r===undefined?true:r}
function loopPassThrough(bot){
 if(!bot||bot.alive===false||bot.escapeMode||!bot.isSafe(bot.position)||!recentLoop(bot))return false;
 var dirs=[[1,0],[-1,0],[0,1],[0,-1]],occupied=[];
 for(var i=0;i<dirs.length;i++){var p={x:bot.position.x+dirs[i][0],y:bot.position.y+dirs[i][1]};if(!safeGrass(bot,p))continue;if(occupant(bot,p,true))occupied.push(p)}
 if(!occupied.length)return false;occupied.sort(function(a,b){return visitCount(bot,a)-visitCount(bot,b)});bot.__v136LoopPasses=(bot.__v136LoopPasses||0)+1;rawSet(bot,occupied[0]);return true
}
function patchAI(){
 if(!window.Bot||Bot.prototype.__v136PassThrough)return false;Bot.prototype.__v136PassThrough=true;
 var oldSet=Bot.prototype.setNextTile,oldChoose=Bot.prototype.chooseNextAction;
 Bot.prototype.setNextTile=function(pos){
  if(this.isBot&&safeGrass(this,pos)&&occupant(this,pos,true)&&typeof this.__v134OldSetNextTile==='function'){
   this.__v136PassingThrough=true;try{return rawSet(this,pos)}finally{this.__v136PassingThrough=false}}
  return oldSet.apply(this,arguments)
 };
 Bot.prototype.chooseNextAction=function(){if(loopPassThrough(this))return;return oldChoose.apply(this,arguments)};
 return true
}
function appearanceFor(name){
 var h=hash('v136|appearance|'+clean(name)),h2=hash('v136|gear|'+clean(name)),h3=hash('v136|shoes|'+clean(name));
 var r=h2%100,hat=r<50?'none':(r<76?'cap':'beanie');
 return{gender:(h%100)<20?'female':'male',skin:SKINS[(h>>>8)%SKINS.length],glasses:((h2>>>9)%100)<34,hat:hat,shoes:SHOES[h3%SHOES.length]}
}
function profile(name){try{return window.BomberLeaderboard127&&BomberLeaderboard127.profile(name)}catch(e){return null}}
function skillFor(score){try{return window.BomberCharacter&&BomberCharacter.skillFromRating?BomberCharacter.skillFromRating(score):Math.max(.08,Math.min(1,(Number(score)-350)/650))}catch(e){return .5}}
function applyOpponent(name,p){
 var g=G();name=clean(name);p=p||profile(name);if(!g||!name)return false;
 var rating=p?Number(p.score)||0:Number(g.simulatedRating||S.simulatedRating||500),a=appearanceFor(name),token=name+'|'+rating+'|'+a.gender+'|'+a.skin+'|'+(a.glasses?1:0)+'|'+a.hat+'|'+a.shoes;
 S.remoteName=name;S.simulatedRating=rating;g.simulatedRating=rating;g.simulatedAppearance=a;
 function sync(){var gg=G(),sim=gg&&gg.simulatedOpponent;if(!sim)return;sim.displayName=name;if(sim.nameLabel)sim.nameLabel.text=name;sim.rating=rating;sim.humanRating=rating;sim.humanSkill=skillFor(rating);if(p)sim.leaderboardRank=p.displayRank||p.rank}
 if(g.__v136OpponentToken!==token){g.__v136OpponentToken=token;[0,40,140,420,900].forEach(function(ms){setTimeout(sync,ms)})}else sync();return true
}
function patchSimulated(){
 if(S.__v136Simulated)return false;S.__v136Simulated=true;var old=S.startSimulated;
 S.startSimulated=function(){var ch=pendingChallenge,r=old.apply(S,arguments),name=ch?ch.name:S.remoteName,p=ch?ch.profile:profile(name);if(ch){activeChallenge=ch;pendingChallenge=null}applyOpponent(name,p);return r};return true
}
function availability(name,now){var bucket=Math.floor(Number(now||Date.now())/300000);return(hash('v136|online|'+clean(name)+'|'+bucket)%100)<30}
function ensureToast(){var t=document.getElementById('v136ChallengeToast');if(t)return t;t=document.createElement('div');t.id='v136ChallengeToast';t.hidden=true;t.style.cssText='position:fixed;left:50%;top:16%;transform:translateX(-50%);z-index:12000;padding:10px 14px;border-radius:10px;background:rgba(18,14,18,.94);border:1px solid rgba(255,255,255,.2);color:#fff;font:700 12px/1.3 Arial,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.45);pointer-events:none';document.body.appendChild(t);return t}
var toastTimer=null;function toast(msg){var t=ensureToast();t.textContent=msg;t.hidden=false;if(toastTimer)clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.hidden=true},2200)}
function launchChallenge(){if(!pendingChallenge||typeof S.startSimulated!=='function')return false;if(S.role!=='host'&&S.role!=='guest'&&typeof S.setRole==='function')S.setRole('host');S.startSimulated();return S.role==='simulated'}
function startChallenge(name,force){
 name=clean(name);var p=profile(name);if(!p)return false;
 if(!force&&!availability(name)){toast(name+' is offline or declined the challenge.');return false}
 pendingChallenge={name:name,profile:p,appearance:appearanceFor(name),acceptedAt:Date.now()};
 var panel=document.getElementById('v127LeaderboardPanel');if(panel)panel.hidden=true;toast(name+' accepted • '+p.score+' rating');
 setTimeout(launchChallenge,140);return true
}
function ensureStyle(){
 if(document.getElementById('v136-style'))return;var st=document.createElement('style');st.id='v136-style';st.textContent='\
#buildVersion135{display:none!important}\
#buildVersion136{position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.68);color:#fff;font:700 9px/1.25 Arial,sans-serif;pointer-events:none}\
#v127LeaderboardPanel .v127_lb_columns,#v127LeaderboardPanel .v127_lb_row{grid-template-columns:40px minmax(100px,1fr) 68px 76px 88px 76px!important}\
.v136_challenge_btn{border:1px solid rgba(153,204,0,.5);border-radius:6px;background:rgba(153,204,0,.12);color:#c9ff8f;padding:5px 6px;font:800 9px/1 Arial,sans-serif;cursor:pointer}.v136_challenge_btn:hover{background:rgba(153,204,0,.25)}.v136_challenge_self{opacity:.35;text-align:center}\
@media(max-width:560px){#v127LeaderboardPanel .v127_lb_columns,#v127LeaderboardPanel .v127_lb_row{grid-template-columns:28px minmax(74px,1fr) 45px 54px 58px 62px!important}.v136_challenge_btn{font-size:7px;padding:4px 3px}}';document.head.appendChild(st)
}
function rowName(row){var n=row&&row.querySelector('.name');if(!n)return'';return clean(String(n.textContent||'').replace(/\s*\(You\)\s*$/i,''))}
function humanizeLabels(){
 var panel=document.getElementById('v127LeaderboardPanel');if(panel){var h=panel.querySelector('.v127_lb_head h2'),p=panel.querySelector('.v127_lb_head p'),n=panel.querySelector('.v127_lb_note');if(h)h.textContent='Leaderboard';if(p)p.textContent='Top 50 of a roughly 600-player population. Scores and records move gradually as players gain and lose points.';if(n)n.textContent='Challenge any listed player. Availability changes over time, and accepted challenges use that player’s rating and difficulty.'}
 var m=S.els&&S.els.matchStatus;if(m&&/^SIMULATED\s*•/i.test(m.textContent||''))m.textContent=(m.textContent||'').replace(/^SIMULATED\s*•/i,'ONLINE •');
}
function decorateLeaderboard(){
 var panel=document.getElementById('v127LeaderboardPanel');if(!panel)return false;ensureStyle();humanizeLabels();
 var cols=panel.querySelector('.v127_lb_columns');if(cols&&!cols.querySelector('.v136_challenge_col')){var c=document.createElement('span');c.className='v136_challenge_col';c.textContent='Challenge';cols.appendChild(c)}
 var rows=panel.querySelectorAll('.v127_lb_row');for(var i=0;i<rows.length;i++){
  var row=rows[i];if(row.querySelector('.v136_challenge_btn,.v136_challenge_self'))continue;
  if(row.classList.contains('you')){var s=document.createElement('span');s.className='v136_challenge_self';s.textContent='—';row.appendChild(s);continue}
  var name=rowName(row);if(!name)continue;var b=document.createElement('button');b.type='button';b.className='v136_challenge_btn';b.textContent='Challenge';b.setAttribute('data-player',name);b.title='Challenge '+name+' if they are online and accept';b.onclick=function(ev){ev.preventDefault();ev.stopPropagation();startChallenge(this.getAttribute('data-player'),false)};row.appendChild(b)
 }return true
}
function watchMatchStatus(){var m=S.els&&S.els.matchStatus;if(!m||m.__v136Observed)return;m.__v136Observed=true;new MutationObserver(function(){humanizeLabels()}).observe(m,{childList:true,characterData:true,subtree:true})}
function badge(){var b=document.getElementById('buildVersion136');if(!b){b=document.createElement('div');b.id='buildVersion136';document.body.appendChild(b)}b.textContent=VERSION}
function install(){
 if(installed)return true;if(!window.Bot||!window.BomberPolish135||!window.BomberLeaderboard127||!window.BomberCharacter||!G()||!S.startSimulated)return false;
 patchAI();patchSimulated();ensureStyle();decorateLeaderboard();watchMatchStatus();humanizeLabels();badge();installed=true;
 window.BomberChallenge136={version:VERSION,availability:availability,appearanceFor:appearanceFor,challenge:startChallenge,active:function(){return activeChallenge},applyOpponent:applyOpponent};
 if(/[?&]netdebug=1(?:&|$)/.test(location.search))BomberChallenge136.debug={occupant:occupant,safeGrass:safeGrass,recentLoop:recentLoop,loopPassThrough:loopPassThrough,forceChallenge:function(name){return startChallenge(name,true)},launchChallenge:launchChallenge,setPending:function(name){var p=profile(name);pendingChallenge=p?{name:name,profile:p,appearance:appearanceFor(name)}:null;return pendingChallenge},femaleRate:function(names){var f=0;for(var i=0;i<names.length;i++)if(appearanceFor(names[i]).gender==='female')f++;return names.length?f/names.length:0}};
 return true
}
var tries=0,t=setInterval(function(){if(install()||++tries>800)clearInterval(t)},40);setInterval(function(){if(!installed)return;decorateLeaderboard();watchMatchStatus();humanizeLabels();badge();if(S.role==='simulated'&&S.remoteName)applyOpponent(S.remoteName,profile(S.remoteName))},180);window.addEventListener('resize',decorateLeaderboard,{passive:true});
})();
