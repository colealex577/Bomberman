(function(){
'use strict';
var S=window.B115,installed=false,observer=null,cleaning=false;
if(!S)return;
var forbidden=/(simulated|fake[- ]?human)/i;
function safeName(v){return String(v||'Player').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,14)||'Player'}
function localScore(){try{return Math.max(0,Math.min(1000,Math.round(Number(localStorage.getItem('BombermanRatingV1'))||0)))}catch(e){return 0}}
function rankFor(v,n){try{return window.BomberLeaderboard127?BomberLeaderboard127.rank(v,n):null}catch(e){return null}}
function syncOnlineMatchStatus(){
 if(!S.started||(S.role!=='host'&&S.role!=='guest')||!S.els||!S.els.matchStatus||!S.els.matchBar||S.els.matchBar.hidden)return;
 var g=window.gGameEngine;if(!g||!g.players||g.players.length<2)return;var remote=S.role==='guest'?g.players[0]:g.players[1];if(!remote||!Number.isFinite(Number(remote.rating)))return;
 var ln=safeName(S.localName||localStorage.getItem('BombermanPlayerName')||'Player'),rn=safeName(S.remoteName||remote.displayName||'Opponent'),ls=localScore(),rs=Math.max(0,Math.min(1000,Math.round(Number(remote.rating)))),lr=rankFor(ls,ln),rr=rankFor(rs,rn);
 var text='ONLINE • '+ln+' '+ls+(lr?' (#'+lr+')':'')+' vs '+rn+' '+rs+(rr?' (#'+rr+')':'');if(S.els.matchStatus.textContent!==text)S.els.matchStatus.textContent=text
}
function fixDefaultLabels(){
 if(!window.BomberSocial130||BomberSocial130.getBestOf()!==1)return;
 var replay=document.getElementById('qolReplayBtn');if(replay&&!replay.disabled&&replay.textContent!=='Replay opponent')replay.textContent='Replay opponent';
 var now=document.getElementById('v127RematchNow');if(now&&!now.disabled&&now.textContent!=='Rematch now')now.textContent='Rematch now';
 var float=document.getElementById('v127SpectateRematch');if(float&&!float.disabled&&float.textContent!=='Request rematch')float.textContent='Request rematch';
}
function sanitizeNow(){if(cleaning||!window.BomberSocial130)return;cleaning=true;try{BomberSocial130.sanitize();syncOnlineMatchStatus();fixDefaultLabels()}finally{cleaning=false}}
function mutationNeedsCleaning(m){
 if(m.type==='characterData')return forbidden.test(m.target&&m.target.data||'');
 for(var i=0;i<m.addedNodes.length;i++){var n=m.addedNodes[i],text=n.nodeType===3?n.data:n.textContent;if(forbidden.test(text||''))return true}
 return false
}
function install(){
 if(installed||!window.BomberSocial130||!window.BomberMultiplayer||!BomberMultiplayer.ready)return false;
 installed=true;
 var guest=S.guestData;
 S.guestData=function(d){
  if(S.role==='guest'&&d&&(d.type==='v130SetState'||d.type==='v130Stats')&&d.set&&!d.__v130GuestPerspective){
   var original=d.set;
   d=Object.assign({},d,{__v130GuestPerspective:true,set:Object.assign({},original,{localWins:Number(original.opponentWins)||0,opponentWins:Number(original.localWins)||0,opponent:S.remoteName||'Opponent'})});
  }
  return guest.apply(S,[d]);
 };
 sanitizeNow();
 if(window.MutationObserver&&document.body){observer=new MutationObserver(function(ms){var needed=false;for(var i=0;i<ms.length;i++)if(mutationNeedsCleaning(ms[i])){needed=true;break}if(needed)sanitizeNow();else{syncOnlineMatchStatus();fixDefaultLabels()}});observer.observe(document.body,{subtree:true,childList:true,characterData:true})}
 return true;
}
var n=0,t=setInterval(function(){if(install()||++n>500)clearInterval(t)},40);setInterval(function(){if(installed){syncOnlineMatchStatus();fixDefaultLabels()}},80);
})();
