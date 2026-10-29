(function(){
'use strict';
function syncRankedSim(){
 var S=window.B115,g=window.gGameEngine,L=window.BomberLeaderboard127;if(!S||!g||!L||S.role!=='simulated'||!S.remoteName)return;
 var p=L.profile(S.remoteName);if(!p)return;
 var internalRating=p.score===0?Number.MIN_VALUE:p.score;
 g.simulatedRating=internalRating;S.simulatedRating=internalRating;
 var sim=g.simulatedOpponent;if(sim){sim.rating=p.score;sim.humanRating=p.score;sim.leaderboardRank=p.displayRank;if(window.BomberCharacter&&BomberCharacter.skillFromRating)sim.humanSkill=BomberCharacter.skillFromRating(p.score)}
 var hud=document.getElementById('qolStatHud'),box=sim&&hud&&hud.querySelector('.qol_stat_box[data-slot="'+sim.statSlot+'"]');if(box){box.setAttribute('data-rating',String(p.score));box.setAttribute('data-rank',String(p.displayRank))}
}
setInterval(syncRankedSim,55);setTimeout(syncRankedSim,0);
})();
