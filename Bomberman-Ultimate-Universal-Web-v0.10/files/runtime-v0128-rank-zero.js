(function(){
'use strict';
function ensureStyle(){if(document.getElementById('v128-rank-style'))return;var s=document.createElement('style');s.id='v128-rank-style';s.textContent='#qolStatHud .qol_stat_name::after{content:none!important}';document.head.appendChild(s)}
function playerName(){var S=window.B115;try{return String((S&&S.localName)||localStorage.getItem('BombermanPlayerName')||'Player').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,14)||'Player'}catch(e){return(S&&S.localName)||'Player'}}
function playerScore(){if(window.BomberV127&&BomberV127.getScore)return BomberV127.getScore();if(window.BomberCharacter&&BomberCharacter.getRating)return BomberCharacter.getRating();return 0}
function syncRankedSim(){
 ensureStyle();var S=window.B115,g=window.gGameEngine,L=window.BomberLeaderboard127;if(!S||!g||!L||S.role!=='simulated'||!S.remoteName)return;
 var p=L.profile(S.remoteName);if(!p)return;
 var internalRating=p.score===0?Number.MIN_VALUE:p.score;
 g.simulatedRating=internalRating;S.simulatedRating=internalRating;
 var sim=g.simulatedOpponent;if(sim){sim.rating=p.score;sim.humanRating=p.score;sim.leaderboardRank=p.displayRank;if(window.BomberCharacter&&BomberCharacter.skillFromRating)sim.humanSkill=BomberCharacter.skillFromRating(p.score)}
 var hud=document.getElementById('qolStatHud'),box=sim&&hud&&hud.querySelector('.qol_stat_box[data-slot="'+sim.statSlot+'"]');if(box){box.setAttribute('data-rating',String(p.score));box.setAttribute('data-rank',String(p.displayRank));var pts=box.querySelector('.v125_points');if(pts)pts.textContent=String(p.score)+' · #'+String(p.displayRank)}
 if(S.els&&S.els.matchStatus&&S.els.matchBar&&!S.els.matchBar.hidden){var ps=playerScore(),pr=L.rank(ps,playerName()),desired='SIMULATED • '+playerName()+' '+ps+' (#'+pr+') vs '+p.name+' '+p.score+' (#'+p.displayRank+')';if(S.els.matchStatus.textContent!==desired)S.els.matchStatus.textContent=desired}
}
function syncOnlineStatus(){
 var S=window.B115,g=window.gGameEngine,L=window.BomberLeaderboard127;if(!S||!g||!L||S.role==='simulated'||!(S.online&&S.online())||!S.started||!S.els||!S.els.matchStatus||!S.els.matchBar||S.els.matchBar.hidden||!g.players||g.players.length<2)return;
 var li=S.role==='guest'?1:0,ri=li===0?1:0,lp=g.players[li],rp=g.players[ri];if(!lp||!rp)return;
 var ls=Math.round(Number(lp.rating)),rs=Math.round(Number(rp.rating));if(!isFinite(ls)||!isFinite(rs))return;
 var ln=String(lp.displayName||S.localName||'Player').slice(0,14),rn=String(rp.displayName||S.remoteName||'Opponent').slice(0,14),lr=L.rank(ls,ln),rr=L.rank(rs,rn),prefix=S.kind==='private'?'PRIVATE • DATA':'ONLINE';
 var desired=prefix+' • '+ln+' '+ls+' (#'+lr+') vs '+rn+' '+rs+' (#'+rr+')';if(S.els.matchStatus.textContent!==desired)S.els.matchStatus.textContent=desired
}
function syncAll(){syncRankedSim();syncOnlineStatus()}
function watchStatus(){var S=window.B115,el=S&&S.els&&S.els.matchStatus;if(!el||el.__v128RankWatch)return;el.__v128RankWatch=true;new MutationObserver(function(){syncAll()}).observe(el,{childList:true,characterData:true,subtree:true})}
ensureStyle();setInterval(function(){watchStatus();syncAll()},55);setTimeout(function(){watchStatus();syncAll()},0);
})();
