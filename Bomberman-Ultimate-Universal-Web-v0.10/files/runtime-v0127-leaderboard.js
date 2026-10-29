(function(){
'use strict';
var S=window.B115,Q=window.BomberQOL;
if(!S||!Q)return;
var SCORE_KEY='BombermanRatingV1',WINS_KEY='BombermanPlayerWinsV1',LOSSES_KEY='BombermanPlayerLossesV1';
var installed=false,top50=[],byName={};
var NAMES=['NeonFox','PixelPilot','BombRider','GhostNova','TurboAce','BlastWolf','ArcadeViper','NightByte','NovaRush','FuseRunner','GridGhost','RetroRex','VaporHawk','CyberBolt','EchoKnight','AstroDrift','CrimsonFox','VoltRider','HyperByte','RapidWolf','PixelViper','NightRex','NovaPilot','FuseAce','GridRunner','RetroGhost','VaporBolt','CyberFox','EchoRush','AstroKnight','CrimsonByte','VoltWolf','HyperPilot','RapidRex','NeonDrift','BombHawk','ArcadeAce','NightGhost','NovaViper','FuseKnight','GridFox','RetroRush','VaporPilot','CyberWolf','EchoAce','AstroByte','CrimsonRex','VoltGhost','HyperHawk','RapidRunner','NeonBolt','PixelKnight','BombFox','ArcadeDrift','NightWolf','NovaRex','FuseViper','GridPilot','RetroAce','VaporByte','CyberRider','EchoFox','AstroRush','CrimsonWolf','VoltPilot','HyperRex','RapidGhost','NeonKnight','PixelHawk','BombByte','ArcadeFox','NightPilot','NovaWolf','FuseRex','GridViper','RetroKnight','VaporRush','CyberAce','EchoByte','AstroFox'];
function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function clamp(v){v=Math.round(Number(v)||0);return Math.max(0,Math.min(1000,v))}
function score(){try{return clamp(localStorage.getItem(SCORE_KEY))}catch(e){return 0}}
function num(key){try{var v=Math.max(0,Math.round(Number(localStorage.getItem(key))||0));return v}catch(e){return 0}}
function setNum(key,v){v=Math.max(0,Math.round(Number(v)||0));try{localStorage.setItem(key,String(v))}catch(e){}return v}
function savedName(){try{var v=String(localStorage.getItem('BombermanPlayerName')||'Player').replace(/[<>]/g,'').replace(/\s+/g,' ').trim();return(v||'Player').slice(0,14)}catch(e){return'Player'}}
function hash(s){var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function profile(name){
 var h=hash('BM127|'+name),score=400+(h%601),games=120+((h>>>7)%781),jitter=((h>>>18)%81-40)/1000;
 var rate=Math.max(.47,Math.min(.91,.46+(score/1000)*.43+jitter));var wins=Math.max(1,Math.round(games*rate)),losses=Math.max(1,games-wins);games=wins+losses;
 return{name:name,score:score,wins:wins,losses:losses,rate:wins/games}
}
function buildRoster(){var all=NAMES.map(profile);all.sort(function(a,b){return b.score-a.score||b.rate-a.rate||a.name.localeCompare(b.name)});top50=all.slice(0,50);byName={};top50.forEach(function(p,i){p.rank=i+1;byName[p.name]=p});S.SIM_NAMES=top50.map(function(p){return p.name})}
function currentFake(){return byName[S.remoteName]||null}
function enforceFakeProfile(){
 if(S.role!=='simulated')return;var p=currentFake(),g=G();if(!p||!g)return;g.simulatedRating=p.score;S.simulatedRating=p.score;var sim=g.simulatedOpponent;if(sim){sim.rating=p.score;sim.humanRating=p.score;if(window.BomberCharacter&&BomberCharacter.skillFromRating)sim.humanSkill=BomberCharacter.skillFromRating(p.score)}
 if(S.els&&S.els.matchStatus&&S.els.matchBar&&!S.els.matchBar.hidden)S.els.matchStatus.textContent='SIMULATED • '+savedName()+' '+score()+' vs '+p.name+' '+p.score
}
function patchSimulatedRoster(){
 if(S.__v127LeaderboardRoster)return;S.__v127LeaderboardRoster=true;buildRoster();var old=S.startSimulated;S.startSimulated=function(){var r=old.apply(S,arguments);[0,40,150,500].forEach(function(ms){setTimeout(enforceFakeProfile,ms)});return r}
}
function countPlayerResult(){
 var g=G(),r=g&&g.__v127Round;if(!r||!r.duelResolved||r.__v127StatsCounted)return;r.__v127StatsCounted=true;
 var local=S.role==='guest'?1:0,win=false,loss=false;
 if(S.role==='simulated'){win=r.winner===0;loss=r.loser===0}else if(S.online&&S.online()){win=r.winner===local;loss=r.loser===local}
 if(win)setNum(WINS_KEY,num(WINS_KEY)+1);else if(loss)setNum(LOSSES_KEY,num(LOSSES_KEY)+1);renderLeaderboard()
}
function fixCustomizeName(){
 var nm=savedName(),tile=$('mainCustomizeTile');if(tile){var t=tile.querySelector('.customize_name');if(t)t.textContent=nm}
 var inp=$('characterName'),prev=$('characterPreviewName');if(prev)prev.textContent=(inp&&String(inp.value||'').trim())||nm;
 if(S.role==='offline'&&S.localName!==nm)S.localName=nm
}
function hideMatchLog(){var panel=$('v127SettingsPanel');if(!panel)return;var secs=panel.querySelectorAll('.v127_section');for(var i=0;i<secs.length;i++){var h=secs[i].querySelector('h3');if(h&&/matchmaking log/i.test(h.textContent))secs[i].remove()}}
function style(){if($('v127-leaderboard-style'))return;var st=document.createElement('style');st.id='v127-leaderboard-style';st.textContent=`
#mainLeaderboardTile{position:fixed;z-index:6500;display:none;box-sizing:border-box;border:0;background:rgba(0,0,0,.5);color:#fff;font-family:Helvetica,Arial,sans-serif;text-align:center;cursor:pointer;padding:7px 4px 5px;align-items:center;justify-content:flex-start;flex-direction:column;gap:2px}#mainLeaderboardTile:hover{background:rgba(0,0,0,.68)}#mainLeaderboardTile svg{width:42px;height:42px;display:block;fill:#ffd166;margin:1px auto 3px}#mainLeaderboardTile strong{font-size:14px;line-height:1.1;color:#ffd166;font-weight:600}#mainLeaderboardTile small{font-size:8px;color:#fff;font-weight:700}
#v127LeaderboardPanel{position:fixed;inset:0;z-index:8500;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(10,6,9,.78);backdrop-filter:blur(4px)}#v127LeaderboardPanel[hidden]{display:none!important}.v127_lb_card{width:min(650px,96vw);max-height:94vh;overflow:hidden;display:flex;flex-direction:column;box-sizing:border-box;padding:16px;border:1px solid rgba(255,255,255,.17);border-radius:14px;background:#21111a;color:#fff;font-family:Helvetica,Arial,sans-serif;box-shadow:0 22px 70px rgba(0,0,0,.55)}.v127_lb_head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.v127_lb_head h2{margin:0;font-size:22px}.v127_lb_head p{margin:4px 0 0;color:#aaa;font-size:10px}.v127_lb_close{border:0;background:transparent;color:#fff;font-size:27px}.v127_lb_you{display:grid;grid-template-columns:46px minmax(100px,1fr) 75px 82px 95px;gap:6px;align-items:center;margin:12px 0 8px;padding:9px;border:1px solid rgba(185,239,140,.35);border-radius:8px;background:rgba(86,123,37,.16);font-size:11px}.v127_lb_you strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.v127_lb_you .score{color:#b9ef8c;font-weight:900}.v127_lb_columns,.v127_lb_row{display:grid;grid-template-columns:40px minmax(100px,1fr) 68px 76px 88px;gap:6px;align-items:center}.v127_lb_columns{padding:5px 7px;color:#888;font-size:9px;text-transform:uppercase}.v127_lb_list{overflow:auto;display:grid;gap:3px;padding-right:2px}.v127_lb_row{padding:6px 7px;border-radius:6px;background:rgba(255,255,255,.04);font-size:10px}.v127_lb_row.top3{background:rgba(255,209,102,.09)}.v127_lb_row .rank{color:#aaa}.v127_lb_row .name{font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.v127_lb_row .score{color:#b9ef8c;font-weight:900}.v127_lb_note{margin-top:8px;color:#777;font-size:9px;text-align:center}@media(max-width:560px){.v127_lb_you{grid-template-columns:36px minmax(80px,1fr) 58px 68px 75px;font-size:9px}.v127_lb_columns,.v127_lb_row{grid-template-columns:30px minmax(80px,1fr) 52px 60px 70px;font-size:8px}}
`;document.head.appendChild(st)}
function ensureLeaderboard(){
 style();var p=$('v127LeaderboardPanel');if(!p){p=document.createElement('div');p.id='v127LeaderboardPanel';p.hidden=true;p.innerHTML='<div class="v127_lb_card"><div class="v127_lb_head"><div><h2>Simulated Leaderboard</h2><p>Top 50 simulated-human profiles. Their score here is the same score they use when matched against you.</p></div><button class="v127_lb_close" type="button" aria-label="Close">×</button></div><div id="v127LbYou" class="v127_lb_you"></div><div class="v127_lb_columns"><span>Rank</span><span>Player</span><span>Score</span><span>Win rate</span><span>W–L</span></div><div id="v127LbList" class="v127_lb_list"></div><div class="v127_lb_note">Fake-human records are deterministic simulated career records. Your row uses your actual competitive human/fake-human results on this device.</div></div>';document.body.appendChild(p);p.querySelector('.v127_lb_close').onclick=function(){p.hidden=true;syncTiles()}}
 var tile=$('mainLeaderboardTile');if(!tile){tile=document.createElement('button');tile.type='button';tile.id='mainLeaderboardTile';tile.setAttribute('aria-label','Simulated leaderboard');tile.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v2h3v4c0 2.8-2 5-4.7 5.6A5.1 5.1 0 0 1 13 17.8V20h4v2H7v-2h4v-2.2a5.1 5.1 0 0 1-2.3-3.2C6 14 4 11.8 4 9V5h3V3Zm0 4H6v2c0 1.5.9 2.8 2.2 3.4A9.8 9.8 0 0 1 7 7Zm10 0a9.8 9.8 0 0 1-1.2 5.4A3.7 3.7 0 0 0 18 9V7h-1Z"/></svg><strong>Leaderboard</strong><small>Top 50</small>';tile.onclick=function(){ensureLeaderboard();renderLeaderboard();p.hidden=false;syncTiles()};document.body.appendChild(tile)}return tile
}
function pct(w,l){var n=w+l;return n?((w/n)*100).toFixed(1)+'%':'—'}
function renderLeaderboard(){
 var p=ensureLeaderboard(),list=$('v127LbList'),you=$('v127LbYou');if(!list||!you)return;var sc=score(),w=num(WINS_KEY),l=num(LOSSES_KEY),rank=1;for(var i=0;i<top50.length;i++)if(top50[i].score>sc)rank++;
 you.innerHTML='<span>#'+rank+'</span><strong>'+escapeHtml(savedName())+' <em style="font-style:normal;color:#b9ef8c">(You)</em></strong><span class="score">'+sc+'</span><span>'+pct(w,l)+'</span><span>'+w+'–'+l+'</span>';
 var html='';for(var j=0;j<top50.length;j++){var r=top50[j];html+='<div class="v127_lb_row '+(j<3?'top3':'')+'"><span class="rank">#'+r.rank+'</span><span class="name">'+escapeHtml(r.name)+'</span><span class="score">'+r.score+'</span><span>'+((r.rate)*100).toFixed(1)+'%</span><span>'+r.wins+'–'+r.losses+'</span></div>'}list.innerHTML=html
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function syncTiles(){
 var g=G(),lb=ensureLeaderboard(),cust=$('mainCustomizeTile'),settings=$('mainSettingsTile'),panel=$('v127LeaderboardPanel'),sp=$('v127SettingsPanel'),cp=$('characterPanel');if(!g||!g.menu||!lb)return;
 var show=!!(g.menu.visible&&!g.lobbyOpen&&(!panel||panel.hidden)&&(!sp||sp.hidden)&&(!cp||cp.hidden));lb.style.display=show?'flex':'none';if(settings&&(!panel||panel.hidden)===false)settings.style.display='none';if(cust&&(!panel||panel.hidden)===false)cust.style.display='none';if(!show)return;
 var c=$('canvas'),r=c&&c.getBoundingClientRect();if(!r||!r.width)return;var scale=Math.max(.65,Math.min(1.25,r.width/(g.size&&g.size.w||544))),w=110*scale,h=100*scale,gap=7*scale,mid=r.left+r.width/2;
 if(cust){cust.style.width=w+'px';cust.style.height=h+'px';cust.style.left=(mid-w-gap)+'px';cust.style.top=(r.top+r.height-h-2*scale)+'px'}lb.style.width=w+'px';lb.style.height=h+'px';lb.style.left=(mid+gap)+'px';lb.style.top=(r.top+r.height-h-2*scale)+'px'
}
function install(){if(installed)return true;if(!window.BomberV127||!window.BomberCharacter||!window.GameEngine||!G()||!G().menu)return false;installed=true;buildRoster();patchSimulatedRoster();hideMatchLog();ensureLeaderboard();fixCustomizeName();renderLeaderboard();syncTiles();window.BomberLeaderboard127={top50:function(){return top50.map(function(x){return Object.assign({},x)})},profile:function(name){return byName[name]&&Object.assign({},byName[name])},wins:function(){return num(WINS_KEY)},losses:function(){return num(LOSSES_KEY)},open:function(){ensureLeaderboard();renderLeaderboard();$('v127LeaderboardPanel').hidden=false;syncTiles()}};return true}
buildRoster();var tries=0,t=setInterval(function(){if(install()||++tries>600)clearInterval(t)},40);setInterval(function(){if(!installed)return;hideMatchLog();fixCustomizeName();countPlayerResult();enforceFakeProfile();syncTiles()},120);window.addEventListener('resize',syncTiles,{passive:true});window.addEventListener('orientationchange',function(){setTimeout(syncTiles,80)},{passive:true});
})();
