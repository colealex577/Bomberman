(function(){
'use strict';
var S=window.B115,Q=window.BomberQOL;
if(!S||!Q)return;

var SCORE_KEY='BombermanRatingV1',WINS_KEY='BombermanPlayerWinsV1',LOSSES_KEY='BombermanPlayerLossesV1';
var POPULATION_SIZE=599,POSITIVE_COUNT=520,LIVE_BUCKET_MS=300000,DAY_MS=86400000,CAREER_EPOCH=Date.UTC(2026,0,1);
var installed=false,seedRoster=[],roster=[],top50=[],byName={},lastBucket=-1,matchedProfile=null;

var GAMER_PREFIX=['Neon','Pixel','Turbo','Ghost','Nova','Night','Vapor','Cyber','Echo','Astro','Crimson','Volt','Hyper','Rapid','Bomb','Arcade','Grid','Retro','Fuse','Shadow'];
var GAMER_SUFFIX=['Fox','Pilot','Rider','Wolf','Ace','Viper','Byte','Rush','Runner','Knight','Hawk','Bolt','Rex','Drift','Blaze','Storm','Ninja','Phantom','Rocket','Zero'];
var MALE_NAMES=['Liam','Noah','Oliver','James','Elijah','Mateo','Theodore','Henry','Lucas','William','Benjamin','Levi','Sebastian','Jack','Ezra','Michael','Daniel','Leo','Owen','Samuel','Hudson','Alexander','Asher','Luca','Ethan','John','David','Jackson','Joseph','Mason','Luke','Matthew','Julian','Dylan','Elias','Jacob','Maverick','Gabriel','Logan','Aiden','Thomas','Isaac','Miles','Grayson','Santiago','Anthony','Wyatt','Carter','Jayden','Ezekiel','Joshua','Andrew','Nathan','Christopher','Caleb','Ryan','Adrian','Cameron','Connor','Aaron','Evan','Nolan','Colton','Landon','Hunter','Tyler','Jordan','Nicholas','Adam','Austin','Brandon','Zachary','Ian','Sean','Gavin','Kevin','Jason','Eric','Cole','Blake','Trevor','Derek','Justin','Marcus','Patrick','Joel','Cody','Max','Ben','Alex','Nate','Sam','Josh','Dan','Chris','Matt','Drew','Jake','Nick'];

function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function clamp(v){v=Math.round(Number(v)||0);return Math.max(0,Math.min(1000,v))}
function score(){try{return clamp(localStorage.getItem(SCORE_KEY))}catch(e){return 0}}
function num(key){try{return Math.max(0,Math.round(Number(localStorage.getItem(key))||0))}catch(e){return 0}}
function setNum(key,v){v=Math.max(0,Math.round(Number(v)||0));try{localStorage.setItem(key,String(v))}catch(e){}return v}
function savedName(){try{var v=String(localStorage.getItem('BombermanPlayerName')||'Player').replace(/[<>]/g,'').replace(/\s+/g,' ').trim();return(v||'Player').slice(0,14)}catch(e){return'Player'}}
function hash(s){var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function clone(o){return o&&Object.assign({},o)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function pct(w,l){var n=w+l;return n?((w/n)*100).toFixed(1)+'%':'—'}
function bucketFor(now){return Math.floor(Number(now||Date.now())/LIVE_BUCKET_MS)}
function dayFor(now){return Math.max(0,Math.floor((Number(now||Date.now())-CAREER_EPOCH)/DAY_MS))}
function tieKey(name){return hash('BM128|tie|'+String(name||'Player'))}

function scoreCurve(rank){
 if(rank<=50)return Math.round(1000-(rank-1)*(235/49));
 if(rank<=150)return Math.round(764-(rank-50)*(214/100));
 if(rank<=300)return Math.round(548-(rank-150)*(248/150));
 if(rank<=420)return Math.round(298-(rank-300)*(178/120));
 if(rank<=POSITIVE_COUNT)return Math.max(1,Math.round(118-(rank-420)*(117/100)));
 return 0
}

function addSeed(out,seen,name,category){
 name=String(name||'').replace(/\s+/g,'').slice(0,14);
 if(!name||seen[name])return false;
 seen[name]=1;out.push({name:name,category:category});return true
}
function buildSeedRoster(){
 if(seedRoster.length)return;
 var out=[],seen={},i,j;
 for(i=0;i<GAMER_PREFIX.length&&out.length<180;i++){
  for(j=0;j<GAMER_SUFFIX.length&&out.length<180;j++){
   addSeed(out,seen,GAMER_PREFIX[(i*7)%GAMER_PREFIX.length]+GAMER_SUFFIX[(j*9)%GAMER_SUFFIX.length],'gamer');
  }
 }
 for(i=0;i<MALE_NAMES.length;i++)addSeed(out,seen,MALE_NAMES[i],'male');
 for(i=0;out.length<POPULATION_SIZE;i++){
  var base=MALE_NAMES[(i*17+11)%MALE_NAMES.length];
  var n=1+(hash('BM128|number|'+base+'|'+i)%999);
  addSeed(out,seen,base+n,'number');
 }
 out.sort(function(a,b){
  var d=(hash('BM128|skill|'+b.name)>>>0)-(hash('BM128|skill|'+a.name)>>>0);
  return d||a.name.localeCompare(b.name)
 });
 for(i=0;i<out.length;i++){out[i].baseRank=i+1;out[i].baseScore=scoreCurve(i+1)}
 seedRoster=out.slice(0,POPULATION_SIZE)
}

function profileAt(seed,now){
 var base=seed.baseScore,h=hash('BM128|profile|'+seed.name),sc=base;
 if(base>0){
  var b=bucketFor(now),day=dayFor(now);
  var live=(hash('BM128|live|'+seed.name+'|'+b)%7)-3;
  var daily=(hash('BM128|day|'+seed.name+'|'+day)%9)-4;
  var volatility=base>=800?.55:(base>=300?1:1.25);
  sc=clamp(base+Math.round((live+daily)*volatility));
  if(seed.baseRank<=POSITIVE_COUNT&&sc===0)sc=1
 }
 var baseGames=80+(h%721);
 var baseRate=Math.max(.35,Math.min(.93,.405+(base/1000)*.47+(((h>>>12)%101)-50)/1000));
 var days=dayFor(now),activity=1+((h>>>21)%4),added=days*activity;
 var games=baseGames+added,wins=Math.max(1,Math.min(games-1,Math.round(games*baseRate))),losses=Math.max(1,games-wins);
 return{name:seed.name,category:seed.category,score:sc,wins:wins,losses:losses,rate:wins/(wins+losses),baseRank:seed.baseRank,baseScore:seed.baseScore}
}
function sortProfiles(a,b){return b.score-a.score||b.rate-a.rate||tieKey(a.name)-tieKey(b.name)||a.name.localeCompare(b.name)}
function refreshRoster(now,force){
 buildSeedRoster();var b=bucketFor(now);if(!force&&roster.length&&b===lastBucket)return false;lastBucket=b;
 roster=seedRoster.map(function(seed){return profileAt(seed,now)});roster.sort(sortProfiles);byName={};
 for(var i=0;i<roster.length;i++){roster[i].rank=i+1;byName[roster[i].name]=roster[i]}
 top50=roster.slice(0,50);S.SIM_NAMES=roster.map(function(p){return p.name});return true
}
function playerRankAt(sc,name){
 refreshRoster();sc=clamp(sc);name=String(name||'Player');var t=tieKey(name),rank=1;
 for(var i=0;i<roster.length;i++){
  var p=roster[i];if(p.score>sc||(p.score===sc&&(tieKey(p.name)<t||(tieKey(p.name)===t&&p.name.localeCompare(name)<0))))rank++
 }
 return rank
}
function combinedStandings(){
 refreshRoster();var me={name:savedName(),category:'you',score:score(),wins:num(WINS_KEY),losses:num(LOSSES_KEY),you:true};
 me.rate=(me.wins+me.losses)?me.wins/(me.wins+me.losses):0;
 var all=roster.map(clone);all.push(me);all.sort(function(a,b){
  if(a.score!==b.score)return b.score-a.score;
  var ta=tieKey(a.name),tb=tieKey(b.name);return ta-tb||String(a.name).localeCompare(String(b.name))
 });
 for(var i=0;i<all.length;i++)all[i].displayRank=i+1;return all
}
function fakeDisplayRank(name){
 var all=combinedStandings();for(var i=0;i<all.length;i++)if(!all[i].you&&all[i].name===name)return all[i].displayRank;return byName[name]?byName[name].rank:null
}
function profile(name){refreshRoster();var p=byName[name];if(!p)return null;var c=clone(p);c.displayRank=fakeDisplayRank(name);return c}

function currentFake(){
 if(matchedProfile&&matchedProfile.name===S.remoteName)return matchedProfile;
 var p=profile(S.remoteName);if(p){matchedProfile=p;matchedProfile.matchRank=p.displayRank}return matchedProfile
}
function localRank(){return playerRankAt(score(),savedName())}

function matchmakingPool(){
 refreshRoster();var r=localRank(),roll=Math.random(),radius=roll<.78?55:(roll<.95?140:POPULATION_SIZE);
 if(radius>=POPULATION_SIZE)return roster.slice();
 var lo=Math.max(1,r-radius),hi=Math.min(POPULATION_SIZE,r+radius),pool=[];
 for(var i=lo-1;i<hi;i++)if(roster[i])pool.push(roster[i]);
 if(!pool.length)pool=roster.slice();return pool
}
function enforceFakeProfile(){
 if(S.role!=='simulated'){matchedProfile=null;return}
 var p=currentFake(),g=G();if(!p||!g)return;
 g.simulatedRating=p.score;S.simulatedRating=p.score;
 var sim=g.simulatedOpponent;if(sim){
  sim.rating=p.score;sim.humanRating=p.score;sim.leaderboardRank=p.matchRank||p.displayRank||p.rank;
  if(window.BomberCharacter&&BomberCharacter.skillFromRating)sim.humanSkill=BomberCharacter.skillFromRating(p.score)
 }
 var lr=localRank(),rr=p.matchRank||p.displayRank||p.rank;
 if(S.els&&S.els.matchStatus&&S.els.matchBar&&!S.els.matchBar.hidden){
  S.els.matchStatus.textContent='SIMULATED • '+savedName()+' '+score()+' (#'+lr+') vs '+p.name+' '+p.score+' (#'+rr+')'
 }
}
function patchSimulatedRoster(){
 if(S.__v127LeaderboardRoster)return;S.__v127LeaderboardRoster=true;refreshRoster(Date.now(),true);
 var old=S.startSimulated;
 S.startSimulated=function(){
  refreshRoster();matchedProfile=null;
  var all=S.SIM_NAMES.slice(),pool=matchmakingPool();S.SIM_NAMES=pool.map(function(p){return p.name});
  var r=old.apply(S,arguments);S.SIM_NAMES=all.length?all:roster.map(function(p){return p.name});
  var p=profile(S.remoteName);if(p){matchedProfile=p;matchedProfile.matchRank=p.displayRank}
  [0,40,150,500].forEach(function(ms){setTimeout(enforceFakeProfile,ms)});return r
 }
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

function style(){
 if($('v127-leaderboard-style'))return;var st=document.createElement('style');st.id='v127-leaderboard-style';st.textContent=`
#mainLeaderboardTile{position:fixed;z-index:6500;display:none;box-sizing:border-box;border:0;background:rgba(0,0,0,.5);color:#fff;font-family:Helvetica,Arial,sans-serif;text-align:center;cursor:pointer;padding:7px 4px 5px;align-items:center;justify-content:flex-start;flex-direction:column;gap:2px}#mainLeaderboardTile:hover{background:rgba(0,0,0,.68)}#mainLeaderboardTile svg{width:42px;height:42px;display:block;fill:#ffd166;margin:1px auto 3px}#mainLeaderboardTile strong{font-size:14px;line-height:1.1;color:#ffd166;font-weight:600}#mainLeaderboardTile small{font-size:8px;color:#fff;font-weight:700}
#v127LeaderboardPanel{position:fixed;inset:0;z-index:8500;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(10,6,9,.78);backdrop-filter:blur(4px)}#v127LeaderboardPanel[hidden]{display:none!important}.v127_lb_card{width:min(650px,96vw);max-height:94vh;overflow:hidden;display:flex;flex-direction:column;box-sizing:border-box;padding:16px;border:1px solid rgba(255,255,255,.17);border-radius:14px;background:#21111a;color:#fff;font-family:Helvetica,Arial,sans-serif;box-shadow:0 22px 70px rgba(0,0,0,.55)}.v127_lb_head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.v127_lb_head h2{margin:0;font-size:22px}.v127_lb_head p{margin:4px 0 0;color:#aaa;font-size:10px}.v127_lb_close{border:0;background:transparent;color:#fff;font-size:27px}.v127_lb_you{display:grid;grid-template-columns:58px minmax(100px,1fr) 75px 82px 95px;gap:6px;align-items:center;margin:12px 0 8px;padding:9px;border:1px solid rgba(185,239,140,.35);border-radius:8px;background:rgba(86,123,37,.16);font-size:11px}.v127_lb_you strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.v127_lb_you .score{color:#b9ef8c;font-weight:900}.v127_lb_columns,.v127_lb_row{display:grid;grid-template-columns:40px minmax(100px,1fr) 68px 76px 88px;gap:6px;align-items:center}.v127_lb_columns{padding:5px 7px;color:#888;font-size:9px;text-transform:uppercase}.v127_lb_list{overflow:auto;display:grid;gap:3px;padding-right:2px}.v127_lb_row{padding:6px 7px;border-radius:6px;background:rgba(255,255,255,.04);font-size:10px}.v127_lb_row.top3{background:rgba(255,209,102,.09)}.v127_lb_row.you{background:rgba(86,123,37,.26);border:1px solid rgba(185,239,140,.25)}.v127_lb_row .rank{color:#aaa}.v127_lb_row .name{font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.v127_lb_row .score{color:#b9ef8c;font-weight:900}.v127_lb_note{margin-top:8px;color:#777;font-size:9px;text-align:center}
#qolStatHud .qol_stat_box[data-rank]:not([data-rank=""]) .qol_stat_name::after{content:" · " attr(data-rating) " · #" attr(data-rank)!important;color:#b9ef8c!important;font-weight:800!important}
@media(max-width:560px){.v127_lb_you{grid-template-columns:48px minmax(80px,1fr) 58px 68px 75px;font-size:9px}.v127_lb_columns,.v127_lb_row{grid-template-columns:30px minmax(80px,1fr) 52px 60px 70px;font-size:8px}}
`;document.head.appendChild(st)
}
function ensureLeaderboard(){
 style();var p=$('v127LeaderboardPanel');if(!p){
  p=document.createElement('div');p.id='v127LeaderboardPanel';p.hidden=true;
  p.innerHTML='<div class="v127_lb_card"><div class="v127_lb_head"><div><h2>Simulated Leaderboard</h2><p>Top 50 of a roughly 600-player simulated population. Names, scores and records are deterministic across devices at the same time; standings move gradually as simulated players gain and lose points.</p></div><button class="v127_lb_close" type="button" aria-label="Close">×</button></div><div id="v127LbYou" class="v127_lb_you"></div><div class="v127_lb_columns"><span>Rank</span><span>Player</span><span>Score</span><span>Win rate</span><span>W–L</span></div><div id="v127LbList" class="v127_lb_list"></div><div class="v127_lb_note">The population mixes gamer tags, ordinary male first names, and name-number handles. Your row uses your actual competitive human/fake-human record on this device.</div></div>';
  document.body.appendChild(p);p.querySelector('.v127_lb_close').onclick=function(){p.hidden=true;syncTiles()}
 }
 var tile=$('mainLeaderboardTile');if(!tile){
  tile=document.createElement('button');tile.type='button';tile.id='mainLeaderboardTile';tile.setAttribute('aria-label','Simulated leaderboard');
  tile.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v2h3v4c0 2.8-2 5-4.7 5.6A5.1 5.1 0 0 1 13 17.8V20h4v2H7v-2h4v-2.2a5.1 5.1 0 0 1-2.3-3.2C6 14 4 11.8 4 9V5h3V3Zm0 4H6v2c0 1.5.9 2.8 2.2 3.4A9.8 9.8 0 0 1 7 7Zm10 0a9.8 9.8 0 0 1-1.2 5.4A3.7 3.7 0 0 0 18 9V7h-1Z"/></svg><strong>Leaderboard</strong><small>Top 50</small>';
  tile.onclick=function(){ensureLeaderboard();renderLeaderboard();p.hidden=false;syncTiles()};document.body.appendChild(tile)
 }return tile
}
function renderLeaderboard(){
 refreshRoster();ensureLeaderboard();var list=$('v127LbList'),you=$('v127LbYou');if(!list||!you)return;
 var sc=score(),w=num(WINS_KEY),l=num(LOSSES_KEY),rank=playerRankAt(sc,savedName());
 you.innerHTML='<span>#'+rank+' / '+(POPULATION_SIZE+1)+'</span><strong>'+escapeHtml(savedName())+' <em style="font-style:normal;color:#b9ef8c">(You)</em></strong><span class="score">'+sc+'</span><span>'+pct(w,l)+'</span><span>'+w+'–'+l+'</span>';
 var standings=combinedStandings().slice(0,50),html='';
 for(var j=0;j<standings.length;j++){
  var r=standings[j],rw=r.you?w:r.wins,rl=r.you?l:r.losses,rr=r.you?((w+l)?w/(w+l):0):r.rate;
  html+='<div class="v127_lb_row '+(j<3?'top3 ':'')+(r.you?'you':'')+'"><span class="rank">#'+(j+1)+'</span><span class="name">'+escapeHtml(r.name)+(r.you?' (You)':'')+'</span><span class="score">'+r.score+'</span><span>'+((rw+rl)?(rr*100).toFixed(1)+'%':'—')+'</span><span>'+rw+'–'+rl+'</span></div>'
 }list.innerHTML=html
}
function decorateHudRanks(){
 var g=G(),hud=$('qolStatHud');if(!g||!hud)return;var slots=g.getContestantsByStatSlot?g.getContestantsByStatSlot():[];
 for(var i=0;i<4;i++){
  var box=hud.querySelector('.qol_stat_box[data-slot="'+i+'"]'),e=slots[i];if(!box)continue;var rank='';
  if(e&&e===g.simulatedOpponent&&S.role==='simulated'){var p=currentFake();rank=p?(p.matchRank||p.displayRank||p.rank):''}
  else if(e&&g.players&&g.players.indexOf(e)>=0&&isFinite(Number(e.rating))){
   var idx=g.players.indexOf(e),name=e.displayName||((S.role==='guest'?(idx===1?S.localName:S.remoteName):(idx===0?S.localName:S.remoteName))||('Player '+(idx+1)));
   rank=playerRankAt(e.rating,name)
  }
  box.setAttribute('data-rank',rank?String(rank):'')
 }
}
function syncTiles(){
 var g=G(),lb=ensureLeaderboard(),cust=$('mainCustomizeTile'),settings=$('mainSettingsTile'),panel=$('v127LeaderboardPanel'),sp=$('v127SettingsPanel'),cp=$('characterPanel');if(!g||!g.menu||!lb)return;
 var show=!!(g.menu.visible&&!g.lobbyOpen&&(!panel||panel.hidden)&&(!sp||sp.hidden)&&(!cp||cp.hidden));lb.style.display=show?'flex':'none';if(settings&&panel&&!panel.hidden)settings.style.display='none';if(cust&&panel&&!panel.hidden)cust.style.display='none';if(!show)return;
 var c=$('canvas'),r=c&&c.getBoundingClientRect();if(!r||!r.width)return;var scale=Math.max(.65,Math.min(1.25,r.width/(g.size&&g.size.w||544))),w=110*scale,h=100*scale,gap=7*scale,mid=r.left+r.width/2;
 if(cust){cust.style.width=w+'px';cust.style.height=h+'px';cust.style.left=(mid-w-gap)+'px';cust.style.top=(r.top+r.height-h-2*scale)+'px'}lb.style.width=w+'px';lb.style.height=h+'px';lb.style.left=(mid+gap)+'px';lb.style.top=(r.top+r.height-h-2*scale)+'px'
}
function install(){
 if(installed)return true;if(!window.BomberV127||!window.BomberCharacter||!window.GameEngine||!G()||!G().menu)return false;installed=true;
 refreshRoster(Date.now(),true);patchSimulatedRoster();hideMatchLog();ensureLeaderboard();fixCustomizeName();renderLeaderboard();syncTiles();
 window.BomberLeaderboard127={
  top50:function(){refreshRoster();return top50.map(function(x){var c=clone(x);c.displayRank=fakeDisplayRank(x.name);return c})},
  profile:function(name){return profile(name)},
  population:function(){refreshRoster();return roster.map(clone)},
  rank:function(sc,name){return playerRankAt(sc,name||savedName())},
  rankForPlayer:function(){return localRank()},
  profileAt:function(name,now){buildSeedRoster();for(var i=0;i<seedRoster.length;i++)if(seedRoster[i].name===name)return profileAt(seedRoster[i],now);return null},
  wins:function(){return num(WINS_KEY)},losses:function(){return num(LOSSES_KEY)},
  open:function(){ensureLeaderboard();renderLeaderboard();$('v127LeaderboardPanel').hidden=false;syncTiles()}
 };return true
}
buildSeedRoster();refreshRoster(Date.now(),true);
var tries=0,t=setInterval(function(){if(install()||++tries>600)clearInterval(t)},40);
setInterval(function(){
 if(!installed)return;var changed=refreshRoster();hideMatchLog();fixCustomizeName();countPlayerResult();enforceFakeProfile();decorateHudRanks();syncTiles();
 if(changed&&$('v127LeaderboardPanel')&&!$('v127LeaderboardPanel').hidden)renderLeaderboard()
},120);
window.addEventListener('resize',syncTiles,{passive:true});window.addEventListener('orientationchange',function(){setTimeout(syncTiles,80)},{passive:true});
})();
